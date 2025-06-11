// Firebase configuration
var config = {
    apiKey: "AIzaSyAuT-RlMl5g4m96V3DtUWGFV6ym7YnMXt8",
    authDomain: "tolexars-ac868.firebaseapp.com",
    databaseURL: "https://tolexars-ac868-default-rtdb.firebaseio.com",
    projectId: "tolexars-ac868",
    storageBucket: "tolexars-ac868.appspot.com",
    messagingSenderId: "148559800786"
};
firebase.initializeApp(config);

// Initialize Firebase database
var database = firebase.database();
var firebaseProductsCollection = database.ref().child('products');

/*===== MENU SHOW =====*/
const showMenu = (toggleId, navId) =>{
    const toggle = document.getElementById(toggleId),
    nav = document.getElementById(navId)

    if(toggle && nav){
        toggle.addEventListener('click', ()=>{
            nav.classList.toggle('show')
        })
    }
}
showMenu('nav-toggle','nav-menu')

/*==================== REMOVE MENU MOBILE ====================*/
const navLink = document.querySelectorAll('.nav__link')

function linkAction(){
    const navMenu = document.getElementById('nav-menu')
    // When we click on each nav__link, we remove the show-menu class
    navMenu.classList.remove('show')
}
navLink.forEach(n => n.addEventListener('click', linkAction))

/*==================== SCROLL SECTIONS ACTIVE LINK ====================*/
const sections = document.querySelectorAll('section[id]')

const scrollActive = () =>{
    const scrollDown = window.scrollY

  sections.forEach(current =>{
        const sectionHeight = current.offsetHeight,
              sectionTop = current.offsetTop - 58,
              sectionId = current.getAttribute('id'),
              sectionsClass = document.querySelector('.nav__menu a[href*=' + sectionId + ']')

        if(scrollDown > sectionTop && scrollDown <= sectionTop + sectionHeight){
            if (sectionsClass) { // Check if sectionsClass exists (is not null)
                sectionsClass.classList.add('active-link')
            }
        }else{
            if (sectionsClass) { // Check if sectionsClass exists (is not null)
                sectionsClass.classList.remove('active-link')
            }
        }
    })
}
window.addEventListener('scroll', scrollActive)

/*===== SHOW SEARCH INPUT =====*/
const searchIcon = document.getElementById('search-icon');
const searchInput = document.getElementById('search-input');

if (searchIcon && searchInput) {
    searchIcon.addEventListener('click', () => {
        searchInput.classList.toggle('show-input');
    });
}

/*===== FILTER ITEMS =====*/
const searchInputLive = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const marketplaceItemsContainer = document.getElementById('marketplace-items');
const loadingOverlay = document.getElementById('loading-overlay'); // Get the loading overlay
const sortBySelect = document.getElementById('sort-by'); // Get the sort dropdown
let allItems = []; // Array to store all marketplace items
let isInitialLoad = true; // Flag to track if it's the initial load

// Initialize ScrollReveal only once
const sr = ScrollReveal({
    origin: 'top',
    distance: '60px',
    duration: 2000,
    delay: 200,
//     reset: true
});

// Function to sort items
function sortItems(items, sortBy) {
    return items.sort((a, b) => {
        if (sortBy === 'newest') {
            const timeA = a.time || 0;
            const timeB = b.time || 0;
            return timeB - timeA;
        } else if (sortBy === 'oldest') {
            const timeA = a.time || 0;
            const timeB = b.time || 0;
            return timeA - timeB;
        } else if (sortBy === 'price-asc') {
            const priceA = parseFloat(a.price.replace(/[^\d.]/g, '')) || 0;
            const priceB = parseFloat(b.price.replace(/[^\d.]/g, '')) || 0;
            return priceA - priceB;
        } else if (sortBy === 'price-desc') {
            const priceA = parseFloat(a.price.replace(/[^\d.]/g, '')) || 0;
            const priceB = parseFloat(b.price.replace(/[^\d.]/g, '')) || 0;
            return priceB - priceA;
        }
        return 0; // Default return if no sorting option is matched
    });
}

// Function to display items
function displayItems(items) {
    if (!marketplaceItemsContainer) return;

    marketplaceItemsContainer.innerHTML = '';
    if (items.length === 0) {
        marketplaceItemsContainer.innerHTML = '<p>No items found.</p>';
        return;
    }
    let allProductsHtml = "";
    items.forEach((product, index) => {
        const individualProductHtml = `<a href="display.html?title=${encodeURIComponent(product.title)}&img=${encodeURIComponent(product.img)}&price=${encodeURIComponent(product.price)}&push=${encodeURIComponent(product.push)}&description=${encodeURIComponent(product.description)}&delivery=${encodeURIComponent(product.delivery)}" class='work__container' data-product-title="${encodeURIComponent(product.title)}" data-product-img="${encodeURIComponent(product.img)}"data-product-push="${encodeURIComponent(product.push)}"data-product-description="${encodeURIComponent(product.description)}"data-product-delivery="${encodeURIComponent(product.delivery)}" data-product-price="${encodeURIComponent(product.price)}">
            <img src="${product.img}" alt="${product.title}">
            <p>${product.title}</p>
            <h2>${product.price}</h2>
            <button href="#" class="button4">VIEW</button>
         </a>`;
        allProductsHtml += individualProductHtml;
    });
    marketplaceItemsContainer.innerHTML = allProductsHtml;

    // Attach event listeners to save scroll position
    const workContainers = document.querySelectorAll('#marketplace-items .work__container');
    workContainers.forEach(container => {
        container.addEventListener('click', function(event) {
            sessionStorage.setItem('scrollPosition', window.scrollY);
        });
    });

    // Apply scroll reveal animation only on initial load
    if (isInitialLoad && typeof sr !== 'undefined' && typeof sr.reveal === 'function') {
        workContainers.forEach((container, index) => {
            sr.reveal(container, {
                delay: 10 * index,
                origin: 'bottom'
            });
        });
    }

    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// Show the loading overlay initially
if (loadingOverlay) {
    loadingOverlay.style.display = 'flex';
}

// Fetch and display products from Firebase
firebaseProductsCollection.on('value', function(productsSnapshot) {
    console.log("Firebase data received:", productsSnapshot.val());
    const productsData = productsSnapshot.val();
    if (productsData) {
        allItems = Object.keys(productsData).map(key => ({
            id: key,
            ...productsData[key]
        }));
        localStorage.setItem('marketplaceData', JSON.stringify(allItems));
        const sortedItems = sortItems(allItems, 'newest');
        displayItems(sortedItems);
        isInitialLoad = false; // Set the flag to false after the first load from Firebase
    } else {
        allItems = [];
        displayItems([]);
        localStorage.removeItem('marketplaceData');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        isInitialLoad = true; // Reset the flag if data is empty
    }
});

// On page load, try to load data from local storage first
document.addEventListener('DOMContentLoaded', function() {
    const storedData = localStorage.getItem('marketplaceData');
    if (storedData) {
        allItems = JSON.parse(storedData);
        const currentSortValue = sortBySelect ? sortBySelect.value : 'newest';
        displayItems(sortItems(allItems, currentSortValue));
        const scrollPos = sessionStorage.getItem('scrollPosition');
        if (scrollPos) {
            window.scrollTo(0, parseInt(scrollPos));
            sessionStorage.removeItem('scrollPosition');
        }
    } else {
        // If no data in local storage, the Firebase listener will handle the initial load
        isInitialLoad = true;
    }
});

// Function to filter items based on search term
function filterBySearch(searchTerm) {
    const filteredItems = allItems.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const currentSortValue = sortBySelect.value;
    displayItems(sortItems(filteredItems, currentSortValue));
}

// Function to filter items by category
function filterByCategory(selectedCategory) {
    const filteredItems = selectedCategory === 'all'
        ? allItems
        : allItems.filter(item => item.category && item.category.toLowerCase() === selectedCategory.toLowerCase());
    const currentSortValue = sortBySelect.value;
    displayItems(sortItems(filteredItems, currentSortValue));
}

// Event listeners for search, category filter, and sort remain the same...
if (searchInputLive) {
    searchInputLive.addEventListener('input', function() {
        filterBySearch(this.value);
    });
}

if (categoryFilter) {
    categoryFilter.addEventListener('change', function() {
        filterByCategory(this.value);
    });
}

if (sortBySelect) {
    sortBySelect.addEventListener('change', function() {
        const currentSortValue = this.value;
        displayItems(sortItems(allItems, currentSortValue));
    });
}


