import { Test, TestingModule } from '@nestjs/testing';
import { DynamicFormController } from './dynamic-form.controller';
import { DynamicFormService } from '../../core/dynamic-form/dynamic-form.service';
import { JwtAuthGuard } from '../../core/auth/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException } from '@nestjs/common';

describe('DynamicFormController', () => {
  let controller: DynamicFormController;
  let serviceMock: any;

  const mockService = {
    createOrUpdateForm: jest.fn(),
    getVersionsByKey: jest.fn(),
    restoreVersion: jest.fn(),
    validateData: jest.fn(),
  };

  const mockJwtService = { verifyAsync: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DynamicFormController],
      providers: [
        { provide: DynamicFormService, useValue: mockService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DynamicFormController>(DynamicFormController);
    serviceMock = module.get<DynamicFormService>(DynamicFormService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOrUpdate', () => {
    it('should return success with form metadata on creation', async () => {
      const req = { tenantId: 't1' };
      const body = { formKey: 'my_form', name: 'Test', fields: [] };
      const mockForm = {
        id: 'form-1',
        formKey: 'my_form',
        name: 'Test',
        version: 1,
        isLatest: true,
        createdAt: new Date('2026-06-21'),
      };
      serviceMock.createOrUpdateForm.mockResolvedValue(mockForm);

      const res = await controller.createOrUpdate(body, req);
      expect(serviceMock.createOrUpdateForm).toHaveBeenCalledWith('t1', body);
      expect(res.success).toBe(true);
      expect(res.data.formKey).toBe('my_form');
      expect(res.data.version).toBe(1);
    });
  });

  describe('getVersions', () => {
    it('should return list of form versions', async () => {
      const req = { tenantId: 't1' };
      const mockVersions = [
        { id: 'f2', formKey: 'my_form', name: 'Test', version: 2, isLatest: true, createdAt: new Date() },
        { id: 'f1', formKey: 'my_form', name: 'Test', version: 1, isLatest: false, createdAt: new Date() },
      ];
      serviceMock.getVersionsByKey.mockResolvedValue(mockVersions);

      const res = await controller.getVersions('my_form', req);
      expect(serviceMock.getVersionsByKey).toHaveBeenCalledWith('my_form', 't1');
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(2);
    });

    it('should propagate NotFoundException from service', async () => {
      serviceMock.getVersionsByKey.mockRejectedValue(new NotFoundException('not found'));
      const req = { tenantId: 't1' };
      await expect(controller.getVersions('unknown', req)).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore', () => {
    it('should return restored form data', async () => {
      const req = { tenantId: 't1' };
      const mockRestored = {
        id: 'new-id',
        formKey: 'my_form',
        version: 3,
        isLatest: true,
        restoredFromVersion: 1,
      };
      serviceMock.restoreVersion.mockResolvedValue(mockRestored);

      const res = await controller.restore('v1-id', req);
      expect(serviceMock.restoreVersion).toHaveBeenCalledWith('v1-id', 't1');
      expect(res.success).toBe(true);
      expect(res.data.restoredFromVersion).toBe(1);
      expect(res.data.version).toBe(3);
    });
  });

  describe('validateData', () => {
    it('should return success message when data is valid', async () => {
      const req = { tenantId: 't1' };
      serviceMock.validateData.mockResolvedValue({ valid: true, errors: [] });

      const res = await controller.validateData('form-1', { reason: 'ok' }, req);
      expect(res.success).toBe(true);
      expect((res as any).message).toBe('Dữ liệu hợp lệ');
    });

    it('should return errors array when data is invalid', async () => {
      const req = { tenantId: 't1' };
      serviceMock.validateData.mockResolvedValue({
        valid: false,
        errors: [{ field: 'reason', message: 'Trường này là bắt buộc' }],
      });

      const res = await controller.validateData('form-1', {}, req);
      expect(res.success).toBe(false);
      expect((res as any).errors).toHaveLength(1);
    });
  });
});
