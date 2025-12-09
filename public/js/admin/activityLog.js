console.log("🚀 activityLog.js loaded!");

// ==============================
// LOAD USER INFO
// ==============================
async function loadUserInfo() {
    try {
        // Check if element exists
        const nameDisplay = document.getElementById('userNameDisplay');
        if (!nameDisplay) {
            console.error("userNameDisplay element not found in HTML!");
            return;
        }

        // Try localStorage first
        const userDataStr = localStorage.getItem('user');
        if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            if (userData.usr_name) {
                updateUserDisplay(userData.usr_name);
                return;
            }
        }

        // Fetch from API if not in localStorage
        const res = await fetch('/api/auth/me');
        if (res.ok) {
            const user = await res.json();
            const userName = user.usr_name || user.username || user.name || 'Admin';
            updateUserDisplay(userName);
            // Store for future use
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            updateUserDisplay('Admin');
        }
    } catch (err) {
        console.error('Failed to load user info:', err);
        updateUserDisplay('Admin');
    }
}

function updateUserDisplay(userName) {
    const nameDisplay = document.getElementById('userNameDisplay');
    if (nameDisplay) {
        nameDisplay.textContent = userName;
    }
}

// Test immediately
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 DOM Content Loaded - Testing user info...");
    loadUserInfo();
});



// ============================
// 🔹 Load Departments for Filter
// ============================
async function loadDepartments() {
  try {
    const res = await fetch("/api/departments", {
      credentials: "include",
      headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) throw new Error("Failed to load departments");

    const departments = await res.json();
    console.log("✅ Departments loaded:", departments);

    const filterDepartment = el("filterDepartment");
    if (!filterDepartment) {
      console.error("❌ filterDepartment element not found!");
      return;
    }

    // Clear existing options except "All Departments"
    filterDepartment.innerHTML = '<option value="">All Departments</option>';

    // Populate department options
    departments.forEach(dept => {
      const option = document.createElement("option");
      option.value = dept.department_id;
      option.textContent = dept.department;
      filterDepartment.appendChild(option);
    });

    console.log("✅ Department filter populated");

  } catch (err) {
    console.error("❌ Error loading departments:", err);
    showToast("Failed to load departments", "error");
  }
}


// ============================
// 🔹 Helper Shortcut
// ============================
const el = id => document.getElementById(id);

// ============================
// 🔹 Global Variables
// ============================
let requestsData = [];
let originalData = [];
let currentUser = null;
let currentRequestId = null;
const TAKE_OUT_LEVELS = [13, 14, 25, 35];

// ============================
// 🔹 Status Configuration
// ============================
const STATUS_MAP = {
  1: { label: 'Pending', class: 'status-pending', value: 'pending' },
  2: { label: 'Rejected (Available)', class: 'status-rejected', value: 'rejected' },
  3: { label: 'Approved', class: 'status-approved', value: 'approved' },
  5: { label: 'Taken Out (Unavailable)', class: 'status-returned', value: 'taken-out' },
  4: { label: 'Returned (Available)', class: 'status-available', value: 'available' }
};

// ============================
// 🔹 Mobile Menu Functions
// ============================
function initMobileMenu() {
  console.log("🔍 Initializing mobile menu...");
  
  const mobileMenuBtn = el("mobileMenuBtn");
  const sidebar = el("sidebar");
  const sidebarOverlay = el("sidebarOverlay");
  
  if (!mobileMenuBtn || !sidebar || !sidebarOverlay) {
    console.warn("⚠️ Mobile menu elements not found");
    return;
  }

  console.log("✅ Mobile menu elements found");

  // Toggle sidebar on hamburger click
  mobileMenuBtn.addEventListener("click", function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log("🍔 Mobile menu toggled");
    sidebar.classList.toggle("active");
    sidebarOverlay.classList.toggle("active");
  });
  
  // Close sidebar on overlay click
  sidebarOverlay.addEventListener("click", function() {
    console.log("📱 Overlay clicked - closing sidebar");
    sidebar.classList.remove("active");
    sidebarOverlay.classList.remove("active");
  });
  
  // Close sidebar when nav link clicked on mobile
  const navLinks = document.querySelectorAll(".sidebar nav a");
  console.log(`Found ${navLinks.length} nav links`);
  
  navLinks.forEach(link => {
    link.addEventListener("click", function() {
      if (window.innerWidth <= 768) {
        console.log("Nav link clicked on mobile - closing sidebar");
        sidebar.classList.remove("active");
        sidebarOverlay.classList.remove("active");
      }
    });
  });

  // Close sidebar on window resize if screen becomes large
  window.addEventListener("resize", function() {
    if (window.innerWidth > 768) {
      sidebar.classList.remove("active");
      sidebarOverlay.classList.remove("active");
    }
  });

  console.log("✅ Mobile menu initialized successfully");
}

// ============================
// 🔹 Toast Notifications
// ============================
function showToast(message, type = "success") {
  const container = el("toastContainer");
  if (!container) {
    const toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.className = "fixed top-4 right-4 z-50 space-y-2";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  const icon = type === "success" ? "✓" : "✕";
  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  
  toast.className = "toast";
  toast.innerHTML = `
    <div class="${bgColor} text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
      ${icon}
    </div>
    <span class="font-medium">${message}</span>
  `;
  
  const finalContainer = el("toastContainer");
  finalContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideIn 0.3s ease-out reverse";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================
// 🔹 Initialize on Page Load
// ============================
if (document.readyState === 'loading') {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

async function initApp() {
  console.log("📄 Initializing app...");
  
  // Initialize mobile menu FIRST
  initMobileMenu();
  
  await loadCurrentUser();
  await loadRequests();
    await loadDepartments(); 
  setupEventListeners();
  
  console.log("✅ App initialized!");
}

// ============================
// 🔹 Load Current User Info
// ============================
async function loadCurrentUser() {
  try {
    const res = await fetch("/api/auth/me", {
      credentials: "include",
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error("Not logged in");
    currentUser = await res.json();
    console.log("✅ User loaded:", currentUser);
  } catch (err) {
    console.warn("⚠️ Could not load user", err);
  }
}

// ============================
// 🔹 Setup Event Listeners
// ============================
function setupEventListeners() {
  el("filterBtn")?.addEventListener("click", applyFilters);
  el("resetBtn")?.addEventListener("click", resetFilters);
  el("searchRequest")?.addEventListener("input", applyFilters);
  el("logoutBtn")?.addEventListener("click", handleLogout);
   el("filterDepartment")?.addEventListener("change", applyFilters);
  
  const cancelBtn = el("cancelReject");
  const confirmBtn = el("confirmReject");
  
  if (cancelBtn) {
    cancelBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeRejectModal();
    });
  }
  
  if (confirmBtn) {
    confirmBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      confirmReject();
    });
  }
  
  const modal = el("rejectModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeRejectModal();
      }
    });
  }
}



// ============================
// 🔹 Load All File Movement Requests
// ============================
async function loadRequests() {
  try {
    console.log("🔍 Starting to fetch requests...");
    
    const res = await fetch("/api/file-movements", {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log("📡 Response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Response not OK:", errorText);
      throw new Error(`Failed to load requests: ${res.status}`);
    }

    const data = await res.json();
    console.log("✅ Data received:", data);
    console.log("📊 Number of records:", data.length);

       if (data.length > 0) {
      console.log("🔍 First record sample:", data[0]);
      console.log("🔍 Department ID:", data[0].department_id);
      console.log("🔍 Department Name:", data[0].department_name);
    }

    requestsData = data;
    originalData = [...data];

    renderTable(requestsData);
    updateStats(requestsData);

  } catch (err) {
    console.error("💥 Error loading requests:", err);
    showToast("Failed to load file requests", "error");
  }
}

// ============================
// 🔹 Render Requests Table
// ============================
function renderTable(requests) {
  const tbody = el("requestTableBody");
  const noRequests = el("noRequests");
  
  if (!tbody) {
    console.error("❌ Table body not found!");
    return;
  }
  
  tbody.innerHTML = "";

  if (!requests || requests.length === 0) {
    console.warn("⚠️ No requests to display");
    if (noRequests) noRequests.classList.remove("hidden");
    return;
  }
  
  if (noRequests) noRequests.classList.add("hidden");

  console.log("🎨 Rendering", requests.length, "requests");

  requests.forEach(req => {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50 transition";
    
    const statusConfig = STATUS_MAP[req.status_id];
    if (req.status_id === 1) {
      row.classList.add("row-pending");
    }
    
    const fileNames = Array.isArray(req.files) 
      ? req.files.map(f => f.file_name).join(", ") 
      : (req.file_name || "-");
    
    const requestedBy = req.user_name || req.requestedBy || "-";
    const moveDate = req.move_date ? formatDateTime(req.move_date) : '-';
    const approvedBy = req.approved_by_name || req.approvedBy || '<span class="text-gray-400">-</span>';
    const statusBadge = getStatusBadge(req, statusConfig);
    const actionBtn = getActionButton(req);

    row.innerHTML = `
      <td class="px-2 md:px-4 py-2 md:py-3 text-center font-semibold">#${req.move_id}</td>
      <td class="px-2 md:px-4 py-2 md:py-3">${escapeHtml(fileNames)}</td>
      <td class="px-2 md:px-4 py-2 md:py-3 hidden md:table-cell">${escapeHtml(requestedBy)}</td>
      <td class="px-2 md:px-4 py-2 md:py-3 hidden lg:table-cell">${moveDate}</td>
      <td class="px-2 md:px-4 py-2 md:py-3 hidden lg:table-cell">${approvedBy}</td>
      <td class="px-2 md:px-4 py-2 md:py-3 text-center">${statusBadge}</td>
      <td class="px-2 md:px-4 py-2 md:py-3 text-center">${actionBtn}</td>
    `;
    
    tbody.appendChild(row);
  });

  console.log("✅ Table rendered successfully");
}

// ============================
// 🔹 Get Status Badge with Approval Time
// ============================
function getStatusBadge(req, statusConfig) {
  if (!statusConfig) {
    return '<span class="status-badge bg-gray-100 text-gray-800">Unknown</span>';
  }
  
  const statusId = req.status_id;
  
  if (statusId === 1 || statusId === 2) {
    return `<span class="status-badge ${statusConfig.class}">${statusConfig.label}</span>`;
  }
  
  if (statusId === 3 || statusId === 4 || statusId === 5) {
    const approvedAt = req.approved_at ? formatDateTime(req.approved_at) : 'N/A';
    return `
      <div class="flex flex-col items-center gap-1">
        <span class="status-badge ${statusConfig.class}">${statusConfig.label}</span>
        <span class="text-xs text-gray-500 hidden lg:inline">${approvedAt}</span>
      </div>
    `;
  }
  
  return `<span class="status-badge ${statusConfig.class}">${statusConfig.label}</span>`;
}

// ============================
// 🔹 Get Action Button Based on Status
// ============================
function getActionButton(req) {
  const HR_LEVELS = [13, 14, 25, 35];
  const canHR = currentUser && HR_LEVELS.includes(Number(currentUser.level));

  // --- STATUS 1: Pending ---
  if (req.status_id === 1) {
    if (canHR) {
      // HR should NOT approve/reject, only see disabled Approved
      return `<span class="text-gray-400 text-xs">Pending</span>`;
    }

    // Normal users → Approve + Reject
    return `
      <div class="flex items-center justify-center gap-1 md:gap-2 flex-wrap">
        <button onclick="approveRequest(${req.move_id}, event)" 
          class="px-2 md:px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs md:text-sm">
          Approve
        </button>

        <button onclick="openRejectModal(${req.move_id}, event)" 
          class="px-2 md:px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs md:text-sm">
          Reject
        </button>
      </div>
    `;
  }

  // --- STATUS 2: Rejected (File Available) ---
  if (req.status_id === 2) {
    return '<span class="text-gray-500 text-xs">File Available</span>';
  }

  // --- STATUS 3: Approved ---
  if (req.status_id === 3) {
    if (canHR) {
      return `
        <button onclick="takeOutFile(${req.move_id}, event)" 
          class="px-2 md:px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs md:text-sm whitespace-nowrap">
          Take Out
        </button>
      `;
    }
    return '<span class="text-gray-400 text-xs">Approved</span>';
  }

  // --- STATUS 5: Taken Out ---
  if (req.status_id === 5) {
    if (canHR) {
      return `
        <button onclick="returnFile(${req.move_id}, event)" 
          class="px-2 md:px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition text-xs md:text-sm whitespace-nowrap">
          Return
        </button>
      `;
    }
    return '<span class="text-gray-400 text-xs">Taken Out</span>';
  }

  // --- STATUS 4: Returned (Available Again) ---
  if (req.status_id === 4) {
    return '<span class="text-gray-500 text-xs">File Available</span>';
  }

  return '<span class="text-gray-400 text-xs">-</span>';
}

// ============================
// 🔹 Admin: Approve Request (Status 1 → 3)
// ============================
async function approveRequest(move_id, event) {
  if (event) event.stopPropagation();
  
  try {
    const res = await fetch(`/api/file-movements/approve/${move_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Failed to approve request");

    showToast("Request approved successfully!", "success");
    await loadRequests();

  } catch (err) {
    console.error("Error approving request:", err);
    showToast("Error approving request: " + err.message, "error");
  }
}

// ============================
// 🔹 Open Reject Modal
// ============================
function openRejectModal(move_id, event) {
  if (event) event.stopPropagation();
  currentRequestId = move_id;
  const modal = el("rejectModal");
  if (modal) modal.classList.add("active");
}

// ============================
// 🔹 Close Reject Modal
// ============================
function closeRejectModal() {
  currentRequestId = null;
  const rejectReason = el("rejectReason");
  if (rejectReason) rejectReason.value = "";
  const modal = el("rejectModal");
  if (modal) modal.classList.remove("active");
}

// ============================
// 🔹 Admin: Confirm Reject Request (Status 1 → 2)
// ============================
async function confirmReject() {
  const reason = el("rejectReason")?.value.trim();
  
  if (!reason) {
    showToast("Please provide a reason for rejection", "error");
    return;
  }

  const request = requestsData.find(r => r.move_id === currentRequestId);
  if (!request) return;

  try {
    const res = await fetch(`/api/file-movements/reject/${currentRequestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ remark: reason })
      });

    if (res.ok) {
      showToast("Request rejected. File is now available.", "success");
      closeRejectModal();
      await loadRequests();
    } else {
      const error = await res.json();
      showToast(error.error || "Failed to reject request", "error");
    }
  } catch (err) {
    console.error("Error rejecting request:", err);
    showToast("Failed to reject request", "error");
  }
}

// ============================
// 🔹 HR: Take Out File (Status 3 → 5)
// ============================
async function takeOutFile(move_id, event) {
  if (event) event.stopPropagation();
  
  const request = requestsData.find(r => r.move_id === move_id);
  if (!request) return;

  const confirmed = confirm("Mark file as TAKEN OUT?\n\nThis confirms the file has been physically taken out.");
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/file-movements/${move_id}/take-out`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });

    if (res.ok) {
      showToast("File marked as taken out (unavailable)", "success");
      await loadRequests();
    } else {
      const error = await res.json();
      showToast(error.error || "Failed to update status", "error");
    }
  } catch (err) {
    console.error("Error taking out file:", err);
    showToast("Failed to update status", "error");
  }
}

// ============================
// 🔹 HR: Return File (Status 5 → 4)
// ============================
async function returnFile(move_id, event) {
  if (event) event.stopPropagation();
  
  const request = requestsData.find(r => r.move_id === move_id);
  if (!request) return;

  const confirmed = confirm("Mark file as RETURNED?\n\nThis confirms the file has been returned.");
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/file-movements/${move_id}/Return`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });

    if (res.ok) {
      showToast("File returned and is now available", "success");
      await loadRequests();
    } else {
      const error = await res.json();
      showToast(error.error || "Failed to mark as returned", "error");
    }
  } catch (err) {
    console.error("Error marking returned:", err);
    showToast("Failed to mark as returned", "error");
  }
}

// ============================
// 🔹 Update Statistics
// ============================
function updateStats(requests) {
  const stats = {
    pending: 0,
    rejected: 0,
    approved: 0,
    takenOut: 0,
    available: 0
  };

  requests.forEach(req => {
    switch(req.status_id) {
      case 1: stats.pending++; break;
      case 2: stats.rejected++; break;
      case 3: stats.approved++; break;
      case 5: stats.takenOut++; break;
      case 4: stats.available++; break;
    }
  });

  if (el('statPending')) el('statPending').textContent = stats.pending;
  if (el('statRejected')) el('statRejected').textContent = stats.rejected;
  if (el('statApproved')) el('statApproved').textContent = stats.approved;
  if (el('statTakenOut')) el('statTakenOut').textContent = stats.takenOut;
  if (el('statAvailable')) el('statAvailable').textContent = stats.available;
}

// ============================
// 🔹 Apply Filters
// ============================
function applyFilters() {
  console.log("🔍 === APPLYING FILTERS ===");
  
  const statusFilter = el('filterStatus')?.value;
  const departmentFilter = el('filterDepartment')?.value;
  const dateFilter = el('filterDate')?.value;
  const searchFilter = el('searchRequest')?.value.toLowerCase();

  console.log("📊 Filter values:", {
    status: statusFilter,
    department: departmentFilter,
    date: dateFilter,
    search: searchFilter
  });

  console.log("📦 Original data count:", originalData.length);
  let filtered = [...originalData];

  // Status filter
  if (statusFilter) {
    const beforeCount = filtered.length;
    filtered = filtered.filter(r => {
      const statusConfig = STATUS_MAP[r.status_id];
      return statusConfig && statusConfig.value === statusFilter;
    });
    console.log(`✅ Status filter: ${beforeCount} → ${filtered.length} records`);
  }

  // Department filter
  if (departmentFilter) {
    const beforeCount = filtered.length;
    console.log(`🏢 Filtering by department: ${departmentFilter}`);
    
    filtered = filtered.filter(r => {
      const recordDept = r.department_id;
      const filterDept = departmentFilter;
      const match = recordDept == filterDept;
      
      // Log first 3 comparisons
      if (beforeCount < 3 || filtered.indexOf(r) < 3) {
        console.log(`  Record #${r.move_id}: dept=${recordDept}, filter=${filterDept}, match=${match}`);
      }
      
      return match;
    });
    console.log(`✅ Department filter: ${beforeCount} → ${filtered.length} records`);
  }

  // Date filter
  if (dateFilter) {
    const beforeCount = filtered.length;
    filtered = filtered.filter(r => {
      if (!r.move_date) return false;
      const moveDate = new Date(r.move_date).toISOString().split('T')[0];
      return moveDate === dateFilter;
    });
    console.log(`✅ Date filter: ${beforeCount} → ${filtered.length} records`);
  }

  // Search filter
  if (searchFilter) {
    const beforeCount = filtered.length;
    filtered = filtered.filter(r => {
      const fileName = Array.isArray(r.files) 
        ? r.files.map(f => f.file_name).join(" ").toLowerCase()
        : (r.file_name || "").toLowerCase();
      
      const requestedBy = (r.user_name || r.requestedBy || "").toLowerCase();
      
      return fileName.includes(searchFilter) || requestedBy.includes(searchFilter);
    });
    console.log(`✅ Search filter: ${beforeCount} → ${filtered.length} records`);
  }

  console.log(`📋 FINAL: ${filtered.length} records after all filters`);
  console.log("🔍 === FILTER COMPLETE ===\n");

  renderTable(filtered);
  updateStats(filtered);
}

// ============================
// 🔹 Reset Filters
// ============================
function resetFilters() {
  if (el('filterStatus')) el('filterStatus').value = '';
  if (el('filterDate')) el('filterDate').value = '';
  if (el('searchRequest')) el('searchRequest').value = '';
    if (el('filterDepartment')) el('filterDepartment').value = '';
  
  renderTable(originalData);
  updateStats(originalData);
}

// ============================
// 🔹 Logout Handler
// ============================
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include"
    })
      .then(() => {
        window.location.href = '/login.html';
      })
      .catch(() => {
        window.location.href = '/login.html';
      });
  }
}

// ============================
// 🔹 Helper Functions
// ============================
function formatDateTime(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================
// 🔹 Expose Functions Globally
// ============================
window.approveRequest = approveRequest;
window.openRejectModal = openRejectModal;
window.confirmReject = confirmReject;
window.closeRejectModal = closeRejectModal;
window.takeOutFile = takeOutFile;
window.returnFile = returnFile;