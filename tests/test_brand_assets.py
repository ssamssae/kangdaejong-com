"""Central brand manifest must describe actual assets and all company consumers."""
import hashlib
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://kangdaejong.com/brand/current/'

class CentralBrand(unittest.TestCase):
    def test_manifest_and_content_version(self):
        manifest = json.loads((ROOT/'public/brand/manifest.json').read_text())
        self.assertEqual(set(manifest['files']), {'logo.svg','favicon.ico','icon.png','apple-touch-icon.png','social.png'})
        for name, item in manifest['files'].items():
            self.assertEqual(item['url'], BASE+name)
            self.assertEqual(item['sha256'], hashlib.sha256((ROOT/'public/brand/current'/name).read_bytes()).hexdigest())
        encoded = json.dumps(manifest['files'],separators=(',',':'))
        self.assertEqual(manifest['version'], hashlib.sha256(encoded.encode()).hexdigest()[:16])
    def test_consumers_and_cache_contract(self):
        layout = (ROOT/'src/layouts/SiteLayout.astro').read_text()
        for name in ('logo.svg','favicon.ico','apple-touch-icon.png','social.png'):
            self.assertIn(BASE+name, layout)
        self.assertIn('src="https://kangdaejong.com/mb-components.js"',layout)
        for relative in ('src/pages/index.astro','src/pages/organization.astro','public/mb-components.js'):
            self.assertIn(BASE+'logo.svg',(ROOT/relative).read_text())
        headers = (ROOT/'public/_headers').read_text().split('/brand/*')[1]
        self.assertIn('max-age=0, must-revalidate',headers)
        self.assertIn('Access-Control-Allow-Origin: *',headers)

if __name__ == '__main__':
    unittest.main()
