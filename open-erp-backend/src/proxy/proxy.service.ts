import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { SERVICE_ROUTE_PREFIXES } from './proxy.constants';

export type ForwardResult = {
  status: number;
  data: unknown;
  contentType: string | null;
};

@Injectable()
export class ProxyService {
  async forwardRequest(req: Request, wildcardPath: string): Promise<ForwardResult> {
    const segments = wildcardPath.split('/').filter(Boolean);
    const serviceKey = segments[0];
    const serviceBaseUrl = SERVICE_ROUTE_PREFIXES[serviceKey];

    if (!serviceBaseUrl) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `No upstream mapped for prefix '${serviceKey}'`,
      });
    }

    const upstreamPath = segments.slice(1).join('/');
    const queryPart = req.originalUrl.split('?')[1];
    const targetUrl = `${serviceBaseUrl}/${upstreamPath}${queryPart ? `?${queryPart}` : ''}`;

    const headers = this.buildHeaders(req);

    let body: string | undefined;
    if (!['GET', 'HEAD'].includes(req.method.toUpperCase())) {
      body = JSON.stringify(req.body ?? {});
    }

    try {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers,
        body,
      });

      const contentType = response.headers.get('content-type');
      const data = await this.readBody(response, contentType);

      return {
        status: response.status,
        data,
        contentType,
      };
    } catch {
      throw new BadGatewayException({
        code: 'UPSTREAM_UNAVAILABLE',
        message: `Failed to reach upstream '${serviceKey}'`,
      });
    }
  }

  private buildHeaders(req: Request): Record<string, string> {
    const passthroughHeaders = [
      'authorization',
      'content-type',
      'accept',
      'x-tenant-id',
      'x-request-id',
      'user-agent',
    ];

    const headers: Record<string, string> = {};

    for (const header of passthroughHeaders) {
      const value = req.header(header);
      if (value) {
        headers[header] = value;
      }
    }

    if (req.tenantId && !headers['x-tenant-id']) {
      headers['x-tenant-id'] = req.tenantId;
    }

    if (req.requestId && !headers['x-request-id']) {
      headers['x-request-id'] = req.requestId;
    }

    return headers;
  }

  private async readBody(
    response: Response,
    contentType: string | null,
  ): Promise<unknown> {
    if (contentType?.includes('application/json')) {
      return response.json();
    }

    return response.text();
  }
}
