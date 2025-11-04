import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Auth Enforcement Test
 * Verifica que @Public() solo esté en endpoints permitidos
 * API Gateway Pattern: Asegurar que endpoints protegidos requieren auth
 */

describe('Auth Enforcement', () => {
  const allowedPublicEndpoints = [
    '/health',
    '/_services/health',
    '/auth/register',
    '/auth/login',
    '/auth/refresh',
    '/auth/logout',
  ];

  const controllerFiles = [
    'health.controller.ts',
    'services-health.controller.ts',
    'auth.controller.ts',
    'boards.controller.ts',
    'workspaces.controller.ts',
    'sessions.controller.ts',
    'assignees.controller.ts',
    'tags.controller.ts',
  ];

  it('should only have @Public() decorator on allowed endpoints', () => {
    const httpDir = join(__dirname);
    const violations: string[] = [];

    controllerFiles.forEach((file) => {
      try {
        const filePath = join(httpDir, file);
        const content = readFileSync(filePath, 'utf-8');

        // Find @Public() decorators
        const publicMatches = content.match(/@Public\(\)/g) || [];

        if (publicMatches.length > 0) {
          // Extract controller path and method info
          const controllerMatch = content.match(
            /@Controller\(['"]?([^'"]*?)['"]?\)/,
          );
          const controllerPath = controllerMatch ? controllerMatch[1] : '';

          // Find method decorators with @Public()
          const lines = content.split('\n');
          let inPublicMethod = false;
          let methodPath = '';

          lines.forEach((line, index) => {
            if (line.includes('@Public()')) {
              inPublicMethod = true;
            } else if (
              inPublicMethod &&
              line.match(/@(Get|Post|Put|Delete|Patch)\(/)
            ) {
              const methodMatch = line.match(
                /@(Get|Post|Put|Delete|Patch)\(['"]?([^'"]*?)['"]?\)/,
              );
              const method = methodMatch ? methodMatch[1].toLowerCase() : '';
              const path = methodMatch ? methodMatch[2] || '' : '';

              methodPath =
                `/${controllerPath}${path ? '/' + path : ''}`.replace(
                  /\/+/g,
                  '/',
                );
              if (methodPath === '/') methodPath = '/health'; // Special case for root health

              // Check if this endpoint is allowed to be public
              const isAllowed = allowedPublicEndpoints.some(
                (allowed) =>
                  methodPath === allowed || methodPath.startsWith(allowed),
              );

              if (!isAllowed) {
                violations.push(
                  `${file}: ${method.toUpperCase()} ${methodPath} should not be @Public()`,
                );
              }

              inPublicMethod = false;
            }
          });
        }
      } catch (error) {
        // File might not exist, skip
      }
    });

    if (violations.length > 0) {
      throw new Error(
        `Auth enforcement violations found:\n${violations.join('\n')}`,
      );
    }
  });

  it('should protect endpoints that require authentication', () => {
    const protectedEndpoints = [
      'workspaces.controller.ts',
      'sessions.controller.ts',
      'boards.controller.ts',
      'assignees.controller.ts',
      'tags.controller.ts',
    ];

    protectedEndpoints.forEach((file) => {
      try {
        const filePath = join(__dirname, file);
        const content = readFileSync(filePath, 'utf-8');

        // These files should NOT have @Public() decorators
        const hasPublic = content.includes('@Public()');

        if (hasPublic) {
          throw new Error(
            `${file} should not have @Public() decorators - all endpoints should be protected`,
          );
        }
      } catch (error) {
        if (error instanceof Error && !error.message.includes('ENOENT')) {
          throw error;
        }
      }
    });
  });
});
