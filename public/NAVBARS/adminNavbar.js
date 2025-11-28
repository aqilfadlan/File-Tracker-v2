// adminNavbar.js
function loadNavbar() {
  const navbarHTML = `
    <aside class="sidebar">
      <div class="sidebar-header">
        
        <h1 class="sidebar-title">
          <span class="icon">📁</span>
          Admin Panel
        </h1>
      </div>
      
      <nav class="sidebar-nav">
        <a href="admin.html" class="nav-link">
          <span class="nav-icon">📋</span>
          <span class="nav-text">Add Files Record</span>
        </a>
        <a href="activityLog.html" class="nav-link">
          <span class="nav-icon">📊</span>
          <span class="nav-text">Activity Log</span>
        </a>
        <a href="locations.html" class="nav-link">
          <span class="nav-icon">📍</span>
          <span class="nav-text">Cabinet Locations</span>
        </a>
      </nav>
      
      <div class="sidebar-footer">
        <button id="logoutBtn" class="logout-btn">
          <span class="logout-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  `;
  
  document.getElementById('navbar-container').innerHTML = navbarHTML;
  
  // Set active link based on current page
  const currentPage = window.location.pathname.split('/').pop() || 'admin.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'admin.html')) {
      link.classList.add('active');
    }
  });
  
  // Add logout event listener
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to logout?')) {
        // Clear any stored session data if needed
        localStorage.removeItem('userSession'); // Optional
        window.location.href = 'login.html';
      }
    });
  }
}

// Load navbar when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadNavbar);
} else {
  loadNavbar();
}