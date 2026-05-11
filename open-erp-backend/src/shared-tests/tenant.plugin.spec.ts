import { Schema } from 'mongoose';
import { tenantPlugin } from '../../libs/shared/database/plugins/tenant.plugin';

describe('tenantPlugin', () => {
  it('adds tenant and isDeleted filter to find queries when tenantId exists', () => {
    const schema = new Schema({ tenantId: String, isDeleted: Boolean });
    tenantPlugin(schema);

    const findHooks = (schema as any).s.hooks._pres.get('find');
    expect(findHooks.length).toBeGreaterThan(0);

    const where = jest.fn().mockReturnThis();
    const query = {
      getOptions: () => ({ tenantId: 'tenant-1' }),
      where,
    };

    findHooks[0].fn.call(query);

    expect(where).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      isDeleted: false,
    });
  });

  it('does not inject filter when tenantId is missing in query options', () => {
    const schema = new Schema({ tenantId: String, isDeleted: Boolean });
    tenantPlugin(schema);

    const findHooks = (schema as any).s.hooks._pres.get('find');
    const where = jest.fn().mockReturnThis();
    const query = {
      getOptions: () => ({}),
      where,
    };

    findHooks[0].fn.call(query);

    expect(where).not.toHaveBeenCalled();
  });

  it('throws on save when tenantId is missing', () => {
    const schema = new Schema({
      tenantId: String,
      isDeleted: Boolean,
      deletedAt: Date,
    });
    tenantPlugin(schema);

    const saveHooks = (schema as any).s.hooks._pres.get('save');
    const doc = { isDeleted: false };

    expect(() => saveHooks[0].fn.call(doc)).toThrow('tenantId is required');
  });

  it('sets deletedAt when soft delete flag is true and tenant exists', () => {
    const schema = new Schema({
      tenantId: String,
      isDeleted: Boolean,
      deletedAt: Date,
    });
    tenantPlugin(schema);

    const saveHooks = (schema as any).s.hooks._pres.get('save');
    const doc: {
      tenantId: string;
      isDeleted: boolean;
      deletedAt: Date | null;
    } = {
      tenantId: 'tenant-1',
      isDeleted: true,
      deletedAt: null,
    };

    saveHooks[0].fn.call(doc);

    expect(doc.deletedAt).toBeInstanceOf(Date);
  });
});
