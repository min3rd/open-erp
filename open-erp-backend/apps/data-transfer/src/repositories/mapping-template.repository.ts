import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MappingTemplate, MappingTemplateDocument } from '@shared/schemas';

@Injectable()
export class MappingTemplateRepository {
  constructor(
    @InjectModel(MappingTemplate.name)
    private readonly model: Model<MappingTemplateDocument>,
  ) {}

  async create(
    data: Partial<MappingTemplate>,
  ): Promise<MappingTemplateDocument> {
    return this.model.create(data);
  }

  async findById(id: string): Promise<MappingTemplateDocument | null> {
    return this.model.findById(id).exec();
  }

  async findByEntity(
    entity: string,
    userId?: string,
  ): Promise<MappingTemplateDocument[]> {
    const query: any = { entity };
    if (userId) query.userId = new Types.ObjectId(userId);
    return this.model.find(query).exec();
  }

  async deleteById(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }
}
