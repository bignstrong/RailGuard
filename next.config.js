/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    return [
      { source: '/sitemap.xml', destination: '/api/sitemap.xml' },
      { source: '/llms.txt', destination: '/api/llms.txt' },
      { source: '/feed.xml', destination: '/api/feed.xml' },
      { source: '/llms-full.txt', destination: '/api/llms-full.txt' },
      { source: '/indexnow-key.txt', destination: '/api/indexnow-key' },
    ];
  },
  images: { formats: ['image/avif', 'image/webp'] },
  compiler: { styledComponents: true },
};
