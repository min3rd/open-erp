var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { TabsVariant, TabsOrientation } from '../../../enums/component.enum';
const SIZE_CLASSES = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    lg: 'px-5 py-3 text-sm gap-2.5 font-bold',
    md: 'px-4 py-2 text-xs font-semibold gap-2'
};
let TabsComponent = class TabsComponent {
    items = input([]);
    activeTabId = model(undefined);
    variant = input(TabsVariant.LINE);
    orientation = input(TabsOrientation.HORIZONTAL);
    size = input('md');
    fullWidth = input(false);
    tabChange = output();
    normalizedItems = computed(() => {
        return this.items().map((item, idx) => {
            if (typeof item === 'string') {
                return { id: `tab-${idx}`, label: item };
            }
            return item;
        });
    });
    currentActiveId = computed(() => {
        const act = this.activeTabId();
        if (act)
            return act;
        const items = this.normalizedItems();
        return items.length > 0 ? items[0].id : '';
    });
    isVertical = computed(() => String(this.orientation()) === 'vertical');
    isLineVariant = computed(() => String(this.variant()) === 'line');
    isPillsOrSegmented = computed(() => {
        const v = String(this.variant());
        return v === 'pills' || v === 'segmented';
    });
    sizeClass = computed(() => {
        return SIZE_CLASSES[this.size()] || SIZE_CLASSES['md'];
    });
    selectTab(item) {
        if (item.disabled || item.id === this.currentActiveId())
            return;
        this.activeTabId.set(item.id);
        this.tabChange.emit(item.id);
    }
    onKeyDown(event, currentIndex) {
        const items = this.normalizedItems();
        if (items.length === 0)
            return;
        let nextIndex = currentIndex;
        const isVert = this.isVertical();
        if ((!isVert && event.key === 'ArrowRight') || (isVert && event.key === 'ArrowDown')) {
            event.preventDefault();
            nextIndex = (currentIndex + 1) % items.length;
            while (items[nextIndex].disabled && nextIndex !== currentIndex) {
                nextIndex = (nextIndex + 1) % items.length;
            }
        }
        else if ((!isVert && event.key === 'ArrowLeft') || (isVert && event.key === 'ArrowUp')) {
            event.preventDefault();
            nextIndex = (currentIndex - 1 + items.length) % items.length;
            while (items[nextIndex].disabled && nextIndex !== currentIndex) {
                nextIndex = (nextIndex - 1 + items.length) % items.length;
            }
        }
        else if (event.key === 'Home') {
            event.preventDefault();
            nextIndex = 0;
            while (items[nextIndex].disabled && nextIndex < items.length - 1) {
                nextIndex++;
            }
        }
        else if (event.key === 'End') {
            event.preventDefault();
            nextIndex = items.length - 1;
            while (items[nextIndex].disabled && nextIndex > 0) {
                nextIndex--;
            }
        }
        if (nextIndex !== currentIndex && !items[nextIndex].disabled) {
            this.selectTab(items[nextIndex]);
        }
    }
    getItemClasses(item) {
        const isActive = item.id === this.currentActiveId();
        const v = String(this.variant());
        const o = String(this.orientation());
        const classes = [this.sizeClass()];
        if (this.fullWidth()) {
            classes.push('flex-1 justify-center');
        }
        if (item.disabled) {
            classes.push('opacity-40 cursor-not-allowed');
        }
        if (v === 'line') {
            if (o === 'horizontal') {
                classes.push('border-b-2 -mb-px');
            }
            else {
                classes.push('border-r-2 -mr-px');
            }
            if (isActive) {
                classes.push('border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold');
            }
            else {
                classes.push('border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white');
            }
        }
        else if (v === 'pills' || v === 'segmented') {
            classes.push('rounded-xl');
            if (isActive) {
                classes.push('bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold');
            }
            else {
                classes.push('text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white');
            }
        }
        else if (v === 'enclosed') {
            classes.push('rounded-t-xl');
            if (isActive) {
                classes.push('bg-white dark:bg-slate-900 border-t border-x border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-bold');
            }
            else {
                classes.push('text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white');
            }
        }
        return classes.join(' ');
    }
};
TabsComponent = __decorate([
    Component({
        selector: 'erp-tabs',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './tabs.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], TabsComponent);
export { TabsComponent };
//# sourceMappingURL=tabs.component.js.map