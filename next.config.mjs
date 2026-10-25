const nextConfig = {
  agentRules: false,
  poweredByHeader: false,
  experimental: { externalDir: true },
  webpack(config) {
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};
export default nextConfig;
