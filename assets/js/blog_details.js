// blog_details.js - Blog Details Page Functionality

document.addEventListener('DOMContentLoaded', () => {
    // Get blog post ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const blogId = urlParams.get('id');
    
    if (!blogId) {
        showError("No blog post specified");
        return;
    }

    loadBlogPost(blogId);
});

function loadBlogPost(blogId) {
    const blogContainer = document.getElementById('blog-details-container');
    const relatedPostsContainer = document.getElementById('related-posts');
    
    showLoading(blogContainer);
    
    const blogRef = firebase.database().ref(`blogPosts/${blogId}`);
    blogRef.once('value').then(snapshot => {
        const blogData = snapshot.val();
        
        if (!blogData) {
            showError("Blog post not found", blogContainer);
            return;
        }
        
        // Display the blog post
        displayBlogPost(blogData, blogContainer);
        
        // Load related posts
        loadRelatedPosts(blogData.category, blogId, relatedPostsContainer);
    }).catch(error => {
        console.error("Error loading blog post:", error);
        showError("Error loading blog post. Please try again later.", blogContainer);
    });
}

function displayBlogPost(blogData, container) {
    container.innerHTML = `
        <img src="${blogData.img || '../assets/img/blog-placeholder.jpg'}" alt="${blogData.title}" class="blog-header-image">
        <div class="blog-content">
            <h1 class="blog-title">${blogData.title}</h1>
            <div class="blog-meta">
                ${blogData.timestamp ? `
                <span class="blog-date">
                    <i class='bx bx-calendar'></i>
                    ${formatDate(blogData.timestamp)}
                </span>
                ` : ''}
                ${blogData.author ? `
                <span class="blog-author">
                    <i class='bx bx-user'></i>
                    ${blogData.author}
                </span>
                ` : ''}
                ${blogData.category ? `
                <span class="blog-category">
                    <i class='bx bx-category'></i>
                    ${blogData.category}
                </span>
                ` : ''}
            </div>
            <div class="blog-text">
                ${blogData.content ? blogData.content : 
                  blogData.description ? `<p>${blogData.description}</p>` : 
                  '<p>No content available for this blog post.</p>'}
            </div>
        </div>
    `;
}

function loadRelatedPosts(category, currentPostId, container) {
    if (!category) {
        container.style.display = 'none';
        return;
    }
    
    const blogsRef = firebase.database().ref('blogPosts');
    blogsRef.once('value').then(snapshot => {
        const allBlogs = snapshot.val();
        const blogArray = [];
        
        // Convert to array and filter
        for (const key in allBlogs) {
            if (key !== currentPostId && allBlogs[key].category === category) {
                blogArray.push({
                    id: key,
                    ...allBlogs[key]
                });
            }
        }
        
        // Sort by date (newest first)
        blogArray.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        // Display up to 3 related posts
        if (blogArray.length > 0) {
            displayRelatedPosts(blogArray.slice(0, 3), container);
        } else {
            container.innerHTML = '<p>No related posts found.</p>';
        }
    }).catch(error => {
        console.error("Error loading related posts:", error);
        container.innerHTML = '<p>Error loading related posts.</p>';
    });
}

function displayRelatedPosts(posts, container) {
    container.innerHTML = '';
    
    posts.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'related-post-card';
        postCard.innerHTML = `
            <img src="${post.img || '../assets/img/blog-placeholder.jpg'}" alt="${post.title}">
            <div class="related-post-content">
                <h4 class="related-post-title">${post.title}</h4>
                <p class="related-post-excerpt">${post.description || ''}</p>
                <a href="blog_details.html?id=${post.id}" class="read-more-btn">Read More</a>
            </div>
        `;
        container.appendChild(postCard);
    });
}

function formatDate(timestamp) {
    if (!timestamp) return 'Date not available';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function showLoading(container) {
    container.innerHTML = `
        <div class="loading-overlay">
            <div class="spinner"></div>
            <p>Loading blog post...</p>
        </div>
    `;
}

function showError(message, container) {
    container.innerHTML = `
        <div class="error-message">
            <i class='bx bx-error-circle' style="font-size: 2rem; margin-bottom: 1rem;"></i>
            <p>${message}</p>
            <a href="../blog.html" class="read-more-btn">Back to Blog</a>
        </div>
    `;
}
