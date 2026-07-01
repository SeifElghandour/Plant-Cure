const asyncHandler = require('express-async-handler');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const Scan = require('../models/Scan');
const Disease = require('../models/Disease');
const GuestLimit = require('../models/GuestLimit');
const {
  mapPredictedClassToDbName,
  formatDisplayName,
} = require('../utils/diseaseMapper');

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001';

function parseConfidence(value) {
  if (typeof value === 'string') {
    return parseFloat(value.replace('%', '').trim());
  }
  return Number(value);
}

function cleanupUploadedFile(filePath) {
  if (!filePath) {
    return;
  }

  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Failed to remove uploaded file:', err.message);
    }
  });
}

async function callAiService(filePath, originalName, mimeType) {
  const formData = new FormData();
  formData.append('image', fs.createReadStream(filePath), {
    filename: originalName || 'plant-image.jpg',
    contentType: mimeType || 'image/jpeg',
  });

  console.log('[AI Service] Sending request to:', `${AI_SERVICE_URL}/predict`);
  console.log('[AI Service] File path:', filePath);
  console.log('[AI Service] Original name:', originalName);
  console.log('[AI Service] MIME type:', mimeType);

  const aiResponse = await axios.post(`${AI_SERVICE_URL}/predict`, formData, {
    headers: formData.getHeaders(),
    timeout: 60000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  console.log('[AI Service] Raw response data:', JSON.stringify(aiResponse.data, null, 2));

  const predictedClass =
    aiResponse.data.predicted_class ||
    aiResponse.data.disease ||
    aiResponse.data.result;

  const confidence = parseConfidence(aiResponse.data.confidence);

  console.log('[AI Service] Extracted predictedClass:', predictedClass);
  console.log('[AI Service] Extracted confidence:', confidence);
  console.log('[AI Service] Is mock response:', aiResponse.data.mock === true);

  if (!predictedClass) {
    const error = new Error('AI service did not return a predicted class.');
    error.statusCode = 502;
    throw error;
  }

  if (!Number.isFinite(confidence)) {
    const error = new Error('AI service returned an invalid confidence value.');
    error.statusCode = 502;
    throw error;
  }

  return { predictedClass, confidence };
}

async function lookupDiseaseInfo(predictedClass) {
  const dbName = mapPredictedClassToDbName(predictedClass);
  
  console.log('[Disease Mapper] Input predictedClass:', predictedClass);
  console.log('[Disease Mapper] Mapped dbName:', dbName);
  
  const diseaseInfo = dbName ? await Disease.findOne({ name: dbName }) : null;
  
  console.log('[Disease Mapper] Found diseaseInfo:', diseaseInfo ? 'YES' : 'NO');
  if (diseaseInfo) {
    console.log('[Disease Mapper] Disease name in DB:', diseaseInfo.name);
  }

  return {
    dbName,
    diseaseInfo,
    symptoms: diseaseInfo?.symptoms || 'Information not available.',
    treatment: diseaseInfo?.treatment || 'Consult an agricultural expert.',
    prevention: diseaseInfo?.prevention || 'No prevention data available.',
  };
}

function handlePipelineError(error, res) {
  if (axios.isAxiosError(error)) {
    const isConnectionError =
      !error.response ||
      ['ECONNREFUSED', 'ETIMEDOUT', 'ECONNABORTED', 'ENOTFOUND', 'EAI_AGAIN'].includes(
        error.code
      );

    if (isConnectionError) {
      console.error('AI Service Connection Error:', error.message);
      res.status(502);
      throw new Error(
        'AI Analysis Service is currently unavailable. Please try again later.'
      );
    }

    const upstreamStatus = error.response.status || 502;
    const upstreamMessage =
      error.response.data?.error ||
      error.response.data?.message ||
      'AI analysis failed.';
    console.error('AI Service Response Error:', upstreamMessage);
    res.status(upstreamStatus >= 400 && upstreamStatus < 600 ? upstreamStatus : 502);
    throw new Error(upstreamMessage);
  }

  if (error.statusCode) {
    res.status(error.statusCode);
    throw error;
  }

  console.error('Scan Processing Error:', error.message);
  if (!res.statusCode || res.statusCode === 200) {
    res.status(500);
  }
  throw new Error(error.message || 'Unexpected server error while processing scan.');
}

// @desc    Analyze plant image (public endpoint for frontend)
// @route   POST /api/scans/analyze
// @access  Public
const analyzeScan = asyncHandler(async (req, res) => {
  const memStart = process.memoryUsage();
  console.log('[Memory] Start of analyzeScan - Heap Used:', Math.round(memStart.heapUsed / 1024 / 1024), 'MB');

  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image file');
  }

  // Get client IP address (handle proxy scenarios)
  const getClientIp = () => {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           '127.0.0.1';
  };

  const clientIp = getClientIp();

  // Check guest limit
  const GUEST_LIMIT = 3;
  let guestLimit = await GuestLimit.findOne({ ip: clientIp });

  if (!guestLimit) {
    guestLimit = await GuestLimit.create({ ip: clientIp, scanCount: 0 });
  }

  if (guestLimit.scanCount >= GUEST_LIMIT) {
    return res.status(403).json({
      error: 'LimitReached',
      message: 'You have used your 3 free guest scans. Please register to continue.',
    });
  }

  const filePath = req.file.path;

  try {
    const { predictedClass, confidence } = await callAiService(
      filePath,
      req.file.originalname,
      req.file.mimetype
    );

    const { dbName, symptoms, treatment, prevention } =
      await lookupDiseaseInfo(predictedClass);

    // Increment scan count
    guestLimit.scanCount += 1;
    guestLimit.lastScanAt = new Date();
    await guestLimit.save();

    const remainingScans = GUEST_LIMIT - guestLimit.scanCount;

    res.status(200).json({
      predicted_class: predictedClass,
      disease_name: formatDisplayName(dbName || predictedClass),
      confidence: Math.round(confidence * 100) / 100,
      symptoms,
      treatment,
      prevention,
      is_healthy:
        (dbName || predictedClass).toLowerCase() === 'healthy' ||
        String(predictedClass).toLowerCase().includes('healthy'),
      remainingScans,
    });
  } catch (error) {
    handlePipelineError(error, res);
  } finally {
    cleanupUploadedFile(filePath);
    const memEnd = process.memoryUsage();
    console.log('[Memory] End of analyzeScan - Heap Used:', Math.round(memEnd.heapUsed / 1024 / 1024), 'MB', 'Delta:', Math.round((memEnd.heapUsed - memStart.heapUsed) / 1024 / 1024), 'MB');
  }
});

// @desc    Upload plant image & save scan history for authenticated users
// @route   POST /api/scans
// @access  Private
const uploadScan = asyncHandler(async (req, res) => {
  const memStart = process.memoryUsage();
  console.log('[Memory] Start of uploadScan - Heap Used:', Math.round(memStart.heapUsed / 1024 / 1024), 'MB');

  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image file');
  }

  const filePath = req.file.path;

  try {
    const { predictedClass, confidence } = await callAiService(
      filePath,
      req.file.originalname,
      req.file.mimetype
    );

    const { dbName, symptoms, treatment, prevention } =
      await lookupDiseaseInfo(predictedClass);

    const scan = await Scan.create({
      user: req.user.id,
      imageUrl: req.file.path,
      result: dbName || predictedClass,
      confidence,
      treatment,
      symptoms,
      prevention,
    });

    res.status(200).json({
      ...scan.toObject(),
      predicted_class: predictedClass,
      disease_name: formatDisplayName(dbName || predictedClass),
    });
  } catch (error) {
    handlePipelineError(error, res);
  } finally {
    cleanupUploadedFile(filePath);
    const memEnd = process.memoryUsage();
    console.log('[Memory] End of uploadScan - Heap Used:', Math.round(memEnd.heapUsed / 1024 / 1024), 'MB', 'Delta:', Math.round((memEnd.heapUsed - memStart.heapUsed) / 1024 / 1024), 'MB');
  }
});

// @desc    Get current user's scan history
// @route   GET /api/scans
// @access  Private
const getMyScans = asyncHandler(async (req, res) => {
  const scans = await Scan.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json(scans);
});

module.exports = {
  analyzeScan,
  uploadScan,
  getMyScans,
};
