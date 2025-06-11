// configure.js - Complete Fixed Implementation
const CACHE_EXPIRATION = 1800000; // 30 minutes

// App state management
const appState = {
    professionals: null,
    professionals22: null, 
    products: null,
    blogPosts: null,
    slider: {
        slides: [],
        currentSlide: 0,
        isAutoSliding: true
    },
    lastUpdated: null,
    isLoggedIn: false
};

// DOM elements
const profilesContainer = document.querySelector('.profiles-container');
const productsContainer = document.querySelector('.products-container');
const blogsContainer = document.querySelector('.blogs-container');
const profilesContainer22 = document.querySelector('.profiles-container22');
const sliderContainer = document.getElementById('slider-container');
const sliderDotsContainer = document.querySelector('.slider-dots');

// Database references
const professionalsRef = database.ref().child('professionals');
const productsRef = database.ref().child('products');
const blogPostsRef = database.ref().child('blogPosts');
const sliderRef = database.ref('slider');

// Function to show loading animation
function showLoading(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const loadingOverlay = section.querySelector('.loading-overlay');
        const contentContainer = section.querySelector(
            sectionId === 'featured-professionals' ? '.profiles-container' :
            sectionId === 'featured-products' ? '.products-container' :
            sectionId === 'featured-professionals22' ? '.profiles-container22' :
            sectionId === 'blog-section' ? '.blogs-container' : null
        );
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        if (contentContainer) contentContainer.classList.add('loading');
    }
}

// Function to hide loading animation
function hideLoading(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const loadingOverlay = section.querySelector('.loading-overlay');
        const contentContainer = section.querySelector(
            sectionId === 'featured-professionals' ? '.profiles-container' :
            sectionId === 'featured-products' ? '.products-container' :
            sectionId === 'featured-professionals22' ? '.profiles-container22' :
            sectionId === 'blog-section' ? '.blogs-container' : null
        );
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        if (contentContainer) contentContainer.classList.remove('loading');
    }
}

// State management functions
function saveAppState() {
    try {
        appState.lastUpdated = Date.now();
        appState.isLoggedIn = !!firebase.auth().currentUser;
        sessionStorage.setItem('appState', JSON.stringify(appState));
    } catch (e) {
        console.error("Error saving app state:", e);
    }
}

function restoreAppState() {
    try {
        const savedState = sessionStorage.getItem('appState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            if (parsedState.lastUpdated && (Date.now() - parsedState.lastUpdated < CACHE_EXPIRATION)) {
                Object.assign(appState, parsedState);
                return true;
            }
        }
    } catch (e) {
        console.error("Error restoring app state:", e);
    }
    return false;
}

// Slider functions
let slideInterval;

function renderSlides() {
    if (!sliderContainer || !sliderDotsContainer) return;
    
    sliderContainer.innerHTML = '';
    sliderDotsContainer.innerHTML = '';
    
    appState.slider.slides.forEach((slide, index) => {
        const slideElement = document.createElement('div');
        slideElement.className = 'slide';
        slideElement.innerHTML = `
            <img src="${slide.imageUrl || slide.image}" alt="${slide.title || ''}">
            ${slide.title ? `
            <div class="slide-content">
                <h2>${slide.title}</h2>
                ${slide.description ? `<p>${slide.description}</p>` : ''}
            </div>` : ''}
        `;
        
        if (slide.link) {
            slideElement.addEventListener('click', () => {
                saveAppState();
                window.location.href = slide.link;
            });
        }
        
        sliderContainer.appendChild(slideElement);
        
        const dot = document.createElement('div');
        dot.className = 'slider-dot';
        if (index === appState.slider.currentSlide) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        sliderDotsContainer.appendChild(dot);
    });
    
    updateSliderPosition();
}

function updateSliderPosition() {
    if (!sliderContainer) return;
    sliderContainer.style.transform = `translateX(${-appState.slider.currentSlide * 100}%)`;
    
    document.querySelectorAll('.slider-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === appState.slider.currentSlide);
    });
}

function startAutoSlide() {
    stopAutoSlide();
    if (appState.slider.isAutoSliding) {
        slideInterval = setInterval(nextSlide, 5000);
    }
}

function stopAutoSlide() {
    clearInterval(slideInterval);
}

function nextSlide() {
    appState.slider.currentSlide = (appState.slider.currentSlide + 1) % appState.slider.slides.length;
    updateSliderPosition();
    saveAppState();
}

function prevSlide() {
    appState.slider.currentSlide = (appState.slider.currentSlide - 1 + appState.slider.slides.length) % appState.slider.slides.length;
    updateSliderPosition();
    saveAppState();
}

function goToSlide(index) {
    appState.slider.currentSlide = index;
    updateSliderPosition();
    saveAppState();
}

function getDefaultSlides() {
    return [
        {
            image: 'assets/img/work1.png',
            title: 'Quality Healthcare',
            description: 'Connecting you with trusted professionals',
            link: 'professionals.html'
        },
        {
            image: 'assets/img/work2.png',
            title: 'Medical Equipment',
            description: 'Find quality healthcare products',
            link: 'marketplace.html'
        }
    ];
}

// Professional functions
function displayProfessionals(professionalsData) {
    if (!profilesContainer) return;
    
    appState.professionals = professionalsData;
    profilesContainer.innerHTML = '';
    
    if (professionalsData) {
        const professionalsArray = Object.keys(professionalsData).map(key => ({
            id: key,
            ...professionalsData[key],
            pos: professionalsData[key].pos || 9999
        })).sort((a, b) => a.pos - b.pos);
        
        const featuredProfessionals = professionalsArray.slice(0, 7);
        
        if (featuredProfessionals.length > 0) {
            featuredProfessionals.forEach(professional => {
                const profileCard = document.createElement('div');
                profileCard.classList.add('profile-card');
                profileCard.innerHTML = `
                    <img src="${professional.img || 'assets/img/profile.png'}" 
                         alt="${professional.name}"
                         class="profile-image">
                    <p2>${professional.name}</p2>
                    <p class="specialty">${professional.job || 'Healthcare Professional'}</p>
                    ${professional.specialty ? `<p class="specialty">${professional.specialty}</p>` : ''}
                `;
                
                profileCard.addEventListener('click', () => {
                    saveAppState();
                    window.location.href = `users.html?id=${professional.id}`;
                });
                
                profilesContainer.appendChild(profileCard);
            });
        } else {
            profilesContainer.innerHTML = '<p>No featured professionals found.</p>';
        }
    } else {
        profilesContainer.innerHTML = '<p>No featured professionals found.</p>';
    }
    
    hideLoading('featured-professionals');
}

// Product functions
function displayFeaturedProducts(productsData) {
    if (!productsContainer) return;
    
    appState.products = productsData;
    productsContainer.innerHTML = '';
    
    const productArray = Object.values(productsData || {}).sort((a, b) => (b.time || 0) - (a.time || 0)).slice(0, 4);
    
    if (productArray.length > 0) {
        productArray.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img src="${product.img}" alt="${product.title}">
                <p2>${product.title}</p2>
                <p>${product.price || 'Brief description of product.'}</p>
            `;
            
            productCard.addEventListener('click', () => {
                saveAppState();
                window.location.href = `display.html?title=${encodeURIComponent(product.title)}&img=${encodeURIComponent(product.img)}&price=${encodeURIComponent(product.price)}&push=${encodeURIComponent(product.push)}&description=${encodeURIComponent(product.description)}&delivery=${encodeURIComponent(product.delivery)}`;
            });
            
            productsContainer.appendChild(productCard);
        });
        
        const viewMoreContainer = document.querySelector('.view-more-container');
        if (viewMoreContainer) {
            viewMoreContainer.style.display = Object.keys(productsData || {}).length > 4 ? 'block' : 'none';
        }
    } else {
        productsContainer.innerHTML = '<p>No featured products found.</p>';
        const viewMoreContainer = document.querySelector('.view-more-container');
        if (viewMoreContainer) viewMoreContainer.style.display = 'none';
    }
    
    hideLoading('featured-products');
}

// Blog functions
function displayLatestBlogPosts(blogPostsData) {
    if (!blogsContainer) return;
    
    appState.blogPosts = blogPostsData;
    blogsContainer.innerHTML = '';
    
    const blogPostsArray = Object.values(blogPostsData || {}).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 5);
    
    if (blogPostsArray.length > 0) {
        blogPostsArray.forEach(blogPost => {
            const blogCard = document.createElement('div');
            blogCard.className = 'blog-card';
            blogCard.innerHTML = `
                <img src="${blogPost.img}" alt="${blogPost.title}">
                <h3>${blogPost.title}</h3>
                <p>${blogPost.description.substring(0, 100)}...</p>
                <a href="#">Read More</a>
            `;
            
            blogCard.addEventListener('click', () => {
                saveAppState();
                window.location.href = `blogs_details.html?id=${blogPost.push}`;
            });
            
            blogsContainer.appendChild(blogCard);
        });
    } else {
        blogsContainer.innerHTML = '<p>No blog posts found.</p>';
    }
    
    hideLoading('blog-section');
}

// Professional22 functions
function displayProfessionals22(professionalsData22) {
    if (!profilesContainer22) return;
    
    appState.professionals22 = professionalsData22;
    profilesContainer22.innerHTML = '';
    
    if (professionalsData22) {
        const professionalsArray = Object.keys(professionalsData22).map(key => ({
            id: key,
            ...professionalsData22[key],
            timestamp: professionalsData22[key].timestamp || 0
        })).sort((a, b) => b.timestamp - a.timestamp);
        
        const featuredProfessionals22 = professionalsArray.slice(0, 10);
        
        if (featuredProfessionals22.length > 0) {
            featuredProfessionals22.forEach(professional => {
                const profileCard = document.createElement('div');
                profileCard.classList.add('profile-card');
                profileCard.innerHTML = `
                    <img src="${professional.img || 'assets/img/profile.png'}" 
                         alt="${professional.name}"
                         class="profile-image">
                    <p2>${professional.name}</p2>
                    <p class="specialty">${professional.job || 'Healthcare Professional'}</p>
                    ${professional.specialty ? `<p class="specialty">${professional.specialty}</p>` : ''}
                `;
                
                profileCard.addEventListener('click', () => {
                    saveAppState();
                    window.location.href = `users.html?id=${professional.id}`;
                });
                
                profilesContainer22.appendChild(profileCard);
            });
        } else {
            profilesContainer22.innerHTML = '<p>No featured professionals found.</p>';
        }
    } else {
        profilesContainer22.innerHTML = '<p>No featured professionals found.</p>';
    }
    
    hideLoading('featured-professionals22');
}

// Error handler function
function handleProfessionalError(sectionId) {
    return error => {
        console.error(`Error loading ${sectionId}:`, error);
        const container = document.querySelector(
            sectionId === 'featured-professionals' ? '.profiles-container' :
            sectionId === 'featured-professionals22' ? '.profiles-container22' : null
        );
        if (container) container.innerHTML = '<p class="error">Error loading professionals. Showing cached data.</p>';
        hideLoading(sectionId);
    };
}

// Initialize the application
function initializeApp() {
    const stateRestored = restoreAppState();
    
    // Check navigation type
    const navigationEntries = performance.getEntriesByType("navigation");
    const navigationType = navigationEntries.length > 0 ? navigationEntries[0].type : '';
    const isBackNavigation = navigationType === 'back_forward';
    
    // Use cached data for back navigation
    if (stateRestored && isBackNavigation) {
        if (appState.professionals) displayProfessionals(appState.professionals);
        if (appState.professionals22) displayProfessionals22(appState.professionals22);
        if (appState.products) displayFeaturedProducts(appState.products);
        if (appState.blogPosts) displayLatestBlogPosts(appState.blogPosts);
        if (appState.slider.slides.length > 0) {
            renderSlides();
            if (appState.slider.isAutoSliding) startAutoSlide();
        }
        
        // Update authentication state if needed
        if (appState.isLoggedIn && !firebase.auth().currentUser) {
            firebase.auth().onAuthStateChanged(user => {
                if (user) handleAuthenticatedState(user);
            });
        }
        
        return; // Skip fetching new data
    }
    
    // Initialize slider
    if (stateRestored && appState.slider.slides.length > 0) {
        renderSlides();
        if (appState.slider.isAutoSliding) startAutoSlide();
    } else {
        sliderRef.once('value').then(snapshot => {
            const sliderData = snapshot.val();
            appState.slider.slides = sliderData ? Object.values(sliderData) : getDefaultSlides();
            renderSlides();
            startAutoSlide();
        }).catch(error => {
            console.error("Error loading slider:", error);
            appState.slider.slides = getDefaultSlides();
            renderSlides();
            startAutoSlide();
        });
    }
    
    // Initialize professionals for both sections
    if (stateRestored) {
        if (appState.professionals) displayProfessionals(appState.professionals);
        if (appState.professionals22) displayProfessionals22(appState.professionals22);
    } else {
        // Original professionals section
        showLoading('featured-professionals');
        professionalsRef.once('value').then(snapshot => {
            displayProfessionals(snapshot.val());
            hideLoading('featured-professionals');
        }).catch(handleProfessionalError('featured-professionals'));

        // New professionals22 section
        showLoading('featured-professionals22');
        professionalsRef.orderByChild('timestamp').limitToLast(10).once('value').then(snapshot => {
            displayProfessionals22(snapshot.val());
            hideLoading('featured-professionals22');
        }).catch(handleProfessionalError('featured-professionals22'));
    }
    
    // Initialize products
    if (stateRestored && appState.products) {
        displayFeaturedProducts(appState.products);
    } else {
        showLoading('featured-products');
        productsRef.once('value').then(snapshot => {
            displayFeaturedProducts(snapshot.val());
        }).catch(error => {
            console.error("Error loading products:", error);
            if (productsContainer) {
                productsContainer.innerHTML = '<p class="error">Error loading products. Showing cached data.</p>';
            }
            hideLoading('featured-products');
        });
    }
    
    // Initialize blog posts
    if (stateRestored && appState.blogPosts) {
        displayLatestBlogPosts(appState.blogPosts);
    } else {
        showLoading('blog-section');
        blogPostsRef.once('value').then(snapshot => {
            displayLatestBlogPosts(snapshot.val());
        }).catch(error => {
            console.error("Error loading blog posts:", error);
            if (blogsContainer) {
                blogsContainer.innerHTML = '<p class="error">Error loading blog posts. Showing cached data.</p>';
            }
            hideLoading('blog-section');
        });
    }
    
    // Set up event listeners
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', stopAutoSlide);
        sliderContainer.addEventListener('mouseleave', () => {
            appState.slider.isAutoSliding = true;
            startAutoSlide();
        });
    }
    
    document.querySelector('.slider-prev')?.addEventListener('click', () => {
        prevSlide();
        appState.slider.isAutoSliding = false;
        startAutoSlide();
    });
    
    document.querySelector('.slider-next')?.addEventListener('click', () => {
        nextSlide();
        appState.slider.isAutoSliding = false;
        startAutoSlide();
    });
    
    // Save state before unload
    window.addEventListener('beforeunload', saveAppState);
    window.addEventListener('pagehide', saveAppState);
}

// Start the application
document.addEventListener('DOMContentLoaded', initializeApp);