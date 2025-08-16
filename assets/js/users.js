document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const profileId = urlParams.get('id');
    let currentUser = null;
    let currentProfileType = '';
    let currentProfileData = null;
    let newProfileImageUrl = '';

    const auth = firebase.auth();
    const database = firebase.database();
    const storage = firebase.storage();

    // DOM Elements
    const profileImage = document.getElementById('profile-image');
    const editIcon = document.getElementById('edit-icon');
    const onlineStatus = document.querySelector('.online-status');
    const userName = document.querySelector('.user-name');
    const userTitle = document.querySelector('.user-title');
    
    // Contact Info
    const emailValue = document.getElementById('email-value');
    const phoneValue = document.getElementById('phone-value');
    const locationValue = document.getElementById('location-value');
    
    // Professional Info
    const professionalDetails = document.getElementById('professional-details');
    const experienceValue = document.getElementById('experience-value');
    const ratingValue = document.getElementById('rating-value');
    const educationValue = document.getElementById('education-value');
    const bioText = document.getElementById('bio-text');
    
    // Supplier Info
    const supplierDetails = document.getElementById('supplier-details');
    const supplierOrg = document.getElementById('supplier-org');
    const supplierProducts = document.getElementById('supplier-products');
    
    // Center Info
    const centerDetails = document.getElementById('center-details');
    const centerType = document.getElementById('center-type');
    const centerAddress = document.getElementById('center-address');
    const centerHours = document.getElementById('center-hours');
    const centerAccreditations = document.getElementById('center-accreditations');
    const centerDescription = document.getElementById('center-description');
    
    // Contact Icons
    const whatsappLink = document.querySelector('.contact-icon.whatsapp');
    const emailLink = document.querySelector('.contact-icon.email');
    const phoneLink = document.querySelector('.contact-icon.phone');
    
    // Rating Section
    const ratingSection = document.getElementById('rating-section');
    const stars = document.querySelectorAll('.bx-star');
    const ratingComment = document.getElementById('rating-comment');
    const submitButton = document.getElementById('submit-rating');
    
    // Profile Footer Elements
    const profileFooter = document.getElementById('profile-footer');
    const viewCountElement = document.getElementById('view-count');
    const profileLogoutBtn = document.getElementById('profile-logout-btn');

    // Load profile data
    async function loadProfileData(profileId) {
        // Hide all sections initially
        professionalDetails.style.display = 'none';
        supplierDetails.style.display = 'none';
        centerDetails.style.display = 'none';
        ratingSection.style.display = 'none';
        profileFooter.style.display = 'none';

        // Load user data from 'userdata'
        const userRef = database.ref(`userdata/${profileId}`);
        const userSnapshot = await userRef.once('value');
        const userData = userSnapshot.val() || {};
        
        // Set basic user info
        userName.textContent = userData?.name || 'No Name Provided';
        userTitle.textContent = userData?.job || 'No Title Provided';

        // Remove any existing profile type classes
        document.body.classList.remove('professional-profile', 'supplier-profile', 'center-profile');

        // Check profile type
        const [professionalSnap, supplierSnap, centerSnap] = await Promise.all([
            database.ref(`professionals/${profileId}`).once('value'),
            database.ref(`merchants`).orderByChild('userId').equalTo(profileId).once('value'),
            database.ref(`centers/${profileId}`).once('value')
        ]);

        const isProfessional = professionalSnap.exists();
        const isSupplier = supplierSnap.exists();
        const isCenter = centerSnap.exists();

        // Set profile type and data for editing
        if (isProfessional) {
            currentProfileType = 'professional';
            currentProfileData = professionalSnap.val();
        } else if (isSupplier) {
            currentProfileType = 'supplier';
            const supplierRecords = supplierSnap.val();
            const supplierKey = Object.keys(supplierRecords)[0];
            currentProfileData = supplierRecords[supplierKey];
        } else if (isCenter) {
            currentProfileType = 'center';
            currentProfileData = centerSnap.val();
        }

        // Handle professional profile
        if (isProfessional) {
            document.body.classList.add('professional-profile');
            professionalDetails.style.display = 'block';
            const professionalData = professionalSnap.val();
            
            // Use professional data for contact info
            userName.textContent = professionalData.name || 'No Name Provided';
            userTitle.textContent = professionalData.job || 'No Title Provided';
            emailValue.textContent = professionalData.email || userData.email || 'Not available';
            phoneValue.textContent = professionalData.phone || userData.phone || 'Not provided';
            locationValue.textContent = professionalData.location || userData.location || 'Not provided';
            
            // Use professional image if available
            if (professionalData.img || professionalData.ing) {
                profileImage.src = professionalData.img || professionalData.ing;
            } else if (userData?.img) {
                profileImage.src = userData.img;
            }
            
            experienceValue.textContent = professionalData.experience || 'Not specified';
            ratingValue.textContent = professionalData.rating ? `${professionalData.rating}/5` : 'No ratings';
            educationValue.textContent = professionalData.education || 'Not specified';
            bioText.textContent = professionalData.bio || 'No bio available';
        }
        // Handle supplier profile
        else if (isSupplier) {
            document.body.classList.add('supplier-profile');
            supplierDetails.style.display = 'block';
            // Get first supplier record (should be only one per user)
            const supplierRecords = supplierSnap.val();
            const supplierKey = Object.keys(supplierRecords)[0];
            const supplierData = supplierRecords[supplierKey];
            
            // Use merchant data for contact info
            userName.textContent = supplierData.orgName || 'No Name Provided';
            userTitle.textContent = supplierData.products || 'No Title Provided'; 
            emailValue.textContent = supplierData.email || userData.email || 'Not available';
            phoneValue.textContent = supplierData.phone || userData.phone || 'Not provided';
            locationValue.textContent = supplierData.location || userData.location || 'Not provided';
            
            // Use supplier image if available
            if (supplierData.img) {
                profileImage.src = supplierData.img;
            } else if (userData?.img) {
                profileImage.src = userData.img;
            }
            
            supplierOrg.textContent = supplierData.orgName || 'Not specified';
            supplierProducts.textContent = supplierData.productsOffered || supplierData.products || 'Not specified';
        }
        // Handle center profile
        else if (isCenter) {
            document.body.classList.add('center-profile');
            centerDetails.style.display = 'block';
            const centerData = centerSnap.val();
            
            // Use center data for contact info
            userName.textContent = centerData.centerName || 'No Name Provided';
            userTitle.textContent = centerData.centerType || 'No Title Provided'; 
            emailValue.textContent = centerData.email || userData.email || 'Not available';
            phoneValue.textContent = centerData.phone || userData.phone || 'Not provided';
            locationValue.textContent = centerData.address || userData.location || 'Not provided';
            
            // Use center image if available
            if (centerData.img || centerData.ing) {
                profileImage.src = centerData.img || centerData.ing;
            } else if (userData?.img) {
                profileImage.src = userData.img;
            }
            
            centerType.textContent = centerData.centerType || 'Not specified';
            centerAddress.textContent = centerData.address || 'Not specified';
            centerHours.textContent = centerData.operatingHours || 'Not specified';
            centerAccreditations.textContent = centerData.accreditations || '...';
            centerDescription.textContent = centerData.description || 'No description available';
        }
        // Handle regular user profile
        else {
            // Only use userdata for non-professional profiles
            emailValue.textContent = userData.email || 'Not available';
            phoneValue.textContent = userData.phone || 'Not provided';
            locationValue.textContent = userData.location || 'Not provided';
            
            // Use userdata image
            if (userData?.img) {
                profileImage.src = userData.img;
            }
        }

        // Contact Links
        if (phoneValue.textContent !== 'Not provided') {
            const formattedPhone = phoneValue.textContent.replace(/[^\d+]/g, '');
            whatsappLink.href = `https://wa.me/${formattedPhone}`;
            phoneLink.href = `tel:${formattedPhone}`;
        } else {
            whatsappLink.removeAttribute('href');
            phoneLink.removeAttribute('href');
        }
        
        if (emailValue.textContent !== 'Not available') {
            emailLink.href = `mailto:${emailValue.textContent}`;
        } else {
            emailLink.removeAttribute('href');
        }

        // Handle rating section visibility
        const user = auth.currentUser;
        const showRating = (isProfessional || isCenter) && 
                           user && 
                           user.uid !== profileId;
        
        ratingSection.style.display = showRating ? 'block' : 'none';
        
        // Show footer for profile owner
        if (user && user.uid === profileId) {
            profileFooter.style.display = 'flex';
            
            // Load profile views
            const viewsRef = database.ref(`profileViews/${profileId}`);
            viewsRef.once('value').then(snapshot => {
                const views = snapshot.val() || 0;
                viewCountElement.textContent = views;
            });
        } else {
            profileFooter.style.display = 'none';
            
            // Increment view count (only for non-owners and logged-in users)
            if (user) {
                const viewsRef = database.ref(`profileViews/${profileId}`);
                viewsRef.transaction(currentViews => {
                    return (currentViews || 0) + 1;
                });
            }
        }
    }

    // Initialize profile
    function initializeProfile() {
        // Set up presence
        setupPresence(profileId);

        // Load profile data
        loadProfileData(profileId);

        // Show edit icon for profile owner
        auth.onAuthStateChanged(user => {
            currentUser = user;
            if (user && user.uid === profileId) {
                editIcon.style.display = 'flex';
                editIcon.addEventListener('click', showEditModal);
            }
        });
        
        // Logout button functionality
        if (profileLogoutBtn) {
            profileLogoutBtn.addEventListener('click', () => {
                auth.signOut().then(() => {
                    window.location.href = 'index.html';
                }).catch(error => {
                    console.error("Logout error:", error);
                    alert('Logout failed. Please try again.');
                });
            });
        }
        
        // Initialize view count if needed
        const viewsRef = database.ref(`profileViews/${profileId}`);
        viewsRef.once('value').then(snapshot => {
            if (!snapshot.exists()) {
                viewsRef.set(0);
            }
        });
    }

    // Show edit profile modal
    function showEditModal() {
        const modal = document.getElementById('edit-profile-modal');
        modal.style.display = 'block';
        
        // Hide all specialized fields initially
        document.getElementById('professional-fields').style.display = 'none';
        document.getElementById('supplier-fields').style.display = 'none';
        document.getElementById('center-fields').style.display = 'none';
        
        // Hide progress and messages
        document.getElementById('image-upload-progress').style.display = 'none';
        document.getElementById('edit-success').style.display = 'none';
        document.getElementById('edit-error').textContent = '';
        
        // Populate common fields
        document.getElementById('edit-name').value = userName.textContent;
        document.getElementById('edit-phone').value = phoneValue.textContent;
        
        // Populate specialized fields based on profile type
        if (currentProfileType === 'professional') {
            document.getElementById('professional-fields').style.display = 'block';
            document.getElementById('edit-title').value = userTitle.textContent;
            document.getElementById('edit-specialty').value = currentProfileData.education || '';
            document.getElementById('edit-experience').value = currentProfileData.experience || '';
            document.getElementById('edit-bio').value = currentProfileData.bio || '';
        } 
        
        else if (currentProfileType === 'supplier') {
            document.getElementById('supplier-fields').style.display = 'block';
            document.getElementById('edit-org').value = orgName.textContent;
            document.getElementById('edit-products').value = currentProfileData.productsOffered || '';
        } 
        
        else if (currentProfileType === 'center') {
            document.getElementById('center-fields').style.display = 'block';
            document.getElementById('edit-center-name').value = currentProfileData.centerName || '';
            document.getElementById('edit-center-type').value = currentProfileData.centerType || '';
            document.getElementById('edit-address').value = currentProfileData.address || '';
            document.getElementById('edit-description').value = currentProfileData.description || '';
        }
    }

    // Hide edit modal
    function hideEditModal() {
        document.getElementById('edit-profile-modal').style.display = 'none';
    }

    // Upload profile image with progress
    async function uploadProfileImage(file, userId) {
        const progressContainer = document.getElementById('image-upload-progress');
        const progressBar = progressContainer.querySelector('.progress-bar');
        const progressText = progressContainer.querySelector('.progress-text');
        
        progressContainer.style.display = 'block';
        
        try {
            // Check file size
            if (file.size > 2 * 1024 * 1024) {
                throw new Error('Image file size exceeds 2MB limit.');
            }
            
            // Check file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                throw new Error('Only JPG, PNG, GIF images are allowed.');
            }
            
            // Upload to storage
            const storageRef = storage.ref(`profile-images/${userId}/${Date.now()}_${file.name}`);
            const uploadTask = storageRef.put(file);
            
            // Listen for upload progress
            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    progressBar.style.width = `${progress}%`;
                    progressText.textContent = `Uploading: ${Math.round(progress)}%`;
                },
                (error) => {
                    throw error;
                },
                async () => {
                    // Get download URL
                    newProfileImageUrl = await uploadTask.snapshot.ref.getDownloadURL();
                    progressText.textContent = 'Upload complete!';
                    
                    // Update userdata reference with the new image URL
                    await database.ref(`userdata/${userId}`).update({
                        img: newProfileImageUrl
                    });
                    
                    await database.ref(`professionals/${userId}`).update({
                        img: newProfileImageUrl
                    });
                    
                    // Update profile image immediately
                    profileImage.src = newProfileImageUrl;
                    
                    // Hide progress after a delay
                    setTimeout(() => {
                        progressContainer.style.display = 'none';
                    }, 2000);
                }
            );
            
            return newProfileImageUrl;
        } catch (error) {
            showError('edit-error', error.message);
            progressContainer.style.display = 'none';
            return null;
        }
    }

    // Save profile changes
    async function saveProfileChanges() {
        const userId = currentUser.uid;
        const name = document.getElementById('edit-name').value;
        const phone = document.getElementById('edit-phone').value;
        
        // Get file input
        const fileInput = document.getElementById('edit-profile-image');
        const file = fileInput.files[0];
        
        try {
            // Validate inputs
            if (!name.trim()) throw new Error('Name is required');
            if (!phone.trim()) throw new Error('Phone is required');
            
            // Upload image if selected
            if (file) {
                await uploadProfileImage(file, userId);
            }
            
            // Update common user data
            await database.ref(`userdata/${userId}`).update({
                name: name,
                phone: phone
            });
            
            // Update specialized data based on profile type
            if (currentProfileType === 'professional') {
                const updateData = {
                    name: name,
                    phone: phone,
                    education: document.getElementById('edit-specialty').value,
                    experience: parseInt(document.getElementById('edit-experience').value) || 0,
                    bio: document.getElementById('edit-bio').value
                };
                
                await database.ref(`professionals/${userId}`).update(updateData);
            } 
            else if (currentProfileType === 'supplier') {
                const updateData = {
                    orgName: document.getElementById('edit-org').value,
                    contactPhone: phone,
                    productsOffered: document.getElementById('edit-products').value
                };
                
                // Find supplier key and update
                const suppliersSnapshot = await database.ref('merchants').orderByChild('userId').equalTo(userId).once('value');
                if (suppliersSnapshot.exists()) {
                    const supplierKey = Object.keys(suppliersSnapshot.val())[0];
                    await database.ref(`merchants/${supplierKey}`).update(updateData);
                }
            } 
            else if (currentProfileType === 'center') {
                const updateData = {
                    centerName: document.getElementById('edit-center-name').value,
                    contactPhone: phone,
                    centerType: document.getElementById('edit-center-type').value,
                    address: document.getElementById('edit-address').value,
                    description: document.getElementById('edit-description').value
                };
                
                await database.ref(`centers/${userId}`).update(updateData);
            }
            
            // Update UI immediately
            userName.textContent = name;
            phoneValue.textContent = phone;
            
            // Show success message
            document.getElementById('edit-success').style.display = 'block';
            document.getElementById('edit-error').textContent = '';
            
            // Hide modal after 2 seconds
            setTimeout(hideEditModal, 2000);
            
        } catch (error) {
            showError('edit-error', error.message);
        }
    }

    // Setup edit modal functionality
    function setupEditModal() {
        // Modal close button
        document.querySelector('#edit-profile-modal .modal-close').addEventListener('click', hideEditModal);
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('edit-profile-modal');
            if (e.target === modal) hideEditModal();
        });
        
        // Save button
        document.getElementById('save-profile-btn').addEventListener('click', saveProfileChanges);
    }

    // Online status tracking
    function setupPresence(uid) {
        const userStatusRef = database.ref(`status/${uid}`);
        const isOffline = {
            state: 'offline',
            last_changed: firebase.database.ServerValue.TIMESTAMP
        };
        
        const isOnline = {
            state: 'online',
            last_changed: firebase.database.ServerValue.TIMESTAMP
        };
        
        database.ref('.info/connected').on('value', (snapshot) => {
            if (snapshot.val() === false) return;
            
            userStatusRef.onDisconnect().set(isOffline).then(() => {
                userStatusRef.set(isOnline);
            });
        });
        
        userStatusRef.on('value', (snapshot) => {
            const status = snapshot.val();
            if (status && status.state === 'online') {
                onlineStatus.style.backgroundColor = '#2ECC71';
            } else {
                onlineStatus.style.backgroundColor = '#95a5a6';
            }
        });
    }

    // Rating system
    let currentRating = 0;
    
    stars.forEach(star => {
        star.addEventListener('mouseover', () => {
            if (ratingSection.style.display !== 'none') {
                highlightStars(star.dataset.rating);
            }
        });
        
        star.addEventListener('mouseout', () => {
            if (ratingSection.style.display !== 'none') {
                highlightStars(currentRating);
            }
        });
        
        star.addEventListener('click', () => {
            if (ratingSection.style.display !== 'none') {
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
        if (!user) return;

        // Get profile type
        const [professionalSnap, centerSnap] = await Promise.all([
            database.ref(`professionals/${profileId}`).once('value'),
            database.ref(`centers/${profileId}`).once('value')
        ]);

        const isProfessional = professionalSnap.exists();
        const isCenter = centerSnap.exists();

        if (!isProfessional && !isCenter) return;

        const ratingData = {
            rating: currentRating,
            comment: ratingComment.value,
            timestamp: Date.now(),
            userId: user.uid,
            profileId: profileId,
            profileType: isProfessional ? 'professional' : 'center'
        };

        try {
            // Save rating
            await database.ref('ratings').push(ratingData);
            
            // Update profile's average rating
            const ratingsRef = database.ref('ratings')
                .orderByChild('profileId')
                .equalTo(profileId);
                
            const snapshot = await ratingsRef.once('value');
            const ratings = snapshot.val() || {};
            
            const total = Object.values(ratings).reduce((sum, r) => sum + r.rating, 0);
            const average = total / Object.keys(ratings).length;
            
            // Update the correct reference
            if (isProfessional) {
                await database.ref(`professionals/${profileId}`).update({
                    rating: average.toFixed(1)
                });
            } else if (isCenter) {
                await database.ref(`centers/${profileId}`).update({
                    rating: average.toFixed(1)
                });
            }

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

    // Helper function to show errors
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = message ? 'block' : 'none';
        }
    }

    // Initialize
    initializeProfile();
    setupEditModal();
});
