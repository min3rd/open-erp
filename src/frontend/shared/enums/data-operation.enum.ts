export enum DataOperation {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
  SHARE = 'SHARE'
}

export const DATA_OPERATIONS: readonly DataOperation[] = [
  DataOperation.READ,
  DataOperation.CREATE,
  DataOperation.UPDATE,
  DataOperation.DELETE,
  DataOperation.EXPORT,
  DataOperation.SHARE
];

export function dataOperationLabelKey(operation: DataOperation): string {
  switch (operation) {
    case DataOperation.CREATE:
      return 'IAM_OPERATION_CREATE';
    case DataOperation.READ:
      return 'IAM_OPERATION_READ';
    case DataOperation.UPDATE:
      return 'IAM_OPERATION_UPDATE';
    case DataOperation.DELETE:
      return 'IAM_OPERATION_DELETE';
    case DataOperation.EXPORT:
      return 'IAM_OPERATION_EXPORT';
    case DataOperation.SHARE:
    default:
      return 'IAM_OPERATION_SHARE';
  }
}

export function dataScopeFieldKey(operation: DataOperation): string {
  switch (operation) {
    case DataOperation.CREATE:
      return 'create_scope';
    case DataOperation.READ:
      return 'read_scope';
    case DataOperation.UPDATE:
      return 'update_scope';
    case DataOperation.DELETE:
      return 'delete_scope';
    case DataOperation.EXPORT:
      return 'export_scope';
    case DataOperation.SHARE:
    default:
      return 'share_scope';
  }
}
