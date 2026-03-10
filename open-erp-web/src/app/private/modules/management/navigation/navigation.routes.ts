import { ActivatedRouteSnapshot, Router, Routes } from '@angular/router';
import { Navigation } from './navigation';
import { inject } from '@angular/core';
import { NavigationManagementService } from './services/navigation-management.service';
import { catchError, map, of } from 'rxjs';
import { NavigationList } from './list/list';
import { NavigationDetail } from './detail/detail';
import { ApiSingleResponse } from '../../../../../core/api';
import { NavigationItemDto } from './dto/navigation-item.dto';

/**
 * Resolver for loading global navigation items before route activation
 * Returns observable that emits navigation items or navigates to error page on failure
 */
const globalListResolver = () => {
  const navigationManagementService = inject(NavigationManagementService);

  return navigationManagementService.getGlobalNavigation({ includeHidden: true }).pipe(
    catchError((error) => {
      console.error('Failed to load global navigation:', error);
      // Navigate to error page or return empty array
      return of([]);
    }),
  );
};

/**
 * Resolver for loading module-specific navigation items before route activation
 * Returns observable that emits navigation items or navigates to error page on failure
 */
const moduleListResolver = (route: ActivatedRouteSnapshot) => {
  const navigationManagementService = inject(NavigationManagementService);
  const moduleId = route.params['moduleId'];

  if (!moduleId) {
    console.error('Module key is required for module navigation resolver');
    return of([]);
  }

  return navigationManagementService
    .getModuleNavigation(moduleId, {
      includeHidden: true,
    })
    .pipe(
      catchError((error) => {
        console.error(`Failed to load module navigation for ${moduleId}:`, error);
        // Return empty array on error
        return of([]);
      }),
    );
};

const moduleDetailResolver = (route: ActivatedRouteSnapshot) => {
  const navigationManagementService = inject(NavigationManagementService);
  const moduleId = route.params['moduleId'];
  if (!moduleId) {
    return of(null);
  }

  return navigationManagementService.getNavigationItem(moduleId).pipe(
    map((response: ApiSingleResponse<NavigationItemDto>) => {
      return response.data?.item || null;
    }),
  );
};

/**
 * Resolver for loading a single navigation item before route activation
 * Returns observable that emits navigation item or navigates to error page on failure
 */
const detailResolver = (route: ActivatedRouteSnapshot) => {
  const navigationManagementService = inject(NavigationManagementService);
  const router = inject(Router);
  const id = route.params['id'];

  // If no ID is provided (e.g., for 'new' route), skip loading
  if (!id || id === 'new') {
    return of(null);
  }

  return navigationManagementService.getNavigationItem(id).pipe(
    map((response: ApiSingleResponse<NavigationItemDto>) => {
      return response.data?.item || null;
    }),
  );
};

export const routes: Routes = [
  {
    path: '',
    component: Navigation,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'global',
      },
      {
        path: 'global',
        resolve: [globalListResolver],
        component: NavigationList,
        children: [
          {
            path: 'new',
            pathMatch: 'full',
            component: NavigationDetail,
          },
          {
            path: 'modules',
            children: [
              {
                path: ':moduleId',
                resolve: [moduleListResolver],
                children: [
                  {
                    path: 'new',
                    pathMatch: 'full',
                    component: NavigationDetail,
                  },
                  {
                    path: 'edit',
                    pathMatch: 'full',
                    resolve: {
                      moduleItem: moduleDetailResolver,
                    },
                    component: NavigationDetail,
                  },
                  {
                    path: ':id',
                    resolve: {
                      item: detailResolver,
                    },
                    children: [
                      {
                        path: '',
                        pathMatch: 'full',
                        component: NavigationDetail,
                      },
                      {
                        path: 'edit',
                        pathMatch: 'full',
                        component: NavigationDetail,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];
