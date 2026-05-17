import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: '/admin/' },
      { userAgent: '*', disallow: '/api/' },
    ],
    sitemap: `${process.env.APP_URL || 'https://fpvlovers.com.tr'}/sitemap.xml`,
  };
}
