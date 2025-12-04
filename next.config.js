/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // Safe: Vercel + Next 14 accept this
  webpack(config) {
    // Fixes module resolution inconsistencies in prod
    config.resolve.symlinks = false;

    config.resolve.extensionAlias = {
      ".js": [".js", ".ts", ".tsx"],
      ".mjs": [".mjs", ".js"]
    };

    return config;
  },

  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'http://localhost:8000/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
