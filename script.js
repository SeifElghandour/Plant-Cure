// ============================================
// Plant Cure - JavaScript
// ============================================

// diseases array loaded from data/diseases.js

// Severity / type styling for disease cards
const severityLabels = {
    low: { text: 'Low Risk', bg: 'rgba(39, 174, 96, 0.15)', color: '#27ae60' },
    medium: { text: 'Moderate', bg: 'rgba(243, 156, 18, 0.15)', color: '#f39c12' },
    high: { text: 'High Risk', bg: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c' },
    none: { text: 'None', bg: 'rgba(45, 138, 107, 0.15)', color: '#2d8a6b' },
};

const typeColors = {
    Fungal: '#9b59b6',
    Bacterial: '#e67e22',
    Viral: '#27ae60',
    Pest: '#f39c12',
    Healthy: '#2d8a6b',
};

const filterTypeMap = {
    all: null,
    fungal: 'Fungal',
    bacterial: 'Bacterial',
    viral: 'Viral',
    pest: 'Pest',
    healthy: 'Healthy',
};

// ... rest of the script.js content remains the same
