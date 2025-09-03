const urlParams = new URLSearchParams(window.location.search);
const productPush = urlParams.get('push');
const productTitle = urlParams.get('title');
const productImg = urlParams.get('img');
const productPrice = urlParams.get('price');
const productDescription = urlParams.get('description');
const productDelivery = urlParams.get('delivery');

document.getElementById('product-title').textContent = productTitle;
document.getElementById('product-image').src = productImg;
document.getElementById('product-image').alt = productTitle;
document.getElementById('product-price').textContent = productPrice;
let description = productDescription ? decodeURIComponent(productDescription) : 'No description available.';
document.getElementById('product-description').innerHTML = description.replace(/\n/g, '<br>');
document.getElementById('product-delivery').textContent = productDelivery || 'Free';

const publicKey = 'pk_live_4c70eb590578eaedff80c3ea23da34d711af4fec'; // Your Paystack public key

const buyNowButton = document.getElementById('buy-now-button');
if (buyNowButton) {
    buyNowButton.addEventListener('click', function() {
        // Check if user is logged in
        const user = auth.currentUser;
        if (user) {
            // User is logged in, proceed with payment
            console.log("User logged in:", user.uid);
            payWithPaystack(user.email); // Pass user's email to Paystack
        } else {
            // User is not logged in, show authentication modal
            console.log("User not logged in. Showing auth modal.");
            // Store a flag in sessionStorage to indicate what to do after login
            sessionStorage.setItem('postAuthAction', 'initiatePayment');
            showModal('auth-modal'); // Assuming showModal is accessible globally or from auth.js
            switchAuthForm('login'); // Show login tab by default
        }
    });
}

// Ensure showModal and switchAuthForm are accessible.
// They are assumed to be defined in auth.js.
// If auth.js is properly loaded before this, these functions will be in the global scope.
// However, it's good practice to ensure they are available.
// For this example, I'm assuming they are globally available.
// If not, you might need to export them from auth.js and import them here,
// or use a more structured approach like a global App object.


// Handle post-authentication action specifically for payment
auth.onAuthStateChanged(user => {
    if (user) {
        const postAuthAction = sessionStorage.getItem('postAuthAction');
        if (postAuthAction === 'initiatePayment') {
            sessionStorage.removeItem('postAuthAction'); // Clear the flag
            console.log("Post-auth action: Initiating payment.");
            hideAllModals(); // Hide auth modal
            payWithPaystack(user.email); // Proceed with payment using the logged-in user's email
        }
    }
});


function payWithPaystack(customerEmail) {
    const quantityInput = document.getElementById('quantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

    const unitPrice = parseFloat(productPrice.replace(/[^\d.]/g, ''));
    const amount = unitPrice * quantity * 100; // Total amount in kobo

    if (isNaN(amount) || amount <= 0) {
        alert('Invalid price or quantity.');
        return;
    }

    const handler = PaystackPop.setup({
        key: publicKey,
        email: customerEmail, // Use the logged-in user's email
        amount: amount,
        currency: 'NGN', // Change if your currency is different
        ref: '' + Math.floor((Math.random() * 1000000000) + 1), // Generate a unique reference
        metadata: {
            title: productTitle,
            price: productPrice, // Keeping the unit price for reference
            quantity: quantity,
            push: productPush,
            totalAmount: amount / 100, // Adding the total amount to metadata
            image: productImg,
            description: productDescription
        },
        callback: function(response){
            // This function is called after a successful payment
            alert(`Payment of ${amount / 100} successful! Transaction reference: ` + response.reference);
            // Redirect to payment_successful.html with product details and transaction reference
            window.location.href = `payment_successful.html?title=${encodeURIComponent(productTitle)}&img=${encodeURIComponent(productImg)}&price=${encodeURIComponent(productPrice)}&push=${encodeURIComponent(productPush)}&quantity=${quantity}&total=${amount / 100}&ref=${response.reference}`;
        },
        onClose: function(){
            alert('Transaction was not completed.');
        },
    });
    handler.openIframe();
}
