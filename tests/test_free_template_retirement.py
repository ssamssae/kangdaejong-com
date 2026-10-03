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
   self.assertIn('/'+prefix+'/* /digital-products/ 301',redirects)
 def test_current_pages_no_longer_offer_templates(self):
  for route in ['index.html','digital-products/index.html','ai-setup/index.html']:
   html=(ROOT/'dist'/route).read_text()
   self.assertNotIn('templates/t01-',html)
   self.assertNotIn('양식은 계속 이용',html)
  page=(ROOT/'dist/digital-products/index.html').read_text()
  self.assertIn('14종의 웹 열람과 다운로드를 종료',page)
  self.assertIn('2026-10-04',page)
  self.assertIn('digital-20261004',page)
if __name__=='__main__':unittest.main()
