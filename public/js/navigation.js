// navigation.js - Handles active menu item highlighting
document.addEventListener('DOMContentLoaded', function() {
  // Get current page filename
  const currentPath = window.location.pathname;
  const currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1);
  
  // Get all navigation menu items
  const menuItems = document.querySelectorAll('nav a, nav button, .menu-item');
  
  // Remove active class from all items first
  menuItems.forEach(item => {
    item.classList.remove('active');
  });
  
  // Add active class based on current page
  menuItems.forEach(item => {
    const href = item.getAttribute('href');
    const dataPage = item.getAttribute('data-page');
    
    // Check if item matches current page
    if (href && href.includes(currentPage)) {
      item.classList.add('active');
    } else if (dataPage && currentPage.includes(dataPage)) {
      item.classList.add('active');
    }
    
    // Handle specific page matches
    const itemText = item.textContent.trim().toLowerCase();
    
    if (currentPage.includes('folder') && itemText.includes('folder')) {
      item.classList.add('active');
    } else if (currentPage.includes('activity') && itemText.includes('activity')) {
      item.classList.add('active');
    } else if (currentPage.includes('history') && itemText.includes('history')) {
      item.classList.add('active');
    } else if (currentPage.includes('cabinet') && itemText.includes('cabinet')) {
      item.classList.add('active');
    }
  });
});