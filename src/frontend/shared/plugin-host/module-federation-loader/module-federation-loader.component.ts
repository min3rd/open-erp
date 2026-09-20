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

interface RemoteContainer {
  init(sharedScope: Record<string, unknown>): Promise<void> | void;
  get(module: string): Promise<() => unknown>;
}

interface RemoteInstance {
  mount?(target: HTMLElement): void | Promise<void>;
  unmount?(): void;
}

@Component({
  selector: 'app-plugin-module-federation-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './module-federation-loader.component.html',
})
export class PluginModuleFederationLoaderComponent implements AfterViewInit, OnDestroy {
  private static loadedScripts = new Set<string>();

  entry = input.required<string>();
  pluginKey = input.required<string>();
  exposedModule = input<string>('./mount');
  failed = output<string>();

  private host = viewChild.required<ElementRef<HTMLElement>>('host');
  private mounted: RemoteInstance | null = null;

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.loadRemoteEntry(this.entry());
      const container = (window as unknown as Record<string, RemoteContainer>)[this.scopeName()];
      if (!container) {
        this.failed.emit('PLUGIN_HOST_RENDER_ERROR');
        return;
      }
      await container.init({});
      const factory = await container.get(this.exposedModule());
      const instance = factory() as RemoteInstance | undefined;
      const target = this.host().nativeElement;
      if (instance && typeof instance.mount === 'function') {
        await instance.mount(target);
        this.mounted = instance;
      } else {
        this.failed.emit('PLUGIN_HOST_RENDER_ERROR');
      }
    } catch {
      this.failed.emit('PLUGIN_HOST_RENDER_ERROR');
    }
  }

  ngOnDestroy(): void {
    this.mounted?.unmount?.();
    this.mounted = null;
  }

  private scopeName(): string {
    return this.pluginKey().replace(/[^a-zA-Z0-9_]/g, '_');
  }

  private loadRemoteEntry(url: string): Promise<void> {
    if (PluginModuleFederationLoaderComponent.loadedScripts.has(url)) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => {
        PluginModuleFederationLoaderComponent.loadedScripts.add(url);
        resolve();
      };
      script.onerror = () => reject(new Error(`Failed to load module federation remote: ${url}`));
      document.head.appendChild(script);
    });
  }
}
