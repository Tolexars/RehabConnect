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
    
    // API Configuration
    const API_BASE_URL = 'https://api.openai.com/v1/chat/completions';
const API_KEY = 'your-openai-key';  // Replace with your key

async function analyzeMedicalText(text) {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer $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`
    },
    body: JSON.stringify({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a medical AI assistant. Analyze the following medical report and provide a diagnosis, treatment plan, and recommendations."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3  // Lower = more deterministic
    })
  });
  return await response.json();
}
    
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
        document.getElementById('summaryContent').classList.add('hidden');
        document.querySelector('.loading-spinner').classList.remove('hidden');
        
        try {
            // First upload the file to get a document ID
            const uploadResponse = await uploadDocument(uploadedFile);
            const documentId = uploadResponse.documentId;
            
            // Then request analysis
            const analysisResponse = await requestAnalysis(documentId, documentType, selectedOptions);
            analysisResults = analysisResponse;
            
            // Display results
            displayResults(analysisResults);
            
            // Hide loading spinner
            document.querySelector('.loading-spinner').classList.add('hidden');
            document.getElementById('summaryContent').classList.remove('hidden');
            
        } catch (error) {
            console.error('Analysis failed:', error);
            showError('Analysis failed. Please try again later.');
            document.querySelector('.loading-spinner').classList.add('hidden');
        }
    }
    
    async function uploadDocument(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('File upload failed');
        }
        
        return await response.json();
    }
    
    async function requestAnalysis(documentId, docType, options) {
        const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                document_id: documentId,
                document_type: docType,
                analysis_options: options
            })
        });
        
        if (!response.ok) {
            throw new Error('Analysis request failed');
        }
        
        return await response.json();
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
                <ul>
                    ${results.diagnosis.map(d => `<li>${d.name} (${d.code}) - ${d.confidence}% confidence</li>`).join('')}
                </ul>
            `;
        }
        
        if (results.treatment_plan) {
            html += `
                <h3>Recommended Treatment Approach</h3>
                <ol>
                    ${results.treatment_plan.steps.map(step => `<li>${step}</li>`).join('')}
                </ol>
            `;
        }
        
        if (results.progress_assessment) {
            html += `
                <h3>Progress Assessment</h3>
                <p>${results.progress_assessment.summary}</p>
                <p>Key metrics: ${results.progress_assessment.metrics.join(', ')}</p>
            `;
        }
        
        html += '</div>';
        return html;
    }
    
    function formatDetails(results) {
        let html = '<div class="result-section">';
        
        if (results.diagnosis_details) {
            html += `
                <h3>Diagnostic Considerations</h3>
                <p>${results.diagnosis_details.rationale}</p>
                <h4>Differential Diagnosis</h4>
                <ul>
                    ${results.diagnosis_details.differential.map(d => `<li>${d}</li>`).join('')}
                </ul>
            `;
        }
        
        if (results.treatment_rationale) {
            html += `
                <h3>Treatment Rationale</h3>
                <p>${results.treatment_rationale}</p>
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
                    ${results.recommendations.map(r => `<li>${r}</li>`).join('')}
                </ol>
            `;
        }
        
        if (results.follow_up) {
            html += `
                <h3>Follow-up Plan</h3>
                <p>${results.follow_up.plan}</p>
                <p>Next review: ${results.follow_up.next_review}</p>
            `;
        }
        
        html += '</div>';
        return html;
    }
    
    function formatReferences(results) {
        let html = '<div class="result-section">';
        
        if (results.references) {
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
        }
        
        if (results.guidelines) {
            html += `
                <h3>Clinical Guidelines</h3>
                <ul>
                    ${results.guidelines.map(g => `<li>${g.name} (${g.organization}, ${g.year})</li>`).join('')}
                </ul>
            `;
        }
        
        html += '</div>';
        return html;
    }
    
    async function downloadReport() {
        if (!analysisResults) {
            showError('No analysis results to download');
            return;
        }
        
        try {
            // Show loading state for download
            downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Report...';
            downloadBtn.disabled = true;
            
            // Request PDF generation from API
            const response = await fetch(`${API_BASE_URL}/generate-report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    analysis_id: analysisResults.analysis_id,
                    format: 'pdf'
                })
            });
            
            if (!response.ok) {
                throw new Error('Report generation failed');
            }
            
            // Get the PDF blob
            const blob = await response.blob();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `medical_report_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
        } catch (error) {
            console.error('Download failed:', error);
            showError('Failed to generate report. Please try again.');
        } finally {
            downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Full Report';
            downloadBtn.disabled = false;
        }
    }
    
    function showError(message) {
        // Simple error notification - you could use a more sophisticated UI
        alert(message);
    }
});
