import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class Retirement(unittest.TestCase):
 def test_sources_preserved_but_not_published(self):
  archived=list((ROOT/'archive/free-templates/public').rglob('*.md'))
  self.assertEqual(len(archived),14)
  redirects=(ROOT/'public/_redirects').read_text()
  for prefix in ['ebook-automation-workshop/vol1/templates','ai-team-ebook/vol2/templates']:
   self.assertFalse((ROOT/'dist'/prefix).exists())
   self.assertIn('/'+prefix+'/* https://work.kangdaejong.com/products/#retired-products 301',redirects)
 def test_current_pages_no_longer_offer_templates(self):
  for route in ['index.html','ai-setup/index.html']:
   html=(ROOT/'dist'/route).read_text()
   self.assertNotIn('templates/t01-',html)
   self.assertNotIn('양식은 계속 이용',html)
  self.assertFalse((ROOT/'dist/digital-products/index.html').exists())
  self.assertIn('/digital-products/ https://work.kangdaejong.com/products/#retired-products 301',(ROOT/'public/_redirects').read_text())
if __name__=='__main__':unittest.main()
