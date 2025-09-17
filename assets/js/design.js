// Design Gallery JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Firebase references
    const designsRef = database.ref('designs');
    
    // DOM elements
    const designsContainer = document.getElementById('designs-container');
    const loadingOverlay = document.getElementById('loading-overlay');
    const noResults = document.getElementById('no-results');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    // State variables
    let allDesigns = [];
    let filteredDesigns = [];
    
    // Initialize the page
    function init() {
        loadDesigns();
        setupEventListeners();
    }
    
    // Load designs from Firebase
    function loadDesigns() {
        showLoading();
        
        designsRef.once('value')
            .then(snapshot => {
                const designsData = snapshot.val();
                
                if (designsData) {
                    // Convert object to array and add id
                    allDesigns = Object.keys(designsData).map(key => {
                        return {
                            id: key,
                            ...designsData[key],
                            timestamp: designsData[key].timestamp || 0
                        };
                    });
                    
                    // Sort by timestamp (newest first by default)
                    sortDesigns('newest');
                    
                    // Apply initial filters and render
                    applyFilters();
                } else {
                    showNoResults();
                }
                
                hideLoading();
            })
            .catch(error => {
                console.error("Error loading designs:", error);
                hideLoading();
                showError();
            });
    }
    
    // Set up event listeners for filters and search
    function setupEventListeners() {
        categoryFilter.addEventListener('change', applyFilters);
        sortFilter.addEventListener('change', applyFilters);
        searchBtn.addEventListener('click', applyFilters);
        searchInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                applyFilters();
            }
        });
    }
    
    // Apply all filters and render results
    function applyFilters() {
        const category = categoryFilter.value;
        const sortBy = sortFilter.value;
        const searchTerm = searchInput.value.toLowerCase();
        
        // Filter by category
        if (category === 'all') {
            filteredDesigns = [...allDesigns];
        } else {
            filteredDesigns = allDesigns.filter(design => 
                design.category && design.category.toLowerCase() === category
            );
        }
        
        // Filter by search term
        if (searchTerm) {
            filteredDesigns = filteredDesigns.filter(design => 
                (design.title && design.title.toLowerCase().includes(searchTerm)) ||
                (design.description && design.description.toLowerCase().includes(searchTerm))
            );
        }
        
        // Sort results
        sortDesigns(sortBy);
        
        // Render results
        renderDesigns();
    }
    
    // Sort designs based on selected option
    function sortDesigns(sortBy) {
        if (sortBy === 'newest') {
            filteredDesigns.sort((a, b) => b.timestamp - a.timestamp);
        } else if (sortBy === 'oldest') {
            filteredDesigns.sort((a, b) => a.timestamp - b.timestamp);
        }
    }
    
    // Render designs to the page
    function renderDesigns() {
        designsContainer.innerHTML = '';
        
        if (filteredDesigns.length === 0) {
            showNoResults();
            return;
        }
        
        noResults.style.display = 'none';
        
        filteredDesigns.forEach(design => {
            const designCard = createDesignCard(design);
            designsContainer.appendChild(designCard);
        });
    }
    
    // Create a design card element
    function createDesignCard(design) {
        const card = document.createElement('div');
        card.className = 'design-card';
        
        card.innerHTML = `
            <img src="${design.imageUrl}" alt="${design.title || 'Design'}" class="design-image">
            <div class="design-content">
                <h3 class="design-title">${design.title || 'Design Idea'}</h3>
                <p class="design-description">${design.description || 'No description available.'}</p>
                <div class="design-meta">
                    <span class="design-category">${design.category || 'Uncategorized'}</span>
                    <span class="design-date">${formatDate(design.timestamp)}</span>
                </div>
            </div>
        `;
        
        // Add click event to redirect to WhatsApp
        card.addEventListener('click', () => {
            redirectToWhatsAppWithDesign(design);
        });
        
        return card;
    }
    
    // Format timestamp to readable date
    function formatDate(timestamp) {
        if (!timestamp) return 'Date unknown';
        
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    // Redirect to WhatsApp with design details
    function redirectToWhatsAppWithDesign(design) {
        const message = `Hello, I'm interested in this design: ${design.title || 'Design Idea'}. ${design.description ? 'Details: ' + design.description : ''}. ${design.imageUrl || 'Design image'}`;
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/2348132912880?text=${encodedMessage}`, '_blank');
    }
    
    // Show loading state
    function showLoading() {
        loadingOverlay.style.display = 'flex';
        designsContainer.style.display = 'none';
        noResults.style.display = 'none';
    }
    
    // Hide loading state
    function hideLoading() {
        loadingOverlay.style.display = 'none';
        designsContainer.style.display = 'grid';
    }
    
    // Show no results message
    function showNoResults() {
        designsContainer.innerHTML = '';
        designsContainer.style.display = 'none';
        noResults.style.display = 'block';
    }
    
    // Show error message
    function showError() {
        designsContainer.innerHTML = `
            <div class="error-state">
                <i class='bx bx-error'></i>
                <h3>Error Loading Designs</h3>
                <p>Please try again later</p>
            </div>
        `;
    }
    
    // Initialize the page
    init();
});