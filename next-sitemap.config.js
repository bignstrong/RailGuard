module.exports = {
  siteUrl: 'https://railguard.ru',
  generateRobotsTxt: true,
  exclude: ['/api/*', '/admin/*', '/drafts/*', '/private/*', '/404', '/500'],
  robotsTxtOptions: {
    additionalSitemaps: ['https://railguard.ru/sitemap.xml'],
    policies: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/drafts/', '/private/', '/404', '/500'] },
      { userAgent: 'Googlebot', allow: '/', disallow: ['/api/', '/admin/', '/drafts/', '/private/', '/404', '/500'] },
    ],
  },
};
