export const RABBITMQ_EXCHANGES = {
  DIRECT: 'openErp.direct',
  TOPIC: 'openErp.topic',
  FANOUT: 'openErp.fanout',
  DEAD_LETTER: 'openErp.dead_letter',
} as const;

export type RabbitmqExchange =
  (typeof RABBITMQ_EXCHANGES)[keyof typeof RABBITMQ_EXCHANGES];
