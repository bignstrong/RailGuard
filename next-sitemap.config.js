module.exports = {
  siteUrl: 'https://railguard.shop',
  generateRobotsTxt: true,
  exclude: ['/api/*', '/admin/*', '/drafts/*', '/private/*', '/404', '/500'],
  robotsTxtOptions: {
    additionalSitemaps: ['https://railguard.shop/sitemap.xml'],
    policies: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/drafts/', '/private/', '/404', '/500'] },
      { userAgent: 'Googlebot', allow: '/', disallow: ['/api/', '/admin/', '/drafts/', '/private/', '/404', '/500'] },
    ],
  },
};
