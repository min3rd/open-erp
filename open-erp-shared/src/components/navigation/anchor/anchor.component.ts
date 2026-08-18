import { Component, Input, Output, EventEmitter, HostListener, OnInit, AfterViewInit } from '@angular/core';
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
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AnchorComponent implements OnInit, AfterViewInit {
  @Input() items: AnchorItem[] = [];
  @Input() activeTargetId: string = '';
  @Input() offsetTop: number = 100;
  @Input() showRail: boolean = true;
  @Input() title?: string = 'Nội dung trang';

  @Output() anchorClick = new EventEmitter<AnchorItem>();
  @Output() activeTargetIdChange = new EventEmitter<string>();

  ngOnInit(): void {
    if (!this.activeTargetId && this.items.length > 0) {
      this.activeTargetId = this.items[0].targetId;
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
    this.activeTargetId = item.targetId;
    this.activeTargetIdChange.emit(this.activeTargetId);
    this.anchorClick.emit(item);

    if (typeof document !== 'undefined') {
      const el = document.getElementById(item.targetId);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - this.offsetTop;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  }

  private checkActiveSection(): void {
    if (typeof document === 'undefined' || this.items.length === 0) return;

    const allTargets: string[] = [];
    const collectTargets = (list: AnchorItem[]) => {
      for (const item of list) {
        if (item.targetId) allTargets.push(item.targetId);
        if (item.children) collectTargets(item.children);
      }
    };
    collectTargets(this.items);

    let current = this.activeTargetId;
    for (const id of allTargets) {
      const el = document.getElementById(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= this.offsetTop + 40 && rect.bottom > this.offsetTop) {
          current = id;
          break;
        }
      }
    }

    if (current && current !== this.activeTargetId) {
      this.activeTargetId = current;
      this.activeTargetIdChange.emit(this.activeTargetId);
    }
  }
}
