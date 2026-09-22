/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    return [{ source: '/sitemap.xml', destination: '/api/sitemap.xml' }];
  },
  images: { formats: ['image/avif', 'image/webp'] },
  compiler: { styledComponents: true },
};
