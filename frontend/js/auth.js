// Global Helper to Populate Sidebar User Details
function populateSidebarUser() {
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch (e) {
    user = {};
  }

  const fullName = user.full_name || "Demo Cloud Admin";
  const email = user.email || "admin@salestracker.cloud";

  const userDisplayEls = document.querySelectorAll(
    ".user-name-display, #userName, .user-name",
  );
  userDisplayEls.forEach((el) => (el.textContent = fullName));

  const emailDisplayEls = document.querySelectorAll("#userEmail, .user-email");
  emailDisplayEls.forEach((el) => (el.textContent = email));
}

// Execute immediately when auth.js is loaded
populateSidebarUser();

// Client Auth & Settings Script connected to AWS Express Backend REST API
document.addEventListener("DOMContentLoaded", async () => {
  populateSidebarUser();

  // Async refresh profile if token is present
  const token = localStorage.getItem("auth_token");
  if (token && typeof APIClient !== "undefined" && APIClient.getMe) {
    try {
      await APIClient.getMe();
      populateSidebarUser();
    } catch (err) {
      // Keep fallback
    }
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const profileForm = document.getElementById("profileForm");
  const passwordForm = document.getElementById("passwordForm");
  const logoutButtons = document.querySelectorAll(".logout-btn, #logoutBtn");

  // Populate Settings Page fields if present
  if (profileForm) {
    const nameInput = document.getElementById("settingsFullName");
    const emailInput = document.getElementById("settingsEmail");
    const companyInput = document.getElementById("settingsCompany");

    if (nameInput) nameInput.value = user.full_name || "";
    if (emailInput) emailInput.value = user.email || "";
    if (companyInput) companyInput.value = user.company_name || "";

    // Settings Tab Switching
    const tabBtns = document.querySelectorAll(".settings-tab-btn");
    const tabContents = document.querySelectorAll(".settings-tab-content");

    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");

        tabBtns.forEach((b) => {
          b.classList.remove("active");
          b.style.background = "transparent";
          b.style.color = "var(--text-muted)";
          b.style.fontWeight = "500";
        });

        btn.classList.add("active");
        btn.style.background = "rgba(14, 165, 233, 0.15)";
        btn.style.color = "#38bdf8";
        btn.style.fontWeight = "600";

        tabContents.forEach((content) => {
          if (content.id === targetTab) {
            content.style.display = "block";
          } else {
            content.style.display = "none";
          }
        });
      });
    });

    // Profile update submit
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fullName = nameInput.value.trim();
      const companyName = companyInput.value.trim();
      const alertEl = document.getElementById("settingsAlert");

      try {
        const res = await APIClient.updateProfile({
          full_name: fullName,
          company_name: companyName,
        });
        if (alertEl) {
          alertEl.className = "alert alert-success";
          alertEl.style.cssText =
            "display:block; margin-bottom:1.5rem; padding:1rem; background:#d1fae5; color:#065f46; border-radius:8px;";
          alertEl.innerHTML = `<i class="fas fa-check-circle"></i> ${res.message || "Profile updated successfully!"}`;
        }
        const userDisplayEls = document.querySelectorAll(".user-name-display");
        userDisplayEls.forEach((el) => (el.textContent = fullName));
      } catch (err) {
        if (alertEl) {
          alertEl.className = "alert alert-danger";
          alertEl.style.cssText =
            "display:block; margin-bottom:1.5rem; padding:1rem; background:#fee2e2; color:#991b1b; border-radius:8px;";
          alertEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${err.message || "Failed to update profile."}`;
        }
      }
    });
  }

  // Password update submit
  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById("currentPassword").value;
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const alertEl = document.getElementById("settingsAlert");

      if (newPassword !== confirmPassword) {
        if (alertEl) {
          alertEl.className = "alert alert-danger";
          alertEl.style.cssText =
            "display:block; margin-bottom:1.5rem; padding:1rem; background:#fee2e2; color:#991b1b; border-radius:8px;";
          alertEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i> New passwords do not match.`;
        }
        return;
      }

      try {
        const res = await APIClient.updatePassword({
          current_password: currentPassword,
          new_password: newPassword,
        });
        if (alertEl) {
          alertEl.className = "alert alert-success";
          alertEl.style.cssText =
            "display:block; margin-bottom:1.5rem; padding:1rem; background:#d1fae5; color:#065f46; border-radius:8px;";
          alertEl.innerHTML = `<i class="fas fa-check-circle"></i> ${res.message || "Password updated successfully!"}`;
        }
        passwordForm.reset();
      } catch (err) {
        if (alertEl) {
          alertEl.className = "alert alert-danger";
          alertEl.style.cssText =
            "display:block; margin-bottom:1.5rem; padding:1rem; background:#fee2e2; color:#991b1b; border-radius:8px;";
          alertEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${err.message || "Failed to update password."}`;
        }
      }
    });
  }

  // Login Form
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const errorEl = document.getElementById("authError");

      try {
        if (errorEl) errorEl.style.display = "none";
        await APIClient.login(email, password);
        window.location.href = "dashboard.html";
      } catch (err) {
        if (errorEl) {
          errorEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${err.message || "Login failed. Please check credentials."}`;
          errorEl.style.display = "flex";
        } else {
          alert(err.message || "Login failed.");
        }
      }
    });
  }

  // Forgot Password
  const forgotPasswordLink = document.getElementById("forgotPassword");
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = prompt("Enter your email address to receive a reset link:");
      if (!email) return;
      try {
        await APIClient.forgotPassword(email);
        alert(
          "If that email exists, a reset link has been sent. Check your inbox.",
        );
      } catch (err) {
        alert(err.message || "Failed to send reset email.");
      }
    });
  }

  // Demo Autofill 1-Click Login Button
  const demoAutoFillBtn = document.getElementById("demoAutoFillBtn");
  if (demoAutoFillBtn) {
    demoAutoFillBtn.addEventListener("click", () => {
      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");
      if (emailInput) emailInput.value = "admin@salestracker.cloud";
      if (passwordInput) passwordInput.value = "admin123";

      // Visual Feedback Highlight
      [emailInput, passwordInput].forEach((input) => {
        if (input) {
          input.style.borderColor = "#34d399";
          input.style.boxShadow = "0 0 0 3.5px rgba(52, 211, 153, 0.25)";
          setTimeout(() => {
            input.style.borderColor = "";
            input.style.boxShadow = "";
          }, 1500);
        }
      });
    });
  }

  // Password Visibility Toggle Buttons
  const togglePasswordBtn = document.getElementById("togglePassword");
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", () => {
      const passwordInput = document.getElementById("password");
      if (passwordInput) {
        const isPassword = passwordInput.type === "password";
        passwordInput.type = isPassword ? "text" : "password";
        const icon = togglePasswordBtn.querySelector("i");
        if (icon) {
          icon.className = isPassword ? "fas fa-eye-slash" : "fas fa-eye";
        }
      }
    });
  }

  const toggleConfirmPasswordBtn = document.getElementById(
    "toggleConfirmPassword",
  );
  if (toggleConfirmPasswordBtn) {
    toggleConfirmPasswordBtn.addEventListener("click", () => {
      const confirmInput = document.getElementById("confirmPassword");
      if (confirmInput) {
        const isPassword = confirmInput.type === "password";
        confirmInput.type = isPassword ? "text" : "password";
        const icon = toggleConfirmPasswordBtn.querySelector("i");
        if (icon) {
          icon.className = isPassword ? "fas fa-eye-slash" : "fas fa-eye";
        }
      }
    });
  }

  // Register Form
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fullName = document.getElementById("fullName").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword")?.value;
      const companyName = document.getElementById("companyName")?.value || "";
      const errorEl = document.getElementById("authError");

      if (confirmPassword && password !== confirmPassword) {
        if (errorEl) {
          errorEl.textContent =
            "Passwords do not match. Please verify your password.";
          errorEl.style.display = "flex";
        } else {
          alert("Passwords do not match.");
        }
        return;
      }

      try {
        if (errorEl) errorEl.style.display = "none";
        await APIClient.register({
          full_name: fullName,
          email,
          password,
          company_name: companyName,
        });
        window.location.href = "dashboard.html";
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = err.message || "Registration failed.";
          errorEl.style.display = "flex";
        } else {
          alert(err.message || "Registration failed.");
        }
      }
    });
  }

  // Logout Buttons
  logoutButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      APIClient.logout();
    });
  });

  // Mobile Navigation Drawer Toggle
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  const closeSidebar = () => {
    if (sidebar) sidebar.classList.remove("active");
    if (sidebarOverlay) sidebarOverlay.classList.remove("active");
  };

  if (mobileMenuToggle && sidebar) {
    mobileMenuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("active");
      if (sidebarOverlay) sidebarOverlay.classList.toggle("active");
    });
  }

  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener("click", closeSidebar);
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeSidebar);
  }
});
