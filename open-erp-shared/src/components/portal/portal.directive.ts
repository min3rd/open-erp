import { Directive, input, TemplateRef, ViewContainerRef, OnInit, OnDestroy, EmbeddedViewRef } from '@angular/core';

@Directive({
  selector: '[erpPortal]',
  standalone: true
})
export class PortalDirective implements OnInit, OnDestroy {
  readonly targetSelector = input<string | undefined>(undefined, { alias: 'erpPortal' });

  private embeddedView?: EmbeddedViewRef<any>;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainerRef: ViewContainerRef
  ) {}

  ngOnInit(): void {
    this.embeddedView = this.viewContainerRef.createEmbeddedView(this.templateRef);
    if (typeof document !== 'undefined') {
      const sel = this.targetSelector();
      const target = sel ? document.querySelector(sel) : document.body;
      if (target) {
        for (const rootNode of this.embeddedView.rootNodes) {
          target.appendChild(rootNode);
        }
      }
    }
  }

  ngOnDestroy(): void {
    if (this.embeddedView) {
      for (const rootNode of this.embeddedView.rootNodes) {
        if (rootNode.parentNode) {
          rootNode.parentNode.removeChild(rootNode);
        }
      }
      this.embeddedView.destroy();
    }
  }
}
