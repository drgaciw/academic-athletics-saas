/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/student",
  reactStrictMode: true,
  transpilePackages: ["@aah/ui", "@aah/database", "@aah/auth"],
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
  env: {
    NEXT_PUBLIC_BASE_PATH: "/student",
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
