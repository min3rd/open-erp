import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WorkDocument, DocumentDocument } from './schemas/document.schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    @InjectModel(WorkDocument.name)
    private readonly documentModel: Model<DocumentDocument>,
  ) {}

  async create(
    tenantId: string,
    dto: CreateDocumentDto,
    createdBy: string,
  ): Promise<DocumentDocument> {
    this.logger.log(`[WorkDoc] Tenant ${tenantId} — createDocument title="${dto.title}"`);
    const doc = new this.documentModel({ ...dto, tenantId, createdBy });
    return doc.save();
  }

  async findAll(
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<{ items: DocumentDocument[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.documentModel
        .find({ tenantId })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.documentModel.countDocuments({ tenantId }),
    ]);
    return { items, total, page, limit };
  }

  async findOne(tenantId: string, id: string): Promise<DocumentDocument> {
    const doc = await this.documentModel.findOne({ _id: id, tenantId }).exec();
    if (!doc) {
      throw new NotFoundException(`Document ${id} not found`);
    }
    return doc;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateDocumentDto,
  ): Promise<DocumentDocument> {
    const doc = await this.documentModel
      .findOneAndUpdate({ _id: id, tenantId }, { $set: dto }, { new: true })
      .exec();
    if (!doc) {
      throw new NotFoundException(`Document ${id} not found`);
    }
    return doc;
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const result = await this.documentModel
      .deleteOne({ _id: id, tenantId })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Document ${id} not found`);
    }
  }
}
