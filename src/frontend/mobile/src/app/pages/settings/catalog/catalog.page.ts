import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonMenuButton,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@shared';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth.service';

interface RuntimeSession {
  token: string;
  entry: string;
}

/**
 * Mobile plugin host (ADR-S05-001 A10): the catalog screen is the plugin UI
 * bundle with the manifest `read_only` flag, not a native mobile page.
 */
@Component({
  selector: 'app-catalog-browse',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonMenuButton, TranslatePipe],
  templateUrl: './catalog.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogBrowsePage implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private auth = inject(AuthService);
  private frame = viewChild<ElementRef<HTMLIFrameElement>>('frame');

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly src = signal<SafeResourceUrl>(this.sanitizer.bypassSecurityTrustResourceUrl('about:blank'));
  private lastRefreshAt = 0;

  private readonly bridge = (event: MessageEvent): void => {
    const frame = this.frame()?.nativeElement;
    if (!frame || event.source !== frame.contentWindow) {
      return;
    }
    const data = event.data as { source?: string; type?: string };
    if (data?.source === 'open-erp-plugin' && data.type === 'session-expired') {
      this.renew();
    }
  };

  ngOnInit(): void {
    window.addEventListener('message', this.bridge);
    void this.load(false);
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.bridge);
  }

  onLoad(): void {
    this.loading.set(false);
  }

  private async load(force: boolean): Promise<void> {
    if (force && Date.now() - this.lastRefreshAt < 5_000) {
      this.auth.clearSession();
      return;
    }
    this.lastRefreshAt = force ? Date.now() : this.lastRefreshAt;
    try {
      const session = await this.requestSession();
      if (!session?.token) {
        throw new Error('no session');
      }
      const base = session.entry || '/api/v1/plugins/runtime/catalog';
      const basePath = base.endsWith('/') ? base : `${base}/`;
      const url = `${environment.apiBaseUrl}${basePath}?plugin_token=${encodeURIComponent(session.token)}`
        + `&readonly=1&_v=${Date.now()}`;
      this.src.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      this.loading.set(true);
      this.failed.set(false);
    } catch {
      this.failed.set(true);
      this.loading.set(false);
      if (force) {
        this.auth.clearSession();
      }
    }
  }

  private requestSession(): Promise<RuntimeSession | null> {
    return new Promise((resolve) => {
      this.http
        .post<{ data?: RuntimeSession }>(`${environment.apiBaseUrl}/api/v1/plugins/session-token`, {
          plugin_key: 'catalog',
        })
        .subscribe({
          next: (response) => resolve(response?.data ?? null),
          error: () => resolve(null),
        });
    });
  }

  private renew(): void {
    void this.load(true);
  }
}
