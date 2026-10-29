import { CommonModule, DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  BadgeComponent,
  ColorVariant,
  DrawerComponent,
  IconComponent,
  SharpButtonComponent,
  TranslatePipe,
} from '@shared';
import { NotificationDto } from './notification.model';
import { NotificationService } from './notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, TranslatePipe, IconComponent, BadgeComponent, SharpButtonComponent, DrawerComponent],
  templateUrl: './notification-bell.component.html',
})
export class NotificationBellComponent implements OnInit, AfterViewInit, OnDestroy {
  private service = inject(NotificationService);
  private host = inject(ElementRef<HTMLElement>);
  private document = inject(DOCUMENT);

  /** Portal wrapper moved to <body> so the drawer escapes the header toolbar. */
  @ViewChild('drawerPortal', { static: true })
  private drawerPortal!: ElementRef<HTMLElement>;

  private portalHome: { parent: Node; next: Node | null } | null = null;

  readonly titleKey = 'PLUGIN_IN_APP_NOTIFICATION_HEADER';
  readonly open = signal(false);
  readonly loading = signal(false);
  readonly failed = signal(false);
  readonly items = signal<NotificationDto[]>([]);
  readonly unread = computed(() => this.items().filter((item) => !item.read_at).length);
  readonly recent = computed(() => this.items().slice(0, 6));

  @Input()
  set apiBaseUrl(value: string) {
    this.service.setRuntimeOrigin(value);
  }

  private readonly refresh = (): void => this.load();

  ngOnInit(): void {
    this.load();
    window.addEventListener('op:notifications-changed', this.refresh);
  }

  ngAfterViewInit(): void {
    // Ionic's toolbar `.toolbar-container` uses `contain: content`, which makes
    // the 40px header the containing block (and paint clip) for fixed overlays.
    // Move the drawer out of the toolbar so it covers the whole viewport.
    const portal = this.drawerPortal.nativeElement;
    this.portalHome = { parent: portal.parentNode!, next: portal.nextSibling };
    this.document.body.appendChild(portal);
  }

  ngOnDestroy(): void {
    window.removeEventListener('op:notifications-changed', this.refresh);
    if (this.portalHome) {
      this.portalHome.parent.insertBefore(this.drawerPortal.nativeElement, this.portalHome.next);
    }
  }

  toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    this.open.set(true);
    this.load();
  }

  close(): void {
    this.open.set(false);
  }

  load(): void {
    if (!this.items().length) {
      this.loading.set(true);
    }
    this.service.list().subscribe({
      next: (response) => {
        this.items.set(response.data?.items ?? []);
        this.failed.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  markRead(item: NotificationDto): void {
    if (item.read_at) {
      return;
    }
    this.service.markRead(item.id).subscribe({
      next: () => this.load(),
      error: () => this.failed.set(true),
    });
  }

  markAllRead(): void {
    this.service.markAllRead().subscribe({
      next: () => this.load(),
      error: () => this.failed.set(true),
    });
  }

  viewAll(): void {
    this.open.set(false);
    this.host.nativeElement.dispatchEvent(new CustomEvent('op:navigate', {
      bubbles: true,
      composed: true,
      detail: { path: '/settings/apps/in-app-notification' },
    }));
  }

  badge(level: string): ColorVariant {
    switch (level) {
      case 'WARN': return ColorVariant.WARNING;
      case 'ERROR': return ColorVariant.DANGER;
      default: return ColorVariant.INFO;
    }
  }
}
