/**
 * Authenticated Request
 *
 * Represents an HTTP request that has been authenticated via JwtAuthGuard.
 * The `user` property is set by the guard after verifying the JWT token.
 *
 * Note: This is a class (not an interface) so it persists at runtime,
 * which is required when used in decorated controller parameters
 * with isolatedModules + emitDecoratorMetadata enabled.
 */
export class AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    organizationId?: string;
    roles?: string[];
  };
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
}
