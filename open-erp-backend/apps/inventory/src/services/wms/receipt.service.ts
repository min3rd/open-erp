import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ReceiptRepository } from '../../repositories/wms/receipt.repository';
import {
  CreateReceiptDto,
  UpdateReceiptDto,
  SubmitReceiptDto,
  ReviewReceiptDto,
  ApproveReceiptDto,
  ReceiveReceiptDto,
  FinalizeReceiptDto,
  UnlockReceiptDto,
  QcReceiptDto,
} from '../../dto/wms/receipt.dto';
import {
  ReceiptStatus,
  ReceiptType,
  QcStatus,
  ReceiptLine,
} from '@shared/schemas';

@Injectable()
export class ReceiptService {
  private readonly logger = new Logger(ReceiptService.name);

  constructor(
    private readonly receiptRepository: ReceiptRepository,
  ) {}

  private generateCode(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RCP-${ts}-${rand}`;
  }

  private addAuditEntry(auditTrail: any[], action: string, userId?: string, payload?: any, ip?: string) {
    auditTrail.push({
      action,
      userId: userId ? new Types.ObjectId(userId) : undefined,
      timestamp: new Date(),
      ip,
      payload,
    });
  }

  async create(dto: CreateReceiptDto, userId?: string) {
    this.logger.log(`Creating receipt for org: ${dto.orgId}, warehouse: ${dto.warehouseId}`);

    const auditTrail: any[] = [];
    this.addAuditEntry(auditTrail, 'created', userId, { orgId: dto.orgId, warehouseId: dto.warehouseId });

    const data: any = {
      code: this.generateCode(),
      orgId: new Types.ObjectId(dto.orgId),
      warehouseId: new Types.ObjectId(dto.warehouseId),
      type: dto.type ?? ReceiptType.MANUAL,
      status: ReceiptStatus.DRAFT,
      referenceDocs: dto.referenceDocs ?? [],
      reviewers: [],
      auditTrail,
    };

    if (dto.poId) data.poId = dto.poId;
    if (dto.supplierId) data.supplierId = new Types.ObjectId(dto.supplierId);
    if (dto.supplier) data.supplier = dto.supplier;
    if (dto.shippingParty) data.shippingParty = dto.shippingParty;
    if (dto.expectedReceiptAt) data.expectedReceiptAt = dto.expectedReceiptAt;
    if (dto.notes) data.notes = dto.notes;
    if (userId) data.createdBy = new Types.ObjectId(userId);

    if (dto.lines?.length) {
      data.lines = dto.lines.map((line, idx) => ({
        lineId: `line-${idx + 1}`,
        skuId: new Types.ObjectId(line.skuId),
        skuCode: line.skuCode,
        skuName: line.skuName,
        orderedQty: line.orderedQty,
        receivedQty: 0,
        unit: line.unit,
        serials: [],
        qcStatus: QcStatus.PENDING,
        defectQty: 0,
      }));
    }

    return this.receiptRepository.create(data);
  }

  async update(id: string, dto: UpdateReceiptDto, userId?: string) {
    const receipt = await this.findById(id);

    if (receipt.lockedAt) {
      throw new ForbiddenException('Cannot update a locked receipt');
    }

    const allowedStatuses: ReceiptStatus[] = [ReceiptStatus.DRAFT];
    if (!allowedStatuses.includes(receipt.status)) {
      throw new BadRequestException(`Cannot update receipt in status: ${receipt.status}. Only draft receipts can be updated.`);
    }

    const auditTrail = [...receipt.auditTrail] as any[];
    this.addAuditEntry(auditTrail, 'updated', userId, { fields: Object.keys(dto) });

    const updateData: any = { auditTrail };
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.poId !== undefined) updateData.poId = dto.poId;
    if (dto.supplier !== undefined) updateData.supplier = dto.supplier;
    if (dto.shippingParty !== undefined) updateData.shippingParty = dto.shippingParty;
    if (dto.expectedReceiptAt !== undefined) updateData.expectedReceiptAt = dto.expectedReceiptAt;
    if (dto.referenceDocs !== undefined) updateData.referenceDocs = dto.referenceDocs;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.lines !== undefined) {
      updateData.lines = dto.lines.map((line, idx) => ({
        lineId: `line-${idx + 1}`,
        skuId: new Types.ObjectId(line.skuId),
        skuCode: line.skuCode,
        skuName: line.skuName,
        orderedQty: line.orderedQty,
        receivedQty: 0,
        unit: line.unit,
        serials: [],
        qcStatus: QcStatus.PENDING,
        defectQty: 0,
      }));
    }

    return this.receiptRepository.update(id, updateData);
  }

  async findById(id: string) {
    const receipt = await this.receiptRepository.findById(id);
    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }
    return receipt;
  }

  async findAll(
    filter: {
      orgId?: string;
      warehouseId?: string;
      poId?: string;
      status?: ReceiptStatus;
      q?: string;
    } = {},
    options: { page?: number; limit?: number; sortField?: string; sortOrder?: 1 | -1 } = {},
  ) {
    const { page = 1, limit = 20, sortField, sortOrder } = options;
    const skip = (page - 1) * limit;

    const result = await this.receiptRepository.findAll(filter, { skip, limit, sortField, sortOrder });

    return {
      items: result.items,
      total: result.total,
      page,
      limit,
    };
  }

  async submit(id: string, dto: SubmitReceiptDto, userId?: string) {
    const receipt = await this.findById(id);

    if (receipt.status !== ReceiptStatus.DRAFT) {
      throw new BadRequestException(`Cannot submit receipt in status: ${receipt.status}. Only draft receipts can be submitted.`);
    }

    const auditTrail = [...receipt.auditTrail] as any[];
    this.addAuditEntry(auditTrail, 'submitted', userId, { reviewers: dto.reviewers, notes: dto.notes });

    const updateData: any = {
      status: ReceiptStatus.UNDER_REVIEW,
      auditTrail,
    };

    if (dto.reviewers?.length) {
      updateData.reviewers = dto.reviewers.map((r) => new Types.ObjectId(r));
    }
    if (dto.notes) {
      updateData.notes = dto.notes;
    }

    return this.receiptRepository.update(id, updateData);
  }

  async review(id: string, dto: ReviewReceiptDto, userId?: string) {
    const receipt = await this.findById(id);

    if (receipt.status !== ReceiptStatus.UNDER_REVIEW) {
      throw new BadRequestException(`Cannot review receipt in status: ${receipt.status}. Only under_review receipts can be reviewed.`);
    }

    const auditTrail = [...receipt.auditTrail] as any[];
    this.addAuditEntry(auditTrail, `review_${dto.action}`, userId, { notes: dto.notes });

    const updateData: any = { auditTrail };

    if (dto.action === 'reject') {
      updateData.status = ReceiptStatus.REJECTED;
      updateData.rejectedBy = userId ? new Types.ObjectId(userId) : undefined;
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = dto.notes;
    } else {
      // accept — apply QC results to lines; status remains under_review until explicitly approved
      if (dto.lineQcResults?.length) {
        const updatedLines = [...receipt.lines] as ReceiptLine[];
        for (const qcResult of dto.lineQcResults) {
          if (qcResult.lineIndex >= 0 && qcResult.lineIndex < updatedLines.length) {
            const line = updatedLines[qcResult.lineIndex];
            line.qcStatus = qcResult.qcStatus;
            if (qcResult.qcNotes) line.qcNotes = qcResult.qcNotes;
            if (qcResult.defectQty !== undefined) line.defectQty = qcResult.defectQty;
          }
        }
        updateData.lines = updatedLines;
      }
    }

    return this.receiptRepository.update(id, updateData);
  }

  async approve(id: string, dto: ApproveReceiptDto, userId?: string) {
    const receipt = await this.findById(id);

    const allowedStatuses: ReceiptStatus[] = [ReceiptStatus.UNDER_REVIEW, ReceiptStatus.PENDING];
    if (!allowedStatuses.includes(receipt.status)) {
      throw new BadRequestException(`Cannot approve receipt in status: ${receipt.status}.`);
    }

    const auditTrail = [...receipt.auditTrail] as any[];
    this.addAuditEntry(auditTrail, 'approved', userId, { notes: dto.notes });

    return this.receiptRepository.update(id, {
      status: ReceiptStatus.APPROVED,
      approvedBy: userId ? new Types.ObjectId(userId) as any : undefined,
      approvedAt: new Date(),
      auditTrail,
    } as any);
  }

  async receive(id: string, dto: ReceiveReceiptDto, userId?: string) {
    const receipt = await this.findById(id);

    if (receipt.lockedAt) {
      throw new ForbiddenException('Cannot receive items for a locked receipt');
    }

    const receivableStatuses: ReceiptStatus[] = [
      ReceiptStatus.APPROVED,
      ReceiptStatus.PARTIAL,
      ReceiptStatus.RECEIVED,
      // Allow receiving without approval flow for backward compat
      ReceiptStatus.PENDING,
      ReceiptStatus.DRAFT,
    ];
    if (!receivableStatuses.includes(receipt.status)) {
      throw new BadRequestException(`Cannot receive a receipt in status: ${receipt.status}`);
    }

    const updatedLines = [...receipt.lines] as ReceiptLine[];

    for (const receiveItem of dto.lines) {
      let lineIndex = -1;
      // Match by lineId first, then by skuId
      if (receiveItem.lineId) {
        lineIndex = updatedLines.findIndex((l) => (l as any).lineId === receiveItem.lineId);
      }
      if (lineIndex === -1) {
        lineIndex = updatedLines.findIndex((l) => l.skuId.toString() === receiveItem.skuId);
      }

      if (lineIndex === -1) {
        this.logger.warn(`Line not found for SKU: ${receiveItem.skuId}`);
        continue;
      }

      const line = updatedLines[lineIndex];
      line.receivedQty = (line.receivedQty || 0) + receiveItem.receivedQty;

      if (receiveItem.lotId) {
        line.lotId = new Types.ObjectId(receiveItem.lotId) as any;
      }
      if (receiveItem.serials?.length) {
        line.serials = [...(line.serials || []), ...receiveItem.serials];
      }
    }

    const allReceived = updatedLines.every((l) => l.receivedQty >= l.orderedQty);
    const anyReceived = updatedLines.some((l) => l.receivedQty > 0);
    const newStatus = allReceived
      ? ReceiptStatus.RECEIVED
      : anyReceived
        ? ReceiptStatus.PARTIAL
        : receipt.status;

    const auditTrail = [...receipt.auditTrail] as any[];
    this.addAuditEntry(auditTrail, 'received', userId, {
      lines: dto.lines.map((l) => ({ skuId: l.skuId, receivedQty: l.receivedQty })),
      partial: !allReceived,
    });

    const updateData: any = {
      lines: updatedLines,
      status: newStatus,
      auditTrail,
    };

    if (dto.actualReceiptAt) {
      updateData.actualReceiptAt = dto.actualReceiptAt;
    }
    if (userId) {
      updateData.receivedBy = new Types.ObjectId(userId);
      if (allReceived) updateData.receivedAt = new Date();
    }

    return this.receiptRepository.update(id, updateData);
  }

  async finalize(id: string, dto: FinalizeReceiptDto, userId?: string) {
    const receipt = await this.findById(id);

    const finalizableStatuses: ReceiptStatus[] = [
      ReceiptStatus.RECEIVED,
      ReceiptStatus.QC_PASSED,
      ReceiptStatus.COMPLETED,
      ReceiptStatus.APPROVED,
    ];
    if (!finalizableStatuses.includes(receipt.status)) {
      throw new BadRequestException(`Cannot finalize receipt in status: ${receipt.status}. Receipt must be received or QC-passed first.`);
    }

    const auditTrail = [...receipt.auditTrail] as any[];
    this.addAuditEntry(auditTrail, 'finalized', userId, { notes: dto.notes });

    return this.receiptRepository.update(id, {
      status: ReceiptStatus.FINALIZED,
      lockedBy: userId ? new Types.ObjectId(userId) as any : undefined,
      lockedAt: new Date(),
      auditTrail,
    } as any);
  }

  async unlock(id: string, dto: UnlockReceiptDto, userId?: string) {
    const receipt = await this.findById(id);

    if (!receipt.lockedAt) {
      throw new BadRequestException('Receipt is not locked');
    }

    const auditTrail = [...receipt.auditTrail] as any[];
    this.addAuditEntry(auditTrail, 'unlocked', userId, { reason: dto.reason });

    return this.receiptRepository.update(id, {
      status: ReceiptStatus.RECEIVED,
      lockedBy: undefined,
      lockedAt: undefined,
      auditTrail,
    } as any);
  }

  getAuditTrail(receipt: any) {
    return receipt.auditTrail || [];
  }

  async applyQc(id: string, dto: QcReceiptDto, userId?: string) {
    const receipt = await this.findById(id);

    if (receipt.status === ReceiptStatus.CANCELLED || receipt.status === ReceiptStatus.FINALIZED) {
      throw new BadRequestException(`Cannot apply QC to a receipt in status: ${receipt.status}`);
    }

    const updatedLines = [...receipt.lines] as ReceiptLine[];

    if (dto.lineIndex !== undefined && dto.lineIndex >= 0 && dto.lineIndex < updatedLines.length) {
      const line = updatedLines[dto.lineIndex];
      line.qcStatus = dto.qcStatus;
      if (dto.qcNotes) line.qcNotes = dto.qcNotes;
      if (dto.defectQty !== undefined) line.defectQty = dto.defectQty;
      if (dto.quarantineBin) line.quarantineBin = dto.quarantineBin;
    } else {
      for (const line of updatedLines) {
        line.qcStatus = dto.qcStatus;
        if (dto.qcNotes) line.qcNotes = dto.qcNotes;
        if (dto.defectQty !== undefined) line.defectQty = dto.defectQty;
        if (dto.quarantineBin) line.quarantineBin = dto.quarantineBin;
      }
    }

    const anyFailed = updatedLines.some((l) => l.qcStatus === QcStatus.FAILED);
    const allPassed = updatedLines.every((l) => l.qcStatus === QcStatus.PASSED);

    const newStatus = anyFailed
      ? ReceiptStatus.QC_FAILED
      : allPassed
        ? ReceiptStatus.QC_PASSED
        : ReceiptStatus.QC_PENDING;

    const auditTrail = [...receipt.auditTrail] as any[];
    this.addAuditEntry(auditTrail, 'qc_applied', userId, { qcStatus: dto.qcStatus, lineIndex: dto.lineIndex });

    return this.receiptRepository.update(id, {
      lines: updatedLines,
      status: newStatus,
      auditTrail,
    } as any);
  }

  async complete(id: string) {
    const receipt = await this.findById(id);

    const anyFailed = receipt.lines.some((l) => l.qcStatus === QcStatus.FAILED);
    if (anyFailed) {
      throw new BadRequestException(
        'Cannot complete receipt with failed QC lines. Quarantine failed items first.',
      );
    }

    return this.receiptRepository.update(id, {
      status: ReceiptStatus.COMPLETED,
    } as any);
  }
}
