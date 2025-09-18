// Firebase configuration
const config = {
    apiKey: "AIzaSyAuT-RlMl5g4m96V3DtUWGFV6ym7YnMXt8",
    authDomain: "tolexars-ac868.firebaseapp.com",
    databaseURL: "https://tolexars-ac868-default-rtdb.firebaseio.com",
    projectId: "tolexars-ac868",
    storageBucket: "tolexars-ac868.firebasestorage.app",
    messagingSenderId: "148559800786"
};
firebase.initializeApp(config);

const auth = firebase.auth();
const database = firebase.database(); // Ensure firebase.database() is initialized
const storage = firebase.storage(); // Ensure firebase.storage() is initialized


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