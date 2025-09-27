// auth.js - Edited for Regular User and Professional/Center Roles
const DEBUG = true;

function initializeApp() {
    if (DEBUG) console.log("Initializing application...");

    auth.onAuthStateChanged(async user => {
        if (user) {
            if (DEBUG) console.log("User authenticated:", user.uid);
            await handleAuthenticatedState(user);
            
            // Hide "Join our Network" section for logged-in users
            const joinSection = document.querySelector('.join-practitioner22');
            if (joinSection) joinSection.style.display = 'none';
        } else {
            if (DEBUG) console.log("User not authenticated");
            handleUnauthenticatedState();
            
            // Show "Join our Network" section for logged-out users
            const joinSection = document.querySelector('.join-practitioner22');
            if (joinSection) joinSection.style.display = 'block';
        }
    });

    setupEventListeners();
    setupAuthForms();

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

    // Login button
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            if (DEBUG) console.log("Login button clicked.");
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
        }
    });
    
    // Hide any spinners that might be visible
    hideAuthSpinner();
}

// Show/hide auth spinner
function showAuthSpinner() {
    const spinner = document.getElementById('auth-spinner');
    if (!spinner) {
        const spinnerDiv = document.createElement('div');
        spinnerDiv.id = 'auth-spinner';
        spinnerDiv.className = 'spinner';
        spinnerDiv.style.cssText = 'border: 4px solid rgba(0,0,0,0.1); border-top: 4px solid #00BCD4; align-self: center; border-radius: 50%; width: 35px; height: 35px; animation: spin 1s linear infinite; margin: 20px auto;';
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

                const redirectTarget = sessionStorage.getItem('postAuthRedirect');
                if (redirectTarget === 'ai-assistant') {
                    sessionStorage.removeItem('postAuthRedirect');
                    window.location.href = '/ai-assistant/';
                } else {
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

// Helper Functions
async function handlePostLogin() {
    if (DEBUG) console.log("Handling post-login actions");
    hideAllModals();
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

// Checks user role to show/hide AI buttons and Tools link/section
async function updateUIVisibilityBasedOnRole(userId) {
    if (DEBUG) console.log("Updating UI based on role for user:", userId);

    const aiAssistantBtn = document.querySelector('.floating-ai-button');
    const aiTherapistBtn = document.querySelector('.floating-ai-button22');
    const toolsNavItem = document.querySelector('a[href="tools.html"]')?.parentElement;
    const toolsSection = document.getElementById('tools-section');

    if (!aiAssistantBtn || !aiTherapistBtn) {
        console.error("AI floating buttons not found in the DOM.");
    }
    if (!toolsNavItem) {
        console.warn("Tools navigation item not found.");
    }
    if (!toolsSection) {
        console.warn("Tools section not found.");
    }
    
    try {
        const professionalRef = database.ref('professionals').orderByChild('userID').equalTo(userId);
        const centerRef = database.ref('centers').orderByChild('userId').equalTo(userId);

        const [professionalSnapshot, centerSnapshot] = await Promise.all([
            professionalRef.once('value'),
            centerRef.once('value')
        ]);

        const isProfessionalOrCenter = professionalSnapshot.exists() || centerSnapshot.exists();

        if (isProfessionalOrCenter) {
            if (DEBUG) console.log("User is a professional or center. Showing professional UI elements.");
            if (aiAssistantBtn) aiAssistantBtn.style.display = 'flex';
            if (aiTherapistBtn) aiTherapistBtn.style.display = 'none';
            if (toolsNavItem) toolsNavItem.style.display = 'list-item';
            if (toolsSection) toolsSection.style.display = 'block';
        } else {
            if (DEBUG) console.log("User is a regular user. Showing regular user UI elements.");
            if (aiAssistantBtn) aiAssistantBtn.style.display = 'none';
            if (aiTherapistBtn) aiTherapistBtn.style.display = 'flex';
            if (toolsNavItem) toolsNavItem.style.display = 'none';
            if (toolsSection) toolsSection.style.display = 'none';
        }
    } catch (error) {
        console.error("Error checking user role:", error);
        // Default to regular user view on error
        if (aiAssistantBtn) aiAssistantBtn.style.display = 'none';
        if (aiTherapistBtn) aiTherapistBtn.style.display = 'flex';
        if (toolsNavItem) toolsNavItem.style.display = 'none';
        if (toolsSection) toolsSection.style.display = 'none';
    }
}

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
    const profileImageNav = document.querySelector('.profile-image-nav');
    const navToggle = document.getElementById('nav-toggle');
    const myProfileNavItem = document.getElementById('my-profile-nav-item');
    const navMenu = document.getElementById('nav-menu');
    
    const joinSection = document.querySelector('.join-practitioner22');
    if (joinSection) joinSection.style.display = 'none';

    if (loginBtn) loginBtn.style.display = 'none';
    
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

    await updateUIVisibilityBasedOnRole(user.uid);

    document.body.classList.add('logged-in');
}

function handleUnauthenticatedState() {
    if (DEBUG) console.log("Handling unauthenticated state.");
    
    const aiAssistantBtn = document.querySelector('.floating-ai-button');
    const aiTherapistBtn = document.querySelector('.floating-ai-button22');
    const toolsNavItem = document.querySelector('a[href="tools.html"]')?.parentElement;
    const toolsSection = document.getElementById('tools-section');

    // Default UI state for logged-out users
    if (aiAssistantBtn) aiAssistantBtn.style.display = 'none';
    if (aiTherapistBtn) aiTherapistBtn.style.display = 'flex';
    if (toolsNavItem) toolsNavItem.style.display = 'none';
    if (toolsSection) toolsSection.style.display = 'none';

    const joinSection = document.querySelector('.join-practitioner22');
    if (joinSection) joinSection.style.display = 'block';

    const loginBtn = document.getElementById('login-btn');
    const profileImageNav = document.querySelector('.profile-image-nav');
    const navToggle = document.getElementById('nav-toggle');
    const myProfileNavItem = document.getElementById('my-profile-nav-item');
    const navMenu = document.getElementById('nav-menu');

    if (loginBtn) loginBtn.style.display = 'block';
    
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

// Initialize the application
document.addEventListener('DOMContentLoaded', initializeApp);


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
