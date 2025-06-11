

function handlePostAuth() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) authModal.style.display = 'none';
    
    const postAuthAction = sessionStorage.getItem('postAuthAction');
    if (postAuthAction === 'showSupplierForm') {
        sessionStorage.removeItem('postAuthAction');
        const supplierModal = document.getElementById('supplier-modal');
        if (supplierModal) supplierModal.style.display = 'block';
    }
}

// Supplier Application Logic
function handleSupplierApplication() {
    const supplierModal = document.getElementById('supplier-modal');
    const closeModal = document.querySelector('.supplier-modal .close');
    const supplierForm = document.getElementById('supplier-form');

    document.getElementById('supplier-cta-btn')?.addEventListener('click', () => {
        const user = auth.currentUser;
        if (user) {
            supplierModal.style.display = 'block';
        } else {
            sessionStorage.setItem('postAuthAction', 'showSupplierForm');
            document.getElementById('auth-modal').style.display = 'block';
        }
    });

    closeModal?.addEventListener('click', () => {
        supplierModal.style.display = 'none';
    });

    supplierForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        
        const supplierData = {
            orgName: document.getElementById('org-name').value,
            email: document.getElementById('contact-email').value,
            phone: document.getElementById('contact-phone').value,
            products: document.getElementById('products-offered').value,
            userId: user.uid,
            timestamp: Date.now(),
            status: 'pending'
        };

        database.ref('merchants').push().set(supplierData)
            .then(() => {
                alert('Application submitted successfully!');
                supplierModal.style.display = 'none';
            })
            .catch((error) => {
                console.error('Submission error:', error);
                alert('Error submitting application. Please try again.');
            });
    });
}

// Auth Modal Logic
function initAuthModal() {
    const authModal = document.getElementById('auth-modal');
    const closeAuthModal = document.querySelector('#auth-modal .close');

    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelector('.auth-tab.active').classList.remove('active');
            tab.classList.add('active');
            document.querySelector('.auth-form.active').classList.remove('active');
            document.getElementById(tab.dataset.form + '-form').classList.add('active');
        });
    });

    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await auth.signInWithEmailAndPassword(
                document.getElementById('login-email').value,
                document.getElementById('login-password').value
            );
            handlePostAuth();
        } catch (error) {
            showAuthError('login-error', error.message);
        }
    });

    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(
                document.getElementById('register-email').value,
                document.getElementById('register-password').value
            );
            
            await database.ref('userdata/' + userCredential.user.uid).set({
                email: userCredential.user.email,
                createdAt: Date.now(),
                userType: 'supplier-applicant'
            });
            
            handlePostAuth();
        } catch (error) {
            showAuthError('register-error', error.message);
        }
    });

    closeAuthModal?.addEventListener('click', () => {
        authModal.style.display = 'none';
    });
}

function showAuthError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => errorElement.style.display = 'none', 5000);
}

// Data initialization functions
function safeInitialize(fn) {
    try {
        fn();
    } catch (error) {
        console.error("Initialization error:", error);
    }
}

function handleDataError(section) {
    return (error) => {
        console.error(`Error loading ${section}:`, error);
        hideLoading(`featured-${section}`);
    };
}

// Main initialization function
function initializeApp() {
    try {
        initAuth();
        initAuthModal();
        handleSupplierApplication();

        const stateRestored = restoreAppState();        

        

      

    } catch (error) {
        console.error("Critical initialization error:", error);
    }
}

