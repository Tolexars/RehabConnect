document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const typeBtns = document.querySelectorAll('.type-btn');
    const optionCards = document.querySelectorAll('.option-card');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultsSection = document.getElementById('resultsSection');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const downloadBtn = document.getElementById('downloadReport');
    const loadingSpinner = document.querySelector('.loading-spinner');
    const summaryContent = document.getElementById('summaryContent');
    
    // GitHub Configuration
    const GITHUB_TOKEN = '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';
    const GITHUB_API_URL = 'https://models.github.ai/inference/chat/completions';
    const AI_MODEL = 'openai/gpt-4.1';  // Using the specified model
    
    // State variables
    let uploadedFile = null;
    let documentType = 'medical';
    let selectedOptions = [];
    let analysisResults = null;
    
    // Initialize the app
    init();
    
    function init() {
        setupEventListeners();
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
                updateAnalyzeButtonState();
            });
        });
        
        // Analysis option selection
        optionCards.forEach(card => {
            card.addEventListener('click', () => {
                card.classList.toggle('selected');
                const option = card.dataset.option;
                
                if (card.classList.contains('selected')) {
                    if (!selectedOptions.includes(option)) {
                        selectedOptions.push(option);
                    }
                } else {
                    selectedOptions = selectedOptions.filter(opt => opt !== option);
                }
                
                updateAnalyzeButtonState();
            });
        });
        
        // Analyze button
        analyzeBtn.addEventListener('click', analyzeDocument);
        
        // Tab switching
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(`${tabId}Tab`).classList.add('active');
            });
        });
        
        // Download report
        downloadBtn.addEventListener('click', downloadReport);
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
        analyzeBtn.disabled = !(uploadedFile && selectedOptions.length > 0);
    }
    
    async function analyzeDocument() {
        if (!uploadedFile || selectedOptions.length === 0) return;
        
        // Show loading state
        resultsSection.classList.remove('hidden');
        summaryContent.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Analyzing...';
        
        try {
            // Read file content
            const fileContent = await readFileAsText(uploadedFile);
            
            // Analyze content using GitHub AI API
            const analysisResponse = await analyzeWithGitHubAI(fileContent);
            analysisResults = analysisResponse;
            
            // Display results
            displayResults(analysisResults);
            
            // Hide loading spinner
            loadingSpinner.classList.add('hidden');
            summaryContent.classList.remove('hidden');
            
        } catch (error) {
            console.error('Analysis failed:', error);
            showError('Analysis failed. Please try again later.');
            loadingSpinner.classList.add('hidden');
        } finally {
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
    
    async function analyzeWithGitHubAI(content) {
        // Prepare the prompt based on selected options
        const prompt = createMedicalPrompt(content, documentType, selectedOptions);
        
        const response = await fetch(GITHUB_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GITHUB_TOKEN}`
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: [
                    {
                        role: "system",
                        content: "You are an experienced medical AI assistant. Analyze medical documents and provide professional assessments with evidence-based recommendations."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 1,
                top_p: 1,
                max_tokens: 4096
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        return parseAIResponse(data.choices[0].message.content);
    }
    
    function createMedicalPrompt(content, docType, options) {
        const documentTypes = {
            medical: "medical report",
            psychology: "psychological assessment",
            physio: "physiotherapy evaluation",
            occupational: "occupational therapy assessment"
        };
        
        const analysisOptions = {
            diagnose: "potential diagnoses with confidence levels",
            treatment: "comprehensive treatment plan",
            progress: "progress assessment report",
            medication: "medication review and adjustments",
            timeline: "recovery timeline with milestones",
            referral: "specialist referral recommendations"
        };
        
        const selectedAnalysis = options.map(opt => analysisOptions[opt]).join(', ');
        
        return `Analyze the following ${documentTypes[docType]} and provide:
1. ${selectedAnalysis}

Document content:
${content.substring(0, 8000)}  [truncated if too long]

Format your response in JSON with these sections:
- diagnosis: { primary: { name, code, confidence }, differential: [names] }
- treatment_plan: { goals: [], interventions: [], timeline: string }
- progress_assessment: { summary: string, metrics: [] }
- recommendations: { clinical: [], lifestyle: [], specialists []}
- references: [ { title, authors, source, year } ]`;
    }
    
    function parseAIResponse(responseText) {
        try {
            // Try to parse as JSON
            const jsonMatch = responseText.match(/```json([\s\S]*?)```/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }
            
            // Fallback: look for JSON without code block
            const jsonStart = responseText.indexOf('{');
            const jsonEnd = responseText.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                const jsonString = responseText.substring(jsonStart, jsonEnd + 1);
                return JSON.parse(jsonString);
            }
            
            // Fallback to plain text parsing
            return {
                diagnosis: {
                    primary: { name: "Unable to parse", code: "N/A", confidence: 0 },
                    differential: []
                },
                treatment_plan: {
                    goals: ["Response parsing failed"],
                    interventions: [],
                    timeline: "N/A"
                },
                progress_assessment: {
                    summary: "Could not parse AI response",
                    metrics: []
                },
                recommendations: {
                    clinical: ["Check API response format"],
                    specialists: [],
                    lifestyle: []                                                          
                },
                references: []
            };
        } catch (e) {
            console.error('Failed to parse AI response:', e);
            return {
                error: 'Failed to parse analysis results'
            };
        }
    }
    
    function displayResults(results) {
        // Format and display results in each tab
        document.getElementById('summaryContent').innerHTML = formatSummary(results);
        document.getElementById('detailsContent').innerHTML = formatDetails(results);
        document.getElementById('recommendationsContent').innerHTML = formatRecommendations(results);
        document.getElementById('referencesContent').innerHTML = formatReferences(results);
    }
    
    function formatSummary(results) {
        let html = '<div class="result-section">';
        
        if (results.diagnosis) {
            html += `
                <h3>Potential Diagnoses</h3>
                <p><strong>Primary:</strong> ${results.diagnosis.primary.name} (${results.diagnosis.primary.code}) - ${results.diagnosis.primary.confidence}% confidence</p>`;
            
            if (results.diagnosis.differential && results.diagnosis.differential.length > 0) {
                html += `
                    <h4>Differential Diagnosis</h4>
                    <ul>
                        ${results.diagnosis.differential.map(d => `<li>${d}</li>`).join('')}
                    </ul>
                `;
            }
        }
        
        if (results.treatment_plan) {
            html += `
                <h3>Treatment Plan</h3>
                <h4>Goals</h4>
                <ul>
                    ${results.treatment_plan.goals.map(g => `<li>${g}</li>`).join('')}
                </ul>
                
                <h4>Interventions</h4>
                <ol>
                    ${results.treatment_plan.interventions.map(i => `<li>${i}</li>`).join('')}
                </ol>
                
                <p><strong>Timeline:</strong> ${results.treatment_plan.timeline}</p>
            `;
        }
        
        html += '</div>';
        return html;
    }
    
    function formatDetails(results) {
        let html = '<div class="result-section">';
        
        if (results.progress_assessment) {
            html += `
                <h3>Progress Assessment</h3>
                <p>${results.progress_assessment.summary}</p>
                
                <h4>Key Metrics</h4>
                <ul>
                    ${results.progress_assessment.metrics.map(m => `<li>${m}</li>`).join('')}
                </ul>
            `;
        }
        
        html += '</div>';
        return html;
    }
    
    function formatRecommendations(results) {
        let html = '<div class="result-section">';
        
        if (results.recommendations) {
            html += `
                <h3>Clinical Recommendations</h3>
                <ol>
                    ${results.recommendations.clinical.map(r => `<li>${r}</li>`).join('')}
                </ol>
                
                <h3>Lifestyle Recommendations</h3>
                <ul>
                    ${results.recommendations.lifestyle.map(r => `<li>${r}</li>`).join('')}
                </ul>
            `;
        }
        
        html += '</div>';
        return html;
    }
    
    function formatReferences(results) {
        let html = '<div class="result-section">';
        
        if (results.references && results.references.length > 0) {
            html += `
                <h3>Evidence-Based References</h3>
                <ul>
                    ${results.references.map(ref => `
                        <li>
                            <strong>${ref.title}</strong><br>
                            ${ref.authors}<br>
                            <em>${ref.source}</em>, ${ref.year}
                        </li>
                    `).join('')}
                </ul>
            `;
        } else {
            html += `<p>No references available</p>`;
        }
        
        html += '</div>';
        return html;
    }
    
    function downloadReport() {
        if (!analysisResults) {
            showError('No analysis results to download');
            return;
        }
        
        try {
            // Create HTML report
            const reportContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Medical Analysis Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 2rem; }
                        h1, h2, h3 { color: #2c3e50; }
                        .section { margin-bottom: 2rem; }
                        ul, ol { margin-left: 1.5rem; }
                        .result-section { 
                            margin-bottom: 2rem; 
                            padding: 1.5rem; 
                            background-color: #f8fafc; 
                            border-radius: 8px; 
                            border-left: 4px solid #00BCD4;
                        }
                    </style>
                </head>
                <body>
                    <h1>Medical Analysis Report</h1>
                    <p>Generated on: ${new Date().toLocaleDateString()}</p>
                    
                    <div class="section">
                        <h2>Summary</h2>
                        ${document.getElementById('summaryContent').innerHTML}
                    </div>
                    
                    <div class="section">
                        <h2>Detailed Analysis</h2>
                        ${document.getElementById('detailsContent').innerHTML}
                    </div>
                    
                    <div class="section">
                        <h2>Recommendations</h2>
                        ${document.getElementById('recommendationsContent').innerHTML}
                    </div>
                    
                    <div class="section">
                        <h2>References</h2>
                        ${document.getElementById('referencesContent').innerHTML}
                    </div>
                </body>
                </html>
            `;
            
            // Create Blob
            const blob = new Blob([reportContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = `medical_report_${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
        } catch (error) {
            console.error('Download failed:', error);
            showError('Failed to generate report. Please try again.');
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
    
    // Add styles for error notification if not already present
    if (!document.querySelector('style[data-error-notification]')) {
        const style = document.createElement('style');
        style.setAttribute('data-error-notification', 'true');
        style.innerHTML = `
            .error-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: #ffebee;
                color: #b71c1c;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 1000;
                animation: slideIn 0.3s ease-out;
                border-left: 4px solid #b71c1c;
            }
            
            .error-notification i.fa-exclamation-circle {
                font-size: 20px;
            }
            
            .error-notification .close-btn {
                cursor: pointer;
                margin-left: 10px;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
});
