import os
from PIL import Image

src_path = r"C:\Users\Asus\.gemini\antigravity-ide\brain\a0ed16c8-3acc-4f4c-ad49-061e72480429\media__1784857665405.png"
web_dest = r"d:\Pikkk\Kuliah\SEM 6\Magang\Nagari\Project\public\logo-fq.png"
mobile_dest = r"d:\Pikkk\Kuliah\SEM 6\Magang\Nagari\Project\mobile\assets\logo-fq.png"

img = Image.open(src_path).convert("RGBA")
datas = img.getdata()

new_data = []
for item in datas:
    # If pixel is white or near-white (R,G,B > 235), make it transparent
    if item[0] > 235 and item[1] > 235 and item[2] > 235:
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(item)

img.putdata(new_data)
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)

# Add small padding
padded = Image.new("RGBA", (img.width + 20, img.height + 20), (0, 0, 0, 0))
padded.paste(img, (10, 10))

os.makedirs(os.path.dirname(web_dest), exist_ok=True)
os.makedirs(os.path.dirname(mobile_dest), exist_ok=True)

padded.save(web_dest)
padded.save(mobile_dest)
print("Logo saved with transparent background successfully to public/logo-fq.png and mobile/assets/logo-fq.png!")
