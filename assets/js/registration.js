// registration.js - Fixed Implementation

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
}

function setupEventListeners() {
    if (DEBUG) console.log("Setting up event listeners...");

    // Close buttons for all modals
    document.querySelectorAll('.modal .close, .modal .modal-close').forEach(btn => {
        btn.addEventListener('click', hideAllModals);
    });

    // Supplier CTA
    const supplierCtaBtn = document.getElementById('supplier-cta-btn');
    if (supplierCtaBtn) {
        supplierCtaBtn.addEventListener('click', () => {
            if (DEBUG) console.log("Supplier CTA clicked.");
            showModal('supplier-modal');
        });
    }

    // Practitioner CTA
    const joinButton = document.getElementById('join-button');
    if (joinButton) {
        joinButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (DEBUG) console.log("Join Practitioner button clicked.");
            showModal('practitioner-modal');
        });
    }

    // Center CTA
    const centerButton = document.getElementById('center-button');
    if (centerButton) {
        centerButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (DEBUG) console.log("Center button clicked.");
            showModal('center-modal');
        });
    }

    // Login button
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            if (DEBUG) console.log("Login button clicked.");
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
    });
}

// --- Authentication Forms ---
function setupAuthForms() {
    if (DEBUG) console.log("Setting up auth forms...");

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
                hideAllModals();
                window.location.href = 'index.html';
            } catch (error) {
                if (DEBUG) console.error("Login error:", error.message);
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

                if (DEBUG) console.log("Regular user registration successful! User:", user.uid);
                hideAllModals();
                
                showSuccessDialog('Account created successfully! You are now logged in.', () => {
                    window.location.href = 'index.html';
                });

            } catch (error) {
                if (DEBUG) console.error("Registration error:", error.message);
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
                console.log("Starting practitioner registration...");
                
                // 1. Create User Account
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                user = userCredential.user;
                console.log("Auth user created:", user.uid);

                // 2. Validate and Upload License File (required)
                if (!licenseFile) {
                    throw new Error('A professional license is required for registration.');
                }

                if (licenseFile.size > 5 * 1024 * 1024) {
                    throw new Error('License file size exceeds 5MB limit.');
                }

                const allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                if (!allowedFileTypes.includes(licenseFile.type)) {
                    throw new Error('Only JPG, PNG, GIF, PDF, DOC, and DOCX files are allowed for licenses.');
                }

                console.log("Uploading license file...");
                const licenseStorageRef = storage.ref('practitioner_licenses/' + user.uid + '/' + licenseFile.name);
                const licenseSnapshot = await licenseStorageRef.put(licenseFile);
                licenseUrl = await licenseSnapshot.ref.getDownloadURL();
                console.log("License uploaded:", licenseUrl);

                // 3. Upload Profile Picture (if provided)
                if (profilePictureFile) {
                    if (profilePictureFile.size > 2 * 1024 * 1024) {
                        throw new Error('Profile picture file size exceeds 2MB limit.');
                    }
                    
                    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
                    if (!allowedImageTypes.includes(profilePictureFile.type)) {
                        throw new Error('Only JPG, PNG, GIF images are allowed for profile pictures.');
                    }
                    
                    console.log("Uploading profile picture...");
                    const profileStorageRef = storage.ref('profile_pictures/' + user.uid + '/' + profilePictureFile.name);
                    const snapshot = await profileStorageRef.put(profilePictureFile);
                    profileImageUrl = await snapshot.ref.getDownloadURL();
                    console.log("Profile picture uploaded:", profileImageUrl);
                }

                // 4. Save User Data to userdata
                const userData = {
                    name: fullName,
                    email: email,
                    role: 'practitioner',
                    img: profileImageUrl,
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                };
                
                console.log("Saving user data to database...");
                await database.ref('userdata/' + user.uid).set(userData);
                console.log("User data saved successfully");

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
                
                console.log("Saving application data...");
                await database.ref('applications').push(practitionerData);
                console.log("Application data saved successfully");

                hideAllModals();
                
                showSuccessDialog('Application submitted successfully! You will be contacted shortly.', () => {
                    window.location.href = 'index.html';
                });

            } catch (error) {
                console.error("Practitioner registration failed:", error);
                showErrorDialog('Registration failed: ' + error.message);
                
                // Clean up user if created but other steps failed
                if (user) {
                    try {
                        await user.delete();
                        console.log("Cleaned up partially created user");
                    } catch (deleteError) {
                        console.error("Error deleting user:", deleteError);
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

            const orgName = supplierForm['org-name'].value;
            const contactEmail = supplierForm['contact-email'].value;
            const password = supplierForm['supplier-password'].value;
            const contactPhone = supplierForm['contact-phone'].value;
            const productsOffered = supplierForm['products-offered'].value;
            let user = null;

            try {
                console.log("Starting supplier registration...");
                
                // 1. Create User Account
                const userCredential = await auth.createUserWithEmailAndPassword(contactEmail, password);
                user = userCredential.user;
                console.log("Auth user created:", user.uid);

                // 2. Save User Data to userdata
                const userData = {
                    name: orgName,
                    email: contactEmail,
                    role: 'supplier',
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                };
                
                console.log("Saving user data to database...");
                await database.ref('userdata/' + user.uid).set(userData);
                console.log("User data saved successfully");

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
                
                console.log("Saving application data...");
                await database.ref('applications').push(supplierData);
                console.log("Application data saved successfully");

                hideAllModals();
                
                showSuccessDialog('Application submitted successfully! You will be contacted shortly.', () => {
                    window.location.href = 'index.html';
                });

            } catch (error) {
                console.error("Supplier registration failed:", error);
                showErrorDialog('Registration failed: ' + error.message);
                
                if (user) {
                    try {
                        await user.delete();
                        console.log("Cleaned up partially created user");
                    } catch (deleteError) {
                        console.error("Error deleting user:", deleteError);
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
                console.log("Starting center registration...");
                
                // 1. Create User Account
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                user = userCredential.user;
                console.log("Auth user created:", user.uid);

                // 2. Upload Center Logo (if provided)
                if (file) {
                    if (file.size > 2 * 1024 * 1024) {
                        throw new Error('Logo file size exceeds 2MB limit.');
                    }
                    
                    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                    if (!allowedTypes.includes(file.type)) {
                        throw new Error('Only JPG, PNG, GIF images are allowed.');
                    }

                    console.log("Uploading center logo...");
                    const storageRef = storage.ref('center-logos/' + user.uid + '/' + file.name);
                    const snapshot = await storageRef.put(file);
                    imageUrl = await snapshot.ref.getDownloadURL();
                    console.log("Center logo uploaded:", imageUrl);
                }

                // 3. Save User Data to userdata
                const userData = {
                    name: centerName,
                    email: email,
                    role: 'center',
                    img: imageUrl,
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                };
                
                console.log("Saving user data to database...");
                await database.ref('userdata/' + user.uid).set(userData);
                console.log("User data saved successfully");

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
                
                console.log("Saving application data...");
                await database.ref('applications').push(centerData);
                console.log("Application data saved successfully");

                hideAllModals();
                
                showSuccessDialog('Application submitted successfully! You will be contacted shortly.', () => {
                    window.location.href = 'index.html';
                });

            } catch (error) {
                console.error("Center registration failed:", error);
                showErrorDialog('Registration failed: ' + error.message);
                
                if (user) {
                    try {
                        await user.delete();
                        console.log("Cleaned up partially created user");
                    } catch (deleteError) {
                        console.error("Error deleting user:", deleteError);
                    }
                }
            }
        });
    }
}

// --- Helper Functions ---

/**
 * Shows a success dialog with a message and optional callback
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

// Displays error messages in form
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
                    return true;
                }
            });
            if (pendingCategory) {
                return { status: 'pending', roleName: pendingCategory };
            }
        }

        return null;
    } catch (error) {
        console.error("Error checking existing overall status:", error);
        return { status: 'error' };
    }
}

// --- User State Handling ---

async function handleAuthenticatedState(user) {
    if (DEBUG) console.log("Handling authenticated state for user:", user.uid);

    const loginBtn = document.getElementById('login-btn');
    const joinPractitionerSection = document.querySelector('.join-practitioner');
    const myCenterSection = document.querySelector('.my-center');
    const becomeSupplierSection = document.querySelector('.become-supplier');
    const registrationStatusMessageContainer = document.getElementById('registration-status-message');

    // Hide registration sections by default when authenticated
    if (joinPractitionerSection) joinPractitionerSection.style.display = 'none';
    if (myCenterSection) myCenterSection.style.display = 'none';
    if (becomeSupplierSection) becomeSupplierSection.style.display = 'none';
    if (registrationStatusMessageContainer) registrationStatusMessageContainer.style.display = 'none';
    registrationStatusMessageContainer.innerHTML = '';

    // Hide login button
    if (loginBtn) loginBtn.style.display = 'none';

    // Fetch user data and check status
    database.ref('userdata/' + user.uid).once('value')
        .then(async snapshot => {
            const userData = snapshot.val();
            
            // Check user status
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
                }
            } else {
                // User is logged in but is a regular user - show registration options
                if (joinPractitionerSection) joinPractitionerSection.style.display = 'block';
                if (myCenterSection) myCenterSection.style.display = 'block';
                if (becomeSupplierSection) becomeSupplierSection.style.display = 'block';
            }
        })
        .catch(error => {
            console.error("Error fetching user data:", error);
        });
}

function handleUnauthenticatedState() {
    if (DEBUG) console.log("Handling unauthenticated state.");

    const loginBtn = document.getElementById('login-btn');
    const joinPractitionerSection = document.querySelector('.join-practitioner');
    const myCenterSection = document.querySelector('.my-center');
    const becomeSupplierSection = document.querySelector('.become-supplier');

    // Show all registration sections when unauthenticated
    if (joinPractitionerSection) joinPractitionerSection.style.display = 'block';
    if (myCenterSection) myCenterSection.style.display = 'block';
    if (becomeSupplierSection) becomeSupplierSection.style.display = 'block';

    // Show login button
    if (loginBtn) loginBtn.style.display = 'block';
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);
