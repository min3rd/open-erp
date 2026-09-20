import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  input,
  output,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-plugin-web-component-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './web-component-loader.component.html',
})
export class PluginWebComponentLoaderComponent implements AfterViewInit, OnDestroy {
  private static loadedScripts = new Set<string>();

  entry = input.required<string>();
  pluginKey = input.required<string>();
  element = input<string>('');
  failed = output<string>();

  private host = viewChild.required<ElementRef<HTMLElement>>('host');
  private mounted: HTMLElement | null = null;

  async ngAfterViewInit(): Promise<void> {
    try {
      const url = this.entry();
      if (!PluginWebComponentLoaderComponent.loadedScripts.has(url)) {
        await this.loadScript(url);
        PluginWebComponentLoaderComponent.loadedScripts.add(url);
      }
      const tag = this.element() || `plugin-${this.pluginKey()}`;
      if (!customElements.get(tag)) {
        this.failed.emit('PLUGIN_HOST_RENDER_ERROR');
        return;
      }
      const element = document.createElement(tag);
      element.setAttribute('plugin-key', this.pluginKey());
      this.host().nativeElement.appendChild(element);
      this.mounted = element;
    } catch {
      this.failed.emit('PLUGIN_HOST_RENDER_ERROR');
    }
  }

  ngOnDestroy(): void {
    this.mounted?.remove();
    this.mounted = null;
  }

  private loadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = url;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load plugin web component: ${url}`));
      document.head.appendChild(script);
    });
  }
}
