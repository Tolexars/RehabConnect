// ads.js
document.addEventListener('DOMContentLoaded', function() {
    // Create ad containers
    createAdContainers();
    
    // Load Google AdSense script
    loadAdSense();
    
    // Initialize ads after a delay to ensure page has rendered
    setTimeout(initializeAds, 2000);
});

function createAdContainers() {
    // Create ad containers at strategic locations
    const adLocations = [
        {id: 'ad-middle', after: 'featured-professionals', className: 'ad-container ad-middle'},
        {id: 'ad-bottom', after: 'blog-section', className: 'ad-container ad-bottom'}
    ];
    
    adLocations.forEach(location => {
        const adContainer = document.createElement('div');
        adContainer.id = location.id;
        adContainer.className = location.className;
        adContainer.innerHTML = `
            <div class="ad-label">Advertisement</div>
            <div class="ad-content" id="${location.id}-content"></div>
        `;
        
        const targetElement = document.getElementById(location.after);
        if (targetElement && targetElement.parentNode) {
            targetElement.parentNode.insertBefore(adContainer, targetElement.nextSibling);
        }
    });
}

function loadAdSense() {
    // Only load if not already loaded
    if (window.adsbygoogle && !window.adsInitialized) {
        return;
    }
    
    // Create script element
    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    script.async = true;
    script.onload = () => {
        window.adsInitialized = true;
        console.log('AdSense script loaded successfully');
    };
    script.onerror = () => {
        console.error('Failed to load AdSense script');
    };
    
    document.head.appendChild(script);
}

function initializeAds() {
    // Initialize ads if AdSense is available
    if (window.adsbygoogle) {
        try {
            // Create ad units
            createAdUnit('ad-middle-content', 'ca-app-pub-4782711076571062/1918087836', 'index ads');
            createAdUnit('ad-bottom-content', 'your-ad-client-id', 'your-ad-slot-id-bottom');
            
            console.log('Ads initialized successfully');
        } catch (error) {
            console.error('Error initializing ads:', error);
        }
    } else {
        console.warn('AdSense not available, showing fallback content');
        showFallbackAds();
    }
}

function createAdUnit(containerId, adClient, adSlot) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const adElement = document.createElement('ins');
    adElement.className = 'adsbygoogle';
    adElement.style.display = 'block';
    adElement.dataset.adClient = adClient;
    adElement.dataset.adSlot = adSlot;
    adElement.dataset.adFormat = 'auto';
    adElement.dataset.fullWidthResponsive = true;
    
    container.appendChild(adElement);
    
    // Push the ad to AdSense
    (adsbygoogle = window.adsbygoogle || []).push({});
}

function showFallbackAds() {
    // Fallback content if ads don't load
    const fallbackContent = [
        
        {
            id: 'ad-middle-content',
            content: `<div class="ad-fallback">
                <h3>Expert Consultation</h3>
                <p>Connect with certified healthcare professionals</p>
                <a href="professionals.html">Find a Specialist</a>
            </div>`
        },
        {
            id: 'ad-bottom-content',
            content: `<div class="ad-fallback">
                <h3>Health Insights</h3>
                <p>Read our latest articles on rehabilitation</p>
                <a href="blogs.html">Explore Blogs</a>
            </div>`
        }
    ];
    
    fallbackContent.forEach(ad => {
        const container = document.getElementById(ad.id);
        if (container) {
            container.innerHTML = ad.content;
        }
    });
}
