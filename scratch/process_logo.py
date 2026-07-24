import os
from PIL import Image

src_path = r"C:\Users\Asus\.gemini\antigravity-ide\brain\79af6897-c48a-44fa-88ed-0dd8d8dc2790\media__1784869875602.png"

# Target paths for web and mobile
web_logo_fq = r"d:\Pikkk\Kuliah\SEM 6\Magang\Nagari\Project\public\logo-fq.png"
web_logo_nagari_png = r"d:\Pikkk\Kuliah\SEM 6\Magang\Nagari\Project\public\logo-bank-nagari.png"
web_logo_nagari_png2 = r"d:\Pikkk\Kuliah\SEM 6\Magang\Nagari\Project\public\nagari-logo.png"

mobile_asset_logo1 = r"d:\Pikkk\Kuliah\SEM 6\Magang\Nagari\Project\mobile\assets\logo-fq.png"
mobile_asset_logo2 = r"d:\Pikkk\Kuliah\SEM 6\Magang\Nagari\Project\mobile\assets\images\logo-fq.png"

img = Image.open(src_path).convert("RGBA")
print(f"Original image size: {img.size}")

datas = img.getdata()

# Remove white or near-white background
new_data = []
for item in datas:
    # If pixel is white or near-white (R > 235, G > 235, B > 235), make transparent
    if item[0] > 235 and item[1] > 235 and item[2] > 235:
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(item)

img.putdata(new_data)

# Trim transparent edges (get bounding box of non-transparent content)
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)
    print(f"Cropped logo size: {img.size}")

# Add a small padding around the logo so text/graphic isn't edge-to-edge
padding = 16
padded_width = img.width + (padding * 2)
padded_height = img.height + (padding * 2)

padded_img = Image.new("RGBA", (padded_width, padded_height), (0, 0, 0, 0))
padded_img.paste(img, (padding, padding))

# Ensure output directories exist
for path in [web_logo_fq, web_logo_nagari_png, web_logo_nagari_png2, mobile_asset_logo1, mobile_asset_logo2]:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    padded_img.save(path, format="PNG")
    print(f"Saved: {path}")

print("Logo processing completed successfully!")
