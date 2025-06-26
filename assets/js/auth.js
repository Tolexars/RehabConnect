// auth.js - Complete Working Implementation
const DEBUG = true;

function initializeApp() {
    if (DEBUG) console.log("Initializing application...");

    auth.onAuthStateChanged(user => {
        if (user) {
            if (DEBUG) console.log("User authenticated:", user.uid);
            handleAuthenticatedState(user);
        } else {
            if (DEBUG) console.log("User not authenticated");
            handleUnauthenticatedState();
        }
    });

    setupEventListeners();
    setupAuthForms();
    setupSupplierForm();
    setupPractitionerForm();

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
                switchAuthForm('login');
            }
        });
    }

    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            if (DEBUG) console.log("Login button clicked.");
            sessionStorage.removeItem('postAuthAction');
            showModal('auth-modal');
            switchAuthForm('login');
        });
    }

    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const formType = tab.dataset.form;
            switchAuthForm(formType);
        });
    });

    window.addEventListener('click', (event) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) hideAllModals();
        });
    });

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
                switchAuthForm('login');
            }
        });
    }

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
                switchAuthForm('login');
            }
        });
    }

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
            document.getElementById('register-form').reset();
            showError('login-error', '');
            showError('register-error', '');
        } else if (modal.id === 'supplier-modal') {
            document.getElementById('supplier-form').reset();
            showError('supplier-error', '');
        } else if (modal.id === 'practitioner-modal') {
            document.getElementById('practitioner-form').reset();
            showError('practitioner-error', '');
        }
    });
}

function setupAuthForms() {
    if (DEBUG) console.log("Setting up auth forms...");
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
                handlePostLogin();
            } catch (error) {
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
            const name = registerForm['register-name'].value;
            const email = registerForm['register-email'].value;
            const password = registerForm['register-password'].value;

            if (password.length < 6) {
                showError('register-error', 'Password should be at least 6 characters.');
                return;
            }

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                if (DEBUG) console.log("Registration successful!", userCredential.user.uid);
                await database.ref('userdata/' + userCredential.user.uid).set({
                    email: email,
                    name: name,
                    createdAt: Date.now(),
                    userType: 'general',
                    img: ''
                });
                handlePostLogin();
            } catch (error) {
                if (DEBUG) console.error("Registration error:", error.message);
                showError('register-error', error.message);
            }
        });
    }
}

function setupSupplierForm() {
    if (DEBUG) console.log("Setting up supplier form...");
    const supplierForm = document.getElementById('supplier-form');
    if (supplierForm) {
        supplierForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showError('supplier-error', '');
            const user = auth.currentUser;

            if (!user) {
                showError('supplier-error', 'You must be logged in to submit this form.');
                return;
            }

            const supplierData = {
                orgName: supplierForm['org-name'].value,
                contactEmail: supplierForm['contact-email'].value,
                contactPhone: supplierForm['contact-phone'].value,
                productsOffered: supplierForm['products-offered'].value,
                userId: user.uid,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                status: 'pending'
            };

            try {
                await database.ref('merchants').push(supplierData);
                alert('Your supplier application has been submitted successfully!');
                hideAllModals();
                supplierForm.reset();
                const supplierSection = document.querySelector('.become-supplier');
                if (supplierSection) supplierSection.style.display = 'none';
            } catch (error) {
                if (DEBUG) console.error("Supplier submission failed:", error.message);
                showError('supplier-error', 'Submission failed: ' + error.message);
            }
        });
    }
}

function setupPractitionerForm() {
    if (DEBUG) console.log("Setting up practitioner form...");
    const practitionerForm = document.getElementById('practitioner-form');
    if (practitionerForm) {
        practitionerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showError('practitioner-error', '');

            const user = auth.currentUser;
            if (!user) {
                showError('practitioner-error', 'You must be logged in to submit this form.');
                return;
            }

            const fileInput = practitionerForm['prof-picture'];
            const file = fileInput.files[0];
            let imageUrl = '';

            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    showError('practitioner-error', 'Image file size exceeds 2MB limit.');
                    return;
                }
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!allowedTypes.includes(file.type)) {
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
                status: 'pending'
            };

            try {
                await database.ref('applications').push(practitionerData);
                alert('Your professional application has been submitted successfully! We will review it shortly.');
                hideAllModals();
                practitionerForm.reset();
                const joinPractitionerSection = document.querySelector('.join-practitioner');
                if (joinPractitionerSection) joinPractitionerSection.style.display = 'none';
            } catch (error) {
                if (DEBUG) console.error("Practitioner submission failed:", error.message);
                showError('practitioner-error', 'Submission failed: ' + error.message);
            }
        });
    }
}

function handlePostLogin() {
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
    }
    handleAuthenticatedState(auth.currentUser);
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

// Auth State Management
function handleAuthenticatedState(user) {
    if (DEBUG) console.log("Handling authenticated state for user:", user.uid);

    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const profileImageNav = document.querySelector('.profile-image-nav');
    const navToggle = document.getElementById('nav-toggle');
    const myProfileNavItem = document.getElementById('my-profile-nav-item');
    const myMobileProfileNavItem = document.getElementById('mobile-profile-nav');
    const navMenu = document.getElementById('nav-menu');

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

    const supplierSection = document.querySelector('.become-supplier');
    if (supplierSection) supplierSection.style.display = 'block';

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

function switchAuthForm(formType) {
    if (DEBUG) console.log("Switching auth form to:", formType);
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.form === formType);
    });

    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.toggle('active', form.id === `${formType}-form`);
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);
