document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorMessage = document.getElementById("errorMessage");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const usr_email = document.getElementById("usr_email").value.trim();
    const usr_pwd = document.getElementById("usr_pwd").value.trim();

    if (!usr_email || !usr_pwd) {
      errorMessage.textContent = "Email and password are required.";
      return;
    }

    errorMessage.textContent = "";

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usr_email, usr_pwd }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        errorMessage.textContent = data.error || "Invalid email or password.";
        return;
      }

      const role = data.user?.role;

      // 🎯 CLEAN, CORRECT REDIRECT BLOCK
      if (role === "super_admin") {
        window.location.href = "/html/super_admin/super_admin.html";
      } else if (role === "admin") {
        window.location.href = "/html/admin/admin.html";
      } else if (role === "HR") {
        window.location.href = "/html/admin/admin.html";
      } else if (role === "staff") {
        window.location.href = "/html/staff/staff.html";
      } else {
        window.location.href = "/html/staff/staff.html"; // fallback safety
      }

    } catch (err) {
      console.error("Login error:", err);
      errorMessage.textContent = "Server error. Please try again later.";
    }
  });
});
