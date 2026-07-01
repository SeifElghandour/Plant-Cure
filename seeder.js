const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Disease = require('./models/Disease');

dotenv.config();
connectDB();

const diseasesData = [
  // --- Apple ---
  {
    name: 'Apple_Scab',
    symptoms: 'Dark, olive-colored fungal spots on leaves and fruit.',
    treatment: 'Apply copper-based sprays or safe fungicides like Mancozeb.',
    prevention: 'Prune trees to improve air circulation and remove fallen infected leaves.'
  },
  {
    name: 'Apple_Black_Rot',
    symptoms: 'Purple spots on leaves and rotting fruit with concentric rings.',
    treatment: 'Use copper-based fungicides.',
    prevention: 'Remove dead wood, cankers, and mummified fruit from the tree.'
  },
  {
    name: 'Apple_Cedar_Apple_Rust',
    symptoms: 'Bright orange or yellow spots on the upper leaf surface.',
    treatment: 'Apply safe fungicides such as Mancozeb.',
    prevention: 'Plant resistant varieties and remove nearby juniper/cedar trees if possible.'
  },

  // --- Strawberry ---
  {
    name: 'Strawberry_Leaf_Scorch',
    symptoms: 'Purple spots that eventually turn brown and dry out the leaf.',
    treatment: 'Apply copper sprays or bio-fungicides.',
    prevention: 'Improve ventilation, use drip irrigation, and remove infected foliage.'
  },

  // --- Cherry ---
  {
    name: 'Cherry_Powdery_Mildew',
    symptoms: 'White, powdery fungal coating on leaves and young stems.',
    treatment: 'Use sulfur-based sprays or safe fungicides.',
    prevention: 'Avoid excessive humidity and ensure proper spacing between trees.'
  },

  // --- Corn ---
  {
    name: 'Corn_Common_Rust',
    symptoms: 'Cinnamon-brown pustules appearing on both leaf surfaces.',
    treatment: 'Apply safe fungicides like Mancozeb.',
    prevention: 'Plant resistant hybrids and clear plant debris after harvest.'
  },
  {
    name: 'Corn_Northern_Leaf_Blight',
    symptoms: 'Large, cigar-shaped grey-green lesions on leaves.',
    treatment: 'Apply Mancozeb or recommended fungicides.',
    prevention: 'Practice crop rotation and manage agricultural residues.'
  },
  {
    name: 'Corn_Gray_Leaf_Spot',
    symptoms: 'Rectangular grey to brown lesions that run parallel to leaf veins.',
    treatment: 'Use safe fungicides like Mancozeb.',
    prevention: 'Improve field drainage and use resistant corn varieties.'
  },

  // --- Grape ---
  {
    name: 'Grape_Black_Rot',
    symptoms: 'Small brown spots on leaves and shriveled black berries.',
    treatment: 'Apply copper-based fungicides.',
    prevention: 'Remove infected branches and reduce humidity around the vines.'
  },
  {
    name: 'Grape_Esca',
    symptoms: 'Interveinal tiger-stripe yellowing on leaves and wood decay.',
    treatment: 'Prune affected areas and apply copper-based protection.',
    prevention: 'Sanitize pruning tools and manage vine stress.'
  },
  {
    name: 'Grape_Leaf_Blight',
    symptoms: 'Irregular brown spots that cause leaves to wither.',
    treatment: 'Apply copper sprays.',
    prevention: 'Manage canopy density to improve airflow.'
  },

  // --- Peach ---
  {
    name: 'Peach_Bacterial_Spot',
    symptoms: 'Small, water-soaked spots on leaves that turn brown or black.',
    treatment: 'Apply copper-based sprays.',
    prevention: 'Avoid overhead irrigation and remove infected leaves.'
  },

  // --- Pepper ---
  {
    name: 'Pepper_Bacterial_Spot',
    symptoms: 'Small, irregular lesions on leaves and fruit.',
    treatment: 'Apply copper sprays.',
    prevention: 'Ensure adequate ventilation and remove infected plant parts.'
  },

  // --- Potato ---
  {
    name: 'Potato_Early_Blight',
    symptoms: 'Dark spots with concentric rings appearing on older leaves.',
    treatment: 'Use safe fungicides like Mancozeb.',
    prevention: 'Control humidity levels and plant resistant varieties.'
  },
  {
    name: 'Potato_Late_Blight',
    symptoms: 'Water-soaked dark lesions on leaf tips and stems.',
    treatment: 'Apply Mancozeb or copper-based fungicides.',
    prevention: 'Plant certified seeds and ensure proper air circulation.'
  },

  // --- Tomato ---
  {
    name: 'Tomato_Bacterial_Spot',
    symptoms: 'Small, water-soaked spots on leaves and fruit that turn brown or black.',
    treatment: 'Apply copper-based sprays or bactericides.',
    prevention: 'Use disease-free seeds, avoid overhead irrigation, and rotate crops.'
  },
  {
    name: 'Tomato_Early_Blight',
    symptoms: "Brown spots with 'target' concentric rings on leaves.",
    treatment: 'Apply Mancozeb or copper sprays; remove infected leaves.',
    prevention: 'Prune lower branches and avoid overhead watering.'
  },
  {
    name: 'Tomato_Late_Blight',
    symptoms: 'Dark spots and wilting of leaves, stems, and fruits.',
    treatment: 'Apply copper-based fungicide every 7-10 days or use Mancozeb.',
    prevention: 'Water at the base to keep foliage dry and improve air circulation.'
  },
  {
    name: 'Tomato_Leaf_Mold',
    symptoms: 'Pale green or yellow spots with a velvet-like fungal coating.',
    treatment: 'Apply copper-based fungicides.',
    prevention: 'Increase greenhouse ventilation and reduce humidity.'
  },
  {
    name: 'Tomato_Target_Spot',
    symptoms: 'Small, water-soaked spots that develop into target-like lesions.',
    treatment: 'Use copper sprays.',
    prevention: 'Maintain proper plant spacing for better airflow.'
  },
  {
    name: 'Tomato_Septoria_Leaf_Spot',
    symptoms: 'Circular spots with dark borders and grey centers.',
    treatment: 'Apply copper sprays or Mancozeb.',
    prevention: 'Remove infected lower leaves and manage weeds.'
  },
  {
    name: 'Tomato_Spider_Mite',
    symptoms: 'Yellow stippling on leaves and fine webbing on undersides.',
    treatment: 'Apply Neem oil or agricultural soap.',
    prevention: 'Keep plants well-hydrated and maintain moderate humidity.'
  },
  {
    name: 'Tomato_Yellow_Leaf_Curl_Virus',
    symptoms: 'Yellow margins and upward curling of leaves; stunted growth.',
    treatment: 'No direct cure for the virus.',
    prevention: 'Immediately remove infected plants and control Whitefly insects.'
  },
  {
    name: 'Tomato_Mosaic_Virus',
    symptoms: 'Mottled green and yellow patterns on leaves.',
    treatment: 'No direct cure exists for the mosaic virus.',
    prevention: 'Practice strict sanitation and remove infected plants immediately.'
  },
  
  // --- Healthy State ---
  {
    name: 'Healthy',
    symptoms: 'No symptoms detected. The plant appears vibrant.',
    treatment: 'No treatment required. Continue regular care.',
    prevention: 'Maintain regular watering and monitoring schedules.'
  }
];

const importData = async () => {
  try {
    // 1. مسح البيانات القديمة بالكامل
    await Disease.deleteMany();
    
    // 2. إدخال البيانات الجديدة
    await Disease.insertMany(diseasesData);
    
    console.log('Data Imported Successfully! ✅');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message} ❌`);
    process.exit(1);
  }
};

importData();