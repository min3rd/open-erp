import { AfterViewInit, Component, OnDestroy, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

/**
 * Plugin shell. It owns the iframe height bridge and mirrors the plugin router
 * state to the core host so the browser URL can be traced/bookmarked. The core
 * host sends `navigate` messages back when the user uses browser history.
 */
@Component({
  selector: 'app-catalog-plugin-shell',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './catalog-plugin-shell.component.html',
})
export class CatalogPluginShellComponent implements AfterViewInit, OnDestroy {
  private router = inject(Router);

  private readonly resizeHandler = () => this.postHeight();

  private readonly messageHandler = (event: MessageEvent): void => {
    if (event.source !== window.parent) {
      return;
    }
    const data = event.data as { source?: string; type?: string; path?: string };
    if (data?.source === 'open-erp-core' && data.type === 'navigate' && data.path) {
      const path = data.path.startsWith('/') ? data.path : `/${data.path}`;
      if (this.router.url !== path) {
        void this.router.navigateByUrl(path);
      }
    }
  };

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .pipe(takeUntilDestroyed())
      .subscribe((event) => this.postRoute(event.urlAfterRedirects));
  }

  ngAfterViewInit(): void {
    window.addEventListener('resize', this.resizeHandler);
    window.addEventListener('message', this.messageHandler);
    setTimeout(() => {
      this.postHeight();
      this.postRoute(this.router.url);
    }, 0);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
    window.removeEventListener('message', this.messageHandler);
  }

  private postHeight(): void {
    const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    window.parent?.postMessage({ source: 'open-erp-plugin', type: 'resize', height }, '*');
  }

  private postRoute(path: string): void {
    window.parent?.postMessage({ source: 'open-erp-plugin', type: 'route', path }, '*');
  }
}
