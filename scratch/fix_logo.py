import os
from PIL import Image

# Path to the actual FQ logo image (Hexagons + FQ text)
src_path = r"C:\Users\Asus\.gemini\antigravity-ide\brain\a0ed16c8-3acc-4f4c-ad49-061e72480429\media__1784857665405.png"

# Target paths for web and mobile
web_logo_fq = r"d:\Pikkk\Kuliah\SEM 6\Magang\Nagari\Project\public\logo-fq.png"
web_logo_nagari_png = r"d:\Pikkk\Kuliah\SEM 6\Magang\Nagari\Project\public\logo-bank-nagari.png"
web_logo_nagari_png2 = r"d:\Pikkk\Kuliah\SEM 6\Magang\Nagari\Project\public\nagari-logo.png"

mobile_asset_logo1 = r"d:\Pikkk\Kuliah\SEM 6\Magang\Nagari\Project\mobile\assets\logo-fq.png"
mobile_asset_logo2 = r"d:\Pikkk\Kuliah\SEM 6\Magang\Nagari\Project\mobile\assets\images\logo-fq.png"

img = Image.open(src_path).convert("RGBA")

# Make white / near-white background transparent
datas = img.getdata()
new_data = []
for item in datas:
    if item[0] > 235 and item[1] > 235 and item[2] > 235:
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(item)

img.putdata(new_data)

# Crop transparent padding
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)

# Add 20px padding around the logo
padding = 20
padded_width = img.width + (padding * 2)
padded_height = img.height + (padding * 2)

padded_img = Image.new("RGBA", (padded_width, padded_height), (0, 0, 0, 0))
padded_img.paste(img, (padding, padding))

# Save to all target paths
for path in [web_logo_fq, web_logo_nagari_png, web_logo_nagari_png2, mobile_asset_logo1, mobile_asset_logo2]:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    padded_img.save(path, format="PNG")
    print(f"Correct FQ logo saved to: {path}")

print("FQ Logo fix completed!")
