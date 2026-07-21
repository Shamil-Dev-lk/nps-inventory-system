import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/government-stock-system',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
