import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { PluginContext, PluginNotifyPayload } from '../plugin-host.model';
import { PluginHostService } from '../plugin-host.service';

interface RemoteContainer {
  init(sharedScope: Record<string, unknown>): Promise<void> | void;
  get(module: string): Promise<() => unknown>;
}

interface RemoteInstance {
  mount?(target: HTMLElement, context: PluginContext): void | Promise<void>;
  unmount?(): void;
  navigate?(path: string): void;
}

@Component({
  selector: 'app-plugin-module-federation-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './module-federation-loader.component.html',
})
export class PluginModuleFederationLoaderComponent implements AfterViewInit, OnDestroy {
  private static loadedScripts = new Set<string>();
  private static loadingScripts = new Map<string, Promise<void>>();
  private hostService = inject(PluginHostService);

  entry = input.required<string>();
  pluginKey = input.required<string>();
  exposedModule = input<string>('./mount');
  context = input<PluginContext | null>(null);
  route = input<string>('');
  failed = output<string>();
  routeChange = output<string>();
  notify = output<PluginNotifyPayload>();
  resized = output<number>();

  private host = viewChild.required<ElementRef<HTMLElement>>('host');
  private mounted: RemoteInstance | null = null;

  constructor() {
    effect(() => {
      const route = this.route();
      if (this.mounted && route) {
        this.mounted.navigate?.(route);
      }
    });
  }

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
        await instance.mount(target, this.buildContext());
        this.mounted = instance;
        if (this.route()) {
          instance.navigate?.(this.route());
        }
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

  private buildContext(): PluginContext {
    const context = this.context();
    return {
      ...(context ?? {
        theme: 'light',
        language: 'vi',
        direction: 'ltr',
        tenant: null,
        user: null,
        permissions: [],
        apiBaseUrl: '',
      }),
      navigate: (path: string) => this.routeChange.emit(path),
      notify: (payload: PluginNotifyPayload) => this.notify.emit(payload),
      resize: () => this.resized.emit(this.host().nativeElement.scrollHeight),
    };
  }

  private scopeName(): string {
    return this.pluginKey().replace(/[^a-zA-Z0-9_]/g, '_');
  }

  private async loadRemoteEntry(entry: string): Promise<void> {
    const entryKey = this.hostService.runtimeEntryUrl(entry);
    if (PluginModuleFederationLoaderComponent.loadedScripts.has(entryKey)) {
      return Promise.resolve();
    }
    const existing = PluginModuleFederationLoaderComponent.loadingScripts.get(entryKey);
    if (existing) {
      return existing;
    }
    const url = await this.hostService.runtimeUrlWithToken(entry, this.pluginKey());
    const request = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => {
        PluginModuleFederationLoaderComponent.loadedScripts.add(entryKey);
        resolve();
      };
      script.onerror = () => reject(new Error(`Failed to load module federation remote: ${url}`));
      document.head.appendChild(script);
    }).finally(() => {
      PluginModuleFederationLoaderComponent.loadingScripts.delete(entryKey);
    });
    PluginModuleFederationLoaderComponent.loadingScripts.set(entryKey, request);
    return request;
  }
}
