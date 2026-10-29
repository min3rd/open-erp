import { Injectable } from '@angular/core';
import { PlatformLocation } from '@angular/common';

/**
 * In-memory location for an embedded web component. The core owns the browser
 * URL; the plugin router must never call history.pushState/replaceState on the
 * core page.
 */
@Injectable()
export class MemoryPlatformLocation extends PlatformLocation {
  private path = '/';
  private state: unknown = null;

  getBaseHrefFromDOM(): string {
    return '/';
  }

  getState(): unknown {
    return this.state;
  }

  onPopState(_fn: (event: any) => void): () => void {
    return () => {};
  }

  onHashChange(_fn: (event: any) => void): () => void {
    return () => {};
  }

  get href(): string {
    return `http://localhost${this.path}`;
  }

  get protocol(): string {
    return 'http:';
  }

  get hostname(): string {
    return 'localhost';
  }

  get port(): string {
    return '';
  }

  get pathname(): string {
    return this.path.split('?')[0];
  }

  get search(): string {
    const index = this.path.indexOf('?');
    return index >= 0 ? this.path.slice(index) : '';
  }

  get hash(): string {
    return '';
  }

  replaceState(state: unknown, _title: string, url: string): void {
    this.state = state;
    this.path = url || this.path;
  }

  pushState(state: unknown, _title: string, url: string): void {
    this.state = state;
    this.path = url || this.path;
  }

  forward(): void {}

  back(): void {}
}
