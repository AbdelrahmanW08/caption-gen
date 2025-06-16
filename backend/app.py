import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
from transformers import AutoProcessor, BlipForConditionalGeneration
import torch

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Load the BLIP model and processor
processor = AutoProcessor.from_pretrained("Salesforce/blip-image-captioning-large")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-large")

# Check if CUDA is available and move model to GPU
device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)

def generate_caption(image_bytes):
    raw_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    
    # Conditional image captioning
    # text = "a photography of"
    # inputs = processor(raw_image, text, return_tensors="pt").to(device)

    # Unconditional image captioning
    inputs = processor(raw_image, return_tensors="pt").to(device)

    out = model.generate(**inputs)
    return processor.decode(out[0], skip_special_tokens=True)

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    image_file = request.files['image']

    if image_file.filename == '':
        return jsonify({"error": "No selected image file"}), 400

    if image_file:
        try:
            # Read image bytes
            image_bytes = image_file.read()

            # Optional: Basic image validation and preparation
            try:
                img = Image.open(io.BytesIO(image_bytes))
                img.load() # Load image data to ensure it's valid
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Re-save image to bytes if conversion happened, or just use original if no conversion
                # This ensures the bytes passed to HF model are consistent
                img_byte_arr = io.BytesIO()
                img.save(img_byte_arr, format='PNG') # Use PNG or JPEG, depending on common model input
                image_bytes = img_byte_arr.getvalue()

            except Exception as e:
                return jsonify({"error": f"Invalid image file or processing error: {str(e)}"}), 400

            # Generate caption using the loaded model
            caption = generate_caption(image_bytes)

            return jsonify({"caption": caption}), 200

        except Exception as e:
            return jsonify({"error": f"An error occurred during caption generation: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)