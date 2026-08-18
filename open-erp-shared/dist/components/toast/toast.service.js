var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable, signal } from '@angular/core';
import { ToastPosition, ToastType } from '../../enums/component.enum';
let ToastService = class ToastService {
    toastsSignal = signal([]);
    toasts = this.toastsSignal.asReadonly();
    positionSignal = signal(ToastPosition.TOP_RIGHT);
    position = this.positionSignal.asReadonly();
    setPosition(pos) {
        this.positionSignal.set(pos);
    }
    show(options) {
        const id = options.id || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newItem = {
            id,
            type: options.type || ToastType.INFO,
            title: options.title || '',
            message: options.message,
            duration: options.duration !== undefined ? options.duration : 4000,
            showProgress: options.showProgress !== undefined ? options.showProgress : true,
            icon: options.icon,
            actionText: options.actionText,
            onAction: options.onAction,
            onClose: options.onClose,
            createdAt: Date.now()
        };
        this.toastsSignal.update(list => [...list, newItem]);
        if (newItem.duration > 0) {
            setTimeout(() => {
                this.dismiss(id);
            }, newItem.duration);
        }
        return id;
    }
    success(message, title, duration) {
        return this.show({ type: ToastType.SUCCESS, message, title, duration });
    }
    error(message, title, duration) {
        return this.show({ type: ToastType.ERROR, message, title, duration: duration !== undefined ? duration : 5000 });
    }
    warning(message, title, duration) {
        return this.show({ type: ToastType.WARNING, message, title, duration });
    }
    info(message, title, duration) {
        return this.show({ type: ToastType.INFO, message, title, duration });
    }
    loading(message, title) {
        return this.show({ type: ToastType.LOADING, message, title, duration: 0 });
    }
    dismiss(id) {
        const item = this.toastsSignal().find(t => t.id === id);
        if (item?.onClose) {
            item.onClose();
        }
        this.toastsSignal.update(list => list.filter(t => t.id !== id));
    }
    clear() {
        this.toastsSignal.set([]);
    }
};
ToastService = __decorate([
    Injectable({
        providedIn: 'root'
    })
], ToastService);
export { ToastService };
//# sourceMappingURL=toast.service.js.map