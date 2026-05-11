import { Controller, Get } from '@nestjs/common';
import { Public, IS_PUBLIC_KEY } from './public.decorator';
import { Reflector } from '@nestjs/core';

describe('Public Decorator', () => {
  @Controller()
  class TestController {
    @Get()
    @Public()
    publicEndpoint() {
      return 'public';
    }

    @Get('protected')
    protectedEndpoint() {
      return 'protected';
    }
  }

  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  it('should set isPublic metadata to true on decorated method', () => {
    const isPublic = reflector.get<boolean>(
      IS_PUBLIC_KEY,
      TestController.prototype.publicEndpoint,
    );
    expect(isPublic).toBe(true);
  });

  it('should not set isPublic metadata on non-decorated method', () => {
    const isPublic = reflector.get<boolean>(
      IS_PUBLIC_KEY,
      TestController.prototype.protectedEndpoint,
    );
    expect(isPublic).toBeUndefined();
  });

  it('should use correct metadata key', () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });
});
