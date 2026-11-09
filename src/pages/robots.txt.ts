import type { APIRoute } from 'astro';
import { indexable } from '../lib/site';

export const GET: APIRoute = ({ site }) => {
  const body = indexable
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap-index.xml', site).href}\n`
    : 'User-agent: *\nDisallow: /\n';

  return new Response(body);
};
