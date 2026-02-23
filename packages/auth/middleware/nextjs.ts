// Re-export Clerk's authMiddleware and redirectToSignIn directly so that
// apps/admin and apps/student use real Clerk JWT session validation instead
// of the former header-based placeholder.
export {
  authMiddleware,
  redirectToSignIn,
} from '@clerk/nextjs';

/**
 * Utility function to check if an authenticated Clerk user has any of the
 * required roles.  Role must be stored in Clerk's publicMetadata.role or
 * surfaced as a JWT claim at sessionClaims.role / sessionClaims.metadata.role.
 *
 * @example
 * ```typescript
 * export default authMiddleware({
 *   afterAuth(auth, req) {
 *     if (!auth.userId) return redirectToSignIn({ returnBackUrl: req.url });
 *     if (!requireRole(['admin', 'staff'])(auth)) {
 *       return new Response('Forbidden', { status: 403 });
 *     }
 *   },
 * });
 * ```
 */
export function requireRole(roles: string[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (auth: any): boolean => {
    const claims = auth.sessionClaims ?? {};
    // Support role stored at top-level claim, or nested under metadata/publicMetadata
    const userRole: string | undefined =
      claims.role ??
      claims.metadata?.role ??
      claims.publicMetadata?.role;
    if (!userRole) return false;
    return roles.includes(userRole);
  };
}
