const { PDFDocument } = PDFLib;

// --- Global variables ---

// --- DOM Elements ---

// Mode Switcher
const modeSplitBtn = document.getElementById('mode-split-btn');
const modeMergeBtn = document.getElementById('mode-merge-btn');
const modeSignBtn = document.getElementById('mode-sign-btn');
const splitView = document.getElementById('split-view');
const mergeView = document.getElementById('merge-view');
const signView = document.getElementById('sign-view');

// Split View
const uploadInput = document.getElementById('pdf-upload');
const processingSection = document.getElementById('processing-section');
const fileNameSpan = document.getElementById('file-name');
const pageCountSpan = document.getElementById('page-count');
const splitBtn = document.getElementById('split-btn');
const resultSection = document.getElementById('result-section');
const downloadLinksContainer = document.getElementById('download-links');
const loader = document.getElementById('loader');
const previewInfo = document.getElementById('preview-info');
const bulkDownloadSection = document.getElementById('bulk-download-section');
const downloadAllBtn = document.getElementById('download-all-btn');

// Merge View
const uploadInputMerge = document.getElementById('pdf-upload-merge');
const processingSectionMerge = document.getElementById('processing-section-merge');
const fileListMergeContainer = document.getElementById('file-list-merge');
const mergeBtn = document.getElementById('merge-btn');
const resultSectionMerge = document.getElementById('result-section-merge');
const loaderMerge = document.getElementById('loader-merge');
const downloadLinkMergeContainer = document.getElementById('download-link-merge');

// Upload areas for drag & drop
const uploadArea = document.getElementById('upload-area');
const uploadAreaMerge = document.getElementById('upload-area-merge');
const uploadAreaSign = document.getElementById('upload-area-sign');

// Sign elements
const uploadInputSign = document.getElementById('pdf-upload-sign');
const processingSectionSign = document.getElementById('processing-section-sign');
const fileNameSign = document.getElementById('file-name-sign');
const pageCountSign = document.getElementById('page-count-sign');
const pdfPreviewSection = document.getElementById('pdf-preview-section');
const pdfPreviewCanvas = document.getElementById('pdf-preview-canvas');
const signatureSection = document.getElementById('signature-section');
const clearSignatureBtn = document.getElementById('clear-signature');
const undoSignatureBtn = document.getElementById('undo-signature');
const signBtn = document.getElementById('sign-btn');
const resultSectionSign = document.getElementById('result-section-sign');
const loaderSign = document.getElementById('loader-sign');
const downloadLinkSignContainer = document.getElementById('download-link-sign');



// --- State ---
let pdfBytes = null;
let mergeDocs = []; // Holds { name, pdfDoc, element }
let selectedPages = new Set(); // Track selected pages for splitting
let splitPdfPages = []; // Store split PDF pages for bulk download
let signatureCanvas = null;
let signatureContext = null;
let isDrawing = false;
let signatureHistory = [];
let currentSignatureStep = -1;
let pdfDoc = null;
let selectedSignaturePosition = null;

// Dark mode functionality
const darkModeToggle = document.getElementById('dark-mode-toggle');
const darkModeIcon = document.querySelector('.dark-mode-icon');

// Toast notification functionality
const toastContainer = document.getElementById('toast-container');

function showToast(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = getToastIcon(type);
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '×';
    closeBtn.setAttribute('aria-label', 'Benachrichtigung schließen');
    closeBtn.onclick = () => hideToast(toast);
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;
    toast.appendChild(closeBtn);
    
    toastContainer.appendChild(toast);
    
    // Auto-hide after duration
    if (duration > 0) {
        setTimeout(() => hideToast(toast), duration);
    }
    
    return toast;
}

function getToastIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || icons.info;
}

function hideToast(toast) {
    if (toast && toast.parentNode) {
        toast.style.animation = 'slideOutUp 0.3s ease forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// Convenience functions
function showSuccess(message, duration = 3000) {
    return showToast(message, 'success', duration);
}

function showError(message, duration = 5000) {
    return showToast(message, 'error', duration);
}

function showWarning(message, duration = 4000) {
    return showToast(message, 'warning', duration);
}

function showInfo(message, duration = 3000) {
    return showToast(message, 'info', duration);
}

// Progress indicator functionality
function showProgress(containerId, text = 'Verarbeitung läuft...') {
    const container = document.getElementById(containerId);
    const fill = document.getElementById(containerId.replace('container', 'fill'));
    const textEl = document.getElementById(containerId.replace('container', 'text'));
    
    if (container) container.classList.remove('hidden');
    if (textEl) textEl.textContent = text;
    if (fill) fill.style.width = '0%';
}

function updateProgress(containerId, percentage, text) {
    const fill = document.getElementById(containerId.replace('container', 'fill'));
    const textEl = document.getElementById(containerId.replace('container', 'text'));
    
    if (fill) fill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    if (textEl && text) textEl.textContent = text;
}

function hideProgress(containerId) {
    const container = document.getElementById(containerId);
    if (container) container.classList.add('hidden');
}

// Drag & Drop functionality
function setupDragAndDrop() {
    const uploadAreaSplit = document.getElementById('upload-area-split');
    const uploadAreaMerge = document.getElementById('upload-area-merge');
    
    // Split upload area
    if (uploadAreaSplit) {
        uploadAreaSplit.addEventListener('click', () => {
            uploadInput.click();
        });
        
        uploadAreaSplit.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadAreaSplit.classList.add('dragover');
        });
        
        uploadAreaSplit.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadAreaSplit.classList.remove('dragover');
        });
        
        uploadAreaSplit.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadAreaSplit.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 1) {
                showWarning('Bitte wählen Sie nur eine PDF-Datei zum Aufteilen.');
                return;
            }
            handleDroppedFiles(files, 'split');
        });
    }
    
    // Merge upload area
    if (uploadAreaMerge) {
        uploadAreaMerge.addEventListener('click', () => {
            uploadInputMerge.click();
        });
        
        uploadAreaMerge.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadAreaMerge.classList.add('dragover');
        });
        
        uploadAreaMerge.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadAreaMerge.classList.remove('dragover');
        });
        
        uploadAreaMerge.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadAreaMerge.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            handleDroppedFiles(files, 'merge');
        });
    }
    
    // Sign upload area
    if (uploadAreaSign) {
        uploadAreaSign.addEventListener('click', () => {
            uploadInputSign.click();
        });
        
        uploadAreaSign.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadAreaSign.classList.add('dragover');
        });
        
        uploadAreaSign.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadAreaSign.classList.remove('dragover');
        });
        
        uploadAreaSign.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadAreaSign.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 1) {
                showWarning('Bitte wählen Sie nur eine PDF-Datei zum Signieren.');
                return;
            }
            handleDroppedFiles(files, 'sign');
        });
    }
}

function handleDroppedFiles(files, mode) {
    if (mode === 'split') {
        if (files.length === 0) return;
        const file = files[0];
        
        // Create a fake event object
        const fakeEvent = {
            target: { files: [file] }
        };
        handleFileSelectSplit(fakeEvent);
    } else if (mode === 'merge') {
        if (files.length === 0) return;
        
        // Create a fake event object
        const fakeEvent = {
            target: { files: files }
        };
        handleFileSelectMerge(fakeEvent);
    } else if (mode === 'sign') {
        if (files.length === 0) return;
        const file = files[0];
        
        // Create a fake event object
        const fakeEvent = {
            target: { files: [file] }
        };
        handleFileSelectSign(fakeEvent);
    }
}

// Page selection functionality
function setupPageSelection() {
    const selectAllBtn = document.getElementById('select-all-pages');
    const selectNoneBtn = document.getElementById('select-none-pages');
    const selectOddBtn = document.getElementById('select-odd-pages');
    const selectEvenBtn = document.getElementById('select-even-pages');
    
    if (selectAllBtn) selectAllBtn.addEventListener('click', selectAllPages);
    if (selectNoneBtn) selectNoneBtn.addEventListener('click', selectNoPages);
    if (selectOddBtn) selectOddBtn.addEventListener('click', selectOddPages);
    if (selectEvenBtn) selectEvenBtn.addEventListener('click', selectEvenPages);
}

function selectAllPages() {
    const checkboxes = document.querySelectorAll('#page-selection-list input[type="checkbox"]');
    selectedPages.clear();
    checkboxes.forEach((checkbox, index) => {
        checkbox.checked = true;
        selectedPages.add(index);
    });
    updateSplitButtonState();
}

function selectNoPages() {
    const checkboxes = document.querySelectorAll('#page-selection-list input[type="checkbox"]');
    selectedPages.clear();
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    updateSplitButtonState();
}

function selectOddPages() {
    const checkboxes = document.querySelectorAll('#page-selection-list input[type="checkbox"]');
    selectedPages.clear();
    checkboxes.forEach((checkbox, index) => {
        const isOdd = (index + 1) % 2 === 1;
        checkbox.checked = isOdd;
        if (isOdd) selectedPages.add(index);
    });
    updateSplitButtonState();
}

function selectEvenPages() {
    const checkboxes = document.querySelectorAll('#page-selection-list input[type="checkbox"]');
    selectedPages.clear();
    checkboxes.forEach((checkbox, index) => {
        const isEven = (index + 1) % 2 === 0;
        checkbox.checked = isEven;
        if (isEven) selectedPages.add(index);
    });
    updateSplitButtonState();
}

function updateSplitButtonState() {
    const hasSelection = selectedPages.size > 0;
    splitBtn.disabled = !hasSelection;
    
    const count = selectedPages.size;
    const text = count > 0 ? `${count} Seite${count > 1 ? 'n' : ''} auswählen` : 'Seiten auswählen';
    splitBtn.textContent = text;
}


async function setupPageSelectionList(pageCount) {
    const pageSelection = document.getElementById('page-selection');
    const pageSelectionList = document.getElementById('page-selection-list');
    
    if (!pageSelection || !pageSelectionList) return;
    
    // Clear existing content
    pageSelectionList.innerHTML = '';
    selectedPages.clear();
    
    // Add all pages to selection by default
    for (let i = 0; i < pageCount; i++) {
        selectedPages.add(i);
    }
    
    // Check if pdfjsLib is available
    if (typeof pdfjsLib === 'undefined' && typeof window.pdfjsLib === 'undefined') {
        console.warn('PDF.js not available for page previews');
        // Create page items without previews
        for (let i = 0; i < pageCount; i++) {
            createPageItem(i, null);
        }
    } else {
        // Create page items with previews
        const pdfLib = pdfjsLib || window.pdfjsLib;
        try {
            const pdfJsDoc = await pdfLib.getDocument({ data: pdfBytes.slice().buffer }).promise;
            
            for (let i = 0; i < pageCount; i++) {
                await createPageItemWithPreview(i, pdfJsDoc);
            }
        } catch (error) {
            console.error('Error loading PDF for previews:', error);
            // Fallback: create page items without previews
            for (let i = 0; i < pageCount; i++) {
                createPageItem(i, null);
            }
        }
    }
    
    // Show page selection
    pageSelection.classList.remove('hidden');
    updateSplitButtonState();
}

function createPageItem(pageIndex, previewCanvas = null) {
    const pageSelectionList = document.getElementById('page-selection-list');
    
    const pageItem = document.createElement('div');
    pageItem.className = 'page-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `page-${pageIndex}`;
    checkbox.checked = true;
    checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            selectedPages.add(pageIndex);
        } else {
            selectedPages.delete(pageIndex);
        }
        updateSplitButtonState();
    });
    
    const label = document.createElement('label');
    label.htmlFor = `page-${pageIndex}`;
    label.textContent = `Seite ${pageIndex + 1}`;
    
    pageItem.appendChild(checkbox);
    pageItem.appendChild(label);
    
    if (previewCanvas) {
        pageItem.appendChild(previewCanvas);
    }
    
    pageSelectionList.appendChild(pageItem);
}

async function createPageItemWithPreview(pageIndex, pdfJsDoc) {
    const pageSelectionList = document.getElementById('page-selection-list');
    
    const pageItem = document.createElement('div');
    pageItem.className = 'page-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `page-${pageIndex}`;
    checkbox.checked = true;
    checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            selectedPages.add(pageIndex);
        } else {
            selectedPages.delete(pageIndex);
        }
        updateSplitButtonState();
    });
    
    const label = document.createElement('label');
    label.htmlFor = `page-${pageIndex}`;
    label.textContent = `Seite ${pageIndex + 1}`;
    
    // Create preview canvas
    const previewCanvas = document.createElement('canvas');
    previewCanvas.style.width = '60px';
    previewCanvas.style.height = '85px';
    previewCanvas.style.border = '1px solid #ddd';
    previewCanvas.style.marginLeft = '10px';
    previewCanvas.style.float = 'right';
    
    pageItem.appendChild(checkbox);
    pageItem.appendChild(label);
    pageItem.appendChild(previewCanvas);
    
    // Render preview
    try {
        const page = await pdfJsDoc.getPage(pageIndex + 1);
        const viewport = page.getViewport({ scale: 0.2 }); // Very small scale for thumbnail
        const context = previewCanvas.getContext('2d');
        previewCanvas.height = viewport.height;
        previewCanvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        await page.render(renderContext).promise;
    } catch (renderError) {
        console.error(`Error rendering preview for page ${pageIndex + 1}:`, renderError);
        // Draw placeholder
        const ctx = previewCanvas.getContext('2d');
        previewCanvas.width = 60;
        previewCanvas.height = 85;
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
        ctx.fillStyle = '#666';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Vorschau', previewCanvas.width / 2, previewCanvas.height / 2 - 5);
        ctx.fillText('fehlgeschlagen', previewCanvas.width / 2, previewCanvas.height / 2 + 10);
    }
    
    pageSelectionList.appendChild(pageItem);
}

// Enhanced Accessibility functionality
function setupAccessibility() {
    // Keyboard navigation for upload areas
    const uploadAreaSplit = document.getElementById('upload-area-split');
    const uploadAreaMerge = document.getElementById('upload-area-merge');
    const uploadAreaSign = document.getElementById('upload-area-sign');
    
    // Enhanced keyboard navigation
    [uploadAreaSplit, uploadAreaMerge, uploadAreaSign].forEach(area => {
        if (area) {
            area.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const inputId = area.id.replace('upload-area-', 'pdf-upload') + 
                                   (area.id.includes('merge') ? '-merge' : 
                                    area.id.includes('sign') ? '-sign' : '');
                    const input = document.getElementById(inputId);
                    if (input) input.click();
                }
            });
        }
    });
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Enhanced screen reader support
    setupScreenReaderAnnouncements();
    
    // Focus management
    setupFocusManagement();
    
    // High contrast mode detection
    setupHighContrastSupport();
}

// Keyboard shortcuts for power users
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Only activate shortcuts when not in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        const isCtrl = e.ctrlKey || e.metaKey;
        
        if (isCtrl) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    switchMode('split');
                    announceToScreenReader('PDF Splitten Modus aktiviert');
                    break;
                case '2':
                    e.preventDefault();
                    switchMode('merge');
                    announceToScreenReader('PDF Zusammenfügen Modus aktiviert');
                    break;
                case '3':
                    e.preventDefault();
                    switchMode('sign');
                    announceToScreenReader('PDF Signieren Modus aktiviert');
                    break;
                case 'd':
                    e.preventDefault();
                    toggleDarkMode();
                    announceToScreenReader(`Dark Mode ${document.documentElement.getAttribute('data-theme') === 'dark' ? 'aktiviert' : 'deaktiviert'}`);
                    break;
            }
        }
    });
}

// Enhanced screen reader announcements
function announceToScreenReader(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// Focus management for better navigation
function setupFocusManagement() {
    // Focus trap for modals (if any)
    let focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    
    // Store last focused element
    let lastFocusedElement = null;
    
    document.addEventListener('focusin', (e) => {
        lastFocusedElement = e.target;
    });
    
    // Return focus after operations
    window.returnFocus = function() {
        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            lastFocusedElement.focus();
        }
    };
}

// High contrast mode support
function setupHighContrastSupport() {
    if (window.matchMedia('(prefers-contrast: high)').matches) {
        document.documentElement.setAttribute('data-high-contrast', 'true');
    }
    
    // Listen for changes
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
        if (e.matches) {
            document.documentElement.setAttribute('data-high-contrast', 'true');
        } else {
            document.documentElement.removeAttribute('data-high-contrast');
        }
    });
}

function setupScreenReaderAnnouncements() {
    // Update status for screen readers
    const splitStatus = document.getElementById('split-status');
    if (splitStatus) {
        // Monitor button state changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
                    const button = mutation.target;
                    if (button.disabled) {
                        splitStatus.textContent = 'Button ist deaktiviert. Bitte wählen Sie Seiten aus.';
                    } else {
                        splitStatus.textContent = 'Button ist aktiviert. Bereit zum Aufteilen.';
                    }
                }
            });
        });
        
        observer.observe(splitBtn, { attributes: true });
    }
}

// PWA functionality
function setupPWA() {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered successfully:', registration.scope);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New version available
                                showUpdateAvailable();
                            }
                        });
                    });
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error);
                });
        });
    }
    
    // Handle install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallPrompt();
    });
    
    // Handle app installed
    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        showSuccess('App erfolgreich installiert!');
        hideInstallPrompt();
    });
    
    // Handle online/offline status
    window.addEventListener('online', () => {
        showInfo('Verbindung wiederhergestellt');
    });
    
    window.addEventListener('offline', () => {
        showWarning('Offline-Modus aktiviert');
    });
}

function showUpdateAvailable() {
    const updateToast = document.createElement('div');
    updateToast.className = 'toast info';
    updateToast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">🔄</span>
            <span class="toast-message">Neue Version verfügbar! Seite wird aktualisiert...</span>
        </div>
    `;
    
    document.getElementById('toast-container').appendChild(updateToast);
    
    // Auto-reload after 3 seconds
    setTimeout(() => {
        window.location.reload();
    }, 3000);
}

function showInstallPrompt() {
    const installToast = document.createElement('div');
    installToast.className = 'toast info';
    installToast.id = 'install-toast';
    installToast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">📱</span>
            <span class="toast-message">App installieren für bessere Erfahrung</span>
            <button id="install-btn" class="btn-secondary" style="margin-left: 10px;">Installieren</button>
        </div>
    `;
    
    document.getElementById('toast-container').appendChild(installToast);
    
    // Add install button functionality
    document.getElementById('install-btn').addEventListener('click', () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredPrompt = null;
            });
        }
    });
}

function hideInstallPrompt() {
    const installToast = document.getElementById('install-toast');
    if (installToast) {
        installToast.remove();
    }
}

// Install button functionality
function setupInstallButton() {
    const installBtn = document.getElementById('install-app-btn');
    let deferredPrompt = null;
    
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        // App is already installed, hide install button
        installBtn.classList.add('hidden');
        return;
    }
    
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show install button
        installBtn.classList.remove('hidden');
        
        // Add click handler
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                deferredPrompt = null;
                
                if (outcome === 'accepted') {
                    showSuccess('App wird installiert...');
                }
            }
        });
    });
    
    // Hide install button after successful installation
    window.addEventListener('appinstalled', () => {
        installBtn.classList.add('hidden');
        showSuccess('App erfolgreich installiert!');
    });
    
    // PWA install instructions are disabled - app works perfectly without installation
}

// PWA install instruction functions removed - app works perfectly without installation

// Initialize dark mode from localStorage
function initDarkMode() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeIcon.textContent = '☀️';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        darkModeIcon.textContent = '🌙';
    }
}

// Toggle dark mode
function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const isDark = currentTheme === 'dark';
    
    if (isDark) {
        document.documentElement.setAttribute('data-theme', 'light');
        darkModeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeIcon.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }
}

// --- Event Listeners ---

// Dark mode toggle
darkModeToggle.addEventListener('click', toggleDarkMode);

// Mode Switching
modeSplitBtn.addEventListener('click', () => switchMode('split'));
modeMergeBtn.addEventListener('click', () => switchMode('merge'));
modeSignBtn.addEventListener('click', () => switchMode('sign'));

// Splitter
uploadInput.addEventListener('change', handleFileSelectSplit);
splitBtn.addEventListener('click', handleSplitPdf);
downloadAllBtn.addEventListener('click', handleDownloadAllPages);

// Merger
uploadInputMerge.addEventListener('change', handleFileSelectMerge);
mergeBtn.addEventListener('click', handleMergePdf);

// Signer
uploadInputSign.addEventListener('change', handleFileSelectSign);
signBtn.addEventListener('click', handleSignPdf);
clearSignatureBtn.addEventListener('click', clearSignature);
undoSignatureBtn.addEventListener('click', undoSignature);


// Drag & Drop functionality
setupDragAndDrop();

// Page selection functionality
setupPageSelection();

// Accessibility functionality
setupAccessibility();

// PWA functionality
setupPWA();

// Install button functionality
setupInstallButton();

// --- Functions ---

function switchMode(mode) {
    // Hide all views
    splitView.classList.add('hidden');
    mergeView.classList.add('hidden');
    signView.classList.add('hidden');
    
    // Remove active class from all mode buttons
    modeSplitBtn.classList.remove('active');
    modeMergeBtn.classList.remove('active');
    modeSignBtn.classList.remove('active');
    
    // Show selected view and activate corresponding button
    if (mode === 'split') {
        splitView.classList.remove('hidden');
        modeSplitBtn.classList.add('active');
        resetMergeUI();
        resetSignUI();
    } else if (mode === 'merge') {
        mergeView.classList.remove('hidden');
        modeMergeBtn.classList.add('active');
        resetSplitUI();
        resetSignUI();
    } else if (mode === 'sign') {
        signView.classList.remove('hidden');
        modeSignBtn.classList.add('active');
        resetSplitUI();
        resetMergeUI();
    }
}

function resetSplitUI() {
    processingSection.classList.add('hidden');
    resultSection.classList.add('hidden');
    previewInfo.classList.add('hidden');
    bulkDownloadSection.classList.add('hidden');
    document.getElementById('page-selection').classList.add('hidden');
    downloadLinksContainer.innerHTML = '';
    splitBtn.disabled = true;
    splitBtn.textContent = 'PDF Splitten';
    pdfBytes = null;
    selectedPages.clear();
    splitPdfPages = [];
    uploadInput.value = '';
    // Make sure the upload section is visible again after a reset
    document.querySelector('#split-view .upload-section').classList.remove('hidden');
}

function resetMergeUI() {
    processingSectionMerge.classList.add('hidden');
    resultSectionMerge.classList.add('hidden');
    downloadLinkMergeContainer.innerHTML = '';
    fileListMergeContainer.innerHTML = '';
    mergeBtn.disabled = true;
    mergeDocs = [];
    uploadInputMerge.value = '';
}

function resetSignUI() {
    processingSectionSign.classList.add('hidden');
    resultSectionSign.classList.add('hidden');
    downloadLinkSignContainer.innerHTML = '';
    signBtn.disabled = true;
    pdfBytes = null;
    uploadInputSign.value = '';
}


async function handleFileSelectSign(event) {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
        resetSignUI();
        if(file) showError('Bitte wählen Sie eine gültige PDF-Datei aus.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            pdfBytes = new Uint8Array(e.target.result);
            pdfDoc = await PDFDocument.load(pdfBytes);
            const pageCount = pdfDoc.getPageCount();
            
            fileNameSign.textContent = file.name;
            pageCountSign.textContent = pageCount;
            
            processingSectionSign.classList.remove('hidden');
            pdfPreviewSection.classList.remove('hidden');
            setupSignature();
            await renderPdfPreview();
            showSuccess(`PDF geladen: ${pageCount} Seite${pageCount > 1 ? 'n' : ''}`);
        } catch (error) {
            console.error('Fehler beim Laden der PDF:', error);
            showError('Die PDF-Datei konnte nicht geladen oder verarbeitet werden.');
            resetSignUI();
        }
    };
    reader.readAsArrayBuffer(file);
}

async function handleFileSelectSplit(event) {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
        resetSplitUI();
        if(file) showError('Bitte wählen Sie eine gültige PDF-Datei aus.');
        return;
    }

    resetSplitUI();
    
    fileNameSpan.textContent = file.name;
    processingSection.classList.remove('hidden');
    document.querySelector('#split-view .upload-section').classList.add('hidden');
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            pdfBytes = new Uint8Array(e.target.result);
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const pageCount = pdfDoc.getPageCount();
            pageCountSpan.textContent = pageCount;
            
            // Setup page selection
            setupPageSelectionList(pageCount);
            splitBtn.disabled = false;
            showSuccess(`PDF geladen: ${pageCount} Seite${pageCount > 1 ? 'n' : ''}`);
        } catch (error) {
            console.error('Fehler beim Laden der PDF:', error);
            showError('Die PDF-Datei konnte nicht geladen oder verarbeitet werden.');
            resetSplitUI();
        }
    };
    reader.readAsArrayBuffer(file);
}


async function handleSplitPdf() {
    if (!pdfBytes) {
        showWarning('Bitte zuerst eine PDF-Datei hochladen.');
        return;
    }

    if (selectedPages.size === 0) {
        showWarning('Bitte wählen Sie mindestens eine Seite aus.');
        return;
    }

    // Check if pdfjsLib is available with multiple fallbacks
    if (typeof pdfjsLib === 'undefined' && typeof window.pdfjsLib === 'undefined') {
        showError('Fehler: Die PDF-Vorschau-Bibliothek (pdf.js) konnte nicht geladen werden. Bitte laden Sie die Seite neu.');
        return;
    }

    const pdfLib = pdfjsLib || window.pdfjsLib;
    
    splitBtn.disabled = true;
    loader.classList.remove('hidden');
    resultSection.classList.remove('hidden');
    previewInfo.classList.remove('hidden');
    downloadLinksContainer.innerHTML = '';

    // Show progress indicator
    showProgress('progress-container', 'PDF wird aufgeteilt...');

    try {
        const originalPdfDoc = await PDFDocument.load(pdfBytes);
        const selectedPagesArray = Array.from(selectedPages).sort((a, b) => a - b);
        const totalPages = selectedPagesArray.length;

        // pdf.js needs a clone of the ArrayBuffer, as it can be transferred to a worker
        const pdfJsDoc = await pdfLib.getDocument({ data: pdfBytes.slice().buffer }).promise;

        for (let i = 0; i < selectedPagesArray.length; i++) {
            const pageIndex = selectedPagesArray[i];
            // Update progress
            const progress = ((i + 1) / totalPages) * 100;
            updateProgress('progress-container', progress, `Seite ${i + 1} von ${totalPages} verarbeiten...`);
            // Create single-page PDF with pdf-lib
            const newPdfDoc = await PDFDocument.create();
            const [copiedPage] = await newPdfDoc.copyPages(originalPdfDoc, [pageIndex]);
            newPdfDoc.addPage(copiedPage);

            const newPdfBytes = await newPdfDoc.save();
            const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            // Store PDF page for bulk download
            splitPdfPages.push({
                name: `Seite-${pageIndex + 1}.pdf`,
                bytes: newPdfBytes,
                url: url
            });

            // Create preview item container
            const previewItem = document.createElement('div');
            previewItem.classList.add('page-preview-item');
            
            // Create canvas for preview
            const canvas = document.createElement('canvas');
            canvas.style.border = '1px solid #ddd';
            canvas.style.marginBottom = '10px';
            previewItem.appendChild(canvas);

            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = `Seite-${pageIndex + 1}.pdf`;
            a.textContent = `Seite ${pageIndex + 1}`;
            a.classList.add('download-link');
            previewItem.appendChild(a);

            downloadLinksContainer.appendChild(previewItem);
            
            try {
                // Debug: Log the page index
                console.log(`Rendering preview for pageIndex: ${pageIndex}, PDF.js page: ${pageIndex + 1}`);
                
                // Render page preview with pdf.js from the original PDF
                const page = await pdfJsDoc.getPage(pageIndex + 1);
                const viewport = page.getViewport({ scale: 0.5 }); // Use a smaller scale for thumbnail
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                await page.render(renderContext).promise;
                console.log(`Successfully rendered preview for page ${pageIndex + 1}`);
            } catch (renderError) {
                console.error(`Fehler beim Rendern der Vorschau für Seite ${pageIndex + 1}:`, renderError);
                // Draw a simple placeholder if rendering fails
                const ctx = canvas.getContext('2d');
                canvas.width = 100;
                canvas.height = 141;
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#666';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Vorschau', canvas.width / 2, canvas.height / 2 - 5);
                ctx.fillText('fehlgeschlagen', canvas.width / 2, canvas.height / 2 + 15);
            }
            
            // Small delay to prevent UI blocking
            if (i % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        
        // Show bulk download button
        bulkDownloadSection.classList.remove('hidden');
        
        // Hide progress and show success
        hideProgress('progress-container');
        showSuccess(`${totalPages} Seite${totalPages > 1 ? 'n' : ''} erfolgreich aufgeteilt!`);
        
    } catch (error) {
        console.error('Fehler beim Splitten der PDF:', error);
        showError(`Ein Fehler ist beim Aufteilen der PDF aufgetreten: ${error.message}`);
        hideProgress('progress-container');
    } finally {
        loader.classList.add('hidden');
        splitBtn.disabled = false;
    }
}

async function handleDownloadAllPages() {
    if (!splitPdfPages || splitPdfPages.length === 0) {
        showWarning('Keine Seiten zum Herunterladen verfügbar.');
        return;
    }

    try {
        downloadAllBtn.disabled = true;
        downloadAllBtn.innerHTML = '<span class="download-icon">⏳</span><span class="download-text">ZIP wird erstellt...</span>';

        // Create ZIP file
        const zip = new JSZip();
        
        // Add all PDF pages to ZIP
        splitPdfPages.forEach((page, index) => {
            zip.file(page.name, page.bytes);
        });

        // Generate ZIP file
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        // Create download link
        const zipUrl = URL.createObjectURL(zipBlob);
        const zipFileName = `Alle-Seiten-${new Date().toISOString().slice(0, 10)}.zip`;
        
        const downloadLink = document.createElement('a');
        downloadLink.href = zipUrl;
        downloadLink.download = zipFileName;
        downloadLink.click();
        
        // Clean up
        URL.revokeObjectURL(zipUrl);
        
        showSuccess(`${splitPdfPages.length} Seiten als ZIP heruntergeladen!`);
        
    } catch (error) {
        console.error('Fehler beim Erstellen der ZIP-Datei:', error);
        showError('Fehler beim Erstellen der ZIP-Datei. Bitte versuchen Sie es erneut.');
    } finally {
        downloadAllBtn.disabled = false;
        downloadAllBtn.innerHTML = '<span class="download-icon">📦</span><span class="download-text">Alle Seiten als ZIP herunterladen</span>';
    }
}

async function handleFileSelectMerge(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    // Validate all files
    const invalidFiles = files.filter(file => file.type !== 'application/pdf');
    if (invalidFiles.length > 0) {
        showError('Bitte wählen Sie nur gültige PDF-Dateien aus.');
        uploadInputMerge.value = '';
        return;
    }
    
    // Process each file
    for (const file of files) {
        await processMergeFile(file);
    }
    
    uploadInputMerge.value = ''; // Reset input
}

async function processMergeFile(file) {
    // Check if pdfjsLib is available
    if (typeof pdfjsLib === 'undefined' && typeof window.pdfjsLib === 'undefined') {
        showError('Fehler: Die PDF-Vorschau-Bibliothek (pdf.js) konnte nicht geladen werden. Bitte laden Sie die Seite neu.');
        return;
    }

    const pdfLib = pdfjsLib || window.pdfjsLib;

    // Show processing section on first file
    if (mergeDocs.length === 0) {
        processingSectionMerge.classList.remove('hidden');
    }

    try {
        const fileBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBytes);
        const pageCount = pdfDoc.getPageCount();

        const fileItem = document.createElement('div');
        fileItem.classList.add('file-item');
        const docId = `doc-${Date.now()}-${Math.random()}`;
        fileItem.dataset.id = docId;

        // Create preview canvas
        const previewDiv = document.createElement('div');
        previewDiv.classList.add('file-item-preview');
        const canvas = document.createElement('canvas');
        previewDiv.appendChild(canvas);

        fileItem.innerHTML = `
            <div class="file-item-info">
                <span class="file-item-name">${file.name}</span>
                <span class="file-item-pages">(${pageCount} Seite${pageCount > 1 ? 'n' : ''})</span>
            </div>
            <button class="file-item-remove" title="Datei entfernen">&times;</button>
        `;

        // Insert preview before the info div
        fileItem.insertBefore(previewDiv, fileItem.firstChild);

        fileListMergeContainer.appendChild(fileItem);
        
        const docData = { id: docId, name: file.name, pdfDoc, element: fileItem };
        mergeDocs.push(docData);

        // Generate preview
        try {
            const pdfJsDoc = await pdfLib.getDocument({ data: fileBytes.slice() }).promise;
            const page = await pdfJsDoc.getPage(1); // First page
            const viewport = page.getViewport({ scale: 0.3 }); // Small scale for thumbnail
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            await page.render(renderContext).promise;
        } catch (renderError) {
            console.error(`Fehler beim Rendern der Vorschau für ${file.name}:`, renderError);
            // Draw a simple placeholder if rendering fails
            const ctx = canvas.getContext('2d');
            canvas.width = 60;
            canvas.height = 85;
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#666';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Vorschau', canvas.width / 2, canvas.height / 2 - 5);
            ctx.fillText('fehlgeschlagen', canvas.width / 2, canvas.height / 2 + 10);
        }

        fileItem.querySelector('.file-item-remove').addEventListener('click', (e) => {
            e.stopPropagation();
            const itemToRemove = e.target.closest('.file-item');
            const idToRemove = itemToRemove.dataset.id;
            
            mergeDocs = mergeDocs.filter(doc => doc.id !== idToRemove);
            itemToRemove.remove();
            
            updateMergeButtonState();
            if (mergeDocs.length === 0) {
                 processingSectionMerge.classList.add('hidden');
            }
        });
        
        if (mergeDocs.length === 1) { // Initialize Sortable on first item
             new Sortable(fileListMergeContainer, {
                animation: 150,
                onEnd: () => {
                    const newOrder = Array.from(fileListMergeContainer.children).map(item => item.dataset.id);
                    mergeDocs.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
                }
            });
        }
        
        updateMergeButtonState();
        showSuccess(`PDF erfolgreich hinzugefügt: ${file.name}`);

    } catch (error) {
        console.error("Fehler beim Laden der PDF:", error);
        showError("Die PDF-Datei konnte nicht verarbeitet werden.");
    }
}

function updateMergeButtonState() {
    mergeBtn.disabled = mergeDocs.length < 1;
}

async function handleMergePdf() {
    if (mergeDocs.length === 0) {
        showWarning("Bitte laden Sie zuerst PDF-Dateien hoch.");
        return;
    }

    mergeBtn.disabled = true;
    loaderMerge.classList.remove('hidden');
    resultSectionMerge.classList.remove('hidden');
    downloadLinkMergeContainer.innerHTML = '';

    // Show progress indicator
    showProgress('progress-container-merge', 'PDFs werden zusammengefügt...');

    try {
        const mergedPdf = await PDFDocument.create();
        const totalDocs = mergeDocs.length;

        for (let i = 0; i < mergeDocs.length; i++) {
            const docData = mergeDocs[i];
            
            // Update progress
            const progress = ((i + 1) / totalDocs) * 100;
            updateProgress('progress-container-merge', progress, `${docData.name} hinzufügen...`);
            const sourceDoc = docData.pdfDoc;
            const indices = Array.from({ length: sourceDoc.getPageCount() }, (_, i) => i);
            const copiedPages = await mergedPdf.copyPages(sourceDoc, indices);
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'zusammengefügt.pdf';
        a.textContent = 'Zusammengefügte PDF herunterladen';
        a.classList.add('download-link');
        downloadLinkMergeContainer.appendChild(a);
        
        // Hide progress and show success
        hideProgress('progress-container-merge');
        showSuccess(`${totalDocs} PDF${totalDocs > 1 ? 's' : ''} erfolgreich zusammengefügt!`);

    } catch (error) {
        console.error('Fehler beim Zusammenfügen der PDFs:', error);
        showError('Ein Fehler ist beim Zusammenfügen der PDFs aufgetreten.');
        hideProgress('progress-container-merge');
    } finally {
        loaderMerge.classList.add('hidden');
    }
}

// Signature functionality
function setupSignature() {
    signatureCanvas = document.getElementById('signature-canvas');
    if (signatureCanvas) {
        signatureContext = signatureCanvas.getContext('2d');
        setupSignatureCanvas();
        console.log('Signature canvas setup complete');
    } else {
        console.error('Signature canvas not found');
    }
}

function setupSignatureCanvas() {
    if (!signatureCanvas || !signatureContext) {
        console.error('Canvas or context not available');
        return;
    }
    
    // Set canvas size - use fixed size from HTML
    signatureCanvas.width = 600;
    signatureCanvas.height = 200;
    
    // Set drawing properties
    signatureContext.strokeStyle = '#000000';
    signatureContext.lineWidth = 2;
    signatureContext.lineCap = 'round';
    signatureContext.lineJoin = 'round';
    signatureContext.fillStyle = 'white';
    signatureContext.fillRect(0, 0, 600, 200);
    
    // Remove existing event listeners first
    signatureCanvas.removeEventListener('mousedown', startDrawing);
    signatureCanvas.removeEventListener('mousemove', draw);
    signatureCanvas.removeEventListener('mouseup', stopDrawing);
    signatureCanvas.removeEventListener('mouseout', stopDrawing);
    signatureCanvas.removeEventListener('touchstart', handleTouch);
    signatureCanvas.removeEventListener('touchmove', handleTouch);
    signatureCanvas.removeEventListener('touchend', stopDrawing);
    
    // Mouse events
    signatureCanvas.addEventListener('mousedown', startDrawing);
    signatureCanvas.addEventListener('mousemove', draw);
    signatureCanvas.addEventListener('mouseup', stopDrawing);
    signatureCanvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events for mobile
    signatureCanvas.addEventListener('touchstart', handleTouch);
    signatureCanvas.addEventListener('touchmove', handleTouch);
    signatureCanvas.addEventListener('touchend', stopDrawing);
    
    console.log('Signature canvas events attached');
}

function startDrawing(e) {
    isDrawing = true;
    const rect = signatureCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (signatureCanvas.width / rect.width);
    const y = (e.clientY - rect.top) * (signatureCanvas.height / rect.height);
    
    signatureContext.beginPath();
    signatureContext.moveTo(x, y);
    
    // Save state for undo
    saveSignatureState();
    
    // Enable sign button when user starts drawing
    if (signBtn) {
        signBtn.disabled = false;
    }
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = signatureCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (signatureCanvas.width / rect.width);
    const y = (e.clientY - rect.top) * (signatureCanvas.height / rect.height);
    
    signatureContext.lineTo(x, y);
    signatureContext.stroke();
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        signatureContext.beginPath();
        
        // Check if signature exists and enable button
        checkSignatureAndEnableButton();
    }
}

function checkSignatureAndEnableButton() {
    if (!signatureCanvas || !signatureContext) return;
    
    const imageData = signatureContext.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height);
    const hasSignature = imageData.data.some(pixel => pixel !== 255);
    
    if (hasSignature && signBtn) {
        signBtn.disabled = false;
        console.log('Signature detected, button enabled');
    }
}

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                   e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    signatureCanvas.dispatchEvent(mouseEvent);
}

function saveSignatureState() {
    if (currentSignatureStep < signatureHistory.length - 1) {
        signatureHistory = signatureHistory.slice(0, currentSignatureStep + 1);
    }
    
    const imageData = signatureContext.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height);
    signatureHistory.push(imageData);
    currentSignatureStep++;
    
    // Limit history to 20 steps
    if (signatureHistory.length > 20) {
        signatureHistory.shift();
        currentSignatureStep--;
    }
}

function clearSignature() {
    if (signatureContext) {
        signatureContext.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
        signatureHistory = [];
        currentSignatureStep = -1;
    }
}

function undoSignature() {
    if (currentSignatureStep > 0) {
        currentSignatureStep--;
        const imageData = signatureHistory[currentSignatureStep];
        signatureContext.putImageData(imageData, 0, 0);
    } else if (currentSignatureStep === 0) {
        signatureContext.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
        currentSignatureStep = -1;
    }
}

// PDF Preview functionality
async function renderPdfPreview() {
    if (!pdfBytes || !pdfPreviewCanvas) return;
    
    try {
        // Use PDF.js for rendering
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1); // First page
        
        const { width, height } = page.getViewport({ scale: 1 });
        
        // Calculate scale to fit in preview
        const maxWidth = 600;
        const maxHeight = 800;
        const scaleX = maxWidth / width;
        const scaleY = maxHeight / height;
        const scale = Math.min(scaleX, scaleY, 1);
        
        const viewport = page.getViewport({ scale });
        
        // Set canvas size
        pdfPreviewCanvas.width = viewport.width;
        pdfPreviewCanvas.height = viewport.height;
        
        const context = pdfPreviewCanvas.getContext('2d');
        
        // Render PDF page
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        // Add click event listener
        pdfPreviewCanvas.addEventListener('click', handlePdfPreviewClick);
        
    } catch (error) {
        console.error('Fehler beim Rendern der PDF-Vorschau:', error);
        showError('PDF-Vorschau konnte nicht geladen werden.');
    }
}

function handlePdfPreviewClick(event) {
    const rect = pdfPreviewCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Store the click position
    selectedSignaturePosition = { x, y };
    
    // Show signature section
    signatureSection.classList.remove('hidden');
    signBtn.classList.remove('hidden');
    
    // Setup signature canvas
    setupSignature();
    
    // Hide preview hint
    document.querySelector('.preview-hint').textContent = 'Position ausgewählt! Zeichnen Sie jetzt Ihre Unterschrift.';
    
    showSuccess('Position ausgewählt! Zeichnen Sie jetzt Ihre Unterschrift.');
}

async function handleSignPdf() {
    if (!pdfBytes) {
        showWarning('Bitte zuerst eine PDF-Datei hochladen.');
        return;
    }

    if (!signatureCanvas || !signatureContext) {
        showWarning('Bitte zeichnen Sie zuerst eine Unterschrift.');
        return;
    }

    // Check if signature is empty
    const imageData = signatureContext.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height);
    const hasSignature = imageData.data.some(pixel => pixel !== 255);
    
    if (!hasSignature) {
        showWarning('Bitte zeichnen Sie zuerst eine Unterschrift.');
        return;
    }

    signBtn.disabled = true;
    loaderSign.classList.remove('hidden');
    resultSectionSign.classList.remove('hidden');
    downloadLinkSignContainer.innerHTML = '';

    // Show progress indicator
    showProgress('progress-container-sign', 'PDF wird signiert...');

    try {
        // Use the already loaded PDF document
        const originalPdfDoc = pdfDoc;
        const pages = originalPdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        // Create signature image from canvas
        const signatureImage = await new Promise((resolve) => {
            signatureCanvas.toBlob(resolve, 'image/png');
        });
        const signatureImageBytes = await signatureImage.arrayBuffer();
        const signaturePngImage = await originalPdfDoc.embedPng(signatureImageBytes);

        // Add signature to first page at selected position
        const signatureWidth = 150;
        const signatureHeight = 60;
        
        // Convert preview coordinates to PDF coordinates
        const previewScale = Math.min(600 / width, 800 / height, 1);
        const pdfX = selectedSignaturePosition.x / previewScale;
        const pdfY = height - (selectedSignaturePosition.y / previewScale) - signatureHeight;
        
        // Ensure coordinates are within bounds
        const finalX = Math.max(0, Math.min(pdfX, width - signatureWidth));
        const finalY = Math.max(0, Math.min(pdfY, height - signatureHeight));

        firstPage.drawImage(signaturePngImage, {
            x: finalX,
            y: finalY,
            width: signatureWidth,
            height: signatureHeight,
        });

        // Save the signed PDF
        const signedPdfBytes = await originalPdfDoc.save();
        const blob = new Blob([signedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `signiert_${fileNameSign.textContent}`;
        a.textContent = 'Signierte PDF herunterladen';
        a.classList.add('download-link');
        downloadLinkSignContainer.appendChild(a);

        // Hide progress and show success
        hideProgress('progress-container-sign');
        showSuccess('PDF erfolgreich signiert!');

    } catch (error) {
        console.error('Fehler beim Signieren der PDF:', error);
        showError(`Ein Fehler ist beim Signieren der PDF aufgetreten: ${error.message}`);
        hideProgress('progress-container-sign');
    } finally {
        loaderSign.classList.add('hidden');
        signBtn.disabled = false;
    }
}




// Initialize dark mode when page loads
document.addEventListener('DOMContentLoaded', function() {
    initDarkMode();
});

