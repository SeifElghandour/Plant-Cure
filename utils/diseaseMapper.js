/**
 * Maps AI model class labels (PlantVillage format) to MongoDB Disease.name values.
 */
const AI_CLASS_TO_DB_NAME = {
  Apple___Apple_scab: 'Apple_Scab',
  Apple___Black_rot: 'Apple_Black_Rot',
  Apple___Cedar_apple_rust: 'Apple_Cedar_Apple_Rust',
  'Apple___healthy': 'Healthy',
  'Blueberry___healthy': 'Healthy',
  'Cherry_(including_sour)___Powdery_mildew': 'Cherry_Powdery_Mildew',
  'Cherry_(including_sour)___healthy': 'Healthy',
  'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot': 'Corn_Gray_Leaf_Spot',
  'Corn_(maize)___Common_rust_': 'Corn_Common_Rust',
  'Corn_(maize)___Northern_Leaf_Blight': 'Corn_Northern_Leaf_Blight',
  'Corn_(maize)___healthy': 'Healthy',
  Grape___Black_rot: 'Grape_Black_Rot',
  'Grape___Esca_(Black_Measles)': 'Grape_Esca',
  'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': 'Grape_Leaf_Blight',
  'Grape___healthy': 'Healthy',
  'Orange___Haunglongbing_(Citrus_greening)': 'Healthy',
  Peach___Bacterial_spot: 'Peach_Bacterial_Spot',
  'Peach___healthy': 'Healthy',
  'Pepper,_bell___Bacterial_spot': 'Pepper_Bacterial_Spot',
  'Pepper,_bell___healthy': 'Healthy',
  Potato___Early_blight: 'Potato_Early_Blight',
  Potato___Late_blight: 'Potato_Late_Blight',
  'Potato___healthy': 'Healthy',
  'Raspberry___healthy': 'Healthy',
  'Soybean___healthy': 'Healthy',
  Squash___Powdery_mildew: 'Healthy',
  Strawberry___Leaf_scorch: 'Strawberry_Leaf_Scorch',
  'Strawberry___healthy': 'Healthy',
  Tomato___Bacterial_spot: 'Tomato_Bacterial_Spot',
  Tomato___Early_blight: 'Tomato_Early_Blight',
  Tomato___Late_blight: 'Tomato_Late_Blight',
  Tomato___Leaf_Mold: 'Tomato_Leaf_Mold',
  Tomato___Septoria_leaf_spot: 'Tomato_Septoria_Leaf_Spot',
  'Tomato___Spider_mites Two-spotted_spider_mite': 'Tomato_Spider_Mite',
  Tomato___Target_Spot: 'Tomato_Target_Spot',
  Tomato___Tomato_Yellow_Leaf_Curl_Virus: 'Tomato_Yellow_Leaf_Curl_Virus',
  Tomato___Tomato_mosaic_virus: 'Tomato_Mosaic_Virus',
  'Tomato___healthy': 'Healthy',
};

function mapPredictedClassToDbName(predictedClass) {
  if (!predictedClass) {
    return null;
  }

  const trimmed = String(predictedClass).trim();
  if (AI_CLASS_TO_DB_NAME[trimmed]) {
    return AI_CLASS_TO_DB_NAME[trimmed];
  }

  if (trimmed.toLowerCase().includes('healthy')) {
    return 'Healthy';
  }

  return trimmed.replace(/___/g, '_').replace(/\s+/g, '_');
}

function formatDisplayName(dbName) {
  if (!dbName || dbName === 'Healthy') {
    return 'Healthy Plant';
  }

  return dbName.replace(/_/g, ' ');
}

module.exports = {
  mapPredictedClassToDbName,
  formatDisplayName,
};
