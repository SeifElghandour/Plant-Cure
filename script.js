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

function getAppLang() {
    return localStorage.getItem('appLang') || localStorage.getItem('lang') || 'en';
}

function dl(disease, field) {
    const lang = getAppLang();
    const localized = disease[`${field}_${lang}`];
    if (localized !== undefined && localized !== null && localized !== '') {
        return localized;
    }
    return disease[`${field}_en`] || '';
}

function dlTags(disease) {
    const lang = getAppLang();
    const tags = disease[lang === 'ar' ? 'tags_ar' : 'tags_en'];
    return Array.isArray(tags) ? tags : (disease.tags_en || []);
}

function getRiskStyle(risk) {
    if (risk === 'High Risk' || risk === 'عالي الخطورة') return severityLabels.high;
    if (risk === 'None' || risk === 'لا يوجد') return severityLabels.none;
    return severityLabels.medium;
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function normalizeDiseaseKey(str) {
    return String(str || '')
        .toLowerCase()
        .replace(/___/g, '_')
        .replace(/[^a-z0-9]/g, '');
}

function findDiseaseByResult(resultKey) {
    if (!resultKey || typeof diseases === 'undefined' || !Array.isArray(diseases)) {
        return null;
    }

    const norm = normalizeDiseaseKey(resultKey);
    if (!norm) return null;

    const exact = diseases.find((d) => normalizeDiseaseKey(d.name) === norm);
    if (exact) return exact;

    const byTitle = diseases.find((d) => normalizeDiseaseKey(dl(d, 'title')) === norm);
    if (byTitle) return byTitle;

    const partial = diseases.find((d) => {
        const dn = normalizeDiseaseKey(d.name);
        return dn.includes(norm) || norm.includes(dn);
    });
    if (partial) return partial;

    return null;
}

function splitPreventionTips(text) {
    if (!text || typeof text !== 'string') return [];
    return text.split(/[.\n]/).map((s) => s.trim()).filter(Boolean);
}

function formatRawResultName(rawKey) {
    if (!rawKey) return '';
    return String(rawKey).replace(/___/g, ' ').replace(/_/g, ' ').trim();
}

function isPayloadHealthy(payload) {
    const rawKey = payload.predicted_class || payload.result || payload.disease_name || '';
    return (
        payload.is_healthy === true ||
        String(rawKey).toLowerCase().includes('healthy')
    );
}

function isHealthyResult(rawKey, disease) {
    if (!rawKey && !disease) return false;
    if (String(rawKey).toLowerCase().includes('healthy')) return true;
    if (disease) {
        const type = dl(disease, 'type');
        return type === 'Healthy' || type === 'سليم';
    }
    return false;
}

function buildDisplayResultFromPayload(payload) {
    const rawKey =
        payload.predicted_class ||
        payload.result ||
        payload.disease_name ||
        '';
    const disease = findDiseaseByResult(rawKey);
    const healthy = payload.is_healthy === true || isHealthyResult(rawKey, disease);
    const confidence = normalizeConfidence(payload.confidence);

    if (disease) {
        const preventionRaw = dl(disease, 'prevention');
        let preventionTips = splitPreventionTips(preventionRaw);
        if (!preventionTips.length) {
            preventionTips = [t('noPrevention')];
        }

        return {
            status: healthy ? 'healthy' : 'diseased',
            diseaseName: dl(disease, 'title') || t('unknownDisease'),
            confidence,
            description: dl(disease, 'symptoms') || t('noSymptomsData'),
            treatments: [
                {
                    title: t('recommendedTreatment'),
                    description: dl(disease, 'treatment') || t('noTreatmentData'),
                    icon: '🧪',
                },
            ],
            preventionTips,
        };
    }

    const preventionFromPayload = splitPreventionTips(payload.prevention);
    const rawEnglishName =
        formatRawResultName(payload.result || payload.predicted_class) ||
        (payload.disease_name ? String(payload.disease_name) : '');

    return {
        status: healthy ? 'healthy' : 'diseased',
        diseaseName: rawEnglishName || t('unknownDisease'),
        confidence,
        description: payload.symptoms || t('noSymptomsData'),
        treatments: [
            {
                title: t('recommendedTreatment'),
                description: payload.treatment || t('noTreatmentData'),
                icon: '🧪',
            },
        ],
        preventionTips: preventionFromPayload.length
            ? preventionFromPayload
            : [t('noPrevention')],
    };
}

function getLocalizedPlantNameFromScan(scan) {
    const key = scan?.result || scan?.predicted_class || scan?.disease_name || '';
    const disease = findDiseaseByResult(key);
    if (disease) return dl(disease, 'title') || t('unknownDisease');
    const fallback = scan?.disease_name || key;
    return fallback ? String(fallback).replace(/_/g, ' ') : t('unknownDisease');
}

// ============================================
// Header Scroll Effect
// ============================================
window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    const scrollTop = document.getElementById('scrollTop');
    
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
    
    if (window.scrollY > 500) {
        scrollTop.classList.add('visible');
    } else {
        scrollTop.classList.remove('visible');
    }
});

// ============================================
// Mobile Menu Toggle
// ============================================
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.toggle('active');
}

// ============================================
// Scroll to Section
// ============================================
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// File Upload Handling
// ============================================
let selectedFile = null;
let uploadedImageData = null;
let lastAnalysisPayload = null;

const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');

// Drag and drop events
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file) {
        handleFile(file);
    }
});

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    // Hide error
    document.getElementById('errorMessage').style.display = 'none';
    
    if (!allowedTypes.includes(file.type)) {
        showError('Please upload a valid image file (JPG, PNG, or GIF)');
        return;
    }
    
    if (file.size > maxSize) {
        showError('File size must be less than 10MB');
        return;
    }
    
    selectedFile = file;
    
    // Read file for preview
    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedImageData = e.target.result;
        
        // Show preview
        document.getElementById('previewImage').src = uploadedImageData;
        document.getElementById('uploadPrompt').style.display = 'none';
        document.getElementById('uploadPreview').style.display = 'block';
        
        // Show file info
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = formatFileSize(file.size);
        document.getElementById('fileInfo').style.display = 'flex';
        
        // Enable analyze button
        document.getElementById('analyzeBtn').disabled = false;
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    selectedFile = null;
    uploadedImageData = null;
    
    document.getElementById('fileInput').value = '';
    document.getElementById('uploadPrompt').style.display = 'block';
    document.getElementById('uploadPreview').style.display = 'none';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('analyzeBtn').disabled = true;
    document.getElementById('errorMessage').style.display = 'none';
}

function resetUpload() {
    removeImage();
}

function showError(message) {
    document.getElementById('errorText').textContent = message;
    document.getElementById('errorMessage').style.display = 'flex';
}

function showLimitReachedModal() {
    document.getElementById('limitReachedModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLimitReachedModal() {
    document.getElementById('limitReachedModal').classList.remove('active');
    document.body.style.overflow = '';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================
// Image Analysis (Backend + AI Pipeline)
// ============================================
const API_BASE_URL = 'https://doctor-plant-backend.onrender.com';

async function analyzeImage() {
    if (!selectedFile) return;

    const analyzeBtn = document.getElementById('analyzeBtn');
    const analyzeText = document.getElementById('analyzeText');
    const analyzeLoading = document.getElementById('analyzeLoading');

    analyzeBtn.disabled = true;
    analyzeText.style.display = 'none';
    analyzeLoading.style.display = 'flex';

    try {
        const formData = new FormData();
        formData.append('image', selectedFile);

        const authToken = getAuthToken();
        const endpoint = authToken
           ? `${API_BASE_URL}/api/scans/upload`
           : `${API_BASE_URL}/api/scans/analyze`;

        const fetchOptions = {
            method: 'POST',
            body: formData,
        };

        if (authToken) {
            fetchOptions.headers = { Authorization: `Bearer ${authToken}` };
        }

        const response = await fetch(endpoint, fetchOptions);

        let payload;
        try {
            payload = await response.json();
        } catch (_parseError) {
            throw new Error('Invalid response from analysis server.');
        }

        if (!response.ok) {
            // Handle guest limit reached error
            if (response.status === 403 && payload.error === 'LimitReached') {
                showLimitReachedModal();
                throw new Error('LimitReached');
            }
            throw new Error(payload.message || 'Analysis failed. Please try again.');
        }

        const isHealthy = isPayloadHealthy(payload);
        lastAnalysisPayload = { ...payload, is_healthy: isHealthy };

        const result = buildDisplayResultFromPayload(lastAnalysisPayload);

        displayResults(result);
        document.getElementById('results').style.display = 'block';
        if (getAuthToken()) {
            fetchUserHistory();
        }
        setTimeout(() => {
            scrollToSection('results');
        }, 100);
    } catch (error) {
        console.error('Analysis error:', error);
        showError(error.message || 'Analysis failed. Please try again.');
    } finally {
        analyzeText.style.display = 'block';
        analyzeLoading.style.display = 'none';
        analyzeBtn.disabled = false;
    }
}

function generateMockResult(isHealthy) {
    if (isHealthy) {
        return {
            status: 'healthy',
            confidence: 97,
            description: 'Your plant appears to be in excellent health! The leaves show no signs of disease, discoloration, or pest damage. Continue with your current care routine.',
            treatments: [
                { title: 'Regular Watering', description: 'Maintain consistent watering schedule based on plant type.', icon: '💧' },
                { title: 'Proper Lighting', description: 'Ensure adequate sunlight exposure for optimal growth.', icon: '☀️' },
                { title: 'Fertilization', description: 'Apply balanced fertilizer during growing season.', icon: '🌱' },
            ],
            preventionTips: [
                'Monitor plants regularly for early signs of stress',
                'Maintain proper spacing between plants for air circulation',
                'Use clean tools when pruning or trimming',
                'Keep foliage dry to prevent fungal growth',
            ],
        };
    } else {
        const diseases = [
            { name: 'Leaf Spot Disease', description: 'Leaf spot is a common fungal disease that causes brown or black spots on leaves. It spreads quickly in humid conditions and can weaken the plant if left untreated.' },
            { name: 'Powdery Mildew', description: 'Powdery mildew appears as white or gray powdery patches on leaves. It thrives in warm, dry conditions with high humidity around the plant.' },
            { name: 'Bacterial Blight', description: 'Bacterial blight causes water-soaked lesions on leaves that turn brown or black. It spreads rapidly through water splash and contaminated tools.' },
        ];
        
        const disease = diseases[Math.floor(Math.random() * diseases.length)];
        
        return {
            status: 'diseased',
            diseaseName: disease.name,
            confidence: 94,
            description: disease.description,
            treatments: [
                { title: 'Remove Infected Leaves', description: 'Prune and dispose of infected leaves to prevent spread.', icon: '✂️' },
                { title: 'Apply Fungicide', description: 'Use appropriate fungicide or bactericide as recommended.', icon: '🧪' },
                { title: 'Improve Air Circulation', description: 'Increase spacing and prune for better airflow.', icon: '💨' },
            ],
            preventionTips: [
                'Water at the base of plants, avoiding wetting foliage',
                'Sterilize pruning tools between uses',
                'Remove plant debris from around the base',
                'Apply preventive fungicide during humid weather',
                'Choose disease-resistant varieties when possible',
            ],
        };
    }
}

function displayResults(result) {
    // Set result image
    document.getElementById('resultImage').src = uploadedImageData;
    
    // Update status badge
    const statusBadge = document.getElementById('statusBadge');
    const resultCard = document.getElementById('resultCard');
    
    if (result.status === 'healthy') {
        statusBadge.textContent = t('healthyPlant');
        statusBadge.className = 'status-badge';
        resultCard.className = 'result-card';
        document.getElementById('diseaseNameSection').style.display = 'none';
    } else {
        statusBadge.textContent = t('diseaseDetected');
        statusBadge.className = 'status-badge diseased';
        resultCard.className = 'result-card diseased';
        document.getElementById('diseaseNameSection').style.display = 'block';
        document.getElementById('diseaseName').textContent = result.diseaseName || t('unknownDisease');
    }

    const confidencePct = Number.isFinite(result.confidence) ? result.confidence : 0;
    document.getElementById('confidence').textContent = `${t('confidence')}: ${confidencePct}%`;
    document.getElementById('confidenceValue').textContent = `${confidencePct}%`;
    document.getElementById('progressFill').style.width = `${confidencePct}%`;

    document.getElementById('resultDescription').textContent = result.description || t('noSymptomsData');

    const treatmentsGrid = document.getElementById('treatmentsGrid');
    const treatments = Array.isArray(result.treatments) ? result.treatments : [];
    treatmentsGrid.innerHTML = treatments
        .map(
            (item) => `
        <div class="treatment-card">
            <div class="treatment-icon">${item.icon || '🧪'}</div>
            <h4 class="treatment-title">${escapeHtml(item.title || t('recommendedTreatment'))}</h4>
            <p class="treatment-description">${escapeHtml(item.description || t('noTreatmentData'))}</p>
        </div>`
        )
        .join('');

    const preventionGrid = document.getElementById('preventionGrid');
    const tips = Array.isArray(result.preventionTips) ? result.preventionTips : [t('noPrevention')];
    preventionGrid.innerHTML = tips
        .map(
            (tip) => `
        <div class="prevention-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <p>${escapeHtml(tip || t('noPrevention'))}</p>
        </div>`
        )
        .join('');
}

function refreshAnalysisReport() {
    if (!lastAnalysisPayload) return;
    const resultsSection = document.getElementById('results');
    if (!resultsSection || resultsSection.style.display === 'none') return;
    displayResults(buildDisplayResultFromPayload(lastAnalysisPayload));
}

// ============================================
// Diseases Gallery
// ============================================
let currentFilter = 'all';
let visibleCount = 8;
let filteredDiseases = [];

const modalSectionLabels = {
    en: {
        affectedPlants: 'Affected Plants',
        symptoms: 'Symptoms',
        treatment: 'Treatment',
        prevention: 'Prevention',
        scanCta: 'Scan Your Plant for This Disease',
        empty: 'No diseases found matching your search.',
        showMore: 'Show More',
    },
    ar: {
        affectedPlants: 'النباتات المتأثرة',
        symptoms: 'الأعراض',
        treatment: 'العلاج',
        prevention: 'الوقاية',
        scanCta: 'افحص نباتك لهذا المرض',
        empty: 'لم يتم العثور على أمراض مطابقة لبحثك.',
        showMore: 'عرض المزيد',
    },
};

function getModalLabels() {
    return modalSectionLabels[getAppLang()] || modalSectionLabels.en;
}

function diseaseMatchesSearch(disease, query) {
    if (!query) return true;

    const searchable = [
        disease.name,
        disease.title_en,
        disease.title_ar,
        ...(disease.tags_en || []),
        ...(disease.tags_ar || []),
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    return searchable.includes(query);
}

function updateShowMoreButton(totalCount) {
    const showMoreBtn = document.getElementById('showMoreDiseases');
    if (!showMoreBtn) return;

    const labels = getModalLabels();
    showMoreBtn.textContent = labels.showMore;
    showMoreBtn.style.display = visibleCount >= totalCount ? 'none' : 'inline-flex';
}

function renderDiseases(diseasesArray) {
    const grid = document.getElementById('diseasesContainer');
    if (!grid) return;

    if (!Array.isArray(diseasesArray)) {
        diseasesArray = [];
    }

    grid.innerHTML = '';
    const labels = getModalLabels();
    const visibleItems = diseasesArray.slice(0, visibleCount);

    if (!visibleItems.length) {
        grid.innerHTML = `<p class="diseases-empty">${labels.empty}</p>`;
        updateShowMoreButton(0);
        return;
    }

    visibleItems.forEach((disease) => {
        const masterIndex = diseases.findIndex((d) => d.name === disease.name);
        const typeEn = disease.type_en || 'Fungal';
        const typeColor = typeColors[typeEn] || '#3498db';
        const typeLabel = dl(disease, 'type');
        const riskLabel = dl(disease, 'risk');
        const risk = getRiskStyle(riskLabel);
        const tags = dlTags(disease);
        const visibleTags = tags.slice(0, 3);
        const extraTags = tags.length > 3 ? tags.length - 3 : 0;

        const card = document.createElement('div');
        card.className = 'disease-card';
        card.onclick = () => openDiseaseModal(masterIndex);
        card.innerHTML = `
            <div class="disease-card-header">
                <span class="disease-category" style="background: ${typeColor}20; color: ${typeColor}">
                    ${typeLabel}
                </span>
                <span class="disease-severity" style="background: ${risk.bg}; color: ${risk.color}">
                    ${riskLabel}
                </span>
            </div>
            <h4 class="disease-name">${dl(disease, 'title')}</h4>
            <p class="disease-scientific">${disease.name}</p>
            <div class="disease-plants">
                ${visibleTags.map((tag) => `<span class="disease-plant-tag">${tag}</span>`).join('')}
                ${extraTags ? `<span class="disease-plant-tag">+${extraTags}</span>` : ''}
            </div>
        `;
        grid.appendChild(card);
    });

    updateShowMoreButton(diseasesArray.length);
}

function filterDiseases() {
    visibleCount = 8;

    const searchInput = document.getElementById('diseaseSearch');
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

    if (!Array.isArray(diseases)) {
        filteredDiseases = [];
        renderDiseases(filteredDiseases);
        return;
    }

    filteredDiseases = diseases.filter((disease) => {
        const matchesSearch = diseaseMatchesSearch(disease, searchQuery);
        const matchesCategory =
            currentFilter === 'all' || disease.type_en === filterTypeMap[currentFilter];
        return matchesSearch && matchesCategory;
    });

    renderDiseases(filteredDiseases);
}

function showMoreDiseases() {
    visibleCount += 8;
    renderDiseases(filteredDiseases);
}

function setFilter(category, btn) {
    currentFilter = category;

    document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    filterDiseases();
}

function openDiseaseModal(index) {
    const disease = diseases[index];
    if (!disease) return;

    const typeEn = disease.type_en || 'Fungal';
    const typeColor = typeColors[typeEn] || '#3498db';
    const typeLabel = dl(disease, 'type');
    const riskLabel = dl(disease, 'risk');
    const risk = getRiskStyle(riskLabel);
    const tags = dlTags(disease);
    const labels = getModalLabels();
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <div class="modal-body">
            <div class="modal-header">
                <div class="modal-badges">
                    <span class="disease-category" style="background: ${typeColor}20; color: ${typeColor}">
                        ${typeLabel}
                    </span>
                    <span class="disease-severity" style="background: ${risk.bg}; color: ${risk.color}">
                        ${riskLabel}
                    </span>
                </div>
                <h3 class="modal-title">${dl(disease, 'title')}</h3>
                <p class="modal-subtitle">${disease.name}</p>
            </div>

            <div class="modal-section">
                <h4 class="modal-section-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
                    ${labels.affectedPlants}
                </h4>
                <div class="modal-plants">
                    ${tags.map((tag) => `<span class="modal-plant-tag">${tag}</span>`).join('')}
                </div>
            </div>

            <div class="modal-section">
                <h4 class="modal-section-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    ${labels.symptoms}
                </h4>
                <p class="modal-text">${dl(disease, 'symptoms')}</p>
            </div>

            <div class="modal-section">
                <h4 class="modal-section-title">${labels.treatment}</h4>
                <p class="modal-text">${dl(disease, 'treatment')}</p>
            </div>

            <div class="modal-section">
                <h4 class="modal-section-title">${labels.prevention}</h4>
                <p class="modal-text">${dl(disease, 'prevention')}</p>
            </div>

            <button class="btn btn-primary btn-full" onclick="closeModal(); scrollToSection('upload')">
                ${labels.scanCta}
            </button>
        </div>
    `;

    document.getElementById('diseaseModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(event) {
    if (event && event.target !== event.currentTarget) return;
    
    document.getElementById('diseaseModal').classList.remove('active');
    document.body.style.overflow = '';
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// ============================================
// FAQ Accordion
// ============================================
function toggleFaq(button) {
    const item = button.parentElement;
    const isActive = item.classList.contains('active');
    
    // Close all items
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
    
    // Open clicked item if it wasn't active
    if (!isActive) {
        item.classList.add('active');
    }
}

// ============================================
// Auth Tabs
// ============================================
function switchTab(tab, btn) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    clearAuthMessage();
    document.getElementById('otpVerification').style.display = 'none';
    document.querySelector('.auth-tabs').style.display = 'flex';

    if (tab === 'login') {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
    } else {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    }
}

// ============================================
// OTP Email Verification
// ============================================
let pendingVerificationEmail = '';

function showOtpVerification(email) {
    pendingVerificationEmail = String(email || '').trim().toLowerCase();
    document.getElementById('authLoggedIn').style.display = 'none';
    document.getElementById('authForms').style.display = 'block';
    document.querySelector('.auth-tabs').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('otpVerification').style.display = 'block';
    document.getElementById('otpEmailDisplay').textContent = pendingVerificationEmail;
    document.getElementById('otpInput').value = '';
    clearOtpMessage();
    clearAuthMessage();
    document.getElementById('otpInput').focus();
}

function hideOtpVerification() {
    document.getElementById('otpVerification').style.display = 'none';
    document.querySelector('.auth-tabs').style.display = 'flex';
    pendingVerificationEmail = '';
    switchTab('login', document.querySelector('.auth-tab[onclick*="login"]'));
}

function showOtpMessage(message, type = 'error') {
    const otpMessage = document.getElementById('otpMessage');
    document.getElementById('otpMessageText').textContent = message;
    otpMessage.className = `auth-message ${type}`;
    otpMessage.style.display = 'flex';
}

function clearOtpMessage() {
    const otpMessage = document.getElementById('otpMessage');
    otpMessage.style.display = 'none';
    otpMessage.className = 'auth-message';
}

function setOtpLoading(isLoading) {
    const submitBtn = document.getElementById('otpSubmitBtn');
    const submitText = document.getElementById('otpSubmitText');
    const submitLoading = document.getElementById('otpSubmitLoading');
    submitBtn.disabled = isLoading;
    submitText.style.display = isLoading ? 'none' : 'inline';
    submitLoading.style.display = isLoading ? 'inline-flex' : 'none';
}

async function handleVerifyOtp(event) {
    event.preventDefault();
    clearOtpMessage();

    const otp = document.getElementById('otpInput').value.trim();
    if (!/^\d{6}$/.test(otp)) {
        showOtpMessage('Please enter a valid 6-digit code.');
        return;
    }

    if (!pendingVerificationEmail) {
        showOtpMessage('Session expired. Please register or log in again.');
        return;
    }

    setOtpLoading(true);

    try {
        const data = await authRequest('/api/users/verify', {
            email: pendingVerificationEmail,
            otp,
        });
        showToast(data.message || t('otpVerifySuccess'), 'success');
        hideOtpVerification();
    } catch (error) {
        showOtpMessage(error.message || 'Verification failed. Please try again.');
    } finally {
        setOtpLoading(false);
    }
}

async function handleResendOtp() {
    if (!pendingVerificationEmail) {
        showOtpMessage('Session expired. Please register again.');
        return;
    }

    clearOtpMessage();
    const resendBtn = document.getElementById('otpResendBtn');
    resendBtn.disabled = true;

    try {
        const data = await authRequest('/api/users/resend-otp', {
            email: pendingVerificationEmail,
        });
        showOtpMessage(data.message || t('otpResentSuccess'), 'success');
    } catch (error) {
        showOtpMessage(error.message || 'Could not resend code. Please try again.');
    } finally {
        resendBtn.disabled = false;
    }
}

// ============================================
// Authentication
// ============================================
const AUTH_STORAGE_KEYS = ['token', 'userName', 'userEmail', 'userId'];

function getAuthToken() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return token ? token.trim() : null;
}

function normalizeConfidence(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    if (num > 0 && num <= 1) return Math.round(num * 100);
    if (num > 1 && num <= 10) return Math.round(num * 10);
    if (num <= 100) return Math.round(num);
    return 100;
}

// ============================================
// Scan History
// ============================================
let lastHistoryData = [];

async function fetchUserHistory() {
    const token = getAuthToken();
    const historySection = document.getElementById('history');

    if (!token) {
        lastHistoryData = [];
        if (historySection) historySection.style.display = 'none';
        renderHistory([]);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/scans/user`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            lastHistoryData = [];
            renderHistory([]);
            return;
        }

        const data = await response.json();
        lastHistoryData = Array.isArray(data) ? data : [];
        renderHistory(lastHistoryData);
        if (historySection) historySection.style.display = 'block';
    } catch (error) {
        console.error('History fetch error:', error);
        lastHistoryData = [];
        renderHistory([]);
    }
}

function formatHistoryDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '—';
    const lang = getAppLang();
    return date.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function renderHistory(historyData) {
    const container = document.getElementById('historyContainer');
    if (!container) return;

    if (!Array.isArray(historyData) || historyData.length === 0) {
        container.innerHTML = `<p class="history-empty">${escapeHtml(t('noPreviousAnalyses'))}</p>`;
        return;
    }

    const rows = historyData
        .map((scan) => {
            const plantName = escapeHtml(getLocalizedPlantNameFromScan(scan));
            const confidence = normalizeConfidence(scan.confidence);
            const date = escapeHtml(formatHistoryDate(scan.createdAt));
            return `<tr>
                <td>${plantName}</td>
                <td>${confidence}%</td>
                <td>${date}</td>
            </tr>`;
        })
        .join('');

    container.innerHTML = `
        <table class="history-table">
            <thead>
                <tr>
                    <th>${escapeHtml(t('historyPlantName'))}</th>
                    <th>${escapeHtml(t('historyConfidence'))}</th>
                    <th>${escapeHtml(t('historyDate'))}</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
}

function getAuthHeaders() {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function saveAuthSession(data, remember = true) {
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;

    AUTH_STORAGE_KEYS.forEach((key) => {
        otherStorage.removeItem(key);
    });

    storage.setItem('token', data.token);
    storage.setItem('userName', data.name);
    storage.setItem('userEmail', data.email);
    storage.setItem('userId', data._id);
}

function clearAuthSession() {
    AUTH_STORAGE_KEYS.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
}

function getCurrentUser() {
    const token = getAuthToken();
    if (!token) {
        return null;
    }

    return {
        token,
        name: localStorage.getItem('userName') || sessionStorage.getItem('userName'),
        email: localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail'),
        id: localStorage.getItem('userId') || sessionStorage.getItem('userId'),
    };
}

function showAuthMessage(message, type = 'error') {
    const authMessage = document.getElementById('authMessage');
    const authMessageText = document.getElementById('authMessageText');

    authMessage.className = `auth-message ${type}`;
    authMessageText.textContent = message;
    authMessage.style.display = 'flex';
}

function clearAuthMessage() {
    const authMessage = document.getElementById('authMessage');
    authMessage.style.display = 'none';
    authMessage.className = 'auth-message';
}

function updateAuthUI() {
    const user = getCurrentUser();
    const authLoggedIn = document.getElementById('authLoggedIn');
    const authForms = document.getElementById('authForms');
    const authNavLink = document.getElementById('authNavLink');
    const authMobileNavLink = document.getElementById('authMobileNavLink');

    if (user) {
        authLoggedIn.style.display = 'block';
        authForms.style.display = 'none';
        document.getElementById('otpVerification').style.display = 'none';
        pendingVerificationEmail = '';
        document.getElementById('authUserName').textContent = user.name || 'User';
        document.getElementById('authUserEmail').textContent = user.email || '';

        const navLabel = user.name ? user.name.split(' ')[0] : 'Account';
        authNavLink.textContent = navLabel;
        authMobileNavLink.textContent = navLabel;
        fetchUserHistory();
        return;
    }

    authLoggedIn.style.display = 'none';
    authForms.style.display = 'block';
    authNavLink.textContent = t('navLogin');
    authMobileNavLink.textContent = t('navLogin');
    const historySection = document.getElementById('history');
    if (historySection) historySection.style.display = 'none';
    lastHistoryData = [];
    renderHistory([]);
}

async function authRequest(endpoint, body) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    let payload;
    try {
        payload = await response.json();
    } catch (_parseError) {
        throw new Error('Invalid response from authentication server.');
    }

    if (!response.ok) {
        throw new Error(payload.message || 'Authentication failed.');
    }

    return payload;
}

function setAuthLoading(formType, isLoading) {
    const isLogin = formType === 'login';
    const submitBtn = document.getElementById(isLogin ? 'loginSubmitBtn' : 'registerSubmitBtn');
    const submitText = document.getElementById(isLogin ? 'loginSubmitText' : 'registerSubmitText');
    const submitLoading = document.getElementById(
        isLogin ? 'loginSubmitLoading' : 'registerSubmitLoading'
    );

    submitBtn.disabled = isLoading;
    submitText.style.display = isLoading ? 'none' : 'inline';
    submitLoading.style.display = isLoading ? 'inline-flex' : 'none';
}

async function handleLogin(event) {
    event.preventDefault();
    clearAuthMessage();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const remember = document.getElementById('rememberMe').checked;

    setAuthLoading('login', true);

    try {
        const data = await authRequest('/api/users/login', { email, password });
        saveAuthSession(data, remember);
        updateAuthUI();
        document.getElementById('loginForm').reset();
        showAuthMessage('Signed in successfully.', 'success');
    } catch (error) {
        const msg = error.message || 'Login failed. Please try again.';
        if (msg.toLowerCase().includes('verify')) {
            showOtpVerification(email.trim().toLowerCase());
        }
        showAuthMessage(msg);
    } finally {
        setAuthLoading('login', false);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    clearAuthMessage();

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
        showAuthMessage('Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&).');
        return;
    }

    setAuthLoading('register', true);

    try {
        const data = await authRequest('/api/users/register', { name, email, password });
        const registeredEmail = data.email || email.trim().toLowerCase();
        document.getElementById('registerForm').reset();
        showOtpVerification(registeredEmail);
        showToast(data.message || 'Registration successful. Enter the code sent to your email.', 'success');
    } catch (error) {
        showAuthMessage(error.message || 'Registration failed. Please try again.');
    } finally {
        setAuthLoading('register', false);
    }
}

function handleLogout() {
    clearAuthSession();
    updateAuthUI();
    showAuthMessage('You have been signed out.', 'success');
}

function socialLogin(provider) {
    showAuthMessage(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login is not available yet.`);
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const wrapper = input.closest('.password-wrapper');
    const eyeIcon = wrapper.querySelector('.eye-icon');
    const eyeOffIcon = wrapper.querySelector('.eye-off-icon');
    const isHidden = input.type === 'password';

    input.type = isHidden ? 'text' : 'password';
    eyeIcon.style.display = isHidden ? 'none' : 'block';
    eyeOffIcon.style.display = isHidden ? 'block' : 'none';
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toastText');
    if (!toast || !toastText) return;

    toast.className = `toast toast-${type}`;
    toastText.textContent = message;
    toast.style.display = 'flex';

    clearTimeout(showToast._hideTimer);
    showToast._hideTimer = setTimeout(() => {
        toast.style.display = 'none';
    }, 5000);
}

// ============================================
// Internationalization (i18n)
// ============================================
// translations loaded from data/translations.js

let currentLang = localStorage.getItem('appLang') || localStorage.getItem('lang') || 'en';

function t(key) {
    const lang = getAppLang();
    return translations[lang]?.[key] || translations.en[key] || '';
}

function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    localStorage.setItem('appLang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    if (translations[lang]?.pageTitle) {
        document.title = translations[lang].pageTitle;
    }

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });

    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.textContent = lang === 'en' ? 'العربية' : 'English';
    }

    updateAuthUI();
    refreshAnalysisReport();

    if (lastHistoryData.length) {
        renderHistory(lastHistoryData);
    }

    if (filteredDiseases.length) {
        renderDiseases(filteredDiseases);
    } else {
        filterDiseases();
    }
}

function toggleLanguage() {
    applyLanguage(currentLang === 'en' ? 'ar' : 'en');
}

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(currentLang);
    filterDiseases();
    updateAuthUI();
    if (getAuthToken()) {
        fetchUserHistory();
    }
    document.querySelector('.faq-item').classList.add('active');
});
