
const toolsRef = database.ref('equip');

// DOM elements
const toolsGrid = document.getElementById('tools-grid');
const searchInput = document.querySelector('.hero-search input');
const categoryFilter = document.getElementById('category-filter');
const specialtyFilter = document.getElementById('specialty-filter');
const loadingOverlay = document.querySelector('.loading-overlay');

// State
let toolsData = [];

// Initialize the page
function init() {
  showLoading();
  
  // Fetch tools from Firebase
  toolsRef.once('value')
    .then(snapshot => {
      toolsData = snapshot.val() ? Object.values(snapshot.val()) : [];
      renderTools(toolsData);
      hideLoading();
    })
    .catch(error => {
      console.error("Error loading tools:", error);
      hideLoading();
      toolsGrid.innerHTML = '<p class="error">Error loading tools. Please try again later.</p>';
    });
  
  // Setup event listeners
  searchInput.addEventListener('input', filterTools);
  categoryFilter.addEventListener('change', filterTools);
  specialtyFilter.addEventListener('change', filterTools);
}

// Show loading state
function showLoading() {
  loadingOverlay.classList.add('active');
}

// Hide loading state
function hideLoading() {
  loadingOverlay.classList.remove('active');
}

// Render tools to the page
function renderTools(tools) {
  if (tools.length === 0) {
    toolsGrid.innerHTML = '<div class="no-results"><i class="bx bx-search-alt"></i><h3>No tools found</h3><p>Try adjusting your search or filters</p></div>';
    return;
  }
  
  toolsGrid.innerHTML = '';
  
  tools.forEach(tool => {
    const toolCard = document.createElement('div');
    toolCard.className = 'tool-card';
    
    toolCard.innerHTML = `
      <div class="tool-image">
        <img src="${tool.img || 'assets/img/default-tool.jpg'}" alt="${tool.title}">
      </div>
      <div class="tool-content">
        <h3>${tool.title.substring(0, 50)}...</h3>
        <p>${tool.description.substring(0, 150) || 'Assessment tool for healthcare professionals'}...</p>
        <div class="tool-meta">
          ${tool.category ? `<span>${tool.category}</span>` : ''}
          ${tool.timeRequired ? `<span>${tool.timeRequired}</span>` : ''}
          ${tool.ageRange ? `<span>${tool.ageRange}</span>` : ''}
        </div>
        <div class="tool-actions">
          <button class="btn btn-primary download-btn" data-id="${tool.push}">
            <i class='bx bx-download'></i> Download
          </button>
          ${tool.pdfUrl ? `
          <button class="btn btn-secondary view-btn" data-url="${tool.pdfUrl}">
            <i class='bx bx-show'></i> View
          </button>` : ''}
        </div>
      </div>
    `;
    
    toolsGrid.appendChild(toolCard);
  });
  
  // Add event listeners to download buttons
  document.querySelectorAll('.download-btn').forEach(button => {
    button.addEventListener('click', function() {
      const toolId = this.getAttribute('data-id');
      const tool = toolsData.find(t => t.push === toolId);
      if (tool) {
        generateToolDocument(tool);
      }
    });
  });
  
  // Add event listeners to view buttons
  document.querySelectorAll('.view-btn').forEach(button => {
    button.addEventListener('click', function() {
      const pdfUrl = this.getAttribute('data-url');
      window.open(pdfUrl, '_blank');
    });
  });
}

// Filter tools based on search and filters
function filterTools() {
  const searchTerm = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const specialty = specialtyFilter.value;
  
  const filteredTools = toolsData.filter(tool => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      (tool.title && tool.title.toLowerCase().includes(searchTerm)) || 
      (tool.description && tool.description.toLowerCase().includes(searchTerm));
    
    // Category filter
    const matchesCategory = category === 'all' || 
      (tool.category && tool.category.toLowerCase() === category);
    
    // Specialty filter
    const matchesSpecialty = specialty === 'all' || 
      (tool.specialty && tool.specialty.toLowerCase() === specialty);
    
    return matchesSearch && matchesCategory && matchesSpecialty;
  });
  
  renderTools(filteredTools);
}

// Generate and download document for a tool
function generateToolDocument(tool) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text(tool.title, 105, 20, { align: 'center' });
  
  // Add image if available
  if (tool.img) {
    const img = new Image();
    img.src = tool.img;
    img.crossOrigin = 'Anonymous';
    
    img.onload = function() {
      const imgWidth = 100;
      const imgHeight = (img.height * imgWidth) / img.width;
      doc.addImage(img, 'JPEG', 55, 30, imgWidth, imgHeight);
      
      // Continue with document generation
      completeDocument(doc, tool);
    };
    
    img.onerror = function() {
      // If image fails to load, continue without it
      completeDocument(doc, tool);
    };
  } else {
    completeDocument(doc, tool);
  }
}

function completeDocument(doc, tool) {
  const startY = tool.img ? 140 : 30;
  
  // Add description
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(50);
  doc.text(tool.description || 'Assessment tool for healthcare professionals', 20, startY, { maxWidth: 170 });
  
  // Add metadata
  let yPos = startY + 20;
  
  if (tool.category) {
    doc.setFont(undefined, 'bold');
    doc.text('Category:', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(tool.category, 50, yPos);
    yPos += 7;
  }
  
  if (tool.timeRequired) {
    doc.setFont(undefined, 'bold');
    doc.text('Time Required:', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(tool.timeRequired, 60, yPos);
    yPos += 7;
  }
  
  if (tool.ageRange) {
    doc.setFont(undefined, 'bold');
    doc.text('Age Range:', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(tool.ageRange, 50, yPos);
    yPos += 7;
  }
  
  if (tool.scoring) {
    doc.setFont(undefined, 'bold');
    doc.text('Scoring:', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(tool.scoring, 45, yPos);
    yPos += 7;
  }
  
  if (tool.reference) {
    yPos += 5;
    doc.setFont(undefined, 'italic');
    doc.text(`Reference: ${tool.reference}`, 20, yPos, { maxWidth: 170 });
  }
  
  // Add footer
  const date = new Date().toLocaleDateString();
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Downloaded from RehabConnect on ${date}`, 105, 280, { align: 'center' });
  
  // Save the PDF
  const fileName = `${tool.title.replace(/\s+/g, '_')}_Assessment.pdf`;
  doc.save(fileName);
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
