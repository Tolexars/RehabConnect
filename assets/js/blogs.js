// blogs.js - Blog Page Functionality

// Initialize Firebase (assuming configure.js is loaded first)
const blogSearchInput = document.getElementById('blog-search-input');
const categoryFilter = document.getElementById('category-filter');

// Function to display blog posts
function displayBlogPosts(blogPosts, searchTerm = '', category = 'All') {
    if (!blogsContainer) return;
    
    // Filter blog posts based on search term and category
    const filteredBlogs = blogPosts.filter(blog => {
        const matchesSearch = searchTerm === '' || 
            (blog.title && blog.title.toLowerCase().includes(searchTerm.toLowerCase())) || 
            (blog.description && blog.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesCategory = category === 'All' || 
            (blog.category && blog.category.toLowerCase() === category.toLowerCase());
        
        return matchesSearch && matchesCategory;
    });
    
    blogsContainer.innerHTML = '';
    
    if (filteredBlogs.length > 0) {
        filteredBlogs.forEach(blog => {
            const blogCard = document.createElement('div');
            blogCard.className = 'blog-card';
            blogCard.innerHTML = `
                <img src="${blog.img || 'assets/img/blog-placeholder.jpg'}" alt="${blog.title}">
                <div class="blog-card-content">
                    <h3>${blog.title}</h3>
                    <p class="blog-date">${formatDate(blog.timestamp)}</p>
                    <p>${blog.description.substring(0, 150)}...</p>
                    <a href="blogs_details.html?id=${blog.push}" class="read-more">Read More</a>
                </div>
            `;
            
            blogCard.addEventListener('click', () => {
                window.location.href = `blogs_details.html?id=${blog.push}`;
            });
            
            blogsContainer.appendChild(blogCard);
        });
    } else {
        blogsContainer.innerHTML = '<p class="no-results">No blog posts found matching your criteria.</p>';
    }
}

// Helper function to format date
function formatDate(timestamp) {
    if (!timestamp) return 'Date not available';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Function to load blog posts from Firebase
function loadBlogPosts() {
    showLoading('blog-section');
    
    const blogPostsRef = firebase.database().ref('blogPosts');
    blogPostsRef.once('value').then(snapshot => {
        const blogPostsData = snapshot.val();
        const blogPostsArray = blogPostsData ? Object.values(blogPostsData) : [];
        
        // Sort by timestamp (newest first)
        blogPostsArray.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        displayBlogPosts(blogPostsArray);
        hideLoading('blog-section');
        
        // Set up search and filter event listeners
        setupSearchAndFilter(blogPostsArray);
    }).catch(error => {
        console.error("Error loading blog posts:", error);
        blogsContainer.innerHTML = '<p class="error">Error loading blog posts. Please try again later.</p>';
        hideLoading('blog-section');
    });
}

// Function to set up search and filter
function setupSearchAndFilter(blogPosts) {
    // Search functionality
    blogSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();
        const category = categoryFilter.value;
        displayBlogPosts(blogPosts, searchTerm, category);
    });
    
    // Category filter functionality
    categoryFilter.addEventListener('change', (e) => {
        const searchTerm = blogSearchInput.value.trim();
        const category = e.target.value;
        displayBlogPosts(blogPosts, searchTerm, category);
    });
}

// Initialize the blog page
document.addEventListener('DOMContentLoaded', () => {
    loadBlogPosts();
});

// Update the "View More" button in your existing code to link to blog.html
// In your configure.js or wherever you have the blog section code:
function displayLatestBlogPosts(blogPostsData) {
    if (!blogsContainer) return;
    blogsContainer.innerHTML = '';
    const blogPostsArray = Object.values(blogPostsData || {}).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 5);
    if (blogPostsArray.length > 0) {
        blogPostsArray.forEach(blogPost => {
            const blogCard = document.createElement('div');
            blogCard.classList.add('blog-card');
            blogCard.innerHTML = `
                <img src="${blogPost.img}" alt="${blogPost.title}">
                <div class="blog-card-content">
                    <h3>${blogPost.title}</h3>
                    <p>${blogPost.description.substring(0, 100)}...</p>
                    <a href="blog.html" class="read-more">View More Blogs</a>
                </div>
            `;
            blogsContainer.appendChild(blogCard);
        });
    } else {
        blogsContainer.innerHTML = '<p>No blog posts found.</p>';
    }
    hideLoading('blog-section');
}
