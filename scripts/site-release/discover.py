#!/usr/bin/env python3
"""Read existing deployment credentials in memory. Never persist tokens or DNS values.

Used before Cloudflare releases. PR checks use the committed, independently
collected snapshot plus current public navigation/GitHub Pages discovery.
"""
import argparse, concurrent.futures, datetime, json, os, re, subprocess, tomllib, urllib.request
from pathlib import Path

def discover():
    token=os.environ.get('CLOUDFLARE_API_TOKEN')
    cred=Path.home()/'.cloudflare/credentials'
    if not token and cred.is_file():
        match=re.search(r'^CLOUDFLARE_API_TOKEN\s*=\s*[\"\']?([^\"\'\n]+)',cred.read_text(),re.M)
        if match: token=match[1].strip()
    if not token:
        cred=Path.home()/'.wrangler/config/default.toml'
        if cred.is_file(): token=tomllib.loads(cred.read_text()).get('oauth_token')
    if not token: raise RuntimeError('Existing Cloudflare authentication is required for deployment inventory')
    def api(path):
        request=urllib.request.Request('https://api.cloudflare.com/client/v4'+path,headers={'Authorization':'Bearer '+token,'User-Agent':'site-release-inventory'})
        with urllib.request.urlopen(request,timeout=30) as response: data=json.load(response)
        if not data.get('success'): raise RuntimeError('Cloudflare inventory request failed')
        return data
    zones=api('/zones?name=kangdaejong.com')['result']
    if len(zones)!=1: raise RuntimeError('Expected one kangdaejong.com zone')
    zone=zones[0]; account=zone['account']['id']; targets=[]
    def add(url,source): targets.append({'url':url.replace('http://','https://'),'source':source})
    page=1
    while True:
        data=api('/accounts/'+account+f'/pages/projects?page={page}')
        for project in data['result']:
            for domain in project['domains']:add('https://'+domain+'/', 'cloudflare-pages:'+project['name'])
        if page>=data.get('result_info',{}).get('total_pages',1):break
        page+=1
    for domain in api('/accounts/'+account+'/workers/domains')['result']:add('https://'+domain['hostname']+'/', 'cloudflare-worker:'+domain['service'])
    for route in api('/zones/'+zone['id']+'/workers/routes')['result']:add('https://'+route['pattern'].replace('*',''), 'cloudflare-route:'+str(route['script']))
    page=1
    while True:
        data=api('/zones/'+zone['id']+f'/dns_records?per_page=100&page={page}')
        for record in data['result']:
            if record['type'] in ['A','AAAA','CNAME']:add('https://'+record['name']+'/', 'cloudflare-dns')
        if page>=data.get('result_info',{}).get('total_pages',1):break
        page+=1
    repos=json.loads(subprocess.check_output(['gh','api','--paginate','--slurp','users/ssamssae/repos?per_page=100'],text=True))
    names=[r['name'] for batch in repos for r in batch if r.get('has_pages')]
    def github(name):
        data=json.loads(subprocess.check_output(['gh','api','repos/ssamssae/'+name+'/pages'],text=True))
        return data['html_url'],'github-pages:'+name
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for url,source in pool.map(github,names):add(url,source)
    return {'schema':1,'observedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sources':['cloudflare-pages','cloudflare-workers','cloudflare-routes','cloudflare-dns','github-pages'],'targets':sorted(targets,key=lambda t:(t['url'],t['source']))}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);args=parser.parse_args()
    result=discover();Path(args.output).parent.mkdir(parents=True,exist_ok=True);Path(args.output).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(f"Discovered {len(result['targets'])} deployment/DNS records; wrote {args.output}")
