/**
 * Severity of a tenant plugin notification. Mirrors the `severity` strings
 * emitted by the backend PluginNotificationService (INFO/WARNING/CRITICAL).
 */
export enum NotificationSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}
