// Firebase configuration
const config = {
    apiKey: "AIzaSyAuT-RlMl5g4m96V3DtUWGFV6ym7YnMXt8",
    authDomain: "tolexars-ac868.firebaseapp.com",
    databaseURL: "https://tolexars-ac868-default-rtdb.firebaseio.com",
    projectId: "tolexars-ac868",
    storageBucket: "tolexars-ac868.appspot.com",
    messagingSenderId: "148559800786"
};
firebase.initializeApp(config);

const auth = firebase.auth();
const database = firebase.database(); // Ensure firebase.database() is initialized
const storage = firebase.storage(); // Ensure firebase.storage() is initialized


// Replace these with your actual IDs:
const ADMOB_UNIT_IDS = {
  middle: 'YOUR_ADMOB_AD_UNIT_ID_1',
  bottom: 'YOUR_ADMOB_AD_UNIT_ID_2'
};

const ADSENSE_CONFIG = {
  client: 'ca-pub-4782711076571062',
  slots: {
    middle: '1234567890',
    bottom: '9876543210'
  }
};