// Intentionally unguarded: forbidden users are redirected here, so guarding it would loop.
export default function ForbiddenPage() {
  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-bold">Access denied</h1>
      <p className="mt-2">
        Your account role does not have access to this area. If you think this is a mistake,
        contact an administrator, or sign out and sign in with a different account.
      </p>
    </main>
  );
}
