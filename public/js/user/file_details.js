
const el = (id) => document.getElementById(id);


async function loadLocations() {
  try {
    console.log("Loading locations...");
    const res = await fetch("/api/locations");
    console.log("Response status:", res.status);

    if (!res.ok) throw new Error("Failed to fetch locations");

    const data = await res.json();
    console.log("Data received:", data);

    const select = document.getElementById("locationsSelect");
    if (!select) {
      console.error("Dropdown element not found!");
      return;
    }

    select.innerHTML = "<option value=''>-- Select Location --</option>";

    if (!Array.isArray(data) || data.length === 0) {
      console.warn("No locations received from API");
      return;
    }

    data.forEach(loct => {
      const option = document.createElement("option");
      option.value = loct.location_id;
      option.textContent = loct.location_name;
      select.appendChild(option);
    });

    console.log("Dropdown populated successfully.");
  } catch (err) {
    console.error("Error loading locations:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadLocations);


async function loadLocations() {
  try {
    const res = await fetch("/api/locations");
    if (!res.ok) throw new Error(`Failed to fetch locations: ${res.statusText}`);

    const data = await res.json();
    const select = document.getElementById("locationsSelect");

    // 🧹 Reset options
    select.innerHTML = "<option value=''>-- Select Location --</option>";

    // 🧩 Populate options
    data.forEach((loc) => {
      const option = document.createElement("option");
      option.value = loc.location_id;       // ✅ Correct DB column
      option.textContent = loc.location_name; // ✅ Display name
      select.appendChild(option);
    });

  } catch (err) {
    console.error("❌ Error loading locations:", err);
    alert("Failed to load locations. Please try again later.");
  }
}




// ✅ Session check
(async () => {
  try {
    const res = await fetch("/api/session", { credentials: "include" });
    if (res.status === 401) {
      console.log("Session expired — redirecting...");
      location.href = "/login.html";
    }
  } catch (err) {
    console.error("Session check error:", err);
  }
})();

// ✅ Logout
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = el("logoutBtn");
  if (!logoutBtn) {
    console.error("Logout button not found!");
    return;
  }
});

el("logoutBtn")?.addEventListener("click", async () => {
  try {
    const res = await fetch("/api/logout", {
      method: "GET",
      credentials: "include",
    });
    const data = await res.json();
    console.log("Logout response:", data);
    if (res.ok) {
      location.href = "/login.html";
    } else {
      alert("Logout failed: " + (data.error || res.status));
    }
  } catch (err) {
    console.error("Logout error:", err);
  }
});

document.addEventListener("DOMContentLoaded", loadDepartments);