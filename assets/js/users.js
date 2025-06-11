// users.js (view mode)
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const profileId = urlParams.get('id');
    let currentUser = null;

    const auth = firebase.auth();
    const database = firebase.database();

    // DOM Elements
    const profileImage = document.querySelector('.profile-image');
    const editIcon = document.querySelector('.edit-profile-icon');
    const onlineStatus = document.querySelector('.online-status');
    const userName = document.querySelector('.user-name');
    const userTitle = document.querySelector('.user-title');
    const professionalDetails = document.getElementById('professional-details');
    
    // Contact Info
    // Update these lines in the DOM Elements section:
const emailValue = document.getElementById('email-value');
const phoneValue = document.getElementById('phone-value');
const locationValue = document.getElementById('location-value');
    
    // Professional Info
    const experienceValue = document.querySelector('.info-grid .info-item:nth-child(1) .info-value');
    const ratingValue = document.querySelector('.info-grid .info-item:nth-child(2) .info-value');
    const educationValue = document.querySelector('.info-grid .info-item:nth-child(3) .info-value');
    const bioText = document.querySelector('.bio-text');
    
    // Contact Icons
    const whatsappLink = document.querySelector('.contact-icon.whatsapp');
    const emailLink = document.querySelector('.contact-icon.email');
    const phoneLink = document.querySelector('.contact-icon.phone');

    // Load profile data
    function loadProfileData(userData, professionalData) {
        // Load basic user data from 'userdata' reference
        userName.textContent = userData?.name || 'No Name Provided';
        userTitle.textContent = userData?.job || 'No Title Provided';
        emailValue.textContent = userData?.email || 'Not available';
        phoneValue.textContent = userData?.phone || 'Not provided';
        locationValue.textContent = userData?.location || 'Not provided';

        // Load professional data from 'professionals' reference
        if (professionalData) {
            professionalDetails.style.display = 'block';
            experienceValue.textContent = professionalData.experience || 'Not specified';
            ratingValue.textContent = professionalData.rating ? `${professionalData.rating}/5` : 'No ratings';
            educationValue.textContent = professionalData.education || 'Not specified';
            bioText.textContent = professionalData.bio || 'No bio available';
        } else {
            professionalDetails.style.display = 'none';
        }

        // Profile Image from userdata
        if (userData?.img) {
            profileImage.src = `${userData.img}?${Date.now()}`;
        }

        // Contact Links from userdata
        if (userData?.phone) {
            const formattedPhone = userData.phone.replace(/[^\d+]/g, '');
            whatsappLink.href = `https://wa.me/${formattedPhone}`;
            phoneLink.href = `tel:${formattedPhone}`;
        }
        
        if (userData?.email) {
            emailLink.href = `mailto:${userData.email}`;
        }
    }

    // Initialize profile
    function initializeProfile() {
        // Load user data from 'userdata' reference
        const userRef = database.ref(`userdata/${profileId}`);
        // Load professional data from 'professionals' reference
        const professionalRef = database.ref(`professionals/${profileId}`);

        // Fetch both data sources
        Promise.all([userRef.once('value'), professionalRef.once('value')])
            .then(([userSnapshot, professionalSnapshot]) => {
                const userData = userSnapshot.val() || {};
                const professionalData = professionalSnapshot.val();

                loadProfileData(userData, professionalData);
            });

        // Set up presence
        setupPresence(profileId);

        // Show edit icon for profile owner
        auth.onAuthStateChanged(user => {
            currentUser = user;
            if (user && user.uid === profileId) {
                editIcon.style.display = 'flex';
                editIcon.addEventListener('click', () => {
                    window.location.href = `profile.html?id=${profileId}`;
                });
            }
        });
    }

    // Online status tracking (keep existing implementation)
    function setupPresence(uid) {
        // ... existing setupPresence implementation ...
    }

    // Initialize
    initializeProfile();
});


// Add to users.js
let currentRating = 0;
let isOwner = false;

// Add these DOM elements at the top
const ratingSection = document.getElementById('rating-section');
const rateButton = document.createElement('button');
const stars = document.querySelectorAll('.bx-star');
const ratingComment = document.getElementById('rating-comment');
const submitButton = document.getElementById('submit-rating');

// Create rate button
rateButton.id = 'rate-button';
rateButton.textContent = 'Rate This Professional';
rateButton.style.display = 'none';
document.querySelector('.profile-header').appendChild(rateButton);

// Check if professional and not owner
function checkRatingEligibility() {
    auth.onAuthStateChanged(user => {
        database.ref(`professionals/${profileId}`).once('value').then(snapshot => {
            if (snapshot.exists() && user && user.uid !== profileId) {
                rateButton.style.display = 'block';
                ratingSection.style.display = 'block';
                isOwner = false;
            } else {
                rateButton.style.display = 'none';
                ratingSection.style.display = 'none';
                isOwner = true;
            }
        });
    });
}

// Star rating interaction
stars.forEach(star => {
    star.addEventListener('mouseover', () => {
        if (!isOwner) highlightStars(star.dataset.rating);
    });
    
    star.addEventListener('mouseout', () => {
        if (!isOwner) highlightStars(currentRating);
    });
    
    star.addEventListener('click', () => {
        if (!isOwner) {
            currentRating = parseInt(star.dataset.rating);
            ratingComment.style.display = 'block';
            submitButton.style.display = 'block';
        }
    });
});

function highlightStars(rating) {
    stars.forEach(star => {
        star.classList.toggle('active', star.dataset.rating <= rating);
    });
}

// Submit rating
submitButton.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user || isOwner) return;

    const ratingData = {
        rating: currentRating,
        comment: ratingComment.value,
        timestamp: Date.now(),
        userId: user.uid,
        profileId: profileId
    };

    try {
        // Save rating
        await database.ref('ratings').push(ratingData);
        
        // Update professional's average rating
        const ratingsRef = database.ref('ratings').orderByChild('profileId').equalTo(profileId);
        const snapshot = await ratingsRef.once('value');
        const ratings = snapshot.val() || {};
        
        const total = Object.values(ratings).reduce((sum, r) => sum + r.rating, 0);
        const average = total / Object.keys(ratings).length;
        
        await database.ref(`professionals/${profileId}`).update({
            rating: average.toFixed(1)
        });

        alert('Thank you for your rating!');
        resetRatingForm();
    } catch (error) {
        console.error('Rating submission failed:', error);
        alert('Failed to submit rating. Please try again.');
    }
});

function resetRatingForm() {
    currentRating = 0;
    ratingComment.value = '';
    highlightStars(0);
    ratingComment.style.display = 'none';
    submitButton.style.display = 'none';
}

// Initialize rating system
checkRatingEligibility();