import urllib.request
import json
import base64
from PIL import Image, ImageDraw, ImageFont
import io

def create_sample_ocr_image(text="SURAT-NAGARI/2026/042"):
    img = Image.new('RGB', (400, 100), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    # Draw dark text on white background
    d.text((20, 35), text, fill=(0, 0, 0))
    
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{b64}"

def test_ocr_endpoint():
    url = "https://project-fq.vercel.app/api/ocr"
    image_b64 = create_sample_ocr_image("SURAT-NAGARI/2026/042")
    payload = {
        "image": image_b64,
        "targetField": "No Surat Cabang"
    }
    
    print("Testing OCR API live on Vercel:", url)
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            print("[OCR SUCCESS] Response Code:", res.getcode())
            print("[OCR RESULT Extracted Text]:", data.get("text"))
            print("[OCR RESULT Raw Text]:", data.get("rawText"))
    except Exception as e:
        print("[OCR FAILED] Error:", e)
        if hasattr(e, 'read'):
            print("Error Details:", e.read().decode('utf-8'))

if __name__ == "__main__":
    test_ocr_endpoint()
