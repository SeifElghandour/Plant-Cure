# Plant-Cure - HTML/CSS/JS Version

A clean, standalone version of Plant Scan AI built with pure HTML, CSS, and JavaScript. Easy to edit in Visual Studio Code and deploy anywhere.

## 📁 Files

| File | Description |
|------|-------------|
| `index.html` | Main HTML structure with all sections |
| `style.css` | All styles - organized by section |
| `script.js` | All JavaScript functionality |
| `README.md` | This file |

## 🚀 Quick Start

1. Open the folder in **Visual Studio Code**
2. Right-click on `index.html` → **Open with Live Server** (if you have the extension)
3. Or simply double-click `index.html` to open in browser

## 🎨 Features

### Sections Included:
- ✅ **Header** - Fixed navigation with smooth scroll
- ✅ **Hero** - Upload card with drag & drop
- ✅ **Results** - Analysis results display
- ✅ **How It Works** - 4-step process explanation
- ✅ **Diseases Gallery** - Searchable disease database
- ✅ **Features** - App capabilities showcase
- ✅ **FAQ** - Accordion-style questions
- ✅ **Auth** - Login/Register forms
- ✅ **Footer** - Links and contact info

### Key Features:
- 📱 **Fully Responsive** - Works on all devices
- 🎨 **Modern Design** - Green gradient theme
- ⚡ **Fast Loading** - No frameworks, pure code
- 🔧 **Easy to Customize** - Well-organized CSS variables
- 🌐 **Backend Ready** - API integration template included

## 🔌 Connect to Your Backend

### Image Analysis API

Find this function in `script.js`:

```javascript
async function analyzeImage() {
    // ... existing code ...
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock result
    const isHealthy = Math.random() > 0.5;
    const result = generateMockResult(isHealthy);
    
    // ... rest of code ...
}
```

Replace with your API:

```javascript
async function analyzeImage() {
    if (!selectedFile) return;
    
    // Show loading
    // ...
    
    try {
        const formData = new FormData();
        formData.append('image', selectedFile);
        
        const response = await fetch('https://your-api-endpoint.com/analyze', {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) {
            throw new Error('Analysis failed');
        }
        
        const result = await response.json();
        displayResults(result);
        
    } catch (error) {
        console.error('Analysis error:', error);
        showError('Analysis failed. Please try again.');
    } finally {
        // Hide loading
        // ...
    }
}
```

### Expected API Response Format:

```json
{
    "status": "healthy" | "diseased",
    "diseaseName": "Leaf Spot Disease",
    "confidence": 94,
    "description": "Description of the condition...",
    "treatments": [
        {
            "title": "Remove Infected Leaves",
            "description": "Prune and dispose of infected leaves...",
            "icon": "✂️"
        }
    ],
    "preventionTips": [
        "Water at the base of plants...",
        "Sterilize pruning tools..."
    ]
}
```

## 🎨 Customization

### Colors
Edit CSS variables in `style.css`:

```css
:root {
    --forest-dark: #0d3328;
    --forest-deep: #144d3d;
    --leaf-green: #2d8a6b;
    --leaf-light: #4db88a;
    /* ... more colors ... */
}
```

### Diseases Database
Edit the `diseasesDB` array in `script.js`:

```javascript
const diseasesDB = [
    {
        id: 1,
        name: 'Your Disease Name',
        scientificName: 'Scientific Name',
        category: 'fungal', // fungal | bacterial | viral | pest
        affectedPlants: ['Plant 1', 'Plant 2'],
        symptoms: ['Symptom 1', 'Symptom 2'],
        severity: 'medium', // low | medium | high
        color: '#9b59b6',
    },
    // ... more diseases ...
];
```

### FAQ Questions
Edit in `index.html` - find the `.faq-list` section.

## 📱 Responsive Breakpoints

- **Desktop**: > 1024px
- **Tablet**: 768px - 1024px
- **Mobile**: < 768px
- **Small Mobile**: < 480px

## 🌐 Deployment Options

### Option 1: Static Hosting
Upload files to:
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting
- Any web server

### Option 2: With Backend
If you need server-side processing:
- Node.js + Express
- Python + Flask/Django
- PHP
- Any backend framework

Just serve the static files and add your API endpoints.

## 📄 License

Free to use and modify for your projects.

## 💡 Tips

1. **Use Live Server** VS Code extension for auto-reload during development
2. **Browser DevTools** - Press F12 to inspect elements and test responsive design
3. **CSS Variables** - All colors are in `:root` for easy theming
4. **Console** - Check browser console for errors and debugging

---

**Happy Coding! 🌿**
