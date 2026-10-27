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
  failed = output<string>();

  private host = viewChild<ElementRef<HTMLElement>>('host');
  private frame = viewChild<ElementRef<HTMLIFrameElement>>('frame');

  src = signal<SafeResourceUrl>(this.sanitizer.bypassSecurityTrustResourceUrl('about:blank'));
  height = signal<number>(this.minHeightPx());
  loading = signal(true);

  private bridge = (event: MessageEvent): void => {
    const frame = this.frame()?.nativeElement;
    if (!frame || event.source !== frame.contentWindow) {
      return;
    }
    const data = event.data as { source?: string; type?: string; height?: number };
    if (data?.source === 'open-erp-plugin' && data.type === 'resize' && Number.isFinite(data.height)) {
      const height = Number(data.height);
      if (height > 0) {
        this.height.set(height);
      }
    }
  };

  async ngAfterViewInit(): Promise<void> {
    window.addEventListener('message', this.bridge);
    const session = await this.hostService.session(this.pluginKey());
    const base = this.entry() || session?.entry;
    if (!session || !base) {
      this.loading.set(false);
      this.failed.emit('PLUGIN_HOST_UNAVAILABLE');
      return;
    }
    const separator = base.includes('?') ? '&' : '?';
    const url = `${base}${separator}plugin_token=${encodeURIComponent(session.token)}`;
    this.src.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.bridge);
  }

  onLoad(): void {
    this.loading.set(false);
    this.bridgeContext();
  }

  private bridgeContext(): void {
    this.postMessage({ type: 'theme', value: this.hostService.themeMode() });
    this.postMessage({ type: 'lang', value: this.hostService.language() });
  }

  private postMessage(payload: Record<string, unknown>): void {
    this.frame()?.nativeElement.contentWindow?.postMessage({ source: 'open-erp-core', ...payload }, '*');
  }
}
