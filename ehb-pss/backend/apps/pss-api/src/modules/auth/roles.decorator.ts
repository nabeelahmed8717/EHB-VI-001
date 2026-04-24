import { SetMetadata } from '@nestjs/common';

/**
 * PSS Role definitions.
 *
 * Current roles:
 *   platform   — authenticated platform backend (uses PlatformKeyGuard)
 *   admin      — EHB master admin (uses AdminKeyGuard)
 *   franchise  — franchise staff (uses AdminKeyGuard + franchise context)
 *   edr        — EDR staff (uses AdminKeyGuard + EDR context)
 *
 * NOTE: Role-based access control is not enforced in Phase 1 — guards are
 * binary (valid key / invalid key). This decorator is defined for future use
 * when per-role logic (e.g. franchise staff vs EHB admin) needs to be applied
 * at the method level without separate guard classes.
 */
export type PssRole = 'platform' | 'admin' | 'franchise' | 'edr';

export const ROLES_KEY = 'pss_roles';

/**
 * Decorator to specify required roles on a controller or handler.
 *
 * Usage:
 *   @Roles('admin', 'edr')
 *   @UseGuards(AdminKeyGuard)
 *   async override(...) { ... }
 *
 * A future RolesGuard can read this metadata via:
 *   const requiredRoles = reflector.getAllAndOverride<PssRole[]>(ROLES_KEY, [...])
 */
export const Roles = (...roles: PssRole[]) => SetMetadata(ROLES_KEY, roles);
