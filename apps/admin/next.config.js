/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/admin",
  reactStrictMode: true,
  transpilePackages: ["@aah/ui", "@aah/database", "@aah/auth"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/admin/:path*",
          destination: "/:path*",
        },
      ],
    };
  },
};

module.exports = nextConfig;
