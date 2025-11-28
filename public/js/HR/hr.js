// ============================
// 🔹 Helper Shortcut
// ============================
const el = id => document.getElementById(id);

// ============================
// 🔹 Toast Notifications
// ============================
function showToast(message, type = "success") {
  const container = el("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className =
    "toast flex items-center gap-2 bg-white border border-gray-200 rounded-lg shadow-md px-4 py-2 animate-slideIn";
  toast.innerHTML = `
    <span class="text-lg">${type === "success" ? "✅" : "❌"}</span>
    <p class="text-gray-700 font-medium">${message}</p>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ============================
// 🔹 Registration Type Toggle
// ============================
let currentFolderId = null; // For editing

document.addEventListener("DOMContentLoaded", () => {
  const registerFolderBtn = el("registerFolderBtn");
  const registerFileBtn = el("registerFileBtn");
  const folderFormSection = el("folderFormSection");
  const fileFormSection = el("fileFormSection");

  if (registerFolderBtn) {
    registerFolderBtn.addEventListener("click", () => {
      folderFormSection.classList.remove("hidden");
      fileFormSection.classList.add("hidden");
      generateSerialNumber();
    });
  }

  if (registerFileBtn) {
    registerFileBtn.addEventListener("click", () => {
      fileFormSection.classList.remove("hidden");
      folderFormSection.classList.add("hidden");
      loadFoldersForFileRegistration();
    });
  }

  // Initialize
  loadDepartments();
  loadLocations();
  loadFolders();

  // Form submissions
  el("folderForm")?.addEventListener("submit", createFolder);
  el("fileForm")?.addEventListener("submit", createFile);
  el("editFolderForm")?.addEventListener("submit", saveFolderChanges);

  // Logout
  el("logoutBtn")?.addEventListener("click", () => {
    if (confirm("Logout?")) {
      fetch("/api/auth/logout").then(() => location.href = "/login.html");
    }
  });

  // File folder selection auto-fill
  el("fileFolderSelect")?.addEventListener("change", autoFillFileForm);
});

function cancelRegistration() {
  el("folderFormSection").classList.add("hidden");
  el("fileFormSection").classList.add("hidden");
  el("folderForm")?.reset();
  el("fileForm")?.reset();
}

// ============================
// 🔹 Generate Serial Number (SGV/YEAR/DEPT/ID)
// ============================
async function generateSerialNumber() {
  const deptSelect = el("folderDepartmentSelect");
  const serialInput = el("folderSerial");
  
  if (!deptSelect || !serialInput) return;

  deptSelect.addEventListener("change", async () => {
    const deptId = deptSelect.value;
    if (!deptId) {
      serialInput.value = "Select department first";
      return;
    }

    const deptCode = deptSelect.options[deptSelect.selectedIndex].textContent.substring(0, 3).toUpperCase();
    const year = new Date().getFullYear();
    
    try {
      // Try to get next ID from API
      const res = await fetch(`/api/folder/next-id?department_id=${deptId}`);
      const data = await res.json();
      const nextId = data.next_id || 1;
      serialInput.value = `SGV/${year}/${deptCode}/${String(nextId).padStart(3, '0')}`;
    } catch {
      // Fallback to localStorage
      const folders = JSON.parse(localStorage.getItem("folders")) || [];
      const deptFolders = folders.filter(f => f.department === deptSelect.options[deptSelect.selectedIndex].textContent);
      const nextId = deptFolders.length + 1;
      serialInput.value = `SGV/${year}/${deptCode}/${String(nextId).padStart(3, '0')}`;
    }
  });
}

// ============================
// 🔹 Load Departments
// ============================
async function loadDepartments() {
  const selects = [
    el("folderDepartmentSelect"),
    el("editDepartmentSelect")
  ].filter(Boolean);

  if (!selects.length) return;

  try {
    const res = await fetch("/api/departments");
    const data = await res.json();
    
    selects.forEach(select => {
      select.innerHTML = "<option value=''>Select Department</option>";
      data.forEach(dept => {
        const option = document.createElement("option");
        option.value = dept.department_id;
        option.textContent = dept.department;
        select.appendChild(option);
      });
    });
  } catch {
    // Fallback
    const fallback = [
      { department_id: 1, department: "HR" },
      { department_id: 2, department: "Finance" },
      { department_id: 3, department: "IT" },
      { department_id: 4, department: "Operations" },
    ];
    
    selects.forEach(select => {
      select.innerHTML = "<option value=''>Select Department</option>";
      fallback.forEach(dept => {
        const option = document.createElement("option");
        option.value = dept.department_id;
        option.textContent = dept.department;
        select.appendChild(option);
      });
    });
  }
}

// ============================
// 🔹 Load Locations
// ============================
async function loadLocations() {
  const selects = [
    el("folderLocationsSelect"),
    el("editLocationSelect")
  ].filter(Boolean);

  if (!selects.length) return;

  try {
    const res = await fetch("/api/locations");
    const data = await res.json();
    
    selects.forEach(select => {
      select.innerHTML = "<option value=''>Select Location</option>";
      data.forEach(loc => {
        const option = document.createElement("option");
        option.value = loc.location_id;
        option.textContent = loc.location_name;
        select.appendChild(option);
      });
    });
  } catch {
    // Fallback
    const fallback = [
      { location_id: 1, location_name: "Building A - Floor 1" },
      { location_id: 2, location_name: "Building A - Floor 2" },
      { location_id: 3, location_name: "Building B - Floor 1" },
      { location_id: 4, location_name: "Archive Room" },
    ];
    
    selects.forEach(select => {
      select.innerHTML = "<option value=''>Select Location</option>";
      fallback.forEach(loc => {
        const option = document.createElement("option");
        option.value = loc.location_id;
        option.textContent = loc.location_name;
        select.appendChild(option);
      });
    });
  }
}

// ============================
// 🔹 Load Folders for File Registration
// ============================
async function loadFoldersForFileRegistration() {
  const select = el("fileFolderSelect");
  if (!select) return;

  select.innerHTML = "<option value=''>Loading folders...</option>";

  try {
    const res = await fetch("/api/folder");
    const folders = await res.json();
    
    select.innerHTML = "<option value=''>Select Folder</option>";
    folders.forEach(folder => {
      const option = document.createElement("option");
      option.value = folder.folder_id;
      option.textContent = `${folder.serial_num} - ${folder.folder_name}`;
      option.dataset.department = folder.department;
      option.dataset.location = folder.location;
      select.appendChild(option);
    });
  } catch {
    // Fallback
    const folders = JSON.parse(localStorage.getItem("folders")) || [];
    select.innerHTML = "<option value=''>Select Folder</option>";
    
    folders.forEach(folder => {
      const option = document.createElement("option");
      option.value = folder.folder_id;
      option.textContent = `${folder.serial_num} - ${folder.folder_name}`;
      option.dataset.department = folder.department;
      option.dataset.location = folder.location;
      select.appendChild(option);
    });
  }
}

// ============================
// 🔹 Auto-fill File Form
// ============================
function autoFillFileForm() {
  const select = el("fileFolderSelect");
  const selectedOption = select.options[select.selectedIndex];
  
  if (selectedOption && selectedOption.value) {
    el("fileDepartment").value = selectedOption.dataset.department || "";
    el("fileLocation").value = selectedOption.dataset.location || "";
  } else {
    el("fileDepartment").value = "";
    el("fileLocation").value = "";
  }
}

// ============================
// 🔹 Create Folder
// ============================
async function createFolder(e) {
  e.preventDefault();
  
  const folder_name = el("folderTitle").value.trim();
  const department_id = el("folderDepartmentSelect").value;
  const location_id = el("folderLocationsSelect").value;
  const serial_num = el("folderSerial").value;
  const used_for = el("folderUsedFor")?.value.trim() || "";

  if (!folder_name || !department_id || !location_id) {
    return showToast("Please fill all required fields!", "error");
  }

  const department = el("folderDepartmentSelect").options[el("folderDepartmentSelect").selectedIndex].textContent;
  const location = el("folderLocationsSelect").options[el("folderLocationsSelect").selectedIndex].textContent;

  try {
    const res = await fetch("/api/folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        folder_name, 
        department_id, 
        location_id, 
        serial_num,
        used_for 
      }),
    });
    
    if (!res.ok) throw new Error("API Failed");
    
    showToast("Folder created successfully!");
    e.target.reset();
    cancelRegistration();
    loadFolders();
  } catch {
    // Fallback localStorage
    const folders = JSON.parse(localStorage.getItem("folders")) || [];
    
    // Generate QR code
    const qrCanvas = document.createElement('canvas');
    QRCode.toCanvas(qrCanvas, serial_num, { width: 200 }, (error) => {
      if (error) console.error(error);
    });
    const qr_code = qrCanvas.toDataURL();

    folders.push({
      folder_id: Date.now(),
      folder_name,
      department,
      location,
      serial_num,
      used_for,
      files_inside: [],
      created_at: new Date().toISOString(),
      created_by: "Admin",
      qr_code
    });
    
    localStorage.setItem("folders", JSON.stringify(folders));
    showToast("Folder created locally!");
    e.target.reset();
    cancelRegistration();
    loadFolders();
  }
}

// ============================
// 🔹 Create File
// ============================
async function createFile(e) {
  e.preventDefault();
  
  const file_name = el("fileName").value.trim();
  const folder_id = el("fileFolderSelect").value;
  const description = el("fileDescription")?.value.trim() || "";

  if (!file_name || !folder_id) {
    return showToast("Please fill all required fields!", "error");
  }

  try {
    const res = await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        file_name, 
        folder_id,
        description 
      }),
    });
    
    if (!res.ok) throw new Error("API Failed");
    
    showToast("File created successfully!");
    e.target.reset();
    cancelRegistration();
    loadFolders();
  } catch {
    // Fallback localStorage
    const files = JSON.parse(localStorage.getItem("files")) || [];
    files.push({
      file_id: Date.now(),
      file_name,
      folder_id,
      description,
      created_at: new Date().toISOString()
    });
    localStorage.setItem("files", JSON.stringify(files));
    
    // Update folder's files_inside
    const folders = JSON.parse(localStorage.getItem("folders")) || [];
const folder = folders.find(f => String(f.folder_id) === String(id));

    if (folder) {
      folder.files_inside = folder.files_inside || [];
      folder.files_inside.push(file_name);
      localStorage.setItem("folders", JSON.stringify(folders));
    }
    
    showToast("File created locally!");
    e.target.reset();
    cancelRegistration();
    loadFolders();
  }
}

// ============================
// 🔹 Load Folders & Render Table
// ============================
async function loadFolders() {
  let folders = [];
  
  try {
    const res = await fetch("/api/folder");
    folders = await res.json();
  } catch {
    folders = JSON.parse(localStorage.getItem("folders")) || [];
  }
  
  renderTable(folders);
}

function renderTable(folders) {
  const tbody = document.querySelector("#fileTable tbody");
  tbody.innerHTML = "";

  if (!folders.length) {
    el("noFiles").classList.remove("hidden");
    return;
  }
  
  el("noFiles").classList.add("hidden");

  folders.forEach(folder => {
    const filesCount = folder.files_inside?.length || 0;
    
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50 transition";
    row.innerHTML = `
      <td class="px-4 py-3 text-sm font-mono text-blue-600">${folder.serial_num || "-"}</td>
      <td class="px-4 py-3 text-sm font-semibold text-gray-800">${folder.folder_name || "-"}</td>
      <td class="px-4 py-3 text-sm text-gray-600">${folder.department || "-"}</td>
      <td class="px-4 py-3 text-sm text-gray-600">${folder.location || "-"}</td>
      <td class="px-4 py-3 text-center">
        <span class="badge bg-blue-100 text-blue-800">${filesCount} files</span>
      </td>
      <td class="px-4 py-3 text-center">
        <div class="flex justify-center gap-2">
          <button onclick="openViewModal('${folder.folder_id}')" 
            class="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition">
             View
          </button>
          <button onclick="openEditModal('${folder.folder_id}')" 
            class="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition">
             Edit
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// ============================
// 🔹 Filter Table
// ============================
window.filterTable = function () {
  const input = el("searchInput").value.toLowerCase();
  const rows = document.querySelectorAll("#fileTable tbody tr");
  
  rows.forEach(row => {
    const rowText = row.textContent.toLowerCase();
    row.style.display = rowText.includes(input) ? "" : "none";
  });
};

// ============================
// 🔹 View Folder Modal
// ============================
function openViewModal(id) {
  let folders = [];
  
  try {
    // Try to get from API or localStorage
    folders = JSON.parse(localStorage.getItem("folders")) || [];
  } catch {
    folders = [];
  }
  
const folder = folders.find(f => String(f.folder_id) === String(id));

  if (!folder) return showToast("Folder not found", "error");

  el("viewFolderName").textContent = folder.folder_name || "-";
  el("viewDepartment").textContent = folder.department || "-";
  el("viewLocation").textContent = folder.location || "-";
  el("viewCreatedBy").textContent = folder.created_by || "-";
  el("viewCreatedAt").textContent = folder.created_at 
    ? new Date(folder.created_at).toLocaleString() 
    : "-";
  el("viewSerial").textContent = folder.serial_num || "-";

  // Generate QR Code
  const qrImg = el("viewQr");
  if (folder.qr_code) {
    qrImg.src = folder.qr_code;
  } else {
    const qrCanvas = document.createElement('canvas');
    QRCode.toCanvas(qrCanvas, folder.serial_num, { width: 200 }, (error) => {
      if (error) console.error(error);
      qrImg.src = qrCanvas.toDataURL();
    });
  }

  // Files list
  const list = el("viewFiles");
  list.innerHTML = "";
  
  if (folder.files_inside && folder.files_inside.length > 0) {
    folder.files_inside.forEach(f => {
      const li = document.createElement("li");
      li.className = "text-gray-700 flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200";
      li.innerHTML = `<span class="text-blue-600">📄</span> ${f}`;
      list.appendChild(li);
    });
  } else {
    list.innerHTML = '<li class="text-gray-500 italic">No files in this folder</li>';
  }

  // Show modal with animation
  const modal = el("viewModal");
  modal.classList.remove("hidden");
  setTimeout(() => modal.classList.add("modal-show"), 10);
}

function closeViewModal() {
  const modal = el("viewModal");
  modal.classList.remove("modal-show");
  setTimeout(() => modal.classList.add("hidden"), 200);
}

// ============================
// 🔹 Edit Folder Modal
// ============================
function openEditModal(id) {
  currentFolderId = id;
  
  let folders = [];
  try {
    folders = JSON.parse(localStorage.getItem("folders")) || [];
  } catch {
    folders = [];
  }
  
const folder = folders.find(f => String(f.folder_id) === String(id));

  if (!folder) return showToast("Folder not found", "error");

  el("editFolderName").value = folder.folder_name || "";
  
  // Set department
  const deptSelect = el("editDepartmentSelect");
  for (let i = 0; i < deptSelect.options.length; i++) {
    if (deptSelect.options[i].textContent === folder.department) {
      deptSelect.selectedIndex = i;
      break;
    }
  }
  
  // Set location
  const locSelect = el("editLocationSelect");
  for (let i = 0; i < locSelect.options.length; i++) {
    if (locSelect.options[i].textContent === folder.location) {
      locSelect.selectedIndex = i;
      break;
    }
  }

  // Show modal with animation
  const modal = el("editModal");
  modal.classList.remove("hidden");
  setTimeout(() => modal.classList.add("modal-show"), 10);
}

function closeEditModal() {
  const modal = el("editModal");
  modal.classList.remove("modal-show");
  setTimeout(() => modal.classList.add("hidden"), 200);
  currentFolderId = null;
}

function saveFolderChanges(e) {
  e.preventDefault();
  
  if (!currentFolderId) return;
  
  const folder_name = el("editFolderName").value.trim();
  const department_id = el("editDepartmentSelect").value;
  const location_id = el("editLocationSelect").value;
  
  if (!folder_name || !department_id || !location_id) {
    return showToast("Please fill all fields!", "error");
  }

  const department = el("editDepartmentSelect").options[el("editDepartmentSelect").selectedIndex].textContent;
  const location = el("editLocationSelect").options[el("editLocationSelect").selectedIndex].textContent;

  try {
    // Try API first
    fetch(`/api/folder/${currentFolderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        folder_name, 
        department_id, 
        location_id 
      }),
    }).then(res => {
      if (!res.ok) throw new Error("API Failed");
      showToast("Folder updated successfully!");
      closeEditModal();
      loadFolders();
    });
  } catch {
    // Fallback localStorage
    const folders = JSON.parse(localStorage.getItem("folders")) || [];
    const folderIndex = folders.findIndex(f => f.folder_id == currentFolderId);
    
    if (folderIndex !== -1) {
      folders[folderIndex].folder_name = folder_name;
      folders[folderIndex].department = department;
      folders[folderIndex].location = location;
      localStorage.setItem("folders", JSON.stringify(folders));
      showToast("Folder updated locally!");
      closeEditModal();
      loadFolders();
    }
  }
}

// ============================
// 🔹 Download & Print QR Code
// ============================
function downloadQrCode() {
  const qr = el("viewQr").src;
  const serial = el("viewSerial").textContent;
  const link = document.createElement("a");
  link.href = qr;
  link.download = `QR_${serial}.png`;
  link.click();
  showToast("QR Code downloaded!");
}

function printFolderDetails() {
  window.print();
}

// Expose functions globally
window.openViewModal = openViewModal;
window.closeViewModal = closeViewModal;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.saveFolderChanges = saveFolderChanges;
window.downloadQrCode = downloadQrCode;
window.printFolderDetails = printFolderDetails;
window.cancelRegistration = cancelRegistration;