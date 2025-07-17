// profile.js - Profile editing functionality
document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const database = firebase.database();
    const storage = firebase.storage();
    
    // DOM Elements
    const profileForm = document.getElementById('profile-form');
    const profilePreview = document.getElementById('profile-preview');
    const profileUpload = document.getElementById('profile-upload');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const cancelBtn = document.getElementById('cancel-btn');
    
    // Form fields
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const locationInput = document.getElementById('location');
    
    // Professional fields
    const titleInput = document.getElementById('title');
    const experienceInput = document.getElementById('experience');
    const educationInput = document.getElementById('education');
    const bioInput = document.getElementById('bio');
    
    // Supplier fields
    const organizationInput = document.getElementById('organization');
    const productsInput = document.getElementById('products');
    
    // Center fields
    const centerNameInput = document.getElementById('center-name');
    const centerTypeSelect = document.getElementById('center-type');
    const addressInput = document.getElementById('address');
    const hoursInput = document.getElementById('hours');
    const descriptionInput = document.getElementById('description');
    
    // Section containers
    const professionalSection = document.getElementById('professional-section');
    const supplierSection = document.getElementById('supplier-section');
    const centerSection = document.getElementById('center-section');
    
    let currentUser = null;
    let profileType = null;
    let newImageUrl = null;
    let tempImageUrl = null;
    
    // Initialize profile
    function initializeProfile() {
        auth.onAuthStateChanged(user => {
            if (user) {
                currentUser = user;
                emailInput.value = user.email;
                loadProfileData(user.uid);
            } else {
                window.location.href = 'index.html';
            }
        });
        
        // Event listeners
        profileUpload.addEventListener('change', handleImageUpload);
        profileForm.addEventListener('submit', handleFormSubmit);
        cancelBtn.addEventListener('click', () => {
            window.history.back();
        });
    }
    
    // Load profile data
    async function loadProfileData(uid) {
        try {
            // Check profile type
            const [userSnap, professionalSnap, supplierSnap, centerSnap] = await Promise.all([
                database.ref(`userdata/${uid}`).once('value'),
                database.ref(`professionals/${uid}`).once('value'),
                database.ref(`merchants`).orderByChild('userId').equalTo(uid).once('value'),
                database.ref(`centers/${uid}`).once('value')
            ]);
            
            const userData = userSnap.val() || {};
            const isProfessional = professionalSnap.exists();
            const isSupplier = supplierSnap.exists();
            const isCenter = centerSnap.exists();
            
            // Set profile type and show relevant sections
            if (isProfessional) {
                profileType = 'professional';
                professionalSection.style.display = 'block';
                const professionalData = professionalSnap.val();
                populateProfessionalForm(professionalData);
            } else if (isSupplier) {
                profileType = 'supplier';
                supplierSection.style.display = 'block';
                // Get first supplier record
                const supplierRecords = supplierSnap.val();
                const supplierKey = Object.keys(supplierRecords)[0];
                const supplierData = supplierRecords[supplierKey];
                populateSupplierForm(supplierData);
            } else if (isCenter) {
                profileType = 'center';
                centerSection.style.display = 'block';
                const centerData = centerSnap.val();
                populateCenterForm(centerData);
            }
            
            // Populate common fields
            nameInput.value = userData.name || '';
            phoneInput.value = userData.phone || '';
            locationInput.value = userData.location || '';
            
            // Set profile image
            if (userData.img) {
                profilePreview.src = userData.img;
                tempImageUrl = userData.img;
            }
            
        } catch (error) {
            console.error("Error loading profile data:", error);
            alert('Failed to load profile data. Please try again.');
        }
    }
    
    // Populate professional form
    function populateProfessionalForm(data) {
        titleInput.value = data.job || '';
        experienceInput.value = data.experience || '';
        educationInput.value = data.education || '';
        bioInput.value = data.bio || '';
    }
    
    // Populate supplier form
    function populateSupplierForm(data) {
        organizationInput.value = data.orgName || '';
        productsInput.value = data.productsOffered || data.products || '';
    }
    
    // Populate center form
    function populateCenterForm(data) {
        centerNameInput.value = data.centerName || '';
        centerTypeSelect.value = data.centerType || '';
        addressInput.value = data.address || '';
        hoursInput.value = data.operatingHours || '';
        descriptionInput.value = data.description || '';
    }
    
    // Handle image upload
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file
        if (file.size > 2 * 1024 * 1024) {
            alert('Image file size exceeds 2MB limit.');
            return;
        }
        
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            alert('Only JPG, PNG, GIF images are allowed.');
            return;
        }
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (event) => {
            profilePreview.src = event.target.result;
            tempImageUrl = event.target.result;
        };
        reader.readAsDataURL(file);
        
        // Show progress container
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        
        // Upload to Firebase Storage
        const storageRef = storage.ref(`profile_images/${currentUser.uid}/${file.name}`);
        const uploadTask = storageRef.put(file);
        
        uploadTask.on('state_changed',
            (snapshot) => {
                // Progress tracking
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `${Math.round(progress)}%`;
            },
            (error) => {
                // Handle unsuccessful uploads
                console.error("Upload error:", error);
                alert('Image upload failed. Please try again.');
                progressContainer.style.display = 'none';
            },
            () => {
                // Handle successful uploads
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    newImageUrl = downloadURL;
                    progressContainer.style.display = 'none';
                });
            }
        );
    }
    
    // Handle form submission
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        // Collect common data
        const profileData = {
            name: nameInput.value.trim(),
            phone: phoneInput.value.trim(),
            location: locationInput.value.trim(),
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Update profile image if changed
        if (newImageUrl) {
            profileData.img = newImageUrl;
        }
        
        try {
            // Update userdata
            await database.ref(`userdata/${currentUser.uid}`).update(profileData);
            
            // Update profile type specific data
            if (profileType === 'professional') {
                await updateProfessionalData();
            } else if (profileType === 'supplier') {
                await updateSupplierData();
            } else if (profileType === 'center') {
                await updateCenterData();
            }
            
            alert('Profile updated successfully!');
            window.location.href = `users.html?id=${currentUser.uid}`;
            
        } catch (error) {
            console.error("Update error:", error);
            alert('Failed to update profile. Please try again.');
        }
    }
    
    // Update professional data
    async function updateProfessionalData() {
        const professionalData = {
            name: nameInput.value.trim(),
            job: titleInput.value.trim(),
            experience: experienceInput.value.trim(),
            education: educationInput.value.trim(),
            bio: bioInput.value.trim(),
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        if (newImageUrl) {
            professionalData.img = newImageUrl;
        }
        
        await database.ref(`professionals/${currentUser.uid}`).update(professionalData);
    }
    
    // Update supplier data
    async function updateSupplierData() {
        // First find the supplier key
        const supplierSnap = await database.ref('merchants').orderByChild('userId').equalTo(currentUser.uid).once('value');
        const supplierRecords = supplierSnap.val();
        const supplierKey = Object.keys(supplierRecords)[0];
        
        const supplierData = {
            orgName: organizationInput.value.trim(),
            productsOffered: productsInput.value.trim(),
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        await database.ref(`merchants/${supplierKey}`).update(supplierData);
    }
    
    // Update center data
    async function updateCenterData() {
        const centerData = {
            centerName: centerNameInput.value.trim(),
            centerType: centerTypeSelect.value,
            address: addressInput.value.trim(),
            operatingHours: hoursInput.value.trim(),
            description: descriptionInput.value.trim(),
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        if (newImageUrl) {
            centerData.img = newImageUrl;
        }
        
        await database.ref(`centers/${currentUser.uid}`).update(centerData);
    }
    
    // Initialize
    initializeProfile();
});