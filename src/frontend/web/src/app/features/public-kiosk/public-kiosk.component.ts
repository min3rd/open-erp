import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TranslatePipe } from '@shared';

interface KioskSessionResponse {
  data?: { token?: string };
}

/**
 * Anonymous kiosk route (`/public/kiosk/:tenantSlug/:deviceCode`). It mints a
 * device-scoped plugin session, then mounts the attendance web component with
 * the device token from the URL. No core login is required; the plugin still
 * verifies the device token on every call.
 */
@Component({
  selector: 'app-public-kiosk',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './public-kiosk.component.html',
})
export class PublicKioskComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private host = viewChild.required<ElementRef<HTMLElement>>('host');

  readonly status = signal<'connecting' | 'failed'>('connecting');

  private timer?: ReturnType<typeof setInterval>;
  private mounted?: HTMLElement;
  private tenantSlug = '';
  private deviceCode = '';
  private deviceToken = '';

  async ngOnInit(): Promise<void> {
    this.tenantSlug = this.route.snapshot.paramMap.get('tenantSlug') ?? '';
    this.deviceCode = this.route.snapshot.paramMap.get('deviceCode') ?? '';
    this.deviceToken = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.applyTheme();
    if (!this.tenantSlug || !this.deviceCode || !this.deviceToken) {
      this.status.set('failed');
      return;
    }
    try {
      await this.issueSession();
      await this.loadAssets();
      await customElements.whenDefined('op-attendance-app');
      const element = document.createElement('op-attendance-app') as HTMLElement & {
        isStandaloneKiosk?: boolean;
        language?: string;
        route?: string;
      };
      element.style.display = 'block';
      element.style.height = '100%';
      element.style.width = '100%';
      element.isStandaloneKiosk = true;
      element.language = 'vi';
      element.route = `kiosk?device=${encodeURIComponent(this.deviceCode)}&token=${encodeURIComponent(this.deviceToken)}`;
      this.host().nativeElement.appendChild(element);
      this.mounted = element;
      this.status.set('connecting');
      this.timer = setInterval(() => {
        void this.issueSession().catch(() => undefined);
      }, 10 * 60 * 1000);
    } catch {
      this.status.set('failed');
    }
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.mounted?.remove();
    if (typeof window !== 'undefined') {
      delete (window as unknown as { __opPluginToken?: string }).__opPluginToken;
    }
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
    }
  }

  private applyTheme(): void {
    const mode = this.route.snapshot.queryParamMap.get('mode');
    const theme = this.route.snapshot.queryParamMap.get('theme');
    const root = document.documentElement;
    if (mode === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    if (theme) {
      root.setAttribute('data-theme', theme.replace(/[^a-z0-9-]/gi, ''));
    }
  }

  private async issueSession(): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<KioskSessionResponse>('/api/v1/plugins/public-session/attendance/kiosk', {
        tenant_slug: this.tenantSlug,
        device_code: this.deviceCode,
        device_token: this.deviceToken,
      }),
    );
    const token = response.data?.token;
    if (!token) {
      throw new Error('KIOSK_SESSION_FAILED');
    }
    (window as unknown as { __opPluginToken?: string }).__opPluginToken = token;
  }

  private async loadAssets(): Promise<void> {
    const token = (window as unknown as { __opPluginToken?: string }).__opPluginToken ?? '';
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = `/api/v1/plugins/runtime/attendance/styles.css?plugin_token=${encodeURIComponent(token)}`;
    document.head.appendChild(style);

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = `/api/v1/plugins/runtime/attendance/main.js?plugin_token=${encodeURIComponent(token)}`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('KIOSK_ASSETS_FAILED'));
      document.head.appendChild(script);
    });
  }
}
