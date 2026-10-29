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

@Component({
  selector: 'app-plugin-web-component-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './web-component-loader.component.html',
})
export class PluginWebComponentLoaderComponent implements AfterViewInit, OnDestroy {
  private static loadedScripts = new Set<string>();
  private static loadingScripts = new Map<string, Promise<void>>();
  private static loadedStyles = new Set<string>();
  private hostService = inject(PluginHostService);

  entry = input.required<string>();
  pluginKey = input.required<string>();
  tagName = input<string>('');
  context = input<PluginContext | null>(null);
  isolation = input<'shadow' | 'light'>('light');
  route = input<string>('');
  failed = output<string>();
  routeChange = output<string>();
  navigate = output<string>();
  notify = output<PluginNotifyPayload>();
  resized = output<number>();

  private host = viewChild.required<ElementRef<HTMLElement>>('host');
  private mounted: HTMLElement | null = null;
  private readonly listeners: Array<[string, EventListener]> = [];

  constructor() {
    effect(() => {
      const route = this.route();
      if (this.mounted && route !== undefined && route !== null) {
        (this.mounted as unknown as { route?: string }).route = route;
      }
    });
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      const entry = this.entry();
      const entryKey = this.hostService.runtimeEntryUrl(entry);
      if (!PluginWebComponentLoaderComponent.loadedScripts.has(entryKey)) {
        const url = await this.hostService.runtimeUrlWithToken(entry, this.pluginKey());
        try {
          await withTimeout(this.loadScript(entryKey, url), 10_000);
        } catch {
          // A rotated backend key invalidates the cached runtime token; retry
          // once with a freshly minted one before surfacing a host error.
          const retry = await this.hostService.runtimeUrlWithToken(entry, this.pluginKey(), true);
          await withTimeout(this.loadScript(entryKey, retry), 10_000);
        }
        PluginWebComponentLoaderComponent.loadedScripts.add(entryKey);
      }
      await this.loadPluginStyles(entry, this.pluginKey());
      const tag = this.tagName() || `plugin-${this.pluginKey()}`;
      await withTimeout(customElements.whenDefined(tag), 5_000).catch(() => {
        throw new Error(`Plugin custom element was not defined: ${tag}`);
      });
      if (!customElements.get(tag)) {
        this.failed.emit('PLUGIN_HOST_RENDER_ERROR');
        return;
      }
      const element = document.createElement(tag);
      element.style.display = 'block';
      element.style.height = '100%';
      element.style.width = '100%';
      this.applyProperties(element);
      this.bindEvents(element);
      const container = this.host().nativeElement;
      container.dataset['pluginIsolation'] = this.isolation();
      container.appendChild(element);
      this.mounted = element;
    } catch {
      this.failed.emit('PLUGIN_HOST_RENDER_ERROR');
    }
  }

  ngOnDestroy(): void {
    for (const [name, listener] of this.listeners) {
      this.mounted?.removeEventListener(name, listener);
    }
    this.listeners.length = 0;
    this.mounted?.remove();
    this.mounted = null;
  }

  private applyProperties(element: HTMLElement): void {
    const context = this.context();
    const target = element as unknown as Record<string, unknown>;
    target['pluginKey'] = this.pluginKey();
    target['context'] = context;
    target['route'] = this.route();
    if (context) {
      target['theme'] = context.theme;
      target['language'] = context.language;
      target['direction'] = context.direction;
      target['tenant'] = context.tenant;
      target['user'] = context.user;
      target['permissions'] = context.permissions;
      target['apiBaseUrl'] = context.apiBaseUrl;
    }
  }

  private bindEvents(element: HTMLElement): void {
    this.listen('op:route-change', (event) => {
      const path = (event as CustomEvent<{ path?: string }>).detail?.path;
      if (path) {
        this.routeChange.emit(path);
      }
    }, element);
    this.listen('op:navigate', (event) => {
      const path = (event as CustomEvent<{ path?: string }>).detail?.path;
      if (path) {
        this.navigate.emit(path);
      }
    }, element);
    this.listen('op:notify', (event) => {
      const detail = (event as CustomEvent<PluginNotifyPayload>).detail;
      if (detail?.code) {
        this.notify.emit(detail);
      }
    }, element);
    this.listen('op:resize', (event) => {
      const height = Number((event as CustomEvent<{ height?: number }>).detail?.height);
      if (Number.isFinite(height) && height > 0) {
        this.resized.emit(height);
      }
    }, element);
  }

  private listen(name: string, handler: EventListener, element: HTMLElement): void {
    element.addEventListener(name, handler);
    this.listeners.push([name, handler]);
  }

  /** Angular emits the plugin Tailwind entry beside `main.js`. */
  private async loadPluginStyles(entry: string, pluginKey: string): Promise<void> {
    const slash = entry.lastIndexOf('/');
    const stylesEntry = `${entry.slice(0, slash + 1)}styles.css`;
    const stylesKey = this.hostService.runtimeEntryUrl(stylesEntry);
    if (!stylesEntry || PluginWebComponentLoaderComponent.loadedStyles.has(stylesKey)) {
      return;
    }
    const url = await this.hostService.runtimeUrlWithToken(stylesEntry, pluginKey);
    let loaded = await this.appendStylesheet(url);
    if (!loaded) {
      const retry = await this.hostService.runtimeUrlWithToken(stylesEntry, pluginKey, true);
      loaded = await this.appendStylesheet(retry);
    }
    if (loaded) {
      PluginWebComponentLoaderComponent.loadedStyles.add(stylesKey);
    }
  }

  private appendStylesheet(url: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      const done = (ok: boolean) => {
        link.onload = null;
        link.onerror = null;
        resolve(ok);
      };
      link.onload = () => done(true);
      link.onerror = () => {
        link.remove();
        done(false);
      };
      setTimeout(() => done(false), 5_000);
      document.head.appendChild(link);
    });
  }

  private loadScript(entryKey: string, url: string): Promise<void> {
    // The plugin entry may bootstrap Angular asynchronously; the caller waits
    // for `customElements.whenDefined` before mounting.
    const existing = PluginWebComponentLoaderComponent.loadingScripts.get(entryKey);
    if (existing) {
      return existing;
    }
    const request = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = url;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load plugin web component: ${url}`));
      document.head.appendChild(script);
    }).finally(() => {
      PluginWebComponentLoaderComponent.loadingScripts.delete(entryKey);
    });
    PluginWebComponentLoaderComponent.loadingScripts.set(entryKey, request);
    return request;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Plugin element registration timed out')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
