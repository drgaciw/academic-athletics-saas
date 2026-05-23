/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/student",
  reactStrictMode: true,
  transpilePackages: ["@aah/ui", "@aah/database", "@aah/auth"],
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
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
