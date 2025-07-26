// registration.js - Complete Implementation with Dynamic Section Visibility and Status Messages

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
                // This scenario should ideally not happen if section is hidden correctly
                alert('You are already registered and logged in!');
            } else {
                sessionStorage.removeItem('postAuthAction'); // Clear any previous post-auth actions
                showModal('auth-modal');
                switchToRegisterForm();
            }
        });
    }

    // Supplier CTA - Now handled by visibility in handleAuthenticatedState
    const supplierCtaBtn = document.getElementById('supplier-cta-btn');
    if (supplierCtaBtn) {
        supplierCtaBtn.addEventListener('click', () => {
            if (DEBUG) console.log("Supplier CTA clicked. Displaying supplier modal directly.");
            showModal('supplier-modal');
        });
    }

    // Practitioner CTA - Now handled by visibility in handleAuthenticatedState
    const joinButton = document.getElementById('join-button');
    if (joinButton) {
        joinButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (DEBUG) console.log("Join Practitioner button clicked. Displaying practitioner modal directly.");
            showModal('practitioner-modal');
        });
    }

    // Center CTA - Now handled by visibility in handleAuthenticatedState
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
            sessionStorage.removeItem('postAuthAction'); // Clear any previous post-auth actions
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
                // Redirect to homepage or refresh to reflect unauthenticated state
                window.location.reload();
            }).catch(error => {
                console.error("Logout error:", error);
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
                // For smaller screens, toggle mobile menu. For larger, go to profile.
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
    document.querySelector('.auth-tab[data-form="register"]').classList.remove('active');
    document.querySelector('.auth-tab[data-form="login"]').classList.add('active');
    document.getElementById('register-form').classList.remove('active');
    document.getElementById('login-form').classList.add('active');
}

function switchToRegisterForm() {
    if (DEBUG) console.log("Switching to register form");
    document.querySelector('.auth-tab[data-form="login"]').classList.remove('active');
    document.querySelector('.auth-tab[data-form="register"]').classList.add('active');
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('register-form').classList.add('active');
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

            const email = loginForm['login-email'].value;
            const password = loginForm['login-password'].value;

            try {
                await auth.signInWithEmailAndPassword(email, password);
                if (DEBUG) console.log("Login successful!");

                // Handle post-login redirect (e.g., for AI Assistant)
                const redirectTarget = sessionStorage.getItem('postAuthRedirect');
                if (redirectTarget === 'ai-assistant') {
                    sessionStorage.removeItem('postAuthRedirect');
                    window.location.href = '/ai-assistant/';
                } else {
                    handlePostLogin();
                }
            } catch (error) {
                if (DEBUG) console.error("Login error:", error.message);
                showError('login-error', error.message);
            }
        });
    }

    // Registration Form Submission (for regular users)
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showError('register-error', '');

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
                hideAllModals();
                alert('Account created successfully! You are now logged in.');

                // Handle post-registration redirect (e.g., for AI Assistant or previous page)
                const redirectTarget = sessionStorage.getItem('postAuthRedirect');
                if (redirectTarget === 'ai-assistant') {
                    sessionStorage.removeItem('postAuthRedirect');
                    window.location.href = '/ai-assistant/';
                } else {
                    // Redirect to the previous page
                    redirectToPreviousPage();
                }
            } catch (error) {
                if (DEBUG) console.error("Registration error:", error.message);
                showError('register-error', error.message);
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

            const fullName = practitionerForm['prof-name'].value;
            const email = practitionerForm['prof-email'].value;
            const password = practitionerForm['prof-password'].value;
            const phone = practitionerForm['prof-phone'].value;
            const specialty = practitionerForm['prof-specialty'].value;
            const yearsExperience = parseInt(practitionerForm['prof-experience'].value, 10);
            const bio = practitionerForm['prof-bio'].value;
            const fileInput = practitionerForm['prof-picture'];
            const file = fileInput.files[0];
            let imageUrl = '';
            let user = null; // Initialize user as null

            try {
                // 1. Create User Account
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                user = userCredential.user;
                if (DEBUG) console.log("Practitioner account created with UID:", user.uid);

                // 2. Upload Profile Picture (if provided)
                if (file) {
                    if (file.size > 2 * 1024 * 1024) {
                        showError('practitioner-error', 'Image file size exceeds 2MB limit.');
                        await deleteUserAccount(user); // Attempt to delete partially created user
                        return;
                    }
                    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                    if (!allowedTypes.includes(file.type)) {
                        showError('practitioner-error', 'Only JPG, PNG, GIF images are allowed.');
                        await deleteUserAccount(user); // Attempt to delete partially created user
                        return;
                    }

                    const storageRef = storage.ref('profile_pictures/' + user.uid + '/' + file.name);
                    const snapshot = await storageRef.put(file);
                    imageUrl = await snapshot.ref.getDownloadURL();
                    if (DEBUG) console.log("Profile picture uploaded:", imageUrl);
                }

                // 3. Save User Data (role: practitioner)
                await database.ref('userdata/' + user.uid).set({
                    name: fullName,
                    email: email,
                    role: 'practitioner',
                    img: imageUrl, // Store profile image URL
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                });
                if (DEBUG) console.log("User data saved for practitioner.");

                // 4. Save Practitioner Application Data
                const practitionerData = {
                    fullName: fullName,
                    contactEmail: email,
                    contactPhone: phone,
                    specialty: specialty,
                    yearsExperience: yearsExperience,
                    bio: bio,
                    img: imageUrl, // Store image URL in application too
                    userId: user.uid,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    status: 'pending', // Application status
                    category: 'practitioner'
                };
                await database.ref('applications').push(practitionerData); // Submit to applications
                if (DEBUG) console.log("Practitioner application submitted.");

                alert('Your professional account has been created and application submitted successfully! You are now logged in and we will review your application shortly.');
                hideAllModals();
                practitionerForm.reset();

                // Hide the practitioner section after successful registration (handled by handleAuthenticatedState)
                // const joinPractitionerSection = document.querySelector('.join-practitioner');
                // if (joinPractitionerSection) joinPractitionerSection.style.display = 'none';

                // Redirect to the previous page
                redirectToPreviousPage();

            } catch (error) {
                if (DEBUG) console.error("Practitioner registration/submission failed:", error.message);
                showError('practitioner-error', 'Registration failed: ' + error.message);
                // If user creation succeeded but subsequent steps failed, try to delete the user
                if (user) {
                    await deleteUserAccount(user);
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

            const orgName = supplierForm['org-name'].value;
            const contactEmail = supplierForm['contact-email'].value;
            const password = supplierForm['supplier-password'].value;
            const contactPhone = supplierForm['contact-phone'].value;
            const productsOffered = supplierForm['products-offered'].value;
            let user = null; // Initialize user as null

            try {
                // 1. Create User Account
                const userCredential = await auth.createUserWithEmailAndPassword(contactEmail, password);
                user = userCredential.user;
                if (DEBUG) console.log("Supplier account created with UID:", user.uid);

                // 2. Save User Data (role: supplier)
                await database.ref('userdata/' + user.uid).set({
                    name: orgName, // Using orgName as the user's display name
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
                    status: 'pending', // Application status
                    category: 'supplier'
                };
                await database.ref('applications').push(supplierData); // Submit to applications
                if (DEBUG) console.log("Supplier application submitted.");

                alert('Your supplier account has been created and application submitted successfully! You are now logged in.');
                hideAllModals();
                supplierForm.reset();

                // Hide the supplier section after successful registration (handled by handleAuthenticatedState)
                // const supplierSection = document.querySelector('.become-supplier');
                // if (supplierSection) supplierSection.style.display = 'none';

                // Redirect to the previous page
                redirectToPreviousPage();

            } catch (error) {
                if (DEBUG) console.error("Supplier registration/submission failed:", error.message);
                showError('supplier-error', 'Registration failed: ' + error.message);
                if (user) {
                    await deleteUserAccount(user);
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
            let user = null; // Initialize user as null

            try {
                // 1. Create User Account
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                user = userCredential.user;
                if (DEBUG) console.log("Center account created with UID:", user.uid);

                // 2. Upload Center Logo (if provided)
                if (file) {
                    if (file.size > 2 * 1024 * 1024) {
                        showError('center-error', 'Logo file size exceeds 2MB limit.');
                        await deleteUserAccount(user); // Attempt to delete partially created user
                        return;
                    }
                    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                    if (!allowedTypes.includes(file.type)) {
                        showError('center-error', 'Only JPG, PNG, GIF images are allowed.');
                        await deleteUserAccount(user); // Attempt to delete partially created user
                        return;
                    }

                    const storageRef = storage.ref('center-logos/' + user.uid + '/' + file.name);
                    const snapshot = await storageRef.put(file);
                    imageUrl = await snapshot.ref.getDownloadURL();
                    if (DEBUG) console.log("Center logo uploaded:", imageUrl);
                }

                // 3. Save User Data (role: center)
                await database.ref('userdata/' + user.uid).set({
                    name: centerName, // Using centerName as the user's display name
                    email: email,
                    role: 'center',
                    img: imageUrl, // Save logo as user's profile image
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
                    status: 'pending', // Application status
                    category: 'center'
                };
                await database.ref('applications').push(centerData); // Submit to applications
                if (DEBUG) console.log("Center application submitted.");

                alert('Your center account has been created and registration submitted successfully! You are now logged in and we will review your registration shortly.');
                hideAllModals();
                centerForm.reset();

                // Hide the center section after successful registration (handled by handleAuthenticatedState)
                // const centerSection = document.querySelector('.my-center');
                // if (centerSection) centerSection.style.display = 'none';

                // Redirect to the previous page
                redirectToPreviousPage();

            } catch (error) {
                if (DEBUG) console.error("Center registration/submission failed:", error.message);
                showError('center-error', 'Registration failed: ' + error.message);
                if (user) {
                    await deleteUserAccount(user);
                }
            }
        });
    }
}

// --- Helper Functions ---

// Handles redirection to the previous page
function redirectToPreviousPage() {
    if (document.referrer && document.referrer !== window.location.href) {
        window.location.href = document.referrer;
    } else {
        window.history.back(); // Fallback if referrer is not available or is the current page
    }
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

// Handles actions after successful login (e.g., redirecting from AI assistant flow)
async function handlePostLogin() {
    if (DEBUG) console.log("Handling post-login actions");
    hideAllModals();

    const redirectTarget = sessionStorage.getItem('postAuthRedirect');
    if (redirectTarget === 'ai-assistant') {
        sessionStorage.removeItem('postAuthRedirect');
        window.location.href = '/ai-assistant/';
    } else {
        // Since supplier/practitioner/center forms now handle registration directly,
        // no other post-auth actions are needed here besides updating UI for logged-in state.
    }
    await handleAuthenticatedState(auth.currentUser);
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
            }, 5000); // Error message disappears after 5 seconds
        }
    }
}

/**
 * Checks a user's existing status across applications and approved roles.
 * @param {string} userId - The UID of the user.
 * @returns {Promise<{status: string, roleName?: string}|null>} A promise that resolves to an object
 * with 'status' ('approved', 'pending', 'error') and 'roleName' if approved/pending. Returns null if no relevant status found.
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

// Updates UI when a user is logged in
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
    const registrationStatusMessageContainer = document.getElementById('registration-status-message'); // Ensure this div exists in your HTML

    // Hide all registration sections by default when authenticated
    if (regularUserSection) regularUserSection.style.display = 'none';
    if (joinPractitionerSection) joinPractitionerSection.style.display = 'none';
    if (myCenterSection) myCenterSection.style.display = 'none';
    if (becomeSupplierSection) becomeSupplierSection.style.display = 'none';
    if (registrationStatusMessageContainer) registrationStatusMessageContainer.style.display = 'none';
    registrationStatusMessageContainer.innerHTML = ''; // Clear previous messages

    // Hide login button
    if (loginBtn) loginBtn.style.display = 'none';

    // Show logout button (only if on a user's own profile page, otherwise hide for simplicity on this page)
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
                if (myProfileNavItem) myProfileNavItem.style.display = 'none'; // My Profile is in dropdown on desktop
                if (navMenu) navMenu.classList.remove('logged-in-mobile');
            }

            // --- Dynamic Content Display based on User Role/Application Status ---
            const userStatus = await getExistingOverallStatus(user.uid);

            if (userStatus) {
                if (userStatus.status === 'approved') {
                    // User is already an approved professional, supplier, or center
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
                    // User has a pending application
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
                    // Error occurred while checking status
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
                // User is logged in but is a regular user (or no specific role/pending application found).
                // In this case, we want to show the professional/supplier/center sections.
                if (joinPractitionerSection) joinPractitionerSection.style.display = 'block';
                if (myCenterSection) myCenterSection.style.display = 'block';
                if (becomeSupplierSection) becomeSupplierSection.style.display = 'block';
            }

        })
        .catch(error => {
            console.error("Error fetching user data or checking statuses:", error);
            // Fallback for profile image if user data fetch fails
            const profileImageElement = profileImageNav?.querySelector('img');
            if (profileImageElement) {
                profileImageElement.src = 'assets/img/default-profile.png';
            }

            // Ensure proper display even on error
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

// Resets UI when no user is logged in
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

    // Show all registration sections and hide status message when unauthenticated
    if (regularUserSection) regularUserSection.style.display = 'block';
    if (joinPractitionerSection) joinPractitionerSection.style.display = 'block';
    if (myCenterSection) myCenterSection.style.display = 'block';
    if (becomeSupplierSection) becomeSupplierSection.style.display = 'block';
    if (registrationStatusMessageContainer) registrationStatusMessageContainer.style.display = 'none';
    registrationStatusMessageContainer.innerHTML = ''; // Clear message

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
