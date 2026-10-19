"""Extract DOCX transcripts, retaining explicit line breaks and speaker timestamps."""
import sys
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as E

def extract(directory):
    ns = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
    dest = Path(__file__).parent / 'sources'
    dest.mkdir(exist_ok=True)
    for file in sorted(directory.glob('[[]INT144-G1[]]*.docx')):
        if '(1)' in file.name:
            continue
        root = E.fromstring(ZipFile(file).read('word/document.xml'))
        paragraphs = []
        for paragraph in root.iter(ns + 'p'):
            parts = []
            for node in paragraph.iter():
                if node.tag == ns + 't':
                    parts.append(node.text or '')
                elif node.tag in (ns + 'br', ns + 'cr'):
                    parts.append('\n')
                elif node.tag == ns + 'tab':
                    parts.append('\t')
            paragraphs.append(''.join(parts))
        text = '\n'.join(paragraphs)
        (dest / file.with_suffix('.txt').name).write_text(text)
        print(file.name, len(text.splitlines()), 'lines')

if __name__ == '__main__':
    extract(Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / 'Downloads')
