const { PDFDocument } = PDFLib;

// --- Global variables ---

// --- DOM Elements ---

// Mode Switcher
const modeSplitBtn = document.getElementById('mode-split-btn');
const modeMergeBtn = document.getElementById('mode-merge-btn');
const splitView = document.getElementById('split-view');
const mergeView = document.getElementById('merge-view');

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

// Merge View
const uploadInputMerge = document.getElementById('pdf-upload-merge');
const processingSectionMerge = document.getElementById('processing-section-merge');
const fileListMergeContainer = document.getElementById('file-list-merge');
const mergeBtn = document.getElementById('merge-btn');
const resultSectionMerge = document.getElementById('result-section-merge');
const loaderMerge = document.getElementById('loader-merge');
const downloadLinkMergeContainer = document.getElementById('download-link-merge');

// --- State ---
let pdfBytes = null;
let mergeDocs = []; // Holds { name, pdfDoc, element }

// --- Event Listeners ---

// Mode Switching
modeSplitBtn.addEventListener('click', () => switchMode('split'));
modeMergeBtn.addEventListener('click', () => switchMode('merge'));

// Splitter
uploadInput.addEventListener('change', handleFileSelectSplit);
splitBtn.addEventListener('click', handleSplitPdf);

// Merger
uploadInputMerge.addEventListener('change', handleFileSelectMerge);
mergeBtn.addEventListener('click', handleMergePdf);

// --- Functions ---

function switchMode(mode) {
    if (mode === 'split') {
        splitView.classList.remove('hidden');
        mergeView.classList.add('hidden');
        modeSplitBtn.classList.add('active');
        modeMergeBtn.classList.remove('active');
        resetSplitUI();
    } else {
        splitView.classList.add('hidden');
        mergeView.classList.remove('hidden');
        modeSplitBtn.classList.remove('active');
        modeMergeBtn.classList.add('active');
        resetMergeUI();
    }
}

function resetSplitUI() {
    processingSection.classList.add('hidden');
    resultSection.classList.add('hidden');
    previewInfo.classList.add('hidden');
    downloadLinksContainer.innerHTML = '';
    splitBtn.disabled = true;
    pdfBytes = null;
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

async function handleFileSelectSplit(event) {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
        resetSplitUI();
        if(file) alert('Bitte wählen Sie eine gültige PDF-Datei aus.');
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
            pageCountSpan.textContent = pdfDoc.getPageCount();
            splitBtn.disabled = false;
        } catch (error) {
            console.error('Fehler beim Laden der PDF:', error);
            alert('Die PDF-Datei konnte nicht geladen oder verarbeitet werden.');
            resetSplitUI();
        }
    };
    reader.readAsArrayBuffer(file);
}

async function handleSplitPdf() {
    if (!pdfBytes) {
        alert('Bitte zuerst eine PDF-Datei hochladen.');
        return;
    }

    // Check if pdfjsLib is available with multiple fallbacks
    if (typeof pdfjsLib === 'undefined' && typeof window.pdfjsLib === 'undefined') {
        alert('Fehler: Die PDF-Vorschau-Bibliothek (pdf.js) konnte nicht geladen werden. Bitte laden Sie die Seite neu.');
        return;
    }

    const pdfLib = pdfjsLib || window.pdfjsLib;
    
    splitBtn.disabled = true;
    loader.classList.remove('hidden');
    resultSection.classList.remove('hidden');
    previewInfo.classList.remove('hidden');
    downloadLinksContainer.innerHTML = '';

    try {
        const originalPdfDoc = await PDFDocument.load(pdfBytes);
        const pageCount = originalPdfDoc.getPageCount();

        // pdf.js needs a clone of the ArrayBuffer, as it can be transferred to a worker
        const pdfJsDoc = await pdfLib.getDocument({ data: pdfBytes.slice().buffer }).promise;

        for (let i = 0; i < pageCount; i++) {
            // Create single-page PDF with pdf-lib
            const newPdfDoc = await PDFDocument.create();
            const [copiedPage] = await newPdfDoc.copyPages(originalPdfDoc, [i]);
            newPdfDoc.addPage(copiedPage);

            const newPdfBytes = await newPdfDoc.save();
            const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            // Create preview item container
            const previewItem = document.createElement('div');
            previewItem.classList.add('page-preview-item');
            
            // Create canvas for preview
            const canvas = document.createElement('canvas');
            previewItem.appendChild(canvas);

            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = `Seite-${i + 1}.pdf`;
            a.textContent = `Seite ${i + 1}`;
            a.classList.add('download-link');
            previewItem.appendChild(a);

            downloadLinksContainer.appendChild(previewItem);
            
            try {
                // Render page preview with pdf.js
                const page = await pdfJsDoc.getPage(i + 1);
                const viewport = page.getViewport({ scale: 0.5 }); // Use a smaller scale for thumbnail
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                await page.render(renderContext).promise;
            } catch (renderError) {
                console.error(`Fehler beim Rendern der Vorschau für Seite ${i + 1}:`, renderError);
                // Draw a simple placeholder if rendering fails
                const ctx = canvas.getContext('2d');
                canvas.width = 100;
                canvas.height = 141;
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#666';
                ctx.textAlign = 'center';
                ctx.fillText('Vorschau', canvas.width / 2, canvas.height / 2 - 5);
                ctx.fillText('fehlgeschlagen', canvas.width / 2, canvas.height / 2 + 15);
            }
        }
    } catch (error) {
        console.error('Fehler beim Splitten der PDF:', error);
        alert(`Ein Fehler ist beim Aufteilen der PDF aufgetreten: ${error.message}`);
    } finally {
        loader.classList.add('hidden');
    }
}

async function handleFileSelectMerge(event) {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
        if(file) alert('Bitte wählen Sie eine gültige PDF-Datei aus.');
        uploadInputMerge.value = ''; // Reset input
        return;
    }

    // Check if pdfjsLib is available
    if (typeof pdfjsLib === 'undefined' && typeof window.pdfjsLib === 'undefined') {
        alert('Fehler: Die PDF-Vorschau-Bibliothek (pdf.js) konnte nicht geladen werden. Bitte laden Sie die Seite neu.');
        return;
    }

    const pdfLib = pdfjsLib || window.pdfjsLib;

    processingSectionMerge.classList.remove('hidden');
    loaderMerge.classList.remove('hidden');

    try {
        const fileBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBytes);
        const pageCount = pdfDoc.getPageCount();

        const fileItem = document.createElement('div');
        fileItem.classList.add('file-item');
        const docId = `doc-${Date.now()}`;
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

    } catch (error) {
        console.error("Fehler beim Laden der PDF:", error);
        alert("Die PDF-Datei konnte nicht verarbeitet werden.");
    } finally {
        loaderMerge.classList.add('hidden');
        uploadInputMerge.value = ''; // Reset for next upload
    }
}

function updateMergeButtonState() {
    mergeBtn.disabled = mergeDocs.length < 1;
}

async function handleMergePdf() {
    if (mergeDocs.length === 0) {
        alert("Bitte laden Sie zuerst PDF-Dateien hoch.");
        return;
    }

    mergeBtn.disabled = true;
    loaderMerge.classList.remove('hidden');
    resultSectionMerge.classList.remove('hidden');
    downloadLinkMergeContainer.innerHTML = '';

    try {
        const mergedPdf = await PDFDocument.create();

        for (const docData of mergeDocs) {
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

    } catch (error) {
        console.error('Fehler beim Zusammenfügen der PDFs:', error);
        alert('Ein Fehler ist beim Zusammenfügen der PDFs aufgetreten.');
    } finally {
        loaderMerge.classList.add('hidden');
    }
}