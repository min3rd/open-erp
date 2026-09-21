import { Injectable, inject } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

export interface ListRouteState {
  page: number;
  size: number;
  keyword: string;
  status: string;
  id: string | null;
  drawer: string | null;
}

export type ListRouteStatePatch = Partial<{
  page: number | null;
  size: number | null;
  keyword: string | null;
  status: string | null;
  id: string | null;
  drawer: string | null;
}> & Record<string, string | number | null>;

@Injectable({ providedIn: 'root' })
export class RouteListStateService {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  bind(apply: (state: ListRouteState, params: ParamMap) => void, defaults?: Partial<ListRouteState>): void {
    const fallback: ListRouteState = {
      page: 0,
      size: 20,
      keyword: '',
      status: '',
      id: null,
      drawer: null,
      ...defaults,
    };
    this.route.queryParamMap.subscribe((params: ParamMap) => {
      apply({
        page: this.number(params.get('page'), fallback.page),
        size: this.number(params.get('size'), fallback.size),
        keyword: params.get('keyword') ?? fallback.keyword,
        status: params.get('status') ?? fallback.status,
        id: params.get('id') ?? fallback.id,
        drawer: params.get('drawer') ?? fallback.drawer,
      }, params);
    });
  }

  set(partial: ListRouteStatePatch): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: partial,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  listKey(state: ListRouteState, extra?: string): string {
    return `${state.page}|${state.size}|${state.keyword}|${state.status}${extra ? '|' + extra : ''}`;
  }

  private number(value: string | null, fallback: number): number {
    if (value === null || value === '') {
      return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
}
