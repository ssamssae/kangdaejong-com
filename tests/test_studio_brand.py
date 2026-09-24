"""Verify built public branding and company contact regressions."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
class StudioBrand(unittest.TestCase):
    def test_metadata_and_assets(self):
        for route in ('index.html', 'organization/index.html'):
            html = (ROOT / 'dist' / route).read_text()
            self.assertIn('https://kangdaejong.com/og-studio-centered-20260924.png', html)
            self.assertIn('/favicon.svg?v=studio-centered-20260924', html)
        self.assertTrue((ROOT/'dist/og-studio-centered-20260924.png').read_bytes().startswith(b'\x89PNG'))
        self.assertIn('#a94830', (ROOT/'dist/favicon.svg').read_text())
    def test_company_body_phone(self):
        html = (ROOT/'dist/organization/index.html').read_text().split('<main')[1].split('</main>')[0]
        self.assertEqual(html.count('href="tel:01074842927"'), 2)
if __name__ == '__main__':
    unittest.main()
