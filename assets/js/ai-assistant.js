document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const typeBtns = document.querySelectorAll('.type-btn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const downloadBtn = document.getElementById('downloadReport');
    const saveBtn = document.getElementById('saveToProfile');
    const documentTypeSelector = document.querySelector('.document-type-selector');
    const analysisRequest = document.querySelector('.analysis-request');
    const analysisTextarea = document.getElementById('analysisRequest');
    const resultsContent = document.getElementById('resultsContent');
    const suggestionBtns = document.querySelectorAll('.suggestion-btn');
    
    // GitHub Configuration
    const GITHUB_API_URL = "https://models.github.ai/inference/chat/completions";
    const AI_MODEL = "openai/gpt-4.1";
    
    // State variables
    let uploadedFile = null;
    let documentType = null;
    let analysisResults = null;
    let githubToken = null;
    let currentUser = null;
    
    // Initialize Firebase
    const database = firebase.database();
    firebase.auth().onAuthStateChanged(user => {
        currentUser = user;
    });
    
    // Initialize the app
    setupEventListeners();
    fetchGitHubToken();
    
    // Fetch GitHub token from Firebase
    async function fetchGitHubToken() {
        try {
            const snapshot = await database.ref('token').once('value');
            githubToken = snapshot.val();
            
            if (!githubToken) {
                showError('GitHub token not found in database');
            }
        } catch (error) {
            console.error('Error fetching token:', error);
            showError('Failed to retrieve GitHub token');
        }
    }
    
    function setupEventListeners() {
        // Drag and drop events
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('highlight');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('highlight');
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('highlight');
            
            if (e.dataTransfer.files.length) {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        });
        
        // File input change
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length) {
                handleFileUpload(fileInput.files[0]);
            }
        });
        
        // Document type selection
        typeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                typeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                documentType = btn.dataset.type;
                
                // Show analysis request
                analysisRequest.classList.add('visible');
                
                updateAnalyzeButtonState();
            });
        });
        
        // Suggestion buttons
        suggestionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const requestText = btn.dataset.request;
                analysisTextarea.value += (analysisTextarea.value ? "\n" : "") + requestText;
            });
        });
        
        // Analyze button
        analyzeBtn.addEventListener('click', () => {
            if (!githubToken) {
                showError('GitHub token not available. Please try again later.');
                return;
            }
            analyzeDocument();
        });
        
        // Download report as Word document
        downloadBtn.addEventListener('click', downloadDOCX);
        
        // Save to profile
        saveBtn.addEventListener('click', saveToProfile);
        
        // Enable analyze button when text changes
        analysisTextarea.addEventListener('input', updateAnalyzeButtonState);
    }
    
    function handleFileUpload(file) {
        // Validate file type
        const validTypes = ['application/pdf', 'application/msword', 
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                          'text/plain'];
        
        if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
            showError('Please upload a PDF, DOC, DOCX, or TXT file.');
            return;
        }
        
        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            showError('File size should be less than 10MB.');
            return;
        }
        
        uploadedFile = file;
        displayFileInfo(file);
        
        // Show document type selector
        documentTypeSelector.classList.add('visible');
        
        updateAnalyzeButtonState();
    }
    
    function displayFileInfo(file) {
        fileInfo.innerHTML = `
            <p><span>File Name:</span> <span>${file.name}</span></p>
            <p><span>File Type:</span> <span>${file.type || file.name.split('.').pop().toUpperCase()}</span></p>
            <p><span>File Size:</span> <span>${formatFileSize(file.size)}</span></p>
        `;
        fileInfo.classList.add('show');
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function updateAnalyzeButtonState() {
        analyzeBtn.disabled = !(
            uploadedFile && 
            documentType && 
            analysisTextarea.value.trim().length > 0
        );
    }
    
    async function analyzeDocument() {
        if (!uploadedFile || !documentType || !analysisTextarea.value) return;
        
        // Get DOM elements
        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'loading-spinner';
        loadingSpinner.innerHTML = `
            <div class="spinner"></div>
            <p>Analyzing document...</p>
        `;
        
        // Show loading state
        document.getElementById('resultsSection').classList.add('visible');
        resultsContent.innerHTML = '';
        resultsContent.appendChild(loadingSpinner);
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Analyzing...';
        
        try {
            // Read file content
            const fileContent = await readFileAsText(uploadedFile);
            
            // Analyze content using GitHub AI API
            const analysisResponse = await analyzeWithGitHubAI(fileContent, analysisTextarea.value);
            analysisResults = analysisResponse;
            
            // Display results
            displayResults(analysisResults);
            
        } catch (error) {
            console.error('Analysis failed:', error);
            showError('Analysis failed: ' + error.message);
        } finally {
            // Reset button
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = 'Analyze Document';
        }
    }
    
    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            
            if (file.type === 'application/pdf') {
                // For PDFs, we'll extract text using a simple method
                // Note: In production, use a proper PDF parser like pdf.js
                reader.readAsDataURL(file);
                resolve("PDF content extraction would require specialized library");
            } else {
                reader.readAsText(file);
            }
        });
    }
    
    async function analyzeWithGitHubAI(content, userRequest) {
        // Prepare the prompt based on user request
        const prompt = createMedicalPrompt(content, documentType, userRequest);
        
        try {
            const response = await fetch(GITHUB_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${githubToken}`
                },
                body: JSON.stringify({
                    model: AI_MODEL,
                    messages: [
                        {
                            role: "system",
                            content: "You are an experienced medical and rehab AI assistant. Analyze medical, psychiatry and therapy documents and provide professional assessments with evidence-based recommendations. Format your response with proper headings but without markdown syntax (no ** or ##). Use clear section headings in plain text."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    top_p: 0.9,
                    max_tokens: 4000
                })
            });

            // First get response as text to handle non-JSON responses
            const responseText = await response.text();
            
            if (!response.ok) {
                throw new Error(responseText || 'API request failed');
            }

            // Parse JSON if response is OK
            const data = JSON.parse(responseText);
            return data.choices[0].message.content;
            
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
    
    function createMedicalPrompt(content, docType, userRequest) {
        const documentTypes = {
            medical: "medical report",
            psychology: "psychological assessment",
            physio: "physiotherapy evaluation",
            occupational: "occupational therapy evaluation",
            speech: "speech therapy assessment"
        };
        
        return `Analyze the following ${documentTypes[docType]} and provide:
- A comprehensive analysis based on the user's specific request
- Clear, professional formatting with section headings (but without markdown syntax)
- Evidence-based recommendations
- Key findings highlighted

User's request: ${userRequest}

Document content:
${content.substring(0, 8000)}  [truncated if too long]

Structure your response as follows:
1. Summary of Key Findings
2. Detailed Analysis
3. Professional Recommendations
4. Next Steps

Avoid using markdown syntax like **bold** or ## headings. Use plain text headings with capitalization instead.`;
    }
    
    function displayResults(results) {
        // Clean up the results by removing markdown syntax
        const cleanResults = results
            .replace(/\*\*/g, '') // Remove bold markers
            .replace(/\#\#\s?/g, '') // Remove heading markers
            .replace(/-\s/g, '• ') // Convert dashes to bullets
            .replace(/\n\s*\n/g, '\n\n'); // Normalize line breaks
        
        // Format with proper HTML
        resultsContent.innerHTML = `
            <div class="result-section">
                ${formatResultsWithHTML(cleanResults)}
            </div>
        `;
    }
    
    function formatResultsWithHTML(text) {
        // Split into sections
        const sections = text.split(/\d+\.\s+/).filter(s => s.trim());
        let html = '';
        
        sections.forEach(section => {
            // Extract title and content
            const titleEnd = section.indexOf('\n');
            const title = section.substring(0, titleEnd).trim();
            const content = section.substring(titleEnd).trim();
            
            if (title && content) {
                html += `<h3>${title}</h3>`;
                html += `<p>${content.replace(/\n/g, '<br>')}</p>`;
            } else {
                html += `<p>${section.replace(/\n/g, '<br>')}</p>`;
            }
        });
        
        return html;
    }
    
   
    async function downloadDOCX() {
        if (!analysisResults) {
            showError('No analysis results to download');
            return;
        }

        try {
            // Show loading state
            const originalText = downloadBtn.innerHTML;
            downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Document...';
            downloadBtn.disabled = true;

            // Create document structure
            const doc = new docx.Document({
                styles: {
                    paragraphStyles: [{
                        id: "normal",
                        name: "Normal",
                        run: {
                            size: 24, // 12pt
                            font: "Calibri"
                        },
                        paragraph: {
                            spacing: {
                                line: 276, // 1.15 line spacing
                            }
                        }
                    }],
                },
                sections: [{
                    properties: {},
                    children: await formatAnalysisForDOCX(analysisResults)
                }]
            });

            // Generate the DOCX file
            const blob = await docx.Packer.toBlob(doc);
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Medical_Analysis_${documentType}_${new Date().toISOString().slice(0,10)}.docx`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;
            }, 100);

        } catch (error) {
            console.error('DOCX generation failed:', error);
            showError('Failed to generate Word document: ' + error.message);
            downloadBtn.innerHTML = 'Download Report';
            downloadBtn.disabled = false;
        }
    }

    /**
     * Formats analysis results for Word document
     */
    async function formatAnalysisForDOCX(text) {
        const paragraphs = [];
        
        // Add title
        paragraphs.push(
            new docx.Paragraph({
                text: "Medical Document Analysis Report",
                heading: docx.HeadingLevel.HEADING_1,
                spacing: { after: 400 },
                border: { bottom: { color: "2F5496", size: 8, space: 4 } }
            })
        );

        // Add metadata
        if (uploadedFile && documentType) {
            paragraphs.push(
                new docx.Paragraph({
                    text: `Document Type: ${documentType.charAt(0).toUpperCase() + documentType.slice(1)} Analysis`,
                    heading: docx.HeadingLevel.HEADING_3,
                    spacing: { after: 200 }
                }),
                new docx.Paragraph({
                    text: `Original File: ${uploadedFile.name}`,
                    italics: true,
                    spacing: { after: 300 }
                })
            );
        }

        // Process analysis sections
        const sections = text.split(/\n\s*\n/).filter(s => s.trim());
        
        sections.forEach(section => {
            // Check for numbered headings (e.g., "1. Summary")
            if (/^\d+\.\s+.+/.test(section)) {
                const headingText = section.replace(/^\d+\.\s+/, '');
                paragraphs.push(
                    new docx.Paragraph({
                        text: headingText,
                        heading: docx.HeadingLevel.HEADING_2,
                        spacing: { before: 400, after: 200 }
                    })
                );
            } else {
                // Regular paragraph with proper formatting
                const content = section.replace(/\*\*/g, '')
                                      .replace(/\n/g, ' ')
                                      .replace(/\s+/g, ' ')
                                      .trim();
                
                if (content) {
                    paragraphs.push(
                        new docx.Paragraph({
                            children: [new docx.TextRun({
                                text: content,
                                size: 24
                            })],
                            spacing: { after: 150 },
                            indent: { left: 200 }
                        })
                    );
                }
            }
        });

        // Add footer with timestamp
        paragraphs.push(
            new docx.Paragraph({
                text: `Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
                alignment: docx.AlignmentType.RIGHT,
                size: 20,
                color: "666666",
                spacing: { before: 600 }
            })
        );

        return paragraphs;
    }

   
    
    function saveToProfile() {
        if (!currentUser) {
            showError('You must be logged in to save analysis');
            return;
        }
        
        if (!analysisResults) {
            showError('No analysis to save');
            return;
        }
        
        try {
            const userId = currentUser.uid;
            const analysisRef = database.ref(`users/${userId}/ais`);
            
            const analysisData = {
                documentType: documentType,
                request: analysisTextarea.value,
                results: analysisResults,
                fileName: uploadedFile.name,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };
            
            analysisRef.push(analysisData)
                .then(() => {
                    showSuccess('Analysis saved to your profile!');
                })
                .catch(error => {
                    console.error('Save failed:', error);
                    showError('Failed to save analysis. Please try again.');
                });
                
        } catch (error) {
            console.error('Save error:', error);
            showError('Error saving analysis');
        }
    }
    
    function showError(message) {
        // Create error notification
        const errorEl = document.createElement('div');
        errorEl.className = 'error-notification';
        errorEl.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <i class="fas fa-times close-btn"></i>
        `;
        
        document.body.appendChild(errorEl);
        
        // Add close functionality
        errorEl.querySelector('.close-btn').addEventListener('click', () => {
            errorEl.remove();
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(errorEl)) {
                errorEl.remove();
            }
        }, 5000);
    }
    
    function showSuccess(message) {
        const successEl = document.createElement('div');
        successEl.className = 'success-notification';
        successEl.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <i class="fas fa-times close-btn"></i>
        `;
        
        document.body.appendChild(successEl);
        
        successEl.querySelector('.close-btn').addEventListener('click', () => {
            successEl.remove();
        });
        
        setTimeout(() => {
            if (document.body.contains(successEl)) {
                successEl.remove();
            }
        }, 5000);
    }
});
