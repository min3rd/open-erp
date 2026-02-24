import { Routes } from '@angular/router';
import { privateGuard } from '../core/guard/private-guard';
import { Layout } from '../core/layout/layout';
import { forkJoin } from 'rxjs';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { NavigationService } from '../core/services/navigation-service';
import { AuthService } from '../core/services/auth-service';
import { ChatService } from '../core/services/chat-service';
import { LanguageService } from '../core/services/language.service';

const initializeData = () => {
  const navigationService = inject(NavigationService);
  const authService = inject(AuthService);
  const chatService = inject(ChatService);
  const languageService = inject(LanguageService);

  return forkJoin([
    navigationService.loadModules(),
    authService.me().pipe(
      tap((response: any) => {
        const userId = response?.data?.item?.id ?? null;
        if (userId) {
          chatService.setCurrentUser(userId);
        }
        const token = authService.accessToken;
        if (token) {
          chatService.connectSocket(token);
        }
      }),
    ),
    chatService.loadConversations(),
    languageService.loadLanguages(),
  ]);
};

export const routes: Routes = [
  {
    path: '',
    canActivate: [privateGuard],
    component: Layout,
    resolve: [initializeData],
    data: {
      layout: 'vertical',
    },
    loadChildren: () => import('./private/private.routes').then((m) => m.routes),
  },
  {
    path: '',
    component: Layout,
    data: {
      layout: 'empty',
    },
    loadChildren: () => import('./public/public.routes').then((m) => m.routes),
  },
];
