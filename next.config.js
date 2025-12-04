/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverActions: {
      allowedOrigins: ["*"]
    },
    turbo: false, // valid
  },
  webpack(config) {
    // Ensures correct module resolution in production
    config.resolve.symlinks = false;

    // Helps map .ts/.tsx imports the same as local build
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
