import {sitemapLocations, COMPANY} from '../../workshop-router/index.mjs';

// During rollout this is the /work artifact map; after cutover it is a 301
// destination containing both sites. Reject foreign URLs in either response.
export function workSitemapUrls(xml){
  const urls=sitemapLocations(xml,COMPANY+'/').filter(url=>url.startsWith(COMPANY+'/work/'));
  if(!urls.includes(COMPANY+'/work/'))throw Error('Missing mounted workshop sitemap');
  return urls;
}
