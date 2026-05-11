import { TransformInterceptor } from './transform.interceptor';
import { lastValueFrom, of } from 'rxjs';

describe('TransformInterceptor', () => {
  const interceptor = new TransformInterceptor();

  it('wraps normal payload with success/meta envelope', async () => {
    const req: any = { requestId: 'req-1' };
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    };

    const handler: any = {
      handle: () => of({ value: 1 }),
    };

    const result: any = await lastValueFrom(
      interceptor.intercept(context, handler),
    );
    expect(result.success).toBe(true);
    expect(result.data.value).toBe(1);
    expect(result.meta.requestId).toBe('req-1');
  });

  it('keeps payload unchanged when already standardized', async () => {
    const req: any = { requestId: 'req-2' };
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    };

    const payload = { success: true, data: { ok: true } };
    const handler: any = {
      handle: () => of(payload),
    };

    const result = await lastValueFrom(interceptor.intercept(context, handler));
    expect(result).toEqual(payload);
  });
});
