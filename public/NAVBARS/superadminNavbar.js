// navbar.js
function loadNavbar() {
  const navbarHTML = `
    <aside class="sidebar">
      <div>
        <img src="/Images/SAFWA-R Logo.png" alt="Logo" class="w-20 mx-auto mb-8">
        <h1 class="text-xl font-bold mb-6 flex items-center gap-2">Super Admin Panel</h1>
      </div>
      <nav class="flex flex-col gap-3">
        <a href="admin.html" class="nav-link">Add Files record</a>
       
        <a href="locations.html" class="nav-link">Cabinet Locations</a>
        
      </nav>
      <button id="logoutBtn" class="logout-btn">Logout</button>
    </aside>
  `;
  
  document.getElementById('navbar-container').innerHTML = navbarHTML;
  
  // Set active link based on current page
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
  
  // Add logout event listener
  document.getElementById('logoutBtn').addEventListener('click', function() {
    if (confirm('Are you sure you want to logout?')) {
      window.location.href = 'login.html';
    }
  });
}

// Load navbar when page loads
document.addEventListener('DOMContentLoaded', loadNavbar);