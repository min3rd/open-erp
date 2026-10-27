import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-catalog-plugin-shell',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './catalog-plugin-shell.component.html',
})
export class CatalogPluginShellComponent implements AfterViewInit, OnDestroy {
  private readonly resizeHandler = () => this.postHeight();

  ngAfterViewInit(): void {
    window.addEventListener('resize', this.resizeHandler);
    setTimeout(() => this.postHeight(), 0);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
  }

  private postHeight(): void {
    const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    window.parent?.postMessage({ source: 'open-erp-plugin', type: 'resize', height }, '*');
  }
}
