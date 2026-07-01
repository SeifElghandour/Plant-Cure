import io
import os

import numpy as np
import tensorflow as tf
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image

app = Flask(__name__)
CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:5500",
                "http://127.0.0.1:5500",
                "http://localhost:8080",
                "http://127.0.0.1:8080",
                "https://plant-care-gold.vercel.app",
                "https://plant-care-tan.vercel.app",
                "https://plant-cure-tan.vercel.app",
            ],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
        }
    },
)


@tf.keras.utils.register_keras_serializable()
class Cast(tf.keras.layers.Layer):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def call(self, inputs):
        return tf.cast(inputs, tf.float32)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_CANDIDATES = [
    os.path.join(BASE_DIR, "plant_model.keras"),
    os.path.join(BASE_DIR, "plant_model.h5"),
]

model = None
for model_path in MODEL_CANDIDATES:
    if not os.path.exists(model_path):
        continue
    try:
        model = tf.keras.models.load_model(
            model_path,
            custom_objects={"Cast": Cast},
            compile=False,
        )
        print(f"Model loaded successfully from {model_path}")
        break
    except Exception as exc:
        print(f"Failed to load {model_path}: {exc}")

if model is None:
    print("Warning: No AI model loaded. /predict will return mock responses.")

CLASSES = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew",
    "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
]

MOCK_PREDICTION = {
    "predicted_class": "Tomato___Early_blight",
    "confidence": 87.5,
}


def prepare_image(image_bytes, target_size=(224, 224)):
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode != "RGB":
        img = img.convert("RGB")
    img = img.resize(target_size, Image.LANCZOS)
    img_array = np.array(img).astype("float32") / 255.0
    return np.expand_dims(img_array, axis=0)


@app.route("/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "ok",
            "model_loaded": model is not None,
        }
    )


@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded. Use form field name 'image'."}), 400

    file = request.files["image"]
    if not file or file.filename == "":
        return jsonify({"error": "Empty image upload."}), 400

    try:
        image_bytes = file.read()
        if not image_bytes:
            return jsonify({"error": "Uploaded image is empty."}), 400

        if model is None:
            print("ERROR: Model not loaded, returning mock prediction")
            return jsonify({**MOCK_PREDICTION, "mock": True})

        processed_image = prepare_image(image_bytes)
        print(f"Input tensor shape: {processed_image.shape}, dtype: {processed_image.dtype}, min: {processed_image.min():.3f}, max: {processed_image.max():.3f}")
        
        raw_predictions = model.predict(processed_image, verbose=0)
        print(f"Raw predictions shape: {raw_predictions.shape}, raw values: {raw_predictions[0][:5]}")
        
        probabilities = tf.nn.softmax(raw_predictions[0]).numpy()
        print(f"Softmax probabilities - min: {probabilities.min():.6f}, max: {probabilities.max():.6f}")

        class_idx = int(np.argmax(probabilities))
        confidence = float(probabilities[class_idx]) * 100
        predicted_class = CLASSES[class_idx]

        print("-" * 30)
        print(f"Predicted: {predicted_class} ({confidence:.2f}%)")
        print(f"Top 3 indices: {np.argsort(probabilities)[-3:][::-1]}")
        print(f"Top 3 probs: {sorted(probabilities)[-3:][::-1]}")
        print("-" * 30)

        return jsonify(
            {
                "predicted_class": predicted_class,
                "confidence": round(confidence, 2),
                "index": class_idx,
            }
        )
    except Exception as exc:
        print(f"Prediction error: {exc}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
