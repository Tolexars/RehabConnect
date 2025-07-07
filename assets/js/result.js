document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const analysisId = urlParams.get('id');
    const fileNameEl = document.getElementById('fileName');
    const analysisDateEl = document.getElementById('analysisDate');
    const documentTypeEl = document.getElementById('documentType');
    const requestTextEl = document.getElementById('requestText');
    const resultsContent = document.getElementById('resultsContent');
    const downloadPDFBtn = document.getElementById('downloadPDF');
    const downloadWordBtn = document.getElementById('downloadWord');
    const backBtn = document.getElementById('backToSaved');
    
    let currentUser = null;
    let analysisData = null;
    
    // Initialize Firebase
    const database = firebase.database();
    
    if (!analysisId) {
        showError('No analysis specified');
        return;
    }
    
    firebase.auth().onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
            loadAnalysisData(user.uid, analysisId);
        } else {
            showError('You must be logged in to view this analysis');
        }
    });
    
    function loadAnalysisData(userId, analysisId) {
        const analysisRef = database.ref(`users/${userId}/ais/${analysisId}`);
        
        analysisRef.once('value')
            .then(snapshot => {
                analysisData = snapshot.val();
                if (!analysisData) {
                    showError('Analysis not found');
                    return;
                }
                
                console.log("Analysis data loaded:", analysisData);
                displayAnalysisData();
            })
            .catch(error => {
                console.error('Error loading analysis:', error);
                showError('Failed to load analysis data');
            });
    }
    
    function displayAnalysisData() {
        // Format date
        const date = new Date(analysisData.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Format document type
        const docTypes = {
            medical: "Medical Report",
            psychology: "Psychology Assessment",
            occupational: "Occupational Therapy",
            physio: "Physiotherapy",
            speech: "Speech Therapy"
        };
        
        const docType = docTypes[analysisData.documentType] || analysisData.documentType;
        
        // Set metadata
        fileNameEl.textContent = analysisData.fileName;
        analysisDateEl.textContent = formattedDate;
        documentTypeEl.textContent = docType;
        
        // Set request text
        requestTextEl.textContent = analysisData.request;
        
        // SIMPLIFIED RESULTS DISPLAY
        displayResults(analysisData.results);
    }
    
    // ULTRA-SIMPLE RESULTS DISPLAY
    function displayResults(text) {
        if (!text) {
            resultsContent.innerHTML = '<p>No results available</p>';
            return;
        }
        
        // Just clean basic markdown and preserve line breaks
        const cleanedText = text
            .replace(/\*\*/g, '') // Remove bold markers
            .replace(/\#\#\s?/g, '') // Remove heading markers
            .replace(/\n/g, '<br>'); // Convert newlines to HTML
        
        resultsContent.innerHTML = `
            <div class="result-section">
                <div class="analysis-content">${cleanedText}</div>
            </div>
        `;
    }
    
    // Download as PDF
    downloadPDFBtn.addEventListener('click', async function() {
        try {
            // Use html2canvas to capture the resultsContent
            const canvas = await html2canvas(resultsContent);
            const imgData = canvas.toDataURL('image/png');
            
            // Calculate PDF dimensions
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = canvas.height * imgWidth / canvas.width;
            
            // Create PDF
            const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
            
            // Add first page
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            
            // Add additional pages if needed
            let heightLeft = imgHeight;
            let position = 0;
            const imgWidthMM = imgWidth;
            const imgHeightMM = imgHeight;
            
            while (heightLeft >= pageHeight) {
                position = heightLeft - pageHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, -position, imgWidthMM, imgHeightMM);
                heightLeft -= pageHeight;
            }
            
            // Download
            pdf.save(`${analysisData.fileName}_analysis.pdf`);
            
        } catch (error) {
            console.error('PDF generation failed:', error);
            showError('Failed to generate PDF. Please try again.');
        }
    });
    
    // Download as Word
    downloadWordBtn.addEventListener('click', function() {
        try {
            // Create HTML content for Word document
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${analysisData.fileName} Analysis</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; }
                        h1, h2, h3 { color: #2c3e50; }
                        .section { margin-bottom: 30px; }
                        ul, ol { margin-left: 25px; }
                    </style>
                </head>
                <body>
                    <h1>Document Analysis Report</h1>
                    <p><strong>File Name:</strong> ${analysisData.fileName}</p>
                    <p><strong>Analysis Date:</strong> ${analysisDateEl.textContent}</p>
                    <p><strong>Document Type:</strong> ${documentTypeEl.textContent}</p>
                    
                    <div class="section">
                        <h2>Analysis Request</h2>
                        <p>${analysisData.request}</p>
                    </div>
                    
                    <div class="section">
                        <h2>Analysis Results</h2>
                        ${resultsContent.innerHTML}
                    </div>
                    
                    <footer>
                        <p>Generated by REHABVERVE Medical Analysis Tool</p>
                    </footer>
                </body>
                </html>
            `;
            
            // Create Blob
            const blob = new Blob([htmlContent], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            
            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = `${analysisData.fileName}_analysis.doc`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
        } catch (error) {
            console.error('Word download failed:', error);
            showError('Failed to generate Word document. Please try again.');
        }
    });
    
    // Back to saved analyses
    backBtn.addEventListener('click', function() {
        window.location.href = 'saved.html';
    });
    
    function showError(message) {
        resultsContent.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }
});