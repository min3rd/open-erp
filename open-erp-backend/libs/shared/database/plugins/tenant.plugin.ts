import { Query, Schema } from 'mongoose';

const QUERY_METHODS = [
  'count',
  'countDocuments',
  'deleteMany',
  'deleteOne',
  'find',
  'findOne',
  'findOneAndDelete',
  'findOneAndUpdate',
  'updateMany',
  'updateOne',
] as const;

type TenantAwareQuery = Query<unknown, unknown, unknown, unknown> & {
  getOptions: () => { tenantId?: unknown };
  where: (filter: Record<string, unknown>) => TenantAwareQuery;
};

export function tenantPlugin(schema: Schema): void {
  for (const method of QUERY_METHODS) {
    schema.pre(method as any, function applyTenantFilter(this: TenantAwareQuery) {
      const tenantId = this.getOptions()?.tenantId;
      if (!tenantId) {
        return;
      }

      this.where({ tenantId, isDeleted: false });
    });
  }

  schema.pre('save', function onSave(this: { tenantId?: unknown; isDeleted?: boolean; deletedAt?: Date | null }) {
    if (!this.tenantId) {
      throw new Error('tenantId is required');
    }

    if (this.isDeleted && !this.deletedAt) {
      this.deletedAt = new Date();
    }
  });
}
