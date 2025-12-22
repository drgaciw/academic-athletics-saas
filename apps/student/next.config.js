/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/student",
  reactStrictMode: true,
  transpilePackages: ["@aah/ui", "@aah/database", "@aah/auth"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/student/:path*",
          destination: "/:path*",
        },
      ],
    };
  },
};

module.exports = nextConfig;
