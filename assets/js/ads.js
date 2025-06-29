// ads.js - Combined AdMob and AdSense implementation with improved error handling

document.addEventListener('DOMContentLoaded', function() {
    createAdContainers();
    
    if (isMobileDevice()) {
        initializeAdMob(); // AdMob for mobile
    } else {
        loadAdSense(); // AdSense for desktop
    }
    
    // Initialize after containers are ready
    setTimeout(initializeAds, 500);
});

// ========================
//  Core Functions
// ========================

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function createAdContainers() {
    const adLocations = [
        {id: 'ad-middle', after: 'featured-professionals', className: 'ad-container ad-middle'},
        {id: 'ad-bottom', after: 'blog-section', className: 'ad-container ad-bottom'}
    ];
    
    adLocations.forEach(location => {
        if (!document.getElementById(location.id)) {
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
        }
    });
}

// ========================
//  Ad Network Initialization
// ========================

function initializeAdMob() {
    // Assumes Firebase is already initialized in configuration.js
    if (typeof firebase === 'undefined' || !firebase.ads) {
        console.error('Firebase AdMob not available, falling back to AdSense');
        loadAdSense();
        return;
    }
    
    firebase.ads()
        .initialize()
        .then(() => {
            console.log('AdMob initialized');
            window.admobInitialized = true;
        })
        .catch(error => {
            console.error('AdMob init failed:', error);
            loadAdSense(); // Fallback to AdSense
        });
}

function loadAdSense() {
    if (window.adsbygoogle && window.adsInitialized) return;
    
    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4782711076571062';
    script.async = true;
    script.onload = () => {
        window.adsInitialized = true;
        console.log('AdSense loaded');
    };
    script.onerror = () => {
        console.error('AdSense failed, showing fallback');
        showFallbackAds();
    };
    document.head.appendChild(script);
}

// ========================
//  Ad Loading Logic (Improved)
// ========================

function initializeAds() {
    if (isMobileDevice() && window.admobInitialized) {
        loadAdMobAds();
    } else if (window.adsbygoogle) {
        loadAdSenseAds();
    } else {
        showFallbackAds();
    }
}

function loadAdMobAds() {
    const adUnits = [
        { id: 'ad-middle-content', adUnitId: 'YOUR_ADMOB_AD_UNIT_ID_1' },
        { id: 'ad-bottom-content', adUnitId: 'YOUR_ADMOB_AD_UNIT_ID_2' }
    ];

    adUnits.forEach(unit => {
        const container = document.getElementById(unit.id);
        
        // Only attempt to load if container is visible and has dimensions
        if (container && container.offsetWidth > 0 && container.offsetHeight > 0) {
            createAdMobAd(unit.id, unit.adUnitId);
        } else {
            console.warn(`Container ${unit.id} not ready, retrying...`);
            setTimeout(() => createAdMobAd(unit.id, unit.adUnitId), 500);
        }
    });
}

function createAdMobAd(containerId, adUnitId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container ${containerId} not found`);
        return;
    }
    
    // If container has no dimensions, show fallback
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        console.warn(`Container ${containerId} has no dimensions`);
        showFallbackContent(containerId);
        return;
    }
    
    container.innerHTML = '';
    
    const ad = new firebase.ads.BannerAd({
        adUnitId: adUnitId,
        size: firebase.ads.BannerSize.ADAPTIVE_BANNER,
        container: container
    });

    ad.load()
        .then(() => ad.show())
        .catch(error => {
            console.error(`AdMob failed for ${containerId}:`, error);
            showFallbackContent(containerId);
        });
}

function loadAdSenseAds() {
    const adUnits = [
        { id: 'ad-middle-content', adClient: 'ca-pub-4782711076571062', adSlot: '1234567890' },
        { id: 'ad-bottom-content', adClient: 'ca-pub-4782711076571062', adSlot: '9876543210' }
    ];

    adUnits.forEach(unit => {
        const container = document.getElementById(unit.id);
        
        // Only attempt to load if container is visible and has dimensions
        if (container && container.offsetWidth > 0 && container.offsetHeight > 0) {
            createAdSenseAd(unit.id, unit.adClient, unit.adSlot);
        } else {
            console.warn(`Container ${unit.id} not ready, retrying...`);
            setTimeout(() => createAdSenseAd(unit.id, unit.adClient, unit.adSlot), 500);
        }
    });
}

function createAdSenseAd(containerId, adClient, adSlot) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container ${containerId} not found`);
        return;
    }
    
    // If container has no dimensions, show fallback
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        console.warn(`Container ${containerId} has no dimensions`);
        showFallbackContent(containerId);
        return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Create AdSense element with improved styling
    const adElement = document.createElement('ins');
    adElement.className = 'adsbygoogle';
    adElement.style.display = 'block';
    adElement.style.width = '100%';
    adElement.style.height = '100%';
    adElement.style.minHeight = '250px';
    adElement.dataset.adClient = adClient;
    adElement.dataset.adSlot = adSlot;
    adElement.dataset.adFormat = 'auto';
    adElement.dataset.fullWidthResponsive = 'true';
    
    container.appendChild(adElement);
    
    try {
        // Push to AdSense queue
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        console.log(`AdSense ad created in ${containerId}`);
    } catch (e) {
        console.error(`AdSense failed for ${containerId}:`, e);
        showFallbackContent(containerId);
    }
}

// ========================
//  Fallback System (Improved)
// ========================

function showFallbackAds() {
    const fallbacks = {
        'ad-middle-content': `
            <div class="ad-fallback">
                <h3>Professional Help</h3>
                <p>Connect with certified specialists</p>
                <a href="/professionals">Browse Professionals</a>
            </div>`,
        'ad-bottom-content': `
            <div class="ad-fallback">
                <h3>Health Resources</h3>
                <p>Discover our free tools and guides</p>
                <a href="/resources">Explore Resources</a>
            </div>`
    };

    Object.entries(fallbacks).forEach(([id, content]) => {
        showFallbackContent(id, content);
    });
}

function showFallbackContent(containerId, content = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = content || `
        <div class="ad-fallback">
            <p>Advertisement placeholder</p>
        </div>`;
}
