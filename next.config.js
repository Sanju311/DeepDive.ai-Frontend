const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],   // safe reset
    },
    optimizePackageImports: false, // disables edge-based rebundling
    typedRoutes: false,
  },
  webpack(config) {
    config.resolve.symlinks = false;
    config.resolve.extensionAlias = {
      ".js": [".js", ".ts", ".tsx"],
      ".mjs": [".mjs", ".js"],
    };
    return config;
  }
};

module.exports = nextConfig;