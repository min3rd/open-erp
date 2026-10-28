import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { PluginHostService } from '../plugin-host.service';
import { PluginRuntimeSession } from '../plugin-host.model';

@Component({
  selector: 'app-plugin-iframe-loader',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './iframe-loader.component.html',
})
export class PluginIframeLoaderComponent implements AfterViewInit, OnDestroy {
  private hostService = inject(PluginHostService);
  private sanitizer = inject(DomSanitizer);

  pluginKey = input.required<string>();
  entry = input<string>('');
  minHeightPx = input<number>(240);
  /** Initial plugin-internal route (without the leading `#/`). */
  route = input<string>('');
  /** Fill the viewport instead of using the measured/message height. */
  fill = input<boolean>(false);
  /** Height reserved for the host chrome (header) when `fill` is on. */
  viewportOffsetPx = input<number>(0);
  failed = output<string>();
  /** Plugin route changed; the host mirrors it into the core browser URL. */
  routeChange = output<string>();

  private host = viewChild<ElementRef<HTMLElement>>('host');
  private frame = viewChild<ElementRef<HTMLIFrameElement>>('frame');

  src = signal<SafeResourceUrl>(this.sanitizer.bypassSecurityTrustResourceUrl('about:blank'));
  height = signal<number>(Math.max(240, window.innerHeight - 150));

  private readonly resizeHandler = (): void => {
    this.height.set(Math.max(this.minHeightPx(), window.innerHeight - 150));
  };
  loading = signal(true);

  /** Last route reported by the plugin; kept so a token reload lands where the user was. */
  private currentRoute = '';
  private lastSessionRefreshAt = 0;

  private bridge = (event: MessageEvent): void => {
    const frame = this.frame()?.nativeElement;
    if (!frame || event.source !== frame.contentWindow) {
      return;
    }
    const data = event.data as { source?: string; type?: string; height?: number; path?: string };
    if (data?.source === 'open-erp-plugin' && data.type === 'resize' && Number.isFinite(data.height)) {
      const height = Number(data.height);
      if (height > 0) {
        this.height.set(Math.max(height, window.innerHeight - 150));
      }
    }
    if (data?.source === 'open-erp-plugin' && data.type === 'route' && typeof data.path === 'string') {
      this.currentRoute = data.path;
      this.routeChange.emit(data.path);
    }
    if (data?.source === 'open-erp-plugin' && data.type === 'session-expired') {
      void this.renewSession();
    }
  };

  async ngAfterViewInit(): Promise<void> {
    window.addEventListener('message', this.bridge);
    window.addEventListener('resize', this.resizeHandler);
    this.resizeHandler();
    const session = await this.hostService.session(this.pluginKey());
    if (!session) {
      this.loading.set(false);
      this.failed.emit('PLUGIN_HOST_UNAVAILABLE');
      return;
    }
    this.currentRoute = this.route();
    this.applySession(session);
  }

  /**
   * The plugin reported `PLUGIN_RUNTIME_TOKEN_INVALID`: mint a new runtime token
   * and reload the frame. A token that is rejected right after reissue is a real
   * auth failure, so hand it to the host (which logs the user out).
   */
  private async renewSession(): Promise<void> {
    if (Date.now() - this.lastSessionRefreshAt < 5_000) {
      this.failed.emit('PLUGIN_RUNTIME_TOKEN_INVALID');
      return;
    }
    this.lastSessionRefreshAt = Date.now();
    const session = await this.hostService.session(this.pluginKey(), true);
    if (!session?.token) {
      this.failed.emit('PLUGIN_RUNTIME_TOKEN_INVALID');
      return;
    }
    this.applySession(session);
  }

  private applySession(session: PluginRuntimeSession): void {
    const base = this.entry() || session.entry;
    if (!base) {
      this.loading.set(false);
      this.failed.emit('PLUGIN_HOST_UNAVAILABLE');
      return;
    }
    const separator = base.includes('?') ? '&' : '?';
    const route = this.currentRoute;
    const hash = route ? `#${route.startsWith('/') ? '' : '/'}${route}` : '';
    const url = `${base}${separator}plugin_token=${encodeURIComponent(session.token)}&_v=${Date.now()}${hash}`;
    this.src.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.bridge);
    window.removeEventListener('resize', this.resizeHandler);
  }

  onLoad(): void {
    this.loading.set(false);
    this.bridgeContext();
  }

  /** Ask the plugin router to navigate (browser back/forward on the host). */
  navigate(path: string): void {
    this.postMessage({ type: 'navigate', path });
  }

  private bridgeContext(): void {
    this.postMessage({ type: 'theme', value: this.hostService.themeMode() });
    this.postMessage({ type: 'lang', value: this.hostService.language() });
  }

  private postMessage(payload: Record<string, unknown>): void {
    this.frame()?.nativeElement.contentWindow?.postMessage({ source: 'open-erp-core', ...payload }, '*');
  }
}
