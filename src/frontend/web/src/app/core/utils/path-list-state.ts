import { Injectable, inject } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { combineLatest } from 'rxjs';

export interface PathListState {
  filter: string;
  sort: string;
  pageSize: number;
  page: number;
  id: string | null;
  mode: string;
}

export const PATH_LIST_DEFAULTS: PathListState = {
  filter: 'all',
  sort: '-',
  pageSize: 20,
  page: 1,
  id: null,
  mode: 'list',
};

export const PATH_LIST_EMPTY_ID = '-';

export function parsePathListState(params: Params): PathListState {
  const page = Number(params['page']);
  const pageSize = Number(params['pageSize']);
  const id = params['id'];
  return {
    filter: params['filter'] ?? PATH_LIST_DEFAULTS.filter,
    sort: params['sort'] ?? PATH_LIST_DEFAULTS.sort,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : PATH_LIST_DEFAULTS.pageSize,
    page: Number.isFinite(page) && page >= 1 ? page : PATH_LIST_DEFAULTS.page,
    id: id && id !== PATH_LIST_EMPTY_ID ? id : null,
    mode: params['mode'] ?? PATH_LIST_DEFAULTS.mode,
  };
}

export function buildPathListCommands(basePath: string, state: PathListState): unknown[] {
  return [
    basePath,
    state.filter || PATH_LIST_DEFAULTS.filter,
    state.sort || PATH_LIST_DEFAULTS.sort,
    String(state.pageSize || PATH_LIST_DEFAULTS.pageSize),
    String(state.page || PATH_LIST_DEFAULTS.page),
    state.id || PATH_LIST_EMPTY_ID,
    state.mode || PATH_LIST_DEFAULTS.mode,
  ];
}

export function buildPathListUrl(basePath: string, state: PathListState, keyword?: string | null): string {
  const url = buildPathListCommands(basePath, state).join('/');
  return keyword ? `${url}?q=${encodeURIComponent(keyword)}` : url;
}

@Injectable()
export class PathListStateService {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private basePath = '';
  private lastKeyword = '';

  bind(basePath: string, apply: (state: PathListState, keyword: string) => void): void {
    this.basePath = basePath;
    combineLatest([this.route.params, this.route.queryParamMap]).subscribe(([params, query]) => {
      const keyword = query.get('q') ?? '';
      this.lastKeyword = keyword;
      apply(parsePathListState(params), keyword);
    });
  }

  set(patch: Partial<PathListState>, keyword?: string | null, extraQuery?: Record<string, string | null>): void {
    const current = parsePathListState(this.route.snapshot.params);
    const next: PathListState = { ...current, ...patch };
    const query: Record<string, string | null> = { ...(extraQuery ?? {}) };
    if (keyword !== undefined) {
      query['q'] = keyword ? keyword : null;
    }
    this.router.navigate(buildPathListCommands(this.basePath, next), {
      replaceUrl: true,
      queryParams: query,
      queryParamsHandling: keyword === undefined && !extraQuery ? 'preserve' : '',
    });
  }

  listKey(state: PathListState): string {
    return `${state.filter}|${state.sort}|${state.pageSize}|${state.page}|${this.lastKeyword}`;
  }
}
