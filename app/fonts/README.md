# Offline UI font subsets

Classroom Text is derived from Noto Sans SC (Regular, Medium, Bold).
Classroom Display is derived from Source Han Serif SC Heavy.
All four WOFF2 subsets retain source copyright/license metadata and are
distributed under the SIL Open Font License 1.1 in OFL.txt, separately from
the project's MIT code license. Family names were changed for the derivatives.

Upstream: https://github.com/notofonts/noto-cjk and
https://github.com/adobe-fonts/source-han-serif .

The committed subsets include interface and bundled-example characters plus
Latin/Latin Extended characters. Uncovered characters in a teacher's own
lesson use the device's fallback fonts. Arabic uses the local Arabic font stack.
The build embeds fonts into the standalone HTML as data URLs; no CDN requests
or teacher font installation is required.

Optional regeneration, using licensed local upstream font files:
`python scripts/subset-fonts.py PATH_TO_FONT_DIRECTORY`.
Only regeneration requires fontTools and Brotli; normal builds use committed files.
