// modals.js
import { auth } from './auth.js';

// Initialize authentication modal
export function initAuthModal() {
    const authModal = document.getElementById('auth-modal');
    const closeAuthModal = document.querySelector('#auth-modal .close');
    
    // Close modal when X is clicked
    closeAuthModal?.addEventListener('click', () => {
        authModal.style.display = 'none';
    });
    
    // Close when clicking outside modal
    window.addEventListener('click', (event) => {
        if (event.target === authModal) {
            authModal.style.display = 'none';
        }
    });

    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelector('.auth-tab.active').classList.remove('active');
            tab.classList.add('active');
            document.querySelector('.auth-form.active').classList.remove('active');
            document.getElementById(tab.dataset.form + '-form').classList.add('active');
        });
    });

    // Login form
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await auth.signInWithEmailAndPassword(
                document.getElementById('login-email').value,
                document.getElementById('login-password').value
            );
            authModal.style.display = 'none';
        } catch (error) {
            showAuthError('login-error', error.message);
        }
    });

    // Registration form
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(
                document.getElementById('register-email').value,
                document.getElementById('register-password').value
            );
            authModal.style.display = 'none';
        } catch (error) {
            showAuthError('register-error', error.message);
        }
    });
}

// Initialize supplier modal
export function initSupplierModal() {
    const supplierModal = document.getElementById('supplier-modal');
    const closeModal = document.querySelector('.supplier-modal .close');

    closeModal?.addEventListener('click', () => {
        supplierModal.style.display = 'none';
    });
}

function showAuthError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => errorElement.style.display = 'none', 5000);
    }
}