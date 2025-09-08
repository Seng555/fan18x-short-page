// next.config.ts
import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
 import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

// Initialize next-intl (App Router)
const withNextIntl = createNextIntlPlugin({
  // You can pass options here later (e.g., localePrefix)
  // See docs: https://next-intl.dev/docs/getting-started/app-router
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  theme: {
    extend: {
      padding: {
        safe: "env(safe-area-inset-bottom)",
      },
    },
  },

  // Add HLS/CORS headers for files served by THIS Next app (e.g. from /public)
  async headers() {
    return [
      // HLS manifests
      {
        source: '/:path*\\.m3u8',
        headers: [
          // Correct MIME for HLS playlists
          { key: 'Content-Type', value: 'application/vnd.apple.mpegurl' },
          // Allow cross-origin playback (adjust as needed)
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Headers', value: 'Range, Origin, X-Requested-With, Content-Type, Accept' },
          // Helpful for streaming/seek
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
};

 if (process.env.NODE_ENV === 'development') {
   await setupDevPlatform();
 }

export default withNextIntl(nextConfig);
