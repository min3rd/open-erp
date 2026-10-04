import { AuditResult, ColorVariant, UserStatus } from '../enums';

export function userStatusVariant(status: string | null | undefined): ColorVariant {
  switch (status) {
    case UserStatus.ACTIVE:
      return ColorVariant.SUCCESS;
    case UserStatus.LOCKED:
      return ColorVariant.WARNING;
    case UserStatus.PENDING:
      return ColorVariant.INFO;
    default:
      return ColorVariant.DEFAULT;
  }
}

export function userStatusLabelKey(status: string | null | undefined): string {
  return status ? `USER_STATUS_${status}` : 'COMMON_INACTIVE';
}

export function auditResultVariant(result: AuditResult): ColorVariant {
  switch (result) {
    case AuditResult.SUCCESS:
      return ColorVariant.SUCCESS;
    case AuditResult.DENIED:
      return ColorVariant.WARNING;
    case AuditResult.FAILED:
      return ColorVariant.DANGER;
    default:
      return ColorVariant.DEFAULT;
  }
}
