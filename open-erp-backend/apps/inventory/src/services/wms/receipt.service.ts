import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ReceiptRepository } from '../../repositories/wms/receipt.repository';
import {
  CreateReceiptDto,
  ReceiveReceiptDto,
  QcReceiptDto,
} from '../../dto/wms/receipt.dto';
import {
  ReceiptStatus,
  QcStatus,
  ReceiptLine,
} from '@shared/schemas';

@Injectable()
export class ReceiptService {
  private readonly logger = new Logger(ReceiptService.name);

  constructor(
    private readonly receiptRepository: ReceiptRepository,
  ) {}

  async create(dto: CreateReceiptDto, userId?: string) {
    this.logger.log(`Creating receipt for org: ${dto.orgId}, warehouse: ${dto.warehouseId}`);

    const data: any = {
      orgId: new Types.ObjectId(dto.orgId),
      warehouseId: new Types.ObjectId(dto.warehouseId),
      status: ReceiptStatus.PENDING,
    };

    if (dto.poId) data.poId = dto.poId;
    if (dto.supplier) data.supplier = dto.supplier;
    if (dto.notes) data.notes = dto.notes;
    if (userId) data.createdBy = new Types.ObjectId(userId);

    if (dto.lines?.length) {
      data.lines = dto.lines.map((line) => ({
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

  async receive(id: string, dto: ReceiveReceiptDto, userId?: string) {
    const receipt = await this.findById(id);

    if (
      receipt.status === ReceiptStatus.COMPLETED ||
      receipt.status === ReceiptStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot receive a receipt in status: ${receipt.status}`,
      );
    }

    const updatedLines = [...receipt.lines] as ReceiptLine[];

    for (const receiveItem of dto.lines) {
      const lineIndex = updatedLines.findIndex(
        (l) => l.skuId.toString() === receiveItem.skuId,
      );

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

    // Determine new status
    const allReceived = updatedLines.every((l) => l.receivedQty >= l.orderedQty);
    const anyReceived = updatedLines.some((l) => l.receivedQty > 0);
    const newStatus = allReceived
      ? ReceiptStatus.QC_PENDING
      : anyReceived
        ? ReceiptStatus.PARTIAL
        : receipt.status;

    const updateData: any = {
      lines: updatedLines,
      status: newStatus,
    };

    if (userId) {
      updateData.receivedBy = new Types.ObjectId(userId);
      updateData.receivedAt = new Date();
    }

    return this.receiptRepository.update(id, updateData);
  }

  async applyQc(id: string, dto: QcReceiptDto, userId?: string) {
    const receipt = await this.findById(id);

    if (receipt.status === ReceiptStatus.CANCELLED) {
      throw new BadRequestException('Cannot apply QC to a cancelled receipt');
    }

    const updatedLines = [...receipt.lines] as ReceiptLine[];

    if (dto.lineIndex !== undefined && dto.lineIndex >= 0 && dto.lineIndex < updatedLines.length) {
      // Apply QC to a specific line
      const line = updatedLines[dto.lineIndex];
      line.qcStatus = dto.qcStatus;
      if (dto.qcNotes) line.qcNotes = dto.qcNotes;
      if (dto.defectQty !== undefined) line.defectQty = dto.defectQty;
      if (dto.quarantineBin) line.quarantineBin = dto.quarantineBin;
    } else {
      // Apply QC to all lines
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

    return this.receiptRepository.update(id, {
      lines: updatedLines,
      status: newStatus,
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
