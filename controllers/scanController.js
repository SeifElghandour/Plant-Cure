const asyncHandler = require('express-async-handler');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const Scan = require('../models/Scan');
const Disease = require('../models/Disease');
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

  const aiResponse = await axios.post(AI_SERVICE_URL, formData, {
    headers: formData.getHeaders(),
    timeout: 60000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const predictedClass =
    aiResponse.data.predicted_class ||
    aiResponse.data.disease ||
    aiResponse.data.result;

  const confidence = parseConfidence(aiResponse.data.confidence);

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
  const diseaseInfo = dbName ? await Disease.findOne({ name: dbName }) : null;

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
    });
  } catch (error) {
    handlePipelineError(error, res);
  } finally {
    cleanupUploadedFile(filePath);
  }
});

// @desc    Upload plant image & save scan history for authenticated users
// @route   POST /api/scans
// @access  Private
const uploadScan = asyncHandler(async (req, res) => {
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
