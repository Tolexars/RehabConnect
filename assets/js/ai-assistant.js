// --- 1. API Endpoints Configuration ---
// REPLACE THESE WITH YOUR ACTUAL DEPLOYED FIREBASE CLOUD FUNCTION URLs
const API_ENDPOINTS = {
    ASK_QUESTION: 'https://us-central1-tolexars-ac868.cloudfunctions.net/askQuestion',
    UPLOAD_DOCUMENT: 'https://us-central1-tolexars-ac868.cloudfunctions.net/uploadDocument', // This function extracts text from file
    ANALYZE_DOCUMENT: 'https://us-central1-tolexars-ac868.cloudfunctions.net/analyzeDocument' // This function sends extracted text to AI
};

// --- 2. DOM Element Selectors ---
const methodTabs = document.querySelectorAll('.method-tab');
const methodContents = document.querySelectorAll('.method-content');

const aiQuestionInput = document.getElementById('ai-question');
const askQuestionBtn = document.getElementById('ask-question-btn');

const fileUploadInput = document.getElementById('file-upload');
const uploadDropzone = document.getElementById('upload-dropzone');
const filePreviewContainer = document.getElementById('file-preview');
const analysisTypeSelect = document.getElementById('analysis-type');
const customPromptTextarea = document.getElementById('custom-prompt');
const analyzeBtn = document.getElementById('analyze-btn');

const aiOutputDiv = document.getElementById('ai-output');
const emptyStateDiv = aiOutputDiv.querySelector('.empty-state');
const loadingIndicatorDiv = document.getElementById('loading-indicator');

const copyBtn = document.getElementById('copy-btn');
const downloadDocxBtn = document.getElementById('download-docx');
const downloadPdfBtn = document.getElementById('download-pdf');

let uploadedFile = null; // To store the selected file object

// --- 3. Utility Functions ---

function showLoading() {
    emptyStateDiv.style.display = 'none';
    aiOutputDiv.style.display = 'none'; // Hide content while loading
    loadingIndicatorDiv.style.display = 'flex'; // Show spinner
}

function hideLoading() {
    loadingIndicatorDiv.style.display = 'none';
    aiOutputDiv.style.display = 'block'; // Show content area again
    // Determine whether to show empty state or actual content based on aiOutputDiv.textContent
    if (aiOutputDiv.innerText.trim() === '' || aiOutputDiv.innerText.trim() === 'Your AI-generated content will appear here') {
        emptyStateDiv.style.display = 'flex';
    } else {
        emptyStateDiv.style.display = 'none';
    }
}

function setOutput(content) {
    aiOutputDiv.innerHTML = content; // Use innerHTML to allow for basic formatting (like bold, lists if AI outputs markdown/HTML)
    hideLoading();
}

function clearOutput() {
    aiOutputDiv.innerHTML = '';
    emptyStateDiv.style.display = 'flex';
    aiOutputDiv.style.display = 'block'; // Ensure it's block for empty state visibility
}

function enableOutputActions(enable = true) {
    copyBtn.disabled = !enable;
    downloadDocxBtn.disabled = !enable;
    downloadPdfBtn.disabled = !enable;
}

// --- 4. Tab Switching Logic ---
methodTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Deactivate all tabs and hide all content
        methodTabs.forEach(t => t.classList.remove('active'));
        methodContents.forEach(c => c.classList.remove('active'));

        // Activate clicked tab and show corresponding content
        tab.classList.add('active');
        const targetMethod = tab.dataset.method;
        document.getElementById(`${targetMethod}-method`).classList.add('active');

        // Clear output when switching tabs
        clearOutput();
        enableOutputActions(false);
        uploadedFile = null; // Clear any loaded file
        filePreviewContainer.innerHTML = ''; // Clear file preview
        fileUploadInput.value = ''; // Clear file input
        analyzeBtn.disabled = true; // Disable analyze button on tab switch
        aiQuestionInput.value = ''; // Clear question input
    });
});

// --- 5. Ask Question Logic ---
askQuestionBtn.addEventListener('click', async () => {
    const question = aiQuestionInput.value.trim();
    if (!question) {
        setOutput('<p style="color:red;">Please enter your question.</p>');
        return;
    }

    showLoading();
    askQuestionBtn.disabled = true;
    enableOutputActions(false);
    clearOutput(); // Clear previous output before new request

    try {
        const response = await fetch(API_ENDPOINTS.ASK_QUESTION, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question: question }),
        });

        const data = await response.json();

        if (response.ok) {
            setOutput(`<div class="document-content">${formatAIOutput(data.answer)}</div>`);
            enableOutputActions(true);
        } else {
            setOutput(`<p style="color:red;">Error: ${data.error || 'Something went wrong.'}</p>`);
        }
    } catch (error) {
        console.error('Error asking question:', error);
        setOutput('<p style="color:red;">An error occurred while connecting to the AI. Please check your internet connection or try again later.</p>');
    } finally {
        askQuestionBtn.disabled = false;
        hideLoading();
    }
});


// --- 6. Document Upload & Analysis Logic ---

// Handle custom prompt visibility
analysisTypeSelect.addEventListener('change', () => {
    if (analysisTypeSelect.value === 'custom') {
        customPromptTextarea.style.display = 'block';
    } else {
        customPromptTextarea.style.display = 'none';
    }
});

// File input change handler
fileUploadInput.addEventListener('change', (event) => {
    handleFiles(event.target.files);
});

// Drag and Drop handlers
uploadDropzone.addEventListener('dragover', (event) => {
    event.preventDefault();
    uploadDropzone.classList.add('hover');
});

uploadDropzone.addEventListener('dragleave', () => {
    uploadDropzone.classList.remove('hover');
});

uploadDropzone.addEventListener('drop', (event) => {
    event.preventDefault();
    uploadDropzone.classList.remove('hover');
    handleFiles(event.dataTransfer.files);
});

function handleFiles(files) {
    filePreviewContainer.innerHTML = ''; // Clear previous preview
    uploadedFile = null; // Reset uploaded file

    if (files.length > 0) {
        uploadedFile = files[0]; // We only process one file for simplicity
        displayFilePreview(uploadedFile);
        analyzeBtn.disabled = false; // Enable analyze button
    } else {
        analyzeBtn.disabled = true; // Disable if no file
    }
}

function displayFilePreview(file) {
    const item = document.createElement('div');
    item.classList.add('file-preview-item');
    item.innerHTML = `
        <span>${file.name} (${(file.size / 1024).toFixed(2)} KB)</span>
        <i class='bx bx-x remove-file' data-filename="${file.name}"></i>
    `;
    filePreviewContainer.appendChild(item);

    // Add event listener to remove button
    item.querySelector('.remove-file').addEventListener('click', () => {
        uploadedFile = null;
        fileUploadInput.value = ''; // Clear the input as well
        filePreviewContainer.innerHTML = '';
        analyzeBtn.disabled = true;
    });
}

// Analyze Document Button Click
analyzeBtn.addEventListener('click', async () => {
    if (!uploadedFile) {
        setOutput('<p style="color:red;">Please upload a document first.</p>');
        return;
    }

    showLoading();
    analyzeBtn.disabled = true;
    enableOutputActions(false);
    clearOutput(); // Clear previous output before new request

    try {
        // Step 1: Upload document to Cloud Function for text extraction
        const formData = new FormData();
        formData.append('document', uploadedFile);

        const uploadResponse = await fetch(API_ENDPOINTS.UPLOAD_DOCUMENT, {
            method: 'POST',
            body: formData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
            throw new Error(uploadData.error || 'Failed to upload and extract text.');
        }

        const extractedText = uploadData.extractedText;
        if (!extractedText || extractedText.trim() === '') {
            throw new Error('No readable text found in the document or unsupported file type.');
        }

        // Determine the prompt based on analysis type
        let userQuery = '';
        const analysisType = analysisTypeSelect.value;
        const customPrompt = customPromptTextarea.value.trim();

        if (analysisType === 'summary') {
            userQuery = 'Provide a concise summary of the document.';
        } else if (analysisType === 'assessment') {
            userQuery = 'Based on the medical report, generate a structured assessment report, including findings, diagnoses, and recommendations.';
        } else if (analysisType === 'treatment') {
            userQuery = 'Suggest a comprehensive treatment plan based on the medical information in the document.';
        } else if (analysisType === 'custom') {
            userQuery = customPrompt;
        }

        if (!userQuery) {
            throw new Error('Please select an analysis type or enter a custom prompt.');
        }

        // Step 2: Send extracted text to another Cloud Function for AI analysis
        const analyzeResponse = await fetch(API_ENDPOINTS.ANALYZE_DOCUMENT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ documentText: extractedText, userQuery: userQuery }),
        });

        const analyzeData = await analyzeResponse.json();

        if (analyzeResponse.ok) {
            setOutput(`<div class="document-content">${formatAIOutput(analyzeData.analysis)}</div>`);
            enableOutputActions(true);
        } else {
            setOutput(`<p style="color:red;">Error: ${analyzeData.error || 'Failed to analyze document.'}</p>`);
        }

    } catch (error) {
        console.error('Document analysis error:', error);
        setOutput(`<p style="color:red;">Error: ${error.message || 'An unexpected error occurred during document processing.'}</p>`);
    } finally {
        analyzeBtn.disabled = false;
        hideLoading();
    }
});


// --- 7. Output Actions (Copy, Download DOCX, Download PDF) ---

copyBtn.addEventListener('click', () => {
    const textToCopy = aiOutputDiv.innerText; // Get plain text from output
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            alert('Content copied to clipboard!');
            // Optional: Provide a visual cue (e.g., button changes text temporarily)
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy content.');
        });
});

// Function to format AI output (e.g., convert markdown to HTML)
// Gemini often outputs markdown, so this helps render it nicely.
function formatAIOutput(text) {
    // Basic markdown to HTML conversion for common elements
    // This is a very simple converter. For robust markdown, use a library like 'marked.js'
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italic
    html = html.replace(/^- (.*)/gm, '<li>$1</li>'); // Unordered lists
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>'); // Wrap lists
    html = html.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>'); // Code blocks
    html = html.replace(/\n/g, '<br>'); // Newlines to breaks

    // Add additional styling classes for document content
    // For example, if you want specific headings, you'd parse more complex markdown.
    // For now, it will apply to all text output.
    return html;
}

// Download as DOCX
downloadDocxBtn.addEventListener('click', async () => {
    const aiContent = aiOutputDiv.innerText; // Get plain text content

    if (!aiContent.trim()) {
        alert('No content to download.');
        return;
    }

    // Using the 'docx' library (from CDN https://unpkg.com/docx@latest/build/index.js)
    // NOTE: This generates a *basic* DOCX from plain text. It does NOT replicate Gamma's
    // advanced formatting or AI-driven layout generation.
    const doc = new docx.Document({
        sections: [{
            properties: {},
            children: [
                new docx.Paragraph({
                    children: [
                        new docx.TextRun({ text: aiContent, break: true }), // break: true for new lines
                    ],
                }),
            ],
        }],
    });

    try {
        const buffer = await docx.Packer.toBuffer(doc);
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ai_assistant_output.docx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Clean up
    } catch (error) {
        console.error('Error generating DOCX:', error);
        alert('Failed to generate DOCX file. Please check console for details.');
    }
});

// Download as PDF
downloadPdfBtn.addEventListener('click', () => {
    const aiContent = aiOutputDiv.innerText; // Get plain text content

    if (!aiContent.trim()) {
        alert('No content to download.');
        return;
    }

    // Using jsPDF (from CDN https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js)
    // NOTE: This generates a *basic* PDF from plain text. It does NOT replicate Gamma's
    // advanced formatting or AI-driven layout generation.
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const lineHeight = 10; // Approx line height
    let y = margin;

    const lines = doc.splitTextToSize(aiContent, pageWidth - 2 * margin);

    for (let i = 0; i < lines.length; i++) {
        if (y + lineHeight > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            y = margin;
        }
        doc.text(lines[i], margin, y);
        y += lineHeight;
    }

    doc.save('ai_assistant_output.pdf');
});

// --- Initial State ---
hideLoading(); // Ensure loading indicator is hidden initially
enableOutputActions(false); // Disable download/copy buttons initially
