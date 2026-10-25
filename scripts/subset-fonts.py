"""Optional developer helper: subset local OFL Noto/Source Han fonts for offline UI."""
import argparse
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('font_directory', type=Path)
args = parser.parse_args()
destination = ROOT / 'app/fonts'
destination.mkdir(exist_ok=True)
text = ''.join(path.read_text(encoding='utf-8') for path in (ROOT / 'app').glob('*.mjs'))
text += ''.join(path.read_text(encoding='utf-8') for path in (ROOT / 'examples').glob('*.json'))
characters = {ord(character) for character in text} | set(range(0x20, 0x250))
fonts = [
    ('Noto Sans SC (TrueType).otf', 'classroom-text-regular', 'Classroom Text', 400),
    ('Noto Sans SC Medium (TrueType).otf', 'classroom-text-medium', 'Classroom Text', 500),
    ('Noto Sans SC Bold (TrueType).otf', 'classroom-text-bold', 'Classroom Text', 700),
    ('Source Han Serif SC Heavy (TrueType).ttf', 'classroom-display', 'Classroom Display', 900),
]
for filename, output, family, weight in fonts:
    font = TTFont(args.font_directory / filename)
    # Derivative subsets use new family names, preserving source copyright and license.
    for record in font['name'].names:
        if record.nameID in (1, 4, 6, 16):
            value = family.replace(' ', '') + '-' + str(weight) if record.nameID == 6 else family
            record.string = value.encode(record.getEncoding())
    options = subset.Options()
    options.flavor = 'woff2'
    options.name_IDs = ['*']
    options.name_legacy = True
    options.name_languages = ['*']
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=characters)
    subsetter.subset(font)
    font.flavor = 'woff2'
    target = destination / (output + '.woff2')
    font.save(target)
    print(output, target.stat().st_size)
