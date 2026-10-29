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

interface RuntimeSession {
  token: string;
  entry: string;
}

/**
 * Mobile host for the catalog Web Component (ADR-S05-001 A10): the plugin UI
 * renders read-only, with the Core mobile token and API base injected.
 */
@Component({
  selector: 'app-catalog-browse',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonMenuButton, TranslatePipe],
  templateUrl: './catalog.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogBrowsePage implements OnInit, OnDestroy {
  private static scriptLoaded = false;

  private http = inject(HttpClient);
  private host = viewChild.required<ElementRef<HTMLElement>>('host');

  readonly loading = signal(true);
  readonly failed = signal(false);
  private element: HTMLElement | null = null;

  ngOnInit(): void {
    void this.load();
  }

  ngOnDestroy(): void {
    this.element?.remove();
    this.element = null;
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    try {
      const session = await this.requestSession();
      if (!session?.token) {
        throw new Error('no session');
      }
      await this.loadScript(session.token);
      await customElements.whenDefined('op-catalog-app');
      this.mount();
      this.loading.set(false);
    } catch {
      this.failed.set(true);
      this.loading.set(false);
    }
  }

  private mount(): void {
    this.element?.remove();
    const element = document.createElement('op-catalog-app') as HTMLElement & {
      route: string;
      scope: string;
      readonly: boolean;
      apiBaseUrl: string;
    };
    element.route = '/';
    element.scope = 'tenant';
    element.readonly = true;
    element.apiBaseUrl = environment.apiBaseUrl;
    element.style.display = 'block';
    element.style.height = '100%';
    this.host().nativeElement.appendChild(element);
    this.element = element;
  }

  private loadScript(token: string): Promise<void> {
    if (CatalogBrowsePage.scriptLoaded) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = `${environment.apiBaseUrl}/api/v1/plugins/runtime/catalog/main.js`
        + `?plugin_token=${encodeURIComponent(token)}`;
      script.onload = () => {
        CatalogBrowsePage.scriptLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('catalog runtime failed to load'));
      document.head.appendChild(script);
    });
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
}
