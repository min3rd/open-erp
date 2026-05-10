export type Primitive = string | number | boolean | Date;

export interface QueryOperator<T extends Primitive = Primitive> {
  eq?: T;
  in?: T[];
  gte?: T;
  lte?: T;
}

export type QueryFilters = Record<string, Primitive | QueryOperator | undefined>;

export function buildMongoFilter(filters: QueryFilters): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const [field, value] of Object.entries(filters)) {
    if (value === undefined) {
      continue;
    }

    if (typeof value !== 'object' || value instanceof Date || Array.isArray(value)) {
      output[field] = value;
      continue;
    }

    const operatorValue = value as QueryOperator;
    const condition: Record<string, unknown> = {};

    if (operatorValue.eq !== undefined) {
      output[field] = operatorValue.eq;
      continue;
    }

    if (operatorValue.in && operatorValue.in.length > 0) {
      condition.$in = operatorValue.in;
    }

    if (operatorValue.gte !== undefined) {
      condition.$gte = operatorValue.gte;
    }

    if (operatorValue.lte !== undefined) {
      condition.$lte = operatorValue.lte;
    }

    if (Object.keys(condition).length > 0) {
      output[field] = condition;
    }
  }

  return output;
}
