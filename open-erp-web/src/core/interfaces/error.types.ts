export interface ApiErrorDto {
  timestamp?: Date;
  status?: number;
  errorCode?: string;
  message?: string;
  details?: any;
  correlationId?: string;
  supportUrl?: string;
}

export interface ApiResponse {
  error?: ApiErrorDto;
}
