// auth.js - Complete Implementation with Practitioner, Supplier, and Center Registration
const DEBUG = true;

function initializeApp() {
    if (DEBUG) console.log("Initializing application...");

    auth.onAuthStateChanged(async user => {
        if (user) {
            if (DEBUG) console.log("User authenticated:", user.uid);
            await handleAuthenticatedState(user);
            
            // Hide Join our Network section for logged-in users
            const joinSection = document.querySelector('.join-practitioner22');
            if (joinSection) joinSection.style.display = 'none';
        } else {
            if (DEBUG) console.log("User not authenticated");
            handleUnauthenticatedState();
            
            // Show Join our Network section for logged-out users
            const joinSection = document.querySelector('.join-practitioner22');
            if (joinSection) joinSection.style.display = 'block';
        }
    });

    setupEventListeners();
    setupAuthForms();
    setupSupplierForm();
    setupPractitionerForm();
    setupCenterForm();

    // Add AI Assistant button event listener
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

    document.querySelectorAll('.modal .close, .modal .modal-close').forEach(btn => {
        btn.addEventListener('click', hideAllModals);
    });

    // Supplier CTA
    const supplierCtaBtn = document.getElementById('supplier-cta-btn');
    if (supplierCtaBtn) {
        supplierCtaBtn.addEventListener('click', () => {
            const user = auth.currentUser;
            if (DEBUG) console.log("Supplier CTA clicked. User:", user ? user.uid : "None");

            if (user) {
                showModal('supplier-modal');
            } else {
                sessionStorage.setItem('postAuthAction', 'showSupplierForm');
                showModal('auth-modal');
            }
        });
    }

    // Practitioner CTA
    const joinButton = document.getElementById('join-button');
    if (joinButton) {
        joinButton.addEventListener('click', (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (DEBUG) console.log("Join Practitioner button clicked. User:", user ? user.uid : "None");

            if (user) {
                showModal('practitioner-modal');
            } else {
                sessionStorage.setItem('postAuthAction', 'showPractitionerForm');
                showModal('auth-modal');
            }
        });
    }

    // Center CTA
    const centerButton = document.getElementById('center-button');
    if (centerButton) {
        centerButton.addEventListener('click', (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (DEBUG) console.log("Center button clicked. User:", user ? user.uid : "None");

            if (user) {
                showModal('center-modal');
            } else {
                sessionStorage.setItem('postAuthAction', 'showCenterForm');
                showModal('auth-modal');
            }
        });
    }

    // Login button
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            if (DEBUG) console.log("Login button clicked.");
            sessionStorage.removeItem('postAuthAction');
            showModal('auth-modal');
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
            }).catch(error => {
                console.error("Logout error:", error);
            });
        });
    }

    // Profile image click
    const profileImageNav = document.querySelector('.profile-image-nav');
    if (profileImageNav) {
        profileImageNav.addEventListener('click', () => {
            const user = auth.currentUser;
            if (user) {
                const navMenu = document.getElementById('nav-menu');
                const myProfileNavItem = document.getElementById('my-profile-nav-item');

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

    // Nav toggle
    const navToggle = document.getElementById('nav-toggle');
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            const navMenu = document.getElementById('nav-menu');
            if (navMenu) {
                navMenu.classList.toggle('show');
            }
        });
    }

    // Auth tab switching
    document.getElementById('show-register')?.addEventListener('click', (e) => {
        e.preventDefault();
        switchToRegisterForm();
    });

    document.getElementById('show-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        switchToLoginForm();
    });
}

// Auth tab switching functions
function switchToLoginForm() {
    document.querySelector('.auth-tab[data-form="register"]').classList.remove('active');
    document.querySelector('.auth-tab[data-form="login"]').classList.add('active');
    document.getElementById('register-form').classList.remove('active');
    document.getElementById('login-form').classList.add('active');
}

function switchToRegisterForm() {
    document.querySelector('.auth-tab[data-form="login"]').classList.remove('active');
    document.querySelector('.auth-tab[data-form="register"]').classList.add('active');
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('register-form').classList.add('active');
}

// Modal Management
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
        if (modal.id === 'auth-modal') {
            document.getElementById('login-form').reset();
            showError('login-error', '');
            document.getElementById('register-form').reset();
            showError('register-error', '');
        } else if (modal.id === 'supplier-modal') {
            document.getElementById('supplier-form').reset();
            showError('supplier-error', '');
        } else if (modal.id === 'practitioner-modal') {
            document.getElementById('practitioner-form').reset();
            showError('practitioner-error', '');
        } else if (modal.id === 'center-modal') {
            document.getElementById('center-form').reset();
            showError('center-error', '');
        }
    });
    
    // Hide any spinners that might be visible
    hideAuthSpinner();
}

// Show/hide auth spinner
function showAuthSpinner() {
    const spinner = document.getElementById('auth-spinner');
    if (!spinner) {
        // Create spinner if it doesn't exist
        const spinnerDiv = document.createElement('div');
        spinnerDiv.id = 'auth-spinner';
        spinnerDiv.className = 'spinner';
        spinnerDiv.style.cssText = 'border: 4px solid rgba(0,0,0,0.1); border-top: 4px solid #00BCD4; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto;';
        document.querySelector('.modal-content').appendChild(spinnerDiv);
    } else {
        spinner.style.display = 'block';
    }
}

function hideAuthSpinner() {
    const spinner = document.getElementById('auth-spinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

// Auth Forms
function setupAuthForms() {
    if (DEBUG) console.log("Setting up auth forms...");
    
    // Auth tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const formToShow = tab.dataset.form;
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${formToShow}-form`).classList.add('active');
        });
    });

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showError('login-error', '');
            showAuthSpinner();
            
            const email = loginForm['login-email'].value;
            const password = loginForm['login-password'].value;

            try {
                await auth.signInWithEmailAndPassword(email, password);
                if (DEBUG) console.log("Login successful!");
                hideAuthSpinner();
                
                // Handle post-login redirect
                const redirectTarget = sessionStorage.getItem('postAuthRedirect');
                if (redirectTarget === 'ai-assistant') {
                    sessionStorage.removeItem('postAuthRedirect');
                    window.location.href = '/ai-assistant/';
                } else {
                    handlePostLogin();
                }
            } catch (error) {
                hideAuthSpinner();
                if (DEBUG) console.error("Login error:", error.message);
                showError('login-error', error.message);
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showError('register-error', '');
            showAuthSpinner();

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

                hideAuthSpinner();
                if (DEBUG) console.log("Registration successful! User:", user.uid);
                hideAllModals();
                alert('Account created successfully! You are now logged in.');

                // Handle post-registration redirect
                const redirectTarget = sessionStorage.getItem('postAuthRedirect');
                if (redirectTarget === 'ai-assistant') {
                    sessionStorage.removeItem('postAuthRedirect');
                    window.location.href = '/ai-assistant/';
                } else {
                    // Redirect to the previous page
                    redirectToPreviousPage();
                }
            } catch (error) {
                hideAuthSpinner();
                if (DEBUG) console.error("Registration error:", error.message);
                showError('register-error', error.message);
            }
        });
    }
}

// Practitioner Form
function setupPractitionerForm() {
    if (DEBUG) console.log("Setting up practitioner form...");
    const practitionerForm = document.getElementById('practitioner-form');
    if (practitionerForm) {
        practitionerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showError('practitioner-error', '');
            showLoading();

            const user = auth.currentUser;
            if (!user) {
                hideLoading();
                showError('practitioner-error', 'You must be logged in to submit this form.');
                return;
            }

            // Check for existing applications
            const hasExistingApp = await checkExistingApplications(user.uid);
            if (hasExistingApp) {
                hideLoading();
                showError('practitioner-error', 'You already have an application submitted.');
                return;
            }

            const fileInput = practitionerForm['prof-picture'];
            const file = fileInput.files[0];
            let imageUrl = '';

            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    hideLoading();
                    showError('practitioner-error', 'Image file size exceeds 2MB limit.');
                    return;
                }
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!allowedTypes.includes(file.type)) {
                    hideLoading();
                    showError('practitioner-error', 'Only JPG, PNG, GIF images are allowed.');
                    return;
                }

                const storageRef = storage.ref('posters/' + user.uid + '/' + file.name);
                try {
                    const snapshot = await storageRef.put(file);
                    imageUrl = await snapshot.ref.getDownloadURL();
                    if (DEBUG) console.log("Image uploaded:", imageUrl);

                    await database.ref('userdata/' + user.uid).update({
                        img: imageUrl
                    });
                } catch (error) {
                    hideLoading();
                    if (DEBUG) console.error("Image upload error:", error.message);
                    showError('practitioner-error', 'Failed to upload image: ' + error.message);
                    return;
                }
            }

            const practitionerData = {
                fullName: practitionerForm['prof-name'].value,
                contactEmail: practitionerForm['prof-email'].value,
                contactPhone: practitionerForm['prof-phone'].value,
                specialty: practitionerForm['prof-specialty'].value,
                yearsExperience: parseInt(practitionerForm['prof-experience'].value, 10),
                bio: practitionerForm['prof-bio'].value,
                img: imageUrl,
                userId: user.uid,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                status: 'pending',
                category: 'practitioner'
            };

            try {
                await database.ref('applications').push(practitionerData);
                hideLoading();
                alert('Your professional application has been submitted successfully! We will review it shortly.');
                hideAllModals();
                practitionerForm.reset();
                const joinPractitionerSection = document.querySelector('.join-practitioner');
                if (joinPractitionerSection) joinPractitionerSection.style.display = 'none';
            } catch (error) {
                hideLoading();
                if (DEBUG) console.error("Practitioner submission failed:", error.message);
                showError('practitioner-error', 'Submission failed: ' + error.message);
            }
        });
    }
}

// Supplier Form
function setupSupplierForm() {
    if (DEBUG) console.log("Setting up supplier form...");
    const supplierForm = document.getElementById('supplier-form');
    if (supplierForm) {
        supplierForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showError('supplier-error', '');
            showLoading();

            const user = auth.currentUser;
            if (!user) {
                hideLoading();
                showError('supplier-error', 'You must be logged in to submit this form.');
                return;
            }

            // Check for existing applications
            const hasExistingApp = await checkExistingApplications(user.uid);
            if (hasExistingApp) {
                hideLoading();
                showError('supplier-error', 'You already have an application submitted.');
                return;
            }

            const supplierData = {
                orgName: supplierForm['org-name'].value,
                contactEmail: supplierForm['contact-email'].value,
                contactPhone: supplierForm['contact-phone'].value,
                productsOffered: supplierForm['products-offered'].value,
                userId: user.uid,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                status: 'pending',
                category: 'supplier'
            };

            try {
                await database.ref('applications').push(supplierData);
                hideLoading();
                alert('Your supplier application has been submitted successfully!');
                hideAllModals();
                supplierForm.reset();
                const supplierSection = document.querySelector('.become-supplier');
                if (supplierSection) supplierSection.style.display = 'none';
            } catch (error) {
                hideLoading();
                if (DEBUG) console.error("Supplier submission failed:", error.message);
                showError('supplier-error', 'Submission failed: ' + error.message);
            }
        });
    }
}

// Center Form
function setupCenterForm() {
    if (DEBUG) console.log("Setting up center form...");
    const centerForm = document.getElementById('center-form');
    if (centerForm) {
        centerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showError('center-error', '');
            showLoading();

            const user = auth.currentUser;
            if (!user) {
                hideLoading();
                showError('center-error', 'You must be logged in to register a center.');
                return;
            }

            // Check for existing applications
            const hasExistingApp = await checkExistingApplications(user.uid);
            if (hasExistingApp) {
                hideLoading();
                showError('center-error', 'You already have an application submitted.');
                return;
            }

            const fileInput = centerForm['center-logo'];
            const file = fileInput.files[0];
            let imageUrl = '';

            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    hideLoading();
                    showError('center-error', 'Logo file size exceeds 2MB limit.');
                    return;
                }
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!allowedTypes.includes(file.type)) {
                    hideLoading();
                    showError('center-error', 'Only JPG, PNG, GIF images are allowed.');
                    return;
                }

                const storageRef = storage.ref('center-logos/' + user.uid + '/' + file.name);
                try {
                    const snapshot = await storageRef.put(file);
                    imageUrl = await snapshot.ref.getDownloadURL();
                    if (DEBUG) console.log("Center logo uploaded:", imageUrl);
                } catch (error) {
                    hideLoading();
                    if (DEBUG) console.error("Logo upload error:", error.message);
                    showError('center-error', 'Failed to upload logo: ' + error.message);
                    return;
                }
            }

            const centerData = {
                centerName: centerForm['center-name'].value,
                centerType: centerForm['center-type'].value,
                address: centerForm['center-address'].value,
                phone: centerForm['center-phone'].value,
                email: centerForm['center-email'].value,
                website: centerForm['center-website'].value || '',
                description: centerForm['center-description'].value,
                logo: imageUrl,
                userId: user.uid,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                status: 'pending',
                category: 'center'
            };

            try {
                await database.ref('applications').push(centerData);
                hideLoading();
                alert('Your center registration has been submitted successfully! We will review it shortly.');
                hideAllModals();
                centerForm.reset();
                const centerSection = document.querySelector('.my-center');
                if (centerSection) centerSection.style.display = 'none';
            } catch (error) {
                hideLoading();
                if (DEBUG) console.error("Center registration failed:", error.message);
                showError('center-error', 'Registration failed: ' + error.message);
            }
        });
    }
}

// Helper Functions
async function handlePostLogin() {
    if (DEBUG) console.log("Handling post-login actions");
    hideAllModals();

    const postAuthAction = sessionStorage.getItem('postAuthAction');
    if (postAuthAction === 'showSupplierForm') {
        sessionStorage.removeItem('postAuthAction');
        if (DEBUG) console.log("Post-auth action: Showing supplier form.");
        showModal('supplier-modal');
    } else if (postAuthAction === 'showPractitionerForm') {
        sessionStorage.removeItem('postAuthAction');
        if (DEBUG) console.log("Post-auth action: Showing practitioner form.");
        showModal('practitioner-modal');
    } else if (postAuthAction === 'showCenterForm') {
        sessionStorage.removeItem('postAuthAction');
        if (DEBUG) console.log("Post-auth action: Showing center form.");
        showModal('center-modal');
    }
    await handleAuthenticatedState(auth.currentUser);
}

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

async function checkExistingApplications(userId) {
    try {
        const snapshot = await database.ref('applications')
            .orderByChild('userId')
            .equalTo(userId)
            .once('value');
        
        return snapshot.exists();
    } catch (error) {
        console.error("Error checking applications:", error);
        return false;
    }
}

// START: NEW FUNCTION TO CHECK USER ROLE AND SET AI BUTTON VISIBILITY
async function checkUserRoleAndSetAIVisibility(userId) {
    if (DEBUG) console.log("Checking user role for AI button visibility for user:", userId);

    const aiAssistantBtn = document.querySelector('.floating-ai-button');
    const aiTherapistBtn = document.querySelector('.floating-ai-button22');

    if (!aiAssistantBtn || !aiTherapistBtn) {
        console.error("AI floating buttons not found in the DOM.");
        return;
    }

    try {
        // Check if the user ID exists in the 'professionals' or 'centers' table
        const professionalRef = database.ref('professionals').orderByChild('userID').equalTo(userId);
        const centerRef = database.ref('centers').orderByChild('userId').equalTo(userId);

        const [professionalSnapshot, centerSnapshot] = await Promise.all([
            professionalRef.once('value'),
            centerRef.once('value')
        ]);

        const isProfessionalOrCenter = professionalSnapshot.exists() || centerSnapshot.exists();

        if (isProfessionalOrCenter) {
            if (DEBUG) console.log("User is a professional or center. Showing AI Assistant.");
            aiAssistantBtn.style.display = 'none';
            aiTherapistBtn.style.display = 'none';
        } else {
            if (DEBUG) console.log("User is a regular user. Showing AI Therapist.");
            aiAssistantBtn.style.display = 'none';
            aiTherapistBtn.style.display = 'none';
        }
    } catch (error) {
        console.error("Error checking user role for AI buttons:", error);
        // Default to showing the therapist button for regular users on error
        aiAssistantBtn.style.display = 'none';
        aiTherapistBtn.style.display = 'flex';
    }
}
// END: NEW FUNCTION

// Show/hide loading spinner
function showLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// Auth State Management
async function handleAuthenticatedState(user) {
    if (DEBUG) console.log("Handling authenticated state for user:", user.uid);

    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const profileImageNav = document.querySelector('.profile-image-nav');
    const navToggle = document.getElementById('nav-toggle');
    const myProfileNavItem = document.getElementById('my-profile-nav-item');
    const myMobileProfileNavItem = document.getElementById('mobile-profile-nav');
    const navMenu = document.getElementById('nav-menu');
    
    // Hide Join our Network section
    const joinSection = document.querySelector('.join-practitioner22');
    if (joinSection) joinSection.style.display = 'none';

    if (loginBtn) loginBtn.style.display = 'none';

    // Conditional logout button visibility
    if (logoutBtn) {
        const isUsersPage = window.location.pathname.includes('users.html');
        if (isUsersPage) {
            const urlParams = new URLSearchParams(window.location.search);
            const profileUserId = urlParams.get('id');
            logoutBtn.style.display = (user.uid === profileUserId) ? 'block' : 'none';
        } else {
            logoutBtn.style.display = 'none';
        }
    }

    database.ref('userdata/' + user.uid).once('value')
        .then(snapshot => {
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
        })
        .catch(error => {
            console.error("Error fetching user data:", error);
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

    // START: ADDED CALL TO CHECK USER ROLE
    await checkUserRoleAndSetAIVisibility(user.uid);
    // END: ADDED CALL

    document.body.classList.add('logged-in');
}

function handleUnauthenticatedState() {
    if (DEBUG) console.log("Handling unauthenticated state.");
    
    // START: ADDED LOGIC FOR AI BUTTONS WHEN LOGGED OUT
    const aiAssistantBtn = document.querySelector('.floating-ai-button');
    const aiTherapistBtn = document.querySelector('.floating-ai-button22');
    if (aiAssistantBtn) aiAssistantBtn.style.display = 'none';
    if (aiTherapistBtn) aiTherapistBtn.style.display = 'flex'; // Show therapist button by default
    // END: ADDED LOGIC

    // Show Join our Network section
    const joinSection = document.querySelector('.join-practitioner22');
    if (joinSection) joinSection.style.display = 'block';

    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const profileImageNav = document.querySelector('.profile-image-nav');
    const navToggle = document.getElementById('nav-toggle');
    const myProfileNavItem = document.getElementById('my-profile-nav-item');
    const navMenu = document.getElementById('nav-menu');

    if (loginBtn) loginBtn.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';

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

function checkMerchantStatus(userId) {
    if (DEBUG) console.log("Checking merchant status for user:", userId);

    database.ref('merchants').orderByChild('userId').equalTo(userId).once('value')
        .then(snapshot => {
            const supplierSection = document.querySelector('.become-supplier');
            if (supplierSection) {
                supplierSection.style.display = snapshot.exists() ? 'none' : 'block';
                if (DEBUG) console.log("User is a merchant applicant:", snapshot.exists());
            }
        })
        .catch(error => {
            console.error("Merchant check error:", error);
        });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', initializeApp);

