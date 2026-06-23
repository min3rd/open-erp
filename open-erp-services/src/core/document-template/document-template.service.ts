import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DocumentTemplate } from './entities/document-template.entity';
import { StorageService } from '../storage/storage.service';
import { WorkflowInstance } from '../workflow/entities/workflow-instance.entity';
import * as AdmZip from 'adm-zip';

@Injectable()
export class DocumentTemplateService {
  constructor(
    @InjectRepository(DocumentTemplate)
    private readonly templateRepository: Repository<DocumentTemplate>,
    @InjectRepository(WorkflowInstance)
    private readonly workflowInstanceRepository: Repository<WorkflowInstance>,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  async createTemplate(
    tenantId: string | null,
    name: string,
    fileId: string,
    mapping: any[],
  ): Promise<DocumentTemplate> {
    const file = await this.storageService.getFileById(fileId);
    if (!file) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          messageKey: 'storage.file_not_found',
        },
      });
    }

    const template = new DocumentTemplate();
    template.tenantId = tenantId;
    template.name = name;
    template.fileId = fileId;
    template.mapping = mapping;

    return this.templateRepository.save(template);
  }

  async getTemplateById(id: string, tenantId: string | null): Promise<DocumentTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id },
      relations: {
        file: true
      },
    });

    if (!template) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          messageKey: 'template.not_found',
        },
      });
    }

    if (template.tenantId && template.tenantId !== tenantId) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'TENANT_MISMATCH',
          messageKey: 'storage.access_denied',
        },
      });
    }

    return template;
  }

  async findAllTemplates(tenantId: string | null): Promise<DocumentTemplate[]> {
    return this.templateRepository.find({
      where: { tenantId: tenantId as any },
      relations: {
        file: true
      },
    });
  }

  async deleteTemplate(id: string, tenantId: string | null): Promise<void> {
    const template = await this.getTemplateById(id, tenantId);
    await this.templateRepository.remove(template);
  }

  async generateDocument(
    templateId: string,
    instanceId: string,
    outputFormat: string,
    tenantId: string | null,
  ): Promise<{ fileUrl: string; fileName: string }> {
    const template = await this.getTemplateById(templateId, tenantId);

    const instance = await this.workflowInstanceRepository.findOne({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'WORKFLOW_INSTANCE_NOT_FOUND',
          messageKey: 'workflow.instance_not_found',
        },
      });
    }

    // Get template file details
    const templateFile = template.file;
    const { stream } = await this.storageService.getFileStream(templateFile.id, tenantId);

    // Read stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const templateBuffer = Buffer.concat(chunks);

    // Map context data to placeholders
    const populatedBuffer = this.fillTemplate(
      templateBuffer,
      template.mapping,
      instance.contextData || {},
    );

    const originalExtension = this.getFileExtension(templateFile.fileName);
    const outputExt = (outputFormat || originalExtension).toLowerCase();

    // Determine filenames
    const baseName = template.name.replace(/\.[^/.]+$/, '');
    const populatedFileName = `${baseName}_generated.${originalExtension}`;
    const finalFileName = `${baseName}_generated.${outputExt}`;

    // Upload populated file first (as temporary/result if outputExt is same as original)
    const tempFile = await this.storageService.uploadFile(
      tenantId,
      'document-generation',
      populatedFileName,
      populatedBuffer,
      templateFile.mimeType,
    );

    // If conversion is needed
    if (outputExt !== originalExtension.toLowerCase()) {
      const conversionUrl = this.configService.get<string>(
        'ONLYOFFICE_CONVERSION_URL',
        'http://localhost:8080/ConvertService.ashx',
      );
      const backendUrl = this.configService.get<string>(
        'ONLYOFFICE_BACKEND_URL',
        'http://localhost:3000',
      );

      const downloadBinaryUrl = `${backendUrl}/api/v1/files/${tempFile.id}/download-binary`;

      try {
        const response = await fetch(conversionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            async: false,
            filetype: originalExtension,
            key: `conv-${tempFile.id}-${Date.now()}`,
            outputtype: outputExt,
            title: finalFileName,
            url: downloadBinaryUrl,
          }),
        });

        if (!response.ok) {
          throw new Error(`OnlyOffice conversion failed with status ${response.status}`);
        }

        const resData = (await response.json()) as any;
        if (resData.error) {
          throw new Error(`OnlyOffice conversion error code: ${resData.error}`);
        }

        const fileUrl = resData.fileUrl;
        if (!fileUrl) {
          throw new Error('OnlyOffice conversion did not return fileUrl');
        }

        // Download converted file
        const fileRes = await fetch(fileUrl);
        if (!fileRes.ok) {
          throw new Error(`Failed to download converted file from ${fileUrl}`);
        }

        const convertedBuffer = Buffer.from(await fileRes.arrayBuffer());

        // Delete temporary file to save space
        await this.storageService.deleteFile(tempFile.id, tenantId);

        // Upload final converted file
        const finalMime = this.getMimeType(outputExt);
        const finalFile = await this.storageService.uploadFile(
          tenantId,
          'document-generation',
          finalFileName,
          convertedBuffer,
          finalMime,
        );

        const downloadUrl = await this.storageService.getPresignedDownloadUrl(
          finalFile.id,
          tenantId,
        );

        return {
          fileUrl: downloadUrl,
          fileName: finalFileName,
        };
      } catch (err) {
        console.error('OnlyOffice Conversion Service error:', err);
        // Fallback to returning original populated document if conversion fails
        const downloadUrl = await this.storageService.getPresignedDownloadUrl(
          tempFile.id,
          tenantId,
        );
        return {
          fileUrl: downloadUrl,
          fileName: populatedFileName,
        };
      }
    }

    const downloadUrl = await this.storageService.getPresignedDownloadUrl(tempFile.id, tenantId);
    return {
      fileUrl: downloadUrl,
      fileName: finalFileName,
    };
  }

  private fillTemplate(buffer: Buffer, mapping: any[], contextData: any): Buffer {
    try {
      const zip = new AdmZip(buffer);
      const zipEntries = zip.getEntries();

      for (const entry of zipEntries) {
        if (entry.entryName.endsWith('.xml') || entry.entryName.endsWith('.rels')) {
          let text = entry.getData().toString('utf8');
          let modified = false;

          for (const item of mapping) {
            const placeholder = item.placeholder;
            const sourcePath = item.source;
            const transform = item.transform;

            let value = this.resolvePath(contextData, sourcePath);

            if (value !== undefined && value !== null) {
              if (transform === 'uppercase') {
                value = String(value).toUpperCase();
              } else if (transform === 'lowercase') {
                value = String(value).toLowerCase();
              } else if (transform === 'currency_text') {
                value = Number(value).toLocaleString('vi-VN');
              }

              const regexToken = new RegExp(`{{\\s*${placeholder}\\s*}}`, 'g');
              if (regexToken.test(text)) {
                text = text.replace(regexToken, String(value));
                modified = true;
              }
            }
          }

          if (modified) {
            zip.updateFile(entry.entryName, Buffer.from(text, 'utf8'));
          }
        }
      }

      return zip.toBuffer();
    } catch (e) {
      // Fallback for non-zip plain files (txt, html, etc)
      let text = buffer.toString('utf8');
      let modified = false;

      for (const item of mapping) {
        const placeholder = item.placeholder;
        const sourcePath = item.source;
        const transform = item.transform;

        let value = this.resolvePath(contextData, sourcePath);

        if (value !== undefined && value !== null) {
          if (transform === 'uppercase') {
            value = String(value).toUpperCase();
          } else if (transform === 'lowercase') {
            value = String(value).toLowerCase();
          } else if (transform === 'currency_text') {
            value = Number(value).toLocaleString('vi-VN');
          }

          const regexToken = new RegExp(`{{\\s*${placeholder}\\s*}}`, 'g');
          if (regexToken.test(text)) {
            text = text.replace(regexToken, String(value));
            modified = true;
          }
        }
      }

      return modified ? Buffer.from(text, 'utf8') : buffer;
    }
  }

  private resolvePath(obj: any, path: string): any {
    if (!path) return undefined;
    const parts = path.split('.');
    let current = obj;
    if (parts[0] === 'context') {
      parts.shift();
    }
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    return current;
  }

  private getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop() || '' : '';
  }

  private getMimeType(ext: string): string {
    switch (ext.toLowerCase()) {
      case 'pdf':
        return 'application/pdf';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'pptx':
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      default:
        return 'application/octet-stream';
    }
  }
}
