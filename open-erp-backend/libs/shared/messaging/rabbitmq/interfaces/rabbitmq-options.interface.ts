export interface RabbitmqRetryPolicy {
  maxRetries?: number;
  retryDelays?: number[];
}

export interface RabbitmqModuleOptions {
  uri: string;
  serviceName: string;
  prefetch?: number;
  retryPolicy?: RabbitmqRetryPolicy;
}
