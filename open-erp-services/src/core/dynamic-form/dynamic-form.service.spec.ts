import { Test, TestingModule } from '@nestjs/testing';
import { DynamicFormService } from './dynamic-form.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DynamicForm } from './entities/dynamic-form.entity';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DynamicFormService', () => {
  let service: DynamicFormService;
  let formRepoMock: any;
  let mockManager: any;
  let dataSourceMock: any;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  };

  const sampleFields = [
    {
      id: 'field_reason',
      name: 'reason',
      label: 'Lý do',
      type: 'TEXTAREA',
      required: true,
      validation: { minLength: 10, maxLength: 500 },
    },
    {
      id: 'field_amount',
      name: 'totalAmount',
      label: 'Số tiền',
      type: 'NUMBER',
      required: true,
      validation: { min: 1000, max: 1000000000 },
    },
    {
      id: 'field_category',
      name: 'category',
      label: 'Danh mục',
      type: 'SELECT',
      required: true,
      options: [
        { label: 'Máy tính', value: 'IT_EQUIPMENT' },
        { label: 'Bàn ghế', value: 'FURNITURE' },
      ],
    },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    // Build a per-test manager that starts fresh
    mockManager = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((_entity, obj) => {
        if (!obj.id) obj.id = 'form-uuid-gen';
        return Promise.resolve(obj);
      }),
    };

    dataSourceMock = {
      transaction: jest.fn((cb: any) => cb(mockManager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DynamicFormService,
        { provide: getRepositoryToken(DynamicForm), useValue: mockRepository },
        { provide: DataSource, useValue: dataSourceMock },
      ],
    }).compile();

    service = module.get<DynamicFormService>(DynamicFormService);
    formRepoMock = module.get(getRepositoryToken(DynamicForm));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── createOrUpdateForm ──────────────────────────────────────────────────
  describe('createOrUpdateForm', () => {
    it('should throw BadRequestException when formKey is missing', async () => {
      await expect(
        service.createOrUpdateForm('t1', { formKey: '', name: 'Test', fields: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when name is missing', async () => {
      await expect(
        service.createOrUpdateForm('t1', { formKey: 'my_form', name: '', fields: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when fields is not an array', async () => {
      await expect(
        service.createOrUpdateForm('t1', { formKey: 'my_form', name: 'Test', fields: null as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for unsupported field type', async () => {
      await expect(
        service.createOrUpdateForm('t1', {
          formKey: 'my_form',
          name: 'Test',
          fields: [{ id: 'f1', name: 'f1', type: 'UNKNOWN' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for duplicate field id', async () => {
      await expect(
        service.createOrUpdateForm('t1', {
          formKey: 'my_form',
          name: 'Test',
          fields: [
            { id: 'f1', name: 'field1', type: 'TEXT' },
            { id: 'f1', name: 'field2', type: 'TEXT' },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when SELECT field has no options', async () => {
      await expect(
        service.createOrUpdateForm('t1', {
          formKey: 'my_form',
          name: 'Test',
          fields: [{ id: 'f1', name: 'f1', type: 'SELECT', options: [] }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when layout is not an object', async () => {
      await expect(
        service.createOrUpdateForm('t1', {
          formKey: 'my_form',
          name: 'Test',
          fields: [{ id: 'f1', name: 'f1', type: 'TEXT' }],
          layout: 'not-an-object',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when layout rows is not an array', async () => {
      await expect(
        service.createOrUpdateForm('t1', {
          formKey: 'my_form',
          name: 'Test',
          fields: [{ id: 'f1', name: 'f1', type: 'TEXT' }],
          layout: { rows: 'not-an-array' },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when layout columns is not an array', async () => {
      await expect(
        service.createOrUpdateForm('t1', {
          formKey: 'my_form',
          name: 'Test',
          fields: [{ id: 'f1', name: 'f1', type: 'TEXT' }],
          layout: {
            rows: [{ columns: 'not-an-array' }],
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when layout referenced field does not exist', async () => {
      await expect(
        service.createOrUpdateForm('t1', {
          formKey: 'my_form',
          name: 'Test',
          fields: [{ id: 'f1', name: 'f1', type: 'TEXT' }],
          layout: {
            rows: [{ columns: [{ fieldId: 'nonexistent-field' }] }],
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should save layout successfully when valid', async () => {
      mockManager.findOne.mockResolvedValue(null);

      const validLayout = {
        rows: [{ columns: [{ fieldId: 'field_reason' }] }],
      };

      const result = await service.createOrUpdateForm('t1', {
        formKey: 'my_form',
        name: 'Test Form',
        fields: sampleFields,
        layout: validLayout,
      });

      expect(result.version).toBe(1);
      expect(result.layout).toEqual(validLayout);
    });

    it('should create first version (version=1) when no existing form', async () => {
      mockManager.findOne.mockResolvedValue(null);

      const result = await service.createOrUpdateForm('t1', {
        formKey: 'my_form',
        name: 'Test Form',
        fields: sampleFields,
      });

      expect(result.version).toBe(1);
      expect(result.isLatest).toBe(true);
      expect(mockManager.save).toHaveBeenCalledTimes(1);
    });

    it('should increment version and demote old latest when form already exists', async () => {
      const existingForm = {
        id: 'old-uuid',
        formKey: 'my_form',
        tenantId: 't1',
        version: 2,
        isLatest: true,
      };
      mockManager.findOne.mockResolvedValue(existingForm);

      const result = await service.createOrUpdateForm('t1', {
        formKey: 'my_form',
        name: 'Test Form Updated',
        fields: sampleFields,
      });

      // old form should be saved with isLatest = false
      expect(existingForm.isLatest).toBe(false);
      expect(result.version).toBe(3);
      expect(result.isLatest).toBe(true);
      // save called twice: once for old, once for new
      expect(mockManager.save).toHaveBeenCalledTimes(2);
    });
  });

  // ── getVersionsByKey ────────────────────────────────────────────────────
  describe('getVersionsByKey', () => {
    it('should return forms sorted by version desc', async () => {
      const forms = [{ id: 'f2', version: 2 }, { id: 'f1', version: 1 }];
      formRepoMock.find.mockResolvedValue(forms);

      const result = await service.getVersionsByKey('my_form', 't1');
      expect(result).toEqual(forms);
    });

    it('should throw NotFoundException when no versions found', async () => {
      formRepoMock.find.mockResolvedValue([]);
      await expect(service.getVersionsByKey('nonexistent', 't1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── restoreVersion ──────────────────────────────────────────────────────
  describe('restoreVersion', () => {
    it('should throw NotFoundException when target form not found', async () => {
      formRepoMock.findOne.mockResolvedValue(null);
      await expect(service.restoreVersion('bad-id', 't1')).rejects.toThrow(NotFoundException);
    });

    it('should create a new version cloned from the target', async () => {
      const targetForm = {
        id: 'v1-id',
        formKey: 'my_form',
        tenantId: 't1',
        name: 'My Form',
        description: null,
        version: 1,
        isLatest: false,
        fields: sampleFields,
      };
      formRepoMock.findOne.mockResolvedValue(targetForm);

      const currentLatest = {
        id: 'v2-id',
        formKey: 'my_form',
        tenantId: 't1',
        version: 2,
        isLatest: true,
      };
      mockManager.findOne.mockResolvedValue(currentLatest);

      const result = await service.restoreVersion('v1-id', 't1');

      expect(currentLatest.isLatest).toBe(false);
      expect(result.version).toBe(3);
      expect(result.isLatest).toBe(true);
      expect((result as any).restoredFromVersion).toBe(1);
    });
  });

  // ── validateData ────────────────────────────────────────────────────────
  describe('validateData', () => {
    it('should throw NotFoundException when form not found', async () => {
      formRepoMock.findOne.mockResolvedValue(null);
      await expect(service.validateData('bad-id', 't1', {})).rejects.toThrow(NotFoundException);
    });

    it('should return valid=true for correct data', async () => {
      formRepoMock.findOne.mockResolvedValue({ id: 'f1', fields: sampleFields });

      const result = await service.validateData('f1', 't1', {
        reason: 'Mua laptop mới phục vụ code dự án OpenERP (đủ dài)',
        totalAmount: 25000000,
        category: 'IT_EQUIPMENT',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for missing required field', async () => {
      formRepoMock.findOne.mockResolvedValue({ id: 'f1', fields: sampleFields });

      const result = await service.validateData('f1', 't1', {
        totalAmount: 25000000,
        category: 'IT_EQUIPMENT',
        // missing: reason
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'reason')).toBe(true);
    });

    it('should return error when TEXT is shorter than minLength', async () => {
      formRepoMock.findOne.mockResolvedValue({ id: 'f1', fields: sampleFields });

      const result = await service.validateData('f1', 't1', {
        reason: 'Ngắn',
        totalAmount: 25000000,
        category: 'IT_EQUIPMENT',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'reason')).toBe(true);
    });

    it('should return error when NUMBER is below min', async () => {
      formRepoMock.findOne.mockResolvedValue({ id: 'f1', fields: sampleFields });

      const result = await service.validateData('f1', 't1', {
        reason: 'Mua laptop mới phục vụ code dự án OpenERP (đủ dài)',
        totalAmount: 500, // below 1000
        category: 'IT_EQUIPMENT',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'totalAmount')).toBe(true);
    });

    it('should return error when SELECT value is not in options', async () => {
      formRepoMock.findOne.mockResolvedValue({ id: 'f1', fields: sampleFields });

      const result = await service.validateData('f1', 't1', {
        reason: 'Mua laptop mới phục vụ code dự án OpenERP (đủ dài)',
        totalAmount: 25000000,
        category: 'INVALID_CATEGORY',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'category')).toBe(true);
    });
  });

  // ── runValidation (pure logic, no DB) ──────────────────────────────────
  describe('runValidation (pure)', () => {
    it('should validate DATE field as invalid when date string is bad', () => {
      const dateField = [
        { id: 'f1', name: 'startDate', label: 'Ngày bắt đầu', type: 'DATE', required: false },
      ];
      const errors = service.runValidation(dateField, { startDate: 'not-a-date' });
      expect(errors.some((e) => e.field === 'startDate')).toBe(true);
    });

    it('should pass when optional field has no value', () => {
      const optionalField = [
        { id: 'f1', name: 'note', label: 'Ghi chú', type: 'TEXT', required: false },
      ];
      const errors = service.runValidation(optionalField, {});
      expect(errors).toHaveLength(0);
    });

    it('should throw BadRequestException for GRID field without columns', async () => {
      await expect(
        service.createOrUpdateForm('t1', {
          formKey: 'grid_form',
          name: 'Grid Form',
          fields: [{ id: 'f_grid', name: 'myGrid', type: 'GRID', columns: [] }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for GRID column with duplicate names', async () => {
      await expect(
        service.createOrUpdateForm('t1', {
          formKey: 'grid_form',
          name: 'Grid Form',
          fields: [
            {
              id: 'f_grid',
              name: 'myGrid',
              type: 'GRID',
              columns: [
                { name: 'col1', type: 'TEXT', label: 'Col 1' },
                { name: 'col1', type: 'NUMBER', label: 'Col 1 Dup' },
              ],
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for GRID column with unsupported type', async () => {
      await expect(
        service.createOrUpdateForm('t1', {
          formKey: 'grid_form',
          name: 'Grid Form',
          fields: [
            {
              id: 'f_grid',
              name: 'myGrid',
              type: 'GRID',
              columns: [{ name: 'col1', type: 'GRID', label: 'Nested Grid is Bad' }],
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate GRID field and return errors for invalid cell values', () => {
      const gridField = [
        {
          id: 'f_grid',
          name: 'proposalItems',
          label: 'Đề xuất',
          type: 'GRID',
          required: true,
          columns: [
            { name: 'itemName', type: 'TEXT', label: 'Tên', required: true, validation: { minLength: 5 } },
            { name: 'price', type: 'NUMBER', label: 'Giá', required: true, validation: { min: 10 } },
            { name: 'type', type: 'SELECT', label: 'Loại', required: true, options: [{ label: 'A', value: 'a' }] },
          ],
        },
      ];

      const errors1 = service.runValidation(gridField, {
        proposalItems: [
          { itemName: 'Pen', price: 5, type: 'b' }, // itemName < 5, price < 10, type not in options
        ],
      });

      expect(errors1).toHaveLength(3);
      expect(errors1.find((e) => e.field === 'proposalItems[0].itemName').messageKey).toBe('form.validation.min_length');
      expect(errors1.find((e) => e.field === 'proposalItems[0].price').messageKey).toBe('form.validation.min_value');
      expect(errors1.find((e) => e.field === 'proposalItems[0].type').messageKey).toBe('form.validation.invalid_option');

      // Test required checks
      const errors2 = service.runValidation(gridField, {
        proposalItems: [
          { itemName: '', price: null }, // empty required cells
        ],
      });
      expect(errors2).toHaveLength(3); // itemName (required), price (required), type (required)
      expect(errors2.find((e) => e.field === 'proposalItems[0].itemName').messageKey).toBe('form.validation.required');
      expect(errors2.find((e) => e.field === 'proposalItems[0].price').messageKey).toBe('form.validation.required');
      expect(errors2.find((e) => e.field === 'proposalItems[0].type').messageKey).toBe('form.validation.required');
    });

    it('should validate GRID field and return invalid grid data error when value is not an array', () => {
      const gridField = [
        {
          id: 'f_grid',
          name: 'proposalItems',
          label: 'Đề xuất',
          type: 'GRID',
          required: true,
          columns: [{ name: 'itemName', type: 'TEXT', label: 'Tên', required: true }],
        },
      ];
      const errors = service.runValidation(gridField, { proposalItems: 'not-an-array' });
      expect(errors).toHaveLength(1);
      expect(errors[0].messageKey).toBe('form.validation.invalid_grid_data');
    });
  });
});
