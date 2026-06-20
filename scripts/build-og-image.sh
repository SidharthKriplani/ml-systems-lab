#!/usr/bin/env bash
# Convert public/og-image.svg → public/og-image.png at 1200×630.
#
# LinkedIn, Twitter, Facebook, and Slack all require PNG/JPG for og:image —
# they will not render SVG. Run this script whenever the SVG is updated.
#
# Tries multiple installed tools in order. The first one available wins.

set -e
cd "$(dirname "$0")/.."

SRC="public/og-image.svg"
DST="public/og-image.png"

if [ ! -f "$SRC" ]; then
  echo "Missing $SRC — nothing to convert."
  exit 1
fi

echo "Converting $SRC → $DST (1200×630)…"

if command -v rsvg-convert >/dev/null 2>&1; then
  rsvg-convert -w 1200 -h 630 "$SRC" -o "$DST"
  echo "✓ Done via rsvg-convert."
  exit 0
fi

if command -v magick >/dev/null 2>&1; then
  magick -density 300 -background none "$SRC" -resize 1200x630 "$DST"
  echo "✓ Done via ImageMagick (magick)."
  exit 0
fi

if command -v convert >/dev/null 2>&1; then
  convert -density 300 -background none "$SRC" -resize 1200x630 "$DST"
  echo "✓ Done via ImageMagick (convert)."
  exit 0
fi

if command -v inkscape >/dev/null 2>&1; then
  inkscape "$SRC" --export-type=png --export-filename="$DST" --export-width=1200 --export-height=630
  echo "✓ Done via Inkscape."
  exit 0
fi

cat <<EOF
No installed converter found (tried rsvg-convert, ImageMagick, Inkscape).

Three quick manual options:
  1.  brew install librsvg  →  re-run this script
  2.  brew install imagemagick  →  re-run this script
  3.  Open public/og-image.svg in any browser, screenshot at 1200×630,
      save as public/og-image.png

Until public/og-image.png exists, LinkedIn link previews will fall back
to the default and click-through rate suffers.
EOF
exit 1
