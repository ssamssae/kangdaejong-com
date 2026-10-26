"""Check that the legacy book anchor has a destination with all three books."""
from pathlib import Path
import unittest
ROOT = Path(__file__).resolve().parents[1]
class BooksAnchor(unittest.TestCase):
    def test_archive_contract(self):
        home=(ROOT/'dist/index.html').read_text()
        archive=(ROOT/'dist/archive/index.html').read_text()
        self.assertIn('id="books"',home)
        self.assertIn('window.location.replace',archive)
        # T-261003-019(#131): 판매 링크 대신 무료 PDF 3권.
        for pdf in ('solo-company-ai-automation','solo-ai-team','phone-controls-my-computer-ai'):
            self.assertIn('href="/books/'+pdf+'.pdf"',home)
if __name__=='__main__': unittest.main()
