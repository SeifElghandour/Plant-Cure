// ============================================
// Plant Scan AI - JavaScript
// ============================================

// ============================================
// Disease Database
// ============================================
const diseasesDB = [
    {
        id: 1,
        name: 'Powdery Mildew',
        scientificName: 'Erysiphales',
        category: 'fungal',
        affectedPlants: ['Roses', 'Cucumbers', 'Tomatoes', 'Squash'],
        symptoms: ['White powdery spots on leaves', 'Distorted growth', 'Yellowing leaves'],
        severity: 'medium',
        color: '#9b59b6',
    },
    {
        id: 2,
        name: 'Leaf Spot',
        scientificName: 'Cercospora spp.',
        category: 'fungal',
        affectedPlants: ['Tomatoes', 'Peppers', 'Lettuce', 'Beans'],
        symptoms: ['Brown/black spots on leaves', 'Yellow halos around spots', 'Premature leaf drop'],
        severity: 'medium',
        color: '#e74c3c',
    },
    {
        id: 3,
        name: 'Blight',
        scientificName: 'Phytophthora infestans',
        category: 'fungal',
        affectedPlants: ['Potatoes', 'Tomatoes', 'Peppers', 'Eggplants'],
        symptoms: ['Dark brown lesions', 'Rapid wilting', 'White fungal growth'],
        severity: 'high',
        color: '#c0392b',
    },
    {
        id: 4,
        name: 'Root Rot',
        scientificName: 'Pythium spp.',
        category: 'fungal',
        affectedPlants: ['Houseplants', 'Tomatoes', 'Beans', 'Peas'],
        symptoms: ['Yellowing leaves', 'Stunted growth', 'Brown mushy roots'],
        severity: 'high',
        color: '#8e44ad',
    },
    {
        id: 5,
        name: 'Bacterial Wilt',
        scientificName: 'Ralstonia solanacearum',
        category: 'bacterial',
        affectedPlants: ['Tomatoes', 'Potatoes', 'Peppers', 'Eggplants'],
        symptoms: ['Sudden wilting', 'Brown streaks in stems', 'Bacterial ooze'],
        severity: 'high',
        color: '#e67e22',
    },
    {
        id: 6,
        name: 'Aphids',
        scientificName: 'Aphidoidea',
        category: 'pest',
        affectedPlants: ['Roses', 'Vegetables', 'Fruit trees', 'Ornamentals'],
        symptoms: ['Sticky honeydew', 'Curling leaves', 'Stunted growth', 'Black sooty mold'],
        severity: 'medium',
        color: '#f39c12',
    },
    {
        id: 7,
        name: 'Spider Mites',
        scientificName: 'Tetranychus urticae',
        category: 'pest',
        affectedPlants: ['Beans', 'Tomatoes', 'Strawberries', 'Houseplants'],
        symptoms: ['Fine webbing', 'Yellow stippling', 'Bronze discoloration'],
        severity: 'medium',
        color: '#d35400',
    },
    {
        id: 8,
        name: 'Mosaic Virus',
        scientificName: 'Tobamovirus',
        category: 'viral',
        affectedPlants: ['Tomatoes', 'Peppers', 'Cucumbers', 'Tobacco'],
        symptoms: ['Mottled leaf pattern', 'Distorted growth', 'Reduced yields'],
        severity: 'high',
        color: '#27ae60',
    },
];

// Severity labels
const severityLabels = {
    low: { text: 'Low Risk', bg: 'rgba(39, 174, 96, 0.15)', color: '#27ae60' },
    medium: { text: 'Moderate', bg: 'rgba(243, 156, 18, 0.15)', color: '#f39c12' },
    high: { text: 'High Risk', bg: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c' },
};

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
const API_BASE_URL = 'http://localhost:3000';

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

        const token = getAuthToken();
        const endpoint = token
            ? `${API_BASE_URL}/api/scans`
            : `${API_BASE_URL}/api/scans/analyze`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: token ? getAuthHeaders() : {},
            body: formData,
        });

        let payload;
        try {
            payload = await response.json();
        } catch (_parseError) {
            throw new Error('Invalid response from analysis server.');
        }

        if (!response.ok) {
            throw new Error(payload.message || 'Analysis failed. Please try again.');
        }

        const isHealthy =
            payload.is_healthy === true ||
            String(payload.predicted_class || payload.result || '').toLowerCase().includes('healthy') ||
            String(payload.disease_name || payload.result || '').toLowerCase().includes('healthy');

        const result = {
            status: isHealthy ? 'healthy' : 'diseased',
            diseaseName:
                payload.disease_name ||
                payload.result ||
                payload.predicted_class ||
                'Unknown',
            confidence: Math.round(Number(payload.confidence) || 0),
            description: payload.symptoms || 'No symptoms details available.',
            treatments: [
                {
                    title: 'Recommended Treatment',
                    description: payload.treatment || 'Consult an agricultural expert.',
                    icon: '🧪',
                },
            ],
            preventionTips: payload.prevention
                ? payload.prevention
                      .split(/[.\n]/)
                      .map((tip) => tip.trim())
                      .filter(Boolean)
                : ['No prevention data available.'],
        };

        displayResults(result);
        document.getElementById('results').style.display = 'block';
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
        statusBadge.textContent = 'Healthy Plant';
        statusBadge.className = 'status-badge';
        resultCard.className = 'result-card';
        document.getElementById('diseaseNameSection').style.display = 'none';
    } else {
        statusBadge.textContent = 'Disease Detected';
        statusBadge.className = 'status-badge diseased';
        resultCard.className = 'result-card diseased';
        document.getElementById('diseaseNameSection').style.display = 'block';
        document.getElementById('diseaseName').textContent = result.diseaseName;
    }
    
    // Update confidence
    document.getElementById('confidence').textContent = `Confidence: ${result.confidence}%`;
    document.getElementById('confidenceValue').textContent = `${result.confidence}%`;
    document.getElementById('progressFill').style.width = `${result.confidence}%`;
    
    // Update description
    document.getElementById('resultDescription').textContent = result.description;
    
    // Update treatments
    const treatmentsGrid = document.getElementById('treatmentsGrid');
    treatmentsGrid.innerHTML = result.treatments.map(t => `
        <div class="treatment-card">
            <div class="treatment-icon">${t.icon}</div>
            <h4 class="treatment-title">${t.title}</h4>
            <p class="treatment-description">${t.description}</p>
        </div>
    `).join('');
    
    // Update prevention tips
    const preventionGrid = document.getElementById('preventionGrid');
    preventionGrid.innerHTML = result.preventionTips.map(tip => `
        <div class="prevention-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <p>${tip}</p>
        </div>
    `).join('');
}

// ============================================
// Diseases Gallery
// ============================================
let currentFilter = 'all';

function renderDiseases() {
    const searchQuery = document.getElementById('diseaseSearch').value.toLowerCase();
    const grid = document.getElementById('diseasesGrid');
    
    const filtered = diseasesDB.filter(disease => {
        const matchesSearch = disease.name.toLowerCase().includes(searchQuery) ||
                             disease.affectedPlants.some(p => p.toLowerCase().includes(searchQuery));
        const matchesCategory = currentFilter === 'all' || disease.category === currentFilter;
        return matchesSearch && matchesCategory;
    });
    
    grid.innerHTML = filtered.map(disease => {
        const severity = severityLabels[disease.severity];
        return `
            <div class="disease-card" onclick="openDiseaseModal(${disease.id})">
                <div class="disease-card-header">
                    <span class="disease-category" style="background: ${disease.color}20; color: ${disease.color}">
                        ${disease.category}
                    </span>
                    <span class="disease-severity" style="background: ${severity.bg}; color: ${severity.color}">
                        ${severity.text}
                    </span>
                </div>
                <h4 class="disease-name">${disease.name}</h4>
                <p class="disease-scientific">${disease.scientificName}</p>
                <div class="disease-plants">
                    ${disease.affectedPlants.slice(0, 3).map(plant => 
                        `<span class="disease-plant-tag">${plant}</span>`
                    ).join('')}
                    ${disease.affectedPlants.length > 3 ? 
                        `<span class="disease-plant-tag">+${disease.affectedPlants.length - 3}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function filterDiseases() {
    renderDiseases();
}

function setFilter(category, btn) {
    currentFilter = category;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    renderDiseases();
}

function openDiseaseModal(id) {
    const disease = diseasesDB.find(d => d.id === id);
    if (!disease) return;
    
    const severity = severityLabels[disease.severity];
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <div class="modal-body">
            <div class="modal-header">
                <div class="modal-badges">
                    <span class="disease-category" style="background: ${disease.color}20; color: ${disease.color}">
                        ${disease.category}
                    </span>
                    <span class="disease-severity" style="background: ${severity.bg}; color: ${severity.color}">
                        ${severity.text}
                    </span>
                </div>
                <h3 class="modal-title">${disease.name}</h3>
                <p class="modal-subtitle">${disease.scientificName}</p>
            </div>
            
            <div class="modal-section">
                <h4 class="modal-section-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
                    Affected Plants
                </h4>
                <div class="modal-plants">
                    ${disease.affectedPlants.map(plant => 
                        `<span class="modal-plant-tag">${plant}</span>`
                    ).join('')}
                </div>
            </div>
            
            <div class="modal-section">
                <h4 class="modal-section-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    Common Symptoms
                </h4>
                <ul class="modal-symptoms">
                    ${disease.symptoms.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
            
            <button class="btn btn-primary btn-full" onclick="closeModal(); scrollToSection('upload')">
                Scan Your Plant for This Disease
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
    
    if (tab === 'login') {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
    } else {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    }
}

// ============================================
// Authentication
// ============================================
const AUTH_STORAGE_KEYS = ['token', 'userName', 'userEmail', 'userId'];

function getAuthToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
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
        document.getElementById('authUserName').textContent = user.name || 'User';
        document.getElementById('authUserEmail').textContent = user.email || '';

        const navLabel = user.name ? user.name.split(' ')[0] : 'Account';
        authNavLink.textContent = navLabel;
        authMobileNavLink.textContent = navLabel;
        return;
    }

    authLoggedIn.style.display = 'none';
    authForms.style.display = 'block';
    authNavLink.textContent = 'Login';
    authMobileNavLink.textContent = 'Login';
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
        showAuthMessage(error.message || 'Login failed. Please try again.');
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

    if (password.length < 6) {
        showAuthMessage('Password must be at least 6 characters.');
        return;
    }

    setAuthLoading('register', true);

    try {
        const data = await authRequest('/api/users/register', { name, email, password });
        saveAuthSession(data, true);
        updateAuthUI();
        document.getElementById('registerForm').reset();
        showAuthMessage('Account created successfully. You are now signed in.', 'success');
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

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    renderDiseases();
    updateAuthUI();
    document.querySelector('.faq-item').classList.add('active');
});
