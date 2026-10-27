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
      this.routeChange.emit(data.path);
    }
  };

  async ngAfterViewInit(): Promise<void> {
    window.addEventListener('message', this.bridge);
    window.addEventListener('resize', this.resizeHandler);
    this.resizeHandler();
    const session = await this.hostService.session(this.pluginKey());
    const base = this.entry() || session?.entry;
    if (!session || !base) {
      this.loading.set(false);
      this.failed.emit('PLUGIN_HOST_UNAVAILABLE');
      return;
    }
    const separator = base.includes('?') ? '&' : '?';
    const route = this.route();
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
