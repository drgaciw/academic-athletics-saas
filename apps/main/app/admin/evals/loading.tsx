export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 mx-auto" />
        <p className="mt-4 text-gray-600 text-lg">Loading evaluation dashboard...</p>
      </div>
    </div>
  );
}
