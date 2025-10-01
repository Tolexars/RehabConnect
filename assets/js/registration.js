// registration.js - Complete Implementation with Dynamic Section Visibility, Loading, and Redirection

const DEBUG = true; // Set to true for console logs, false to disable

function initializeApp() {
    if (DEBUG) console.log("Initializing application...");

    auth.onAuthStateChanged(async user => {
        if (user) {
            if (DEBUG) console.log("User authenticated:", user.uid);
            await handleAuthenticatedState(user);
        } else {
            if (DEBUG) console.log("User not authenticated");
            handleUnauthenticatedState();
        }
    });

    setupEventListeners();
    setupAuthForms();
    setupSupplierForm();
    setupPractitionerForm();
    setupCenterForm();

    // Add AI Assistant button event listener (if it exists)
    const aiAssistantButton = document.querySelector('.floating-ai-button');
    if (aiAssistantButton) {
        aiAssistantButton.addEventListener('click', function(e) {
            const user = auth.currentUser;
            if (!user) {
                e.preventDefault();
                sessionStorage.setItem('postAuthRedirect', 'ai-assistant');
                showModal('auth-modal');
            }
        });
    }

    // Handle window resize for responsive UI adjustments
    window.addEventListener('resize', () => {
        if (auth.currentUser) {
            handleAuthenticatedState(auth.currentUser);
        } else {
            handleUnauthenticatedState();
        }
    });
}

function setupEventListeners() {
    if (DEBUG) console.log("Setting up event listeners...");

    // Close buttons for all modals
    document.querySelectorAll('.modal .close, .modal .modal-close').forEach(btn => {
        btn.addEventListener('click', hideAllModals);
    });

    // Regular User CTA - Only visible when unauthenticated
    const userRegisterBtn = document.getElementById('user-register-btn');
    if (userRegisterBtn) {
        userRegisterBtn.addEventListener('click', () => {
            const user = auth.currentUser;
            if (DEBUG) console.log("Regular User CTA clicked. User:", user ? user.uid : "None");

            if (user) {
                alert('You are already registered and logged in!');
            } else {
                sessionStorage.removeItem('postAuthAction');
                showModal('auth-modal');
                switchToRegisterForm();
            }
        });
    }

    // Supplier CTA
    const supplierCtaBtn = document.getElementById('supplier-cta-btn');
    if (supplierCtaBtn) {
        supplierCtaBtn.addEventListener('click', () => {
            if (DEBUG) console.log("Supplier CTA clicked. Displaying supplier modal directly.");
            showModal('supplier-modal');
        });
    }

    // Practitioner CTA
    const joinButton = document.getElementById('join-button');
    if (joinButton) {
        joinButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (DEBUG) console.log("Join Practitioner button clicked. Displaying practitioner modal directly.");
            showModal('practitioner-modal');
        });
    }

    // Center CTA
    const centerButton = document.getElementById('center-button');
    if (centerButton) {
        centerButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (DEBUG) console.log("Center button clicked. Displaying center modal directly.");
            showModal('center-modal');
        });
    }

    // Login button (for the main navigation)
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            if (DEBUG) console.log("Login button clicked.");
            sessionStorage.removeItem('postAuthAction');
            showModal('auth-modal');
            switchToLoginForm();
        });
    }

    // Modal background click
    window.addEventListener('click', (event) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) hideAllModals();
        });
    });

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                if (DEBUG) console.log("User signed out successfully.");
                window.location.href = 'index.html';
            }).catch(error => {
                console.error("Logout error:", error);
                showErrorDialog('Logout failed: ' + error.message);
            });
        });
    }

    // Profile image click (in navigation)
    const profileImageNav = document.querySelector('.profile-image-nav');
    if (profileImageNav) {
        profileImageNav.addEventListener('click', () => {
            const user = auth.currentUser;
            if (user) {
                const navMenu = document.getElementById('nav-menu');
                if (window.innerWidth <= 991) {
                    if (navMenu) {
                        navMenu.classList.toggle('show');
                    }
                } else {
                    window.location.href = `users.html?id=${user.uid}`;
                }
            } else {
                showModal('auth-modal');
            }
        });
    }

    // Nav toggle (for mobile menu)
    const navToggle = document.getElementById('nav-toggle');
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            const navMenu = document.getElementById('nav-menu');
            if (navMenu) {
                navMenu.classList.toggle('show');
            }
        });
    }
}

// --- Auth Switching Functions ---
function switchToLoginForm() {
    if (DEBUG) console.log("Switching to login form");
    document.querySelector('.auth-tab[data-form="register"]')?.classList.remove('active');
    document.querySelector('.auth-tab[data-form="login"]')?.classList.add('active');
    document.getElementById('register-form')?.classList.remove('active');
    document.getElementById('login-form')?.classList.add('active');
}

function switchToRegisterForm() {
    if (DEBUG) console.log("Switching to register form");
    document.querySelector('.auth-tab[data-form="login"]')?.classList.remove('active');
    document.querySelector('.auth-tab[data-form="register"]')?.classList.add('active');
    document.getElementById('login-form')?.classList.remove('active');
    document.getElementById('register-form')?.classList.add('active');
}

// --- Modal Management ---
function showModal(modalId) {
    if (DEBUG) console.log("Showing modal:", modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function hideAllModals() {
    if (DEBUG) console.log("Hiding all modals");
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
        // Reset forms and clear errors when modals are hidden
        if (modal.id === 'auth-modal') {
            document.getElementById('login-form')?.reset();
            showError('login-error', '');
            document.getElementById('register-form')?.reset();
            showError('register-error', '');
        } else if (modal.id === 'supplier-modal') {
            document.getElementById('supplier-form')?.reset();
            showError('supplier-error', '');
        } else if (modal.id === 'practitioner-modal') {
            document.getElementById('practitioner-form')?.reset();
            showError('practitioner-error', '');
        } else if (modal.id === 'center-modal') {
            document.getElementById('center-form')?.reset();
            showError('center-error', '');
        }
    });
}

// --- Authentication Forms ---
function setupAuthForms() {
    if (DEBUG) console.log("Setting up auth forms...");

    // Auth tab switching (Login/Register within the modal)
    document.getElementById('show-register')?.addEventListener('click', (e) => {
        e.preventDefault();
        switchToRegisterForm();
    });

    document.getElementById('show-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        switchToLoginForm();
    });

    // Login Form Submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showError('login-error', '');
            showLoading();

            const email = loginForm['login-email'].value;
            const password = loginForm['login-password'].value;

            try {
                await auth.signInWithEmailAndPassword(email, password);
                if (DEBUG) console.log("Login successful!");
                hideLoading();

                // Handle post-login redirect
                const redirectTarget = sessionStorage.getItem('postAuthRedirect');
                if (redirectTarget === 'ai-assistant') {
                    sessionStorage.removeItem('postAuthRedirect');
                    window.location.href = '/ai-assistant/';
                } else {
                    handlePostLogin();
                }
            } catch (error) {
                if (DEBUG) console.error("Login error:", error.message);
                hideLoading();
                showErrorDialog('Login failed: ' + error.message);
            }
        });
    }

    // Registration Form Submission (for regular users)
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showError('register-error', '');
            showLoading();

            const name = registerForm['register-name'].value;
            const email = registerForm['register-email'].value;
            const password = registerForm['register-password'].value;

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Save user data to database (role: regular)
                await database.ref('userdata/' + user.uid).set({
                    name: name,
                    email: email,
                    role: 'regular',
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                });

                if (DEBUG) console.log("Registration successful! User:", user.uid);
                hideLoading();
                hideAllModals();
                
                // Show success message and redirect to homepage
                showSuccessDialog('Account created successfully! You are now logged in.', () => {
                    window.location.href = 'index.html';
                });

            } catch (error) {
                if (DEBUG) console.error("Registration error:", error.message);
                hideLoading();
                showErrorDialog('Registration failed: ' + error.message);
            }
        });
    }
}

// --- Practitioner Form Handling ---
function setupPractitionerForm() {
    if (DEBUG) console.log("Setting up practitioner form...");
    const practitionerForm = document.getElementById('practitioner-form');
    if (practitionerForm) {
        practitionerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showError('practitioner-error', '');
            showLoading();

            const fullName = practitionerForm['prof-name'].value;
            const email = practitionerForm['prof-email'].value;
            const password = practitionerForm['prof-password'].value;
            const phone = practitionerForm['prof-phone'].value;
            const specialty = practitionerForm['prof-specialty'].value;
            const yearsExperience = parseInt(practitionerForm['prof-experience'].value, 10);
            const bio = practitionerForm['prof-bio'].value;
            const licenseFile = practitionerForm['prof-license'].files[0];
            const profilePictureFile = practitionerForm['prof-picture'].files[0];
            
            let profileImageUrl = '';
            let licenseUrl = '';
            let user = null;

            try {
                // 1. Create User Account
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                user = userCredential.user;
                if (DEBUG) console.log("Practitioner account created with UID:", user.uid);

                // 2. Validate and Upload License File (required)
                if (licenseFile) {
                    if (licenseFile.size > 5 * 1024 * 1024) {
                        throw new Error('License file size exceeds 5MB limit.');
                    }
                    const allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                    if (!allowedFileTypes.includes(licenseFile.type)) {
                        throw new Error('Only JPG, PNG, GIF, PDF, DOC, and DOCX files are allowed for licenses.');
                    }
                    const licenseStorageRef = storage.ref('practitioner_licenses/' + user.uid + '/' + licenseFile.name);
                    const licenseSnapshot = await licenseStorageRef.put(licenseFile);
                    licenseUrl = await licenseSnapshot.ref.getDownloadURL();
                    if (DEBUG) console.log("Professional license uploaded:", licenseUrl);
                } else {
                    throw new Error('A professional license is required for registration.');
                }

                // 3. Upload Profile Picture (if provided)
                if (profilePictureFile) {
                    if (profilePictureFile.size > 2 * 1024 * 1024) {
                        throw new Error('Profile picture file size exceeds 2MB limit.');
                    }
                    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
                    if (!allowedImageTypes.includes(profilePictureFile.type)) {
                        throw new Error('Only JPG, PNG, GIF images are allowed for profile pictures.');
                    }
                    const profileStorageRef = storage.ref('profile_pictures/' + user.uid + '/' + profilePictureFile.name);
                    const snapshot = await profileStorageRef.put(profilePictureFile);
                    profileImageUrl = await snapshot.ref.getDownloadURL();
                    if (DEBUG) console.log("Profile picture uploaded:", profileImageUrl);
                }

                // 4. Save User Data (role: practitioner)
                await database.ref('userdata/' + user.uid).set({
                    name: fullName,
                    email: email,
                    role: 'practitioner',
                    img: profileImageUrl,
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                });
                if (DEBUG) console.log("User data saved for practitioner.");

                // 5. Save Practitioner Application Data
                const practitionerData = {
                    fullName: fullName,
                    contactEmail: email,
                    contactPhone: phone,
                    specialty: specialty,
                    yearsExperience: yearsExperience,
                    bio: bio,
                    licenseUrl: licenseUrl,
                    img: profileImageUrl,
                    userId: user.uid,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    status: 'pending',
                    category: 'practitioner'
                };
                await database.ref('applications').push(practitionerData);
                if (DEBUG) console.log("Practitioner application submitted.");

                hideLoading();
                hideAllModals();
                
                // Show success message and redirect to homepage
                showSuccessDialog('Application submitted successfully! You will be contacted shortly.', () => {
                    window.location.href = 'index.html';
                });

            } catch (error) {
                if (DEBUG) console.error("Practitioner registration/submission failed:", error.message);
                hideLoading();
                showErrorDialog('Registration failed: ' + error.message);
                
                // If user creation succeeded but subsequent steps failed, try to delete the user
                if (user) {
                    try {
                        await deleteUserAccount(user);
                    } catch (deleteError) {
                        console.error("Error deleting user account:", deleteError);
                    }
                }
            }
        });
    }
}

// --- Supplier Form Handling ---
function setupSupplierForm() {
    if (DEBUG) console.log("Setting up supplier form...");
    const supplierForm = document.getElementById('supplier-form');
    if (supplierForm) {
        supplierForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showError('supplier-error', '');
            showLoading();

            const orgName = supplierForm['org-name'].value;
            const contactEmail = supplierForm['contact-email'].value;
            const password = supplierForm['supplier-password'].value;
            const contactPhone = supplierForm['contact-phone'].value;
            const productsOffered = supplierForm['products-offered'].value;
            let user = null;

            try {
                // 1. Create User Account
                const userCredential = await auth.createUserWithEmailAndPassword(contactEmail, password);
                user = userCredential.user;
                if (DEBUG) console.log("Supplier account created with UID:", user.uid);

                // 2. Save User Data (role: supplier)
                await database.ref('userdata/' + user.uid).set({
                    name: orgName,
                    email: contactEmail,
                    role: 'supplier',
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                });
                if (DEBUG) console.log("User data saved for supplier.");

                // 3. Save Supplier Application Data
                const supplierData = {
                    orgName: orgName,
                    contactEmail: contactEmail,
                    contactPhone: contactPhone,
                    productsOffered: productsOffered,
                    userId: user.uid,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    status: 'pending',
                    category: 'supplier'
                };
                await database.ref('applications').push(supplierData);
                if (DEBUG) console.log("Supplier application submitted.");

                hideLoading();
                hideAllModals();
                
                // Show success message and redirect to homepage
                showSuccessDialog('Application submitted successfully! You will be contacted shortly.', () => {
                    window.location.href = 'index.html';
                });

            } catch (error) {
                if (DEBUG) console.error("Supplier registration/submission failed:", error.message);
                hideLoading();
                showErrorDialog('Registration failed: ' + error.message);
                
                if (user) {
                    try {
                        await deleteUserAccount(user);
                    } catch (deleteError) {
                        console.error("Error deleting user account:", deleteError);
                    }
                }
            }
        });
    }
}

// --- Center Form Handling ---
function setupCenterForm() {
    if (DEBUG) console.log("Setting up center form...");
    const centerForm = document.getElementById('center-form');
    if (centerForm) {
        centerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showError('center-error', '');
            showLoading();

            const centerName = centerForm['center-name'].value;
            const centerType = centerForm['center-type'].value;
            const address = centerForm['center-address'].value;
            const phone = centerForm['center-phone'].value;
            const email = centerForm['center-email'].value;
            const password = centerForm['center-password'].value;
            const website = centerForm['center-website'].value || '';
            const description = centerForm['center-description'].value;
            const fileInput = centerForm['center-logo'];
            const file = fileInput.files[0];
            let imageUrl = '';
            let user = null;

            try {
                // 1. Create User Account
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                user = userCredential.user;
                if (DEBUG) console.log("Center account created with UID:", user.uid);

                // 2. Upload Center Logo (if provided)
                if (file) {
                    if (file.size > 2 * 1024 * 1024) {
                        throw new Error('Logo file size exceeds 2MB limit.');
                    }
                    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                    if (!allowedTypes.includes(file.type)) {
                        throw new Error('Only JPG, PNG, GIF images are allowed.');
                    }

                    const storageRef = storage.ref('center-logos/' + user.uid + '/' + file.name);
                    const snapshot = await storageRef.put(file);
                    imageUrl = await snapshot.ref.getDownloadURL();
                    if (DEBUG) console.log("Center logo uploaded:", imageUrl);
                }

                // 3. Save User Data (role: center)
                await database.ref('userdata/' + user.uid).set({
                    name: centerName,
                    email: email,
                    role: 'center',
                    img: imageUrl,
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                });
                if (DEBUG) console.log("User data saved for center.");

                // 4. Save Center Application Data
                const centerData = {
                    centerName: centerName,
                    centerType: centerType,
                    address: address,
                    phone: phone,
                    email: email,
                    website: website,
                    description: description,
                    logo: imageUrl,
                    userId: user.uid,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    status: 'pending',
                    category: 'center'
                };
                await database.ref('applications').push(centerData);
                if (DEBUG) console.log("Center application submitted.");

                hideLoading();
                hideAllModals();
                
                // Show success message and redirect to homepage
                showSuccessDialog('Application submitted successfully! You will be contacted shortly.', () => {
                    window.location.href = 'index.html';
                });

            } catch (error) {
                if (DEBUG) console.error("Center registration/submission failed:", error.message);
                hideLoading();
                showErrorDialog('Registration failed: ' + error.message);
                
                if (user) {
                    try {
                        await deleteUserAccount(user);
                    } catch (deleteError) {
                        console.error("Error deleting user account:", deleteError);
                    }
                }
            }
        });
    }
}

// --- Helper Functions ---

/**
 * Shows a loading overlay.
 */
function showLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

/**
 * Hides the loading overlay.
 */
function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

/**
 * Shows a success dialog with a message and optional callback
 * @param {string} message - The success message to display
 * @param {function} callback - Optional callback function to execute after user acknowledges
 */
function showSuccessDialog(message, callback = null) {
    // Create or show success modal
    let successModal = document.getElementById('success-modal');
    
    if (!successModal) {
        // Create success modal if it doesn't exist
        successModal = document.createElement('div');
        successModal.id = 'success-modal';
        successModal.className = 'modal';
        successModal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; text-align: center;">
                <span class="close">&times;</span>
                <div style="color: #28a745; font-size: 48px; margin: 20px 0;">✓</div>
                <h3 style="color: #28a745;">Success!</h3>
                <p id="success-message" style="margin: 20px 0;"></p>
                <button id="success-ok-btn" class="whatsapp-button" style="margin-top: 20px;">OK</button>
            </div>
        `;
        document.body.appendChild(successModal);
        
        // Add event listeners
        successModal.querySelector('.close').addEventListener('click', () => {
            successModal.style.display = 'none';
            if (callback) callback();
        });
        
        successModal.querySelector('#success-ok-btn').addEventListener('click', () => {
            successModal.style.display = 'none';
            if (callback) callback();
        });
        
        // Close on background click
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                successModal.style.display = 'none';
                if (callback) callback();
            }
        });
    }
    
    document.getElementById('success-message').textContent = message;
    successModal.style.display = 'block';
}

/**
 * Shows an error dialog with a message
 * @param {string} message - The error message to display
 */
function showErrorDialog(message) {
    // Create or show error modal
    let errorModal = document.getElementById('error-modal');
    
    if (!errorModal) {
        // Create error modal if it doesn't exist
        errorModal = document.createElement('div');
        errorModal.id = 'error-modal';
        errorModal.className = 'modal';
        errorModal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; text-align: center;">
                <span class="close">&times;</span>
                <div style="color: #dc3545; font-size: 48px; margin: 20px 0;">⚠️</div>
                <h3 style="color: #dc3545;">Error</h3>
                <p id="error-message" style="margin: 20px 0;"></p>
                <button id="error-ok-btn" class="whatsapp-button" style="background-color: #dc3545; margin-top: 20px;">OK</button>
            </div>
        `;
        document.body.appendChild(errorModal);
        
        // Add event listeners
        errorModal.querySelector('.close').addEventListener('click', () => {
            errorModal.style.display = 'none';
        });
        
        errorModal.querySelector('#error-ok-btn').addEventListener('click', () => {
            errorModal.style.display = 'none';
        });
        
        // Close on background click
        errorModal.addEventListener('click', (e) => {
            if (e.target === errorModal) {
                errorModal.style.display = 'none';
            }
        });
    }
    
    document.getElementById('error-message').textContent = message;
    errorModal.style.display = 'block';
}

// Cleans up partially created user accounts if subsequent steps fail
async function deleteUserAccount(user) {
    if (user && auth.currentUser && auth.currentUser.uid === user.uid) {
        try {
            await auth.currentUser.delete();
            if (DEBUG) console.warn("Cleaned up partially created user due to subsequent error.");
        } catch (deleteError) {
            if (DEBUG) console.error("Error deleting partially created user:", deleteError);
        }
    }
}

// Handles actions after successful login
async function handlePostLogin() {
    if (DEBUG) console.log("Handling post-login actions");
    hideAllModals();

    const redirectTarget = sessionStorage.getItem('postAuthRedirect');
    if (redirectTarget === 'ai-assistant') {
        sessionStorage.removeItem('postAuthRedirect');
        window.location.href = '/ai-assistant/';
    } else {
        // Redirect to homepage after login
        window.location.href = 'index.html';
    }
}

// Displays error messages temporarily
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = message ? 'block' : 'none';
        if (message) {
            setTimeout(() => {
                errorElement.style.display = 'none';
                errorElement.textContent = '';
            }, 5000);
        }
    }
}

/**
 * Checks a user's existing status across applications and approved roles.
 */
async function getExistingOverallStatus(userId) {
    try {
        // 1. Check user's primary role in 'userdata'
        const userDataSnapshot = await database.ref('userdata/' + userId).once('value');
        const userData = userDataSnapshot.val();
        if (userData && (userData.role === 'practitioner' || userData.role === 'supplier' || userData.role === 'center')) {
            return { status: 'approved', roleName: userData.role };
        }

        // 2. Check 'applications' for pending status
        const appSnapshot = await database.ref('applications')
            .orderByChild('userId')
            .equalTo(userId)
            .once('value');

        if (appSnapshot.exists()) {
            let pendingCategory = null;
            appSnapshot.forEach(childSnapshot => {
                const app = childSnapshot.val();
                if (app.status === 'pending') {
                    pendingCategory = app.category;
                    return true; // Break forEach
                }
            });
            if (pendingCategory) {
                return { status: 'pending', roleName: pendingCategory };
            }
        }

        return null; // No existing status found
    } catch (error) {
        console.error("Error checking existing overall status:", error);
        return { status: 'error' };
    }
}

// --- User State Handling (Authenticated/Unauthenticated) ---

async function handleAuthenticatedState(user) {
    if (DEBUG) console.log("Handling authenticated state for user:", user.uid);

    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const profileImageNav = document.querySelector('.profile-image-nav');
    const navToggle = document.getElementById('nav-toggle');
    const myProfileNavItem = document.getElementById('my-profile-nav-item');
    const navMenu = document.getElementById('nav-menu');

    const regularUserSection = document.querySelector('.regular-user');
    const joinPractitionerSection = document.querySelector('.join-practitioner');
    const myCenterSection = document.querySelector('.my-center');
    const becomeSupplierSection = document.querySelector('.become-supplier');
    const registrationStatusMessageContainer = document.getElementById('registration-status-message');

    // Hide all registration sections by default when authenticated
    if (regularUserSection) regularUserSection.style.display = 'none';
    if (joinPractitionerSection) joinPractitionerSection.style.display = 'none';
    if (myCenterSection) myCenterSection.style.display = 'none';
    if (becomeSupplierSection) becomeSupplierSection.style.display = 'none';
    if (registrationStatusMessageContainer) registrationStatusMessageContainer.style.display = 'none';
    registrationStatusMessageContainer.innerHTML = '';

    // Hide login button
    if (loginBtn) loginBtn.style.display = 'none';

    // Show logout button
    if (logoutBtn) {
        const isUsersPage = window.location.pathname.includes('users.html');
        const urlParams = new URLSearchParams(window.location.search);
        const profileUserId = urlParams.get('id');
        logoutBtn.style.display = (isUsersPage && user.uid === profileUserId) ? 'block' : 'none';
    }

    // Fetch user data to update profile image
    database.ref('userdata/' + user.uid).once('value')
        .then(async snapshot => {
            const userData = snapshot.val();
            const profileImageUrl = (userData && userData.img) ? userData.img : 'assets/img/profile.png';

            const profileImageElement = profileImageNav?.querySelector('img');
            if (profileImageElement) {
                profileImageElement.src = profileImageUrl;
            }

            const myProfileLink = myProfileNavItem?.querySelector('a');
            if (myProfileLink) {
                myProfileLink.href = `users.html?id=${user.uid}`;
            }

            // Adjust nav visibility based on screen size
            if (window.innerWidth <= 991) {
                if (navToggle) navToggle.style.display = 'none';
                if (profileImageNav) profileImageNav.style.display = 'block';
                if (myProfileNavItem) myProfileNavItem.style.display = 'block';
                if (navMenu) navMenu.classList.add('logged-in-mobile');
            } else {
                if (navToggle) navToggle.style.display = 'none';
                if (profileImageNav) profileImageNav.style.display = 'block';
                if (myProfileNavItem) myProfileNavItem.style.display = 'none';
                if (navMenu) navMenu.classList.remove('logged-in-mobile');
            }

            // --- Dynamic Content Display based on User Role/Application Status ---
            const userStatus = await getExistingOverallStatus(user.uid);

            if (userStatus) {
                if (userStatus.status === 'approved') {
                    if (registrationStatusMessageContainer) {
                        let roleDisplayName = userStatus.roleName;
                        if (roleDisplayName === 'practitioner') roleDisplayName = 'a Professional';
                        else if (roleDisplayName === 'supplier') roleDisplayName = 'a Supplier';
                        else if (roleDisplayName === 'center') roleDisplayName = 'a Center';

                        registrationStatusMessageContainer.innerHTML = `
                            <p style="text-align: center; font-size: 1.5em; color: #333; margin-top: 50px;">
                                YOU ARE ALREADY REGISTERED AS ${roleDisplayName.toUpperCase()}.
                            </p>
                        `;
                        registrationStatusMessageContainer.style.display = 'block';
                    }
                } else if (userStatus.status === 'pending') {
                    if (registrationStatusMessageContainer) {
                        registrationStatusMessageContainer.innerHTML = `
                            <p style="text-align: center; font-size: 1.5em; color: #333; margin-top: 50px;">
                                YOUR APPLICATION WAS SUCCESSFULLY SUBMITTED AND IT'S STILL IN REVIEW. WE WILL ATTEND TO IT SHORTLY.
                            </p>
                            <div style="text-align: center; margin-top: 20px;">
                                <a href="mailto:rehabverve@gmail.com?subject=Complaint%20or%20Appeal%20Regarding%20My%20Application%20(User%20ID%3A%20${user.uid})" class="whatsapp-button" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; border-radius: 5px; text-decoration: none;">
                                    Email Us for Complaints or Appeal
                                </a>
                            </div>
                        `;
                        registrationStatusMessageContainer.style.display = 'block';
                    }
                } else if (userStatus.status === 'error') {
                    if (registrationStatusMessageContainer) {
                        registrationStatusMessageContainer.innerHTML = `
                            <p style="text-align: center; font-size: 1.5em; color: red; margin-top: 50px;">
                                An error occurred while checking your registration status. Please try again later.
                            </p>
                        `;
                        registrationStatusMessageContainer.style.display = 'block';
                    }
                }
            } else {
                // User is logged in but is a regular user - show registration options
                if (joinPractitionerSection) joinPractitionerSection.style.display = 'block';
                if (myCenterSection) myCenterSection.style.display = 'block';
                if (becomeSupplierSection) becomeSupplierSection.style.display = 'block';
            }

        })
        .catch(error => {
            console.error("Error fetching user data or checking statuses:", error);
            const profileImageElement = profileImageNav?.querySelector('img');
            if (profileImageElement) {
                profileImageElement.src = 'assets/img/default-profile.png';
            }

            if (window.innerWidth <= 991) {
                if (navToggle) navToggle.style.display = 'none';
                if (profileImageNav) profileImageNav.style.display = 'block';
                if (myProfileNavItem) myProfileNavItem.style.display = 'block';
            } else {
                if (navToggle) navToggle.style.display = 'none';
                if (profileImageNav) profileImageNav.style.display = 'block';
                if (myProfileNavItem) myProfileNavItem.style.display = 'none';
            }
        });

    document.body.classList.add('logged-in');
}

function handleUnauthenticatedState() {
    if (DEBUG) console.log("Handling unauthenticated state.");

    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const profileImageNav = document.querySelector('.profile-image-nav');
    const navToggle = document.getElementById('nav-toggle');
    const myProfileNavItem = document.getElementById('my-profile-nav-item');
    const navMenu = document.getElementById('nav-menu');

    const regularUserSection = document.querySelector('.regular-user');
    const joinPractitionerSection = document.querySelector('.join-practitioner');
    const myCenterSection = document.querySelector('.my-center');
    const becomeSupplierSection = document.querySelector('.become-supplier');
    const registrationStatusMessageContainer = document.getElementById('registration-status-message');

    // Show all registration sections when unauthenticated
    if (regularUserSection) regularUserSection.style.display = 'block';
    if (joinPractitionerSection) joinPractitionerSection.style.display = 'block';
    if (myCenterSection) myCenterSection.style.display = 'block';
    if (becomeSupplierSection) becomeSupplierSection.style.display = 'block';
    if (registrationStatusMessageContainer) registrationStatusMessageContainer.style.display = 'none';
    registrationStatusMessageContainer.innerHTML = '';

    // Show login button, hide logout
    if (loginBtn) loginBtn.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';

    // Adjust nav visibility based on screen size
    if (window.innerWidth <= 991) {
        if (navToggle) navToggle.style.display = 'block';
        if (profileImageNav) profileImageNav.style.display = 'none';
        if (myProfileNavItem) myProfileNavItem.style.display = 'none';
    } else {
        if (navToggle) navToggle.style.display = 'none';
        if (profileImageNav) profileImageNav.style.display = 'none';
        if (myProfileNavItem) myProfileNavItem.style.display = 'none';
    }

    document.body.classList.remove('logged-in');
    if (navMenu) navMenu.classList.remove('logged-in-mobile');
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);
