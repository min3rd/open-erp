export interface ErpMessage<T = unknown> {
  eventId: string;
  eventType: string;
  tenantId: string;
  userId: string;
  timestamp: string;
  version: number;
  payload: T;
  metadata?: {
    correlationId?: string;
    traceId?: string;
    source?: string;
  };
}
