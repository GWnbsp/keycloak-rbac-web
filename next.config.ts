import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  trailingSlash: false,
  experimental: {
    esmExternals: true,
  },
};

export default nextConfig;
