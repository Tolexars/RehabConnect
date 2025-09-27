// Add this function to your configuration.js file
function trackUserVisit() {
    // Check if user is logged in to get user ID, otherwise use anonymous
    const user = firebase.auth().currentUser;
    const userId = user ? user.uid : 'anonymous';
    
    // Get additional information about the visit
    const visitData = {
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        userId: userId
    };
    
    // Push data to the 'visits' node in Firebase
    const visitsRef = firebase.database().ref('visits');
    visitsRef.push(visitData)
        .catch(error => {
            console.error('Error recording visit:', error);
        });
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Firebase to initialize before tracking the visit
    if (typeof firebase !== 'undefined') {
        trackUserVisit();
    }
});