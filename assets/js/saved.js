document.addEventListener('DOMContentLoaded', function() {
    const savedAnalysesContainer = document.getElementById('savedAnalyses');
    const loadingSpinner = document.querySelector('.loading-spinner');
    let currentUser = null;
    
    // Initialize Firebase
    const database = firebase.database();
    
    firebase.auth().onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
            loadSavedAnalyses(user.uid);
        } else {
            showError('You must be logged in to view saved analyses');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        }
    });
    
    function loadSavedAnalyses(userId) {
        const analysesRef = database.ref(`users/${userId}/ais`);
        
        analysesRef.on('value', (snapshot) => {
            const analyses = snapshot.val();
            loadingSpinner.style.display = 'none';
            
            if (!analyses) {
                savedAnalysesContainer.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-file-medical-alt"></i>
                        <h3>No Saved Analyses</h3>
                        <p>You haven't saved any analyses yet.</p>
                        <a href="ai-assistant.html" class="action-btn">Analyze a Document</a>
                    </div>
                `;
                return;
            }
            
            // Convert to array and sort by timestamp (newest first)
            const analysesArray = Object.entries(analyses)
                .map(([key, value]) => ({ id: key, ...value }))
                .sort((a, b) => b.timestamp - a.timestamp);
            
            let html = '<div class="saved-list">';
            analysesArray.forEach(analysis => {
                const date = new Date(analysis.timestamp);
                const formattedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                // Shorten the request text for display
                const shortRequest = analysis.request.length > 100 
                    ? analysis.request.substring(0, 100) + '...' 
                    : analysis.request;
                
                html += `
                    <div class="saved-item" data-id="${analysis.id}">
                        <div class="item-header">
                            <h3>${analysis.fileName}</h3>
                            <span class="date">${formattedDate}</span>
                        </div>
                        <div class="item-details">
                            <span class="doc-type">${analysis.documentType}</span>
                            <p class="request">${shortRequest}</p>
                        </div>
                        <div class="item-actions">
                            <button class="download-btn" data-id="${analysis.id}">
                                <i class="fas fa-download"></i> Download Analysis
                            </button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            
            savedAnalysesContainer.innerHTML = html;
            
            // Add event listeners to download buttons
            document.querySelectorAll('.download-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const analysisId = this.dataset.id;
                    downloadAnalysis(analysisId);
                });
            });
        }, (error) => {
            console.error('Error loading saved analyses:', error);
            loadingSpinner.style.display = 'none';
            showError('Failed to load saved analyses. Please try again.');
        });
    }
    
    function downloadAnalysis(analysisId) {
        if (!currentUser) return;
        
        const analysisRef = database.ref(`users/${currentUser.uid}/ais/${analysisId}`);
        analysisRef.once('value').then(snapshot => {
            const analysis = snapshot.val();
            if (analysis && analysis.results) {
                generateWordDocument(analysis);
            } else {
                alert('Analysis data not found');
            }
        }).catch(error => {
            console.error('Error fetching analysis:', error);
            alert('Failed to download analysis');
        });
    }
    
    function generateWordDocument(analysis) {
        // Create a simple Word document structure
        const content = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset="utf-8">
                <title>${analysis.fileName} Analysis</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                    h2 { color: #3498db; }
                    .meta { margin-bottom: 20px; }
                    .content { line-height: 1.6; }
                </style>
            </head>
            <body>
                <h1>Document Analysis: ${analysis.fileName}</h1>
                <div class="meta">
                    <p><strong>Document Type:</strong> ${analysis.documentType}</p>
                    <p><strong>Analysis Date:</strong> ${new Date(analysis.timestamp).toLocaleString()}</p>
                    <p><strong>Original Request:</strong> ${analysis.request}</p>
                </div>
                <div class="content">
                    ${analysis.results.replace(/\n/g, '<br>')}
                </div>
            </body>
            </html>
        `;
        
        // Create a Blob with Word document format
        const blob = new Blob([content], {type: 'application/msword'});
        
        // Create download link
        const link = document.createElement('a');
        const fileName = `${analysis.fileName.replace(/\.[^/.]+$/, "")}_analysis.doc`;
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }, 100);
    }
    
    function showError(message) {
        savedAnalysesContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Content</h3>
                <p>${message}</p>
            </div>
        `;
    }
});