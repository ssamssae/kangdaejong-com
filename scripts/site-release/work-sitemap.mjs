import {sitemapLocations, COMPANY} from '../../workshop-router/index.mjs';

// During rollout this is the /work artifact map; after cutover it is a 301
// destination containing both sites. Reject foreign URLs in either response.
export function workSitemapUrls(xml){
  return mountedSitemapUrls(xml,'/work/');
}

export function mountedSitemapUrls(xml,base){
  const urls=sitemapLocations(xml,COMPANY+'/').filter(url=>url.startsWith(COMPANY+base));
  if(!urls.includes(COMPANY+base))throw Error('Missing mounted sitemap: '+base);
  return urls;
}
