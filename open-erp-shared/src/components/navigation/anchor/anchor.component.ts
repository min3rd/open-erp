import { Component, ChangeDetectionStrategy, input, model, output, HostListener, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../icon/icon.component';

export interface AnchorItem {
  id?: string;
  title: string;
  targetId: string;
  icon?: IconName;
  children?: AnchorItem[];
}

@Component({
  selector: 'erp-anchor, erp-scrollspy',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './anchor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AnchorComponent implements OnInit, AfterViewInit {
  readonly items = input<AnchorItem[]>([]);
  readonly activeTargetId = model<string>('');
  readonly offsetTop = input<number>(100);
  readonly showRail = input<boolean>(true);
  readonly title = input<string | undefined>('Nội dung trang');

  readonly anchorClick = output<AnchorItem>();

  ngOnInit(): void {
    const act = this.activeTargetId();
    const its = this.items();
    if (!act && its.length > 0) {
      this.activeTargetId.set(its[0].targetId);
    }
  }

  ngAfterViewInit(): void {
    this.checkActiveSection();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.checkActiveSection();
  }

  scrollToTarget(item: AnchorItem, event: MouseEvent): void {
    event.preventDefault();
    this.activeTargetId.set(item.targetId);
    this.anchorClick.emit(item);

    if (typeof document !== 'undefined') {
      const el = document.getElementById(item.targetId);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - this.offsetTop();
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  }

  private checkActiveSection(): void {
    const its = this.items();
    if (typeof document === 'undefined' || its.length === 0) return;

    const allTargets: string[] = [];
    const collectTargets = (list: AnchorItem[]) => {
      for (const item of list) {
        if (item.targetId) allTargets.push(item.targetId);
        if (item.children) collectTargets(item.children);
      }
    };
    collectTargets(its);

    let current = this.activeTargetId();
    const offset = this.offsetTop();

    for (const id of allTargets) {
      const el = document.getElementById(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= offset + 40 && rect.bottom > offset) {
          current = id;
          break;
        }
      }
    }

    if (current && current !== this.activeTargetId()) {
      this.activeTargetId.set(current);
    }
  }
}
