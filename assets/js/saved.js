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
            
            let html = '<div class="saved-list">';
            Object.keys(analyses).forEach(key => {
                const analysis = analyses[key];
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
                    <div class="saved-item" data-id="${key}">
                        <div class="item-header">
                            <h3>${analysis.fileName}</h3>
                            <span class="date">${formattedDate}</span>
                        </div>
                        <div class="item-details">
                            <span class="doc-type">${analysis.documentType}</span>
                            <p class="request">${shortRequest}</p>
                        </div>
                        <div class="item-actions">
                            <button class="view-btn">View Analysis</button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            
            savedAnalysesContainer.innerHTML = html;
            
            // Add event listeners to view buttons
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const item = this.closest('.saved-item');
                    const analysisId = item.dataset.id;
                    window.location.href = `result.html?id=${analysisId}`;
                });
            });
        }, (error) => {
            console.error('Error loading saved analyses:', error);
            loadingSpinner.style.display = 'none';
            showError('Failed to load saved analyses. Please try again.');
        });
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