document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const database = firebase.database();
    const storage = firebase.storage();
    
    // Get profile ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const profileId = urlParams.get('id');
    
    // DOM Elements
    const profileForm = document.getElementById('profile-form');
    const profilePreview = document.getElementById('profile-preview');
    const profileImageInput = document.getElementById('profile-image');
    const professionalSection = document.getElementById('professional-section');
    const cancelBtn = document.getElementById('cancel-btn');
    const errorMessage = document.getElementById('error-message');
    const saveBtn = document.getElementById('save-btn');
    
    let currentUser = null;
    let isProfessional = false;
    let currentImageUrl = '';
    let newImageFile = null;
    let progressElements = null;

    // Initialize the form
    function initializeForm() {
        auth.onAuthStateChanged(async (user) => {
            if (!user || user.uid !== profileId) {
                window.location.href = `users.html?id=${profileId}`;
                return;
            }
            
            currentUser = user;
            await loadProfileData();
            createUploadProgress();
            
            // Verify Firebase initialization
            if (!firebase.apps.length) {
                showError('Firebase not initialized');
                return;
            }
        });
    }

    // Load profile data with error handling
    async function loadProfileData() {
        try {
            const [userSnapshot, professionalSnapshot] = await Promise.all([
                database.ref(`userdata/${profileId}`).once('value'),
                database.ref(`professionals/${profileId}`).once('value')
            ]);

            const userData = userSnapshot.val() || {};
            const professionalData = professionalSnapshot.val() || {};
            
            // Set basic info
            document.getElementById('name').value = userData.name || '';
            document.getElementById('job').value = userData.job || '';
            document.getElementById('email').value = userData.email || '';
            document.getElementById('phone').value = userData.phone || '';
            document.getElementById('location').value = userData.location || '';
            
            // Set professional info if exists
            if (professionalSnapshot.exists()) {
                isProfessional = true;
                professionalSection.style.display = 'block';
                document.getElementById('specialty').value = professionalData.specialty || '';
                document.getElementById('experience').value = professionalData.experience || '';
                document.getElementById('education').value = professionalData.education || '';
                document.getElementById('bio').value = professionalData.bio || '';
            }
            
            // Set profile image with cache busting
            if (userData.img) {
                currentImageUrl = userData.img;
                profilePreview.src = `${userData.img}?t=${Date.now()}`;
                profilePreview.onerror = () => {
                    profilePreview.src = 'assets/img/profile.png';
                };
            }
        } catch (error) {
            console.error('Profile load error:', error);
            showError('Failed to load profile data');
        }
    }

    // Image preview handler with better error handling
    profileImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        errorMessage.style.display = 'none';
        
        // Validate file
        if (file.size > 2 * 1024 * 1024) {
            showError('Image must be less than 2MB');
            resetFileInput();
            return;
        }
        
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            showError('Only JPG, PNG or GIF images allowed');
            resetFileInput();
            return;
        }
        
        // Preview image
        const reader = new FileReader();
        reader.onloadstart = () => {
            profilePreview.src = 'assets/img/loading.gif';
        };
        reader.onload = (event) => {
            profilePreview.src = event.target.result;
            newImageFile = file;
        };
        reader.onerror = () => {
            showError('Failed to preview image');
            resetFileInput();
        };
        reader.readAsDataURL(file);
    });

    // Reset file input
    function resetFileInput() {
        profileImageInput.value = '';
        profilePreview.src = currentImageUrl || 'assets/img/profile.png';
    }

    // Save handler with comprehensive error handling
    saveBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        errorMessage.style.display = 'none';
        
        if (!validateForm()) return;
        
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        
        try {
            const imageUrl = await handleImageUpload();
            await updateProfileData(imageUrl);
            
            // Force refresh by adding timestamp
            window.location.href = `users.html?id=${currentUser.uid}&t=${Date.now()}`;
        } catch (error) {
            console.error('Save error:', error);
            showError(`Save failed: ${error.message || 'Please try again'}`);
        } finally {
            saveBtn.textContent = 'Save Changes';
            saveBtn.disabled = false;
        }
    });

    // Form validation
    function validateForm() {
        if (!document.getElementById('name').value.trim()) {
            showError('Name is required');
            return false;
        }
        if (!document.getElementById('email').value.trim()) {
            showError('Email is required');
            return false;
        }
        return true;
    }

    // Handle image upload process
    async function handleImageUpload() {
        if (!newImageFile) return currentImageUrl;
        
        try {
            showUploadProgress();
            
            const fileExt = newImageFile.name.split('.').pop();
            const fileName = `profile_${Date.now()}.${fileExt}`;
            const storageRef = storage.ref(`profile_images/${currentUser.uid}/${fileName}`);
            
            const snapshot = await new Promise((resolve, reject) => {
                const uploadTask = storageRef.put(newImageFile);
                
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        updateUploadProgress(progress);
                    },
                    (error) => {
                        hideUploadProgress();
                        reject(new Error('Image upload failed'));
                    },
                    () => {
                        hideUploadProgress();
                        resolve(uploadTask.snapshot);
                    }
                );
            });
            
            const downloadURL = await snapshot.ref.getDownloadURL();
            return `${downloadURL}?t=${Date.now()}`;
        } catch (error) {
            hideUploadProgress();
            throw error;
        }
    }

    // Update profile data in Firebase
    async function updateProfileData(imageUrl) {
        const userData = {
            name: document.getElementById('name').value.trim(),
            job: document.getElementById('job').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            location: document.getElementById('location').value.trim(),
            img: imageUrl,
            lastUpdated: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Update user data
        await database.ref(`userdata/${currentUser.uid}`).update(userData);
        
        // Update professional data if professional
        if (isProfessional) {
            const professionalData = {
                fullName: userData.name,
                specialty: document.getElementById('specialty').value.trim(),
                experience: parseInt(document.getElementById('experience').value) || 0,
                education: document.getElementById('education').value.trim(),
                bio: document.getElementById('bio').value.trim(),
                img: imageUrl,
                lastUpdated: firebase.database.ServerValue.TIMESTAMP
            };
            
            await database.ref(`professionals/${currentUser.uid}`).update(professionalData);
        }
    }

    // Progress indicator functions
    function createUploadProgress() {
        // Remove existing if any
        if (progressElements?.container) {
            progressElements.container.remove();
        }
        
        const container = document.createElement('div');
        container.id = 'upload-progress';
        Object.assign(container.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0,0,0,0.85)',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            zIndex: '10000',
            display: 'none',
            textAlign: 'center',
            minWidth: '250px'
        });
        
        const text = document.createElement('p');
        text.id = 'progress-text';
        text.textContent = 'Uploading image... 0%';
        text.style.margin = '0 0 15px 0';
        
        const barContainer = document.createElement('div');
        barContainer.style.width = '250px';
        barContainer.style.height = '10px';
        barContainer.style.backgroundColor = '#444';
        barContainer.style.borderRadius = '5px';
        barContainer.style.overflow = 'hidden';
        barContainer.style.margin = '0 auto';
        
        const barFill = document.createElement('div');
        barFill.id = 'progress-fill';
        Object.assign(barFill.style, {
            height: '100%',
            width: '0%',
            backgroundColor: '#4a89dc',
            transition: 'width 0.3s ease'
        });
        
        barContainer.appendChild(barFill);
        container.appendChild(text);
        container.appendChild(barContainer);
        document.body.appendChild(container);
        
        progressElements = {
            container,
            text,
            fill: barFill
        };
    }

    function showUploadProgress() {
        if (progressElements) {
            progressElements.container.style.display = 'block';
            progressElements.fill.style.width = '0%';
            progressElements.text.textContent = 'Uploading image... 0%';
        }
    }

    function updateUploadProgress(percent) {
        if (progressElements) {
            progressElements.fill.style.width = `${percent}%`;
            progressElements.text.textContent = `Uploading image... ${Math.round(percent)}%`;
        }
    }

    function hideUploadProgress() {
        if (progressElements) {
            progressElements.container.style.display = 'none';
        }
    }

    // Cancel button
    cancelBtn.addEventListener('click', () => {
        window.location.href = `users.html?id=${profileId}`;
    });

    // Error display
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Initialize the app
    initializeForm();
});