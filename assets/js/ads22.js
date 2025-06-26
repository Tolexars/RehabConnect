// assets/js/ads.js

document.addEventListener('DOMContentLoaded', () => {
    // Create ad modal structure
    const adModal = document.createElement('div');
    adModal.id = 'ad-modal';
    adModal.className = 'modal';
    adModal.innerHTML = `
        <div class="modal-content ad-modal-content">
            <span class="close">&times;</span>
            <div class="ad-container">
                <!-- Google AdSense Ad Unit -->
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-client="ca-app-pub-3940256099942544/9257395921"
                     data-ad-slot="XXXXXXXXXX"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
            </div>
        </div>
    `;
    document.body.appendChild(adModal);

    // Ad Modal Styles
    const style = document.createElement('style');
    style.innerHTML = `
        .ad-modal-content {
            max-width: 600px;
            background: white;
            border-radius: 10px;
            overflow: hidden;
        }
        
        .ad-container {
            padding: 20px;
            min-height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        #ad-modal .close {
            position: absolute;
            top: 10px;
            right: 15px;
            font-size: 28px;
            z-index: 10;
        }
    `;
    document.head.appendChild(style);

    // Ad display functionality
    const showAd = () => {
        const modal = document.getElementById('ad-modal');
        modal.style.display = 'block';
        
        // Initialize AdSense
        if (window.adsbygoogle) {
            (adsbygoogle = window.adsbygoogle || []).push({});
        }
    };

    // Close functionality
    document.querySelector('#ad-modal .close').addEventListener('click', () => {
        document.getElementById('ad-modal').style.display = 'none';
    });

    // Close when clicking outside modal
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('ad-modal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Show ad after page load
    window.addEventListener('load', () => {
        // Delay to ensure page is fully loaded
        setTimeout(showAd, 5000); // Show after 5 seconds
    });
});
