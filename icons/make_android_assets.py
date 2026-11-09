"""Draws the source images for the Android launcher icon and launch screen.

Uses the same drawing as make_icons.py. Writes into ../assets/, where
`npx capacitor-assets generate --android` picks them up and makes every size.

Run from the project folder:  python icons/make_android_assets.py
"""
import os
import sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_icons import draw_icon, CREAM  # noqa: E402

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')
os.makedirs(out, exist_ok=True)

# Adaptive icon. Android shows the middle 72 of 108 units and crops it to the
# phone's shape, so the drawing stays within a radius of about 0.29.
draw_icon(1024, 0.27).convert('RGB').save(os.path.join(out, 'icon-foreground.png'))
Image.new('RGB', (1024, 1024), CREAM).save(os.path.join(out, 'icon-background.png'))
# Older Android: one square icon.
draw_icon(1024, 0.36).convert('RGB').save(os.path.join(out, 'icon-only.png'))

# Launch screen: the rounded icon in the middle of the app's cream.
splash = Image.new('RGB', (2732, 2732), CREAM)
mark = draw_icon(560, 0.40, round_bg=True)
splash.paste(mark, ((2732 - 560) // 2, (2732 - 560) // 2), mark)
splash.save(os.path.join(out, 'splash.png'))
print('android assets written to assets/')
