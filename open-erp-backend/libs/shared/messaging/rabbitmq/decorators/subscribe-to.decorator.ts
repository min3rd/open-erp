import { SetMetadata } from '@nestjs/common';

export const SUBSCRIBE_TO = 'erp:subscribe-to';

export interface SubscribeToMetadata {
  queue: string;
}

export const SubscribeTo = (queue: string): MethodDecorator =>
  SetMetadata(SUBSCRIBE_TO, { queue } satisfies SubscribeToMetadata);
