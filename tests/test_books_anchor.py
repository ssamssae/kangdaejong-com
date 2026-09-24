"""Check that the legacy book anchor has a destination with all three books."""
from pathlib import Path
import unittest
ROOT = Path(__file__).resolve().parents[1]
class BooksAnchor(unittest.TestCase):
    def test_archive_contract(self):
        home=(ROOT/'dist/index.html').read_text()
        archive=(ROOT/'dist/archive/index.html').read_text()
        self.assertIn("window.location.hash === '#books'",home)
        self.assertIn("'/archive/'",home)
        self.assertIn('id="books"',archive)
        for product in ('786557','786749','798202'):
            self.assertIn('https://kmong.com/gig/'+product,archive)
if __name__=='__main__': unittest.main()
