export enum DataScope {
  ALL = 'ALL',
  BRANCH = 'BRANCH',
  DEPARTMENT_AND_CHILDREN = 'DEPARTMENT_AND_CHILDREN',
  DEPARTMENT = 'DEPARTMENT',
  OWN_AND_SUBORDINATES = 'OWN_AND_SUBORDINATES',
  OWN_ONLY = 'OWN_ONLY',
  NONE = 'NONE'
}

export const DATA_SCOPE_RANK: Record<DataScope, number> = {
  [DataScope.NONE]: 0,
  [DataScope.OWN_ONLY]: 1,
  [DataScope.OWN_AND_SUBORDINATES]: 2,
  [DataScope.DEPARTMENT]: 3,
  [DataScope.DEPARTMENT_AND_CHILDREN]: 4,
  [DataScope.BRANCH]: 5,
  [DataScope.ALL]: 6
};

export function dataScopeRank(scope: DataScope): number {
  return DATA_SCOPE_RANK[scope] ?? 0;
}

export function isBroaderThan(candidate: DataScope, reference: DataScope): boolean {
  return dataScopeRank(candidate) > dataScopeRank(reference);
}

export function dataScopeAbbreviationKey(scope: DataScope): string {
  switch (scope) {
    case DataScope.ALL:
      return 'IAM_DATA_SCOPE_SHORT_ALL';
    case DataScope.BRANCH:
      return 'IAM_DATA_SCOPE_SHORT_BRANCH';
    case DataScope.DEPARTMENT_AND_CHILDREN:
      return 'IAM_DATA_SCOPE_SHORT_DEPT_CHILDREN';
    case DataScope.DEPARTMENT:
      return 'IAM_DATA_SCOPE_SHORT_DEPT';
    case DataScope.OWN_AND_SUBORDINATES:
      return 'IAM_DATA_SCOPE_SHORT_SUBORDINATES';
    case DataScope.OWN_ONLY:
      return 'IAM_DATA_SCOPE_SHORT_OWN';
    case DataScope.NONE:
    default:
      return 'IAM_DATA_SCOPE_SHORT_NONE';
  }
}

export function dataScopeLabelKey(scope: DataScope): string {
  switch (scope) {
    case DataScope.ALL:
      return 'IAM_DATA_SCOPE_ALL';
    case DataScope.BRANCH:
      return 'IAM_DATA_SCOPE_BRANCH';
    case DataScope.DEPARTMENT_AND_CHILDREN:
      return 'IAM_DATA_SCOPE_DEPT_CHILDREN';
    case DataScope.DEPARTMENT:
      return 'IAM_DATA_SCOPE_DEPT';
    case DataScope.OWN_AND_SUBORDINATES:
      return 'IAM_DATA_SCOPE_SUBORDINATES';
    case DataScope.OWN_ONLY:
      return 'IAM_DATA_SCOPE_OWN';
    case DataScope.NONE:
    default:
      return 'IAM_DATA_SCOPE_NONE';
  }
}
