// next.config.ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// Initialize next-intl (App Router)
const withNextIntl = createNextIntlPlugin({
  // You can pass options here later (e.g., localePrefix)
  // See docs: https://next-intl.dev/docs/getting-started/app-router
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.fan18x.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'vz-693abed9-be1.b-cdn.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Add HLS/CORS headers for files served by THIS Next app (e.g. from /public)
  async headers() {
    return [
      // HLS manifests
      {
        source: '/:path*\\.m3u8',
        headers: [
          { key: 'Content-Type', value: 'application/vnd.apple.mpegurl' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Headers', value: 'Range, Origin, X-Requested-With, Content-Type, Accept' },
          { key: 'Accept-Ranges', value: 'bytes' },
        ],
      },
      // HLS segments: .ts (MPEG-TS) or .m4s (fMP4)
      {
        source: '/:path*\\.(ts|m4s)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Headers', value: 'Range, Origin, X-Requested-With, Content-Type, Accept' },
          { key: 'Accept-Ranges', value: 'bytes' },
        ],
      },
    ];
  },

  eslint: {
    // Ignore ESLint errors during production builds
    ignoreDuringBuilds: true,
  },
};

// Export the config wrapped with next-intl
export default withNextIntl(nextConfig);
