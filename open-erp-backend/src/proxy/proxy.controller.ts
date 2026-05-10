import {
  All,
  Controller,
  HttpException,
  HttpStatus,
  Param,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ProxyService } from './proxy.service';

@ApiTags('proxy')
@ApiBearerAuth()
@Controller('api/v1')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('*path')
  @ApiExcludeEndpoint()
  async proxy(@Req() req: Request, @Param('path') pathParam: string | string[]) {
    const wildcardPath = Array.isArray(pathParam)
      ? pathParam.join('/')
      : pathParam;

    const result = await this.proxyService.forwardRequest(req, wildcardPath || '');

    if (result.status >= HttpStatus.BAD_REQUEST) {
      throw new HttpException(this.toHttpExceptionBody(result.data), result.status);
    }

    return result.data;
  }

  private toHttpExceptionBody(data: unknown): string | Record<string, any> {
    if (typeof data === 'string') {
      return data;
    }

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data as Record<string, any>;
    }

    return {
      code: 'UPSTREAM_ERROR',
      message: {
        key: 'error.upstream.invalid_payload',
        data: {
          payloadType: Array.isArray(data) ? 'array' : typeof data,
        },
      },
    };
  }
}
