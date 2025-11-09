/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@aah/ui', '@aah/database', '@aah/auth', '@aah/ai'],
  experimental: {
    serverActions: true,
  },
  async rewrites() {
    return [
      // Student Portal zone rewrites
      {
        source: '/student',
        destination: `${process.env.STUDENT_PORTAL_URL || 'http://localhost:3001'}/student`,
      },
      {
        source: '/student/:path*',
        destination: `${process.env.STUDENT_PORTAL_URL || 'http://localhost:3001'}/student/:path*`,
      },
      // Admin Portal zone rewrites
      {
        source: '/admin',
        destination: `${process.env.ADMIN_PORTAL_URL || 'http://localhost:3002'}/admin`,
      },
      {
        source: '/admin/:path*',
        destination: `${process.env.ADMIN_PORTAL_URL || 'http://localhost:3002'}/admin/:path*`,
      },
      // Docs App zone rewrites
      {
        source: '/docs',
        destination: `${process.env.DOCS_APP_URL || 'http://localhost:3003'}/docs`,
      },
      {
        source: '/docs/:path*',
        destination: `${process.env.DOCS_APP_URL || 'http://localhost:3003'}/docs/:path*`,
      },
    ];
  },
}

module.exports = nextConfig
