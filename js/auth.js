import { supabase } from './supabase.js';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const forgotPasswordLink = document.getElementById('forgotPassword');
const togglePasswordButtons = document.querySelectorAll('.toggle-password');

// Initialize auth
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    checkAuthStatus();
    
    // Setup password visibility toggles
    setupPasswordToggles();
    
    // Setup login form
    if (loginForm) {
        setupLoginForm();
    }
    
    // Setup register form
    if (registerForm) {
        setupRegisterForm();
    }
    
    // Setup forgot password
    if (forgotPasswordLink) {
        setupForgotPassword();
    }
});

// Check authentication status
async function checkAuthStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    
    // If user is logged in and on auth pages, redirect to dashboard
    const currentPage = window.location.pathname;
    if (user && (currentPage.includes('login.html') || 
                 currentPage.includes('register.html') || 
                 currentPage === '/')) {
        window.location.href = 'dashboard.html';
    }
}

// Setup password visibility toggles
function setupPasswordToggles() {
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.parentElement.querySelector('input');
            const icon = button.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    });
}

// Setup login form
function setupLoginForm() {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe')?.checked;
        const loginBtn = document.getElementById('loginBtn');
        
        // Validate inputs
        if (!email || !password) {
            showAuthMessage('error', 'Please fill in all fields');
            return;
        }
        
        // Show loading state
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            // Store email if remember me is checked
            if (rememberMe) {
                localStorage.setItem('remembered_email', email);
            }
            
            showAuthMessage('success', 'Login successful! Redirecting...');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } catch (error) {
            console.error('Login error:', error);
            showAuthMessage('error', error.message || 'Invalid email or password');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    });
    
    // Load remembered email
    const rememberedEmail = localStorage.getItem('remembered_email');
    if (rememberedEmail && document.getElementById('email')) {
        document.getElementById('email').value = rememberedEmail;
        if (document.getElementById('rememberMe')) {
            document.getElementById('rememberMe').checked = true;
        }
    }
}

// Setup register form
function setupRegisterForm() {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const registerBtn = document.getElementById('registerBtn');
        
        // Validate inputs
        if (!fullName || !email || !password || !confirmPassword) {
            showAuthMessage('error', 'Please fill in all fields');
            return;
        }
        
        if (password.length < 6) {
            showAuthMessage('error', 'Password must be at least 6 characters');
            return;
        }
        
        if (password !== confirmPassword) {
            showAuthMessage('error', 'Passwords do not match');
            return;
        }
        
        // Show loading state
        registerBtn.disabled = true;
        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        
        try {
            // Sign up user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName
                    }
                }
            });
            
            if (authError) throw authError;
            
            showAuthMessage('success', 
                'Account created successfully! ' + 
                (authData.user?.identities?.length === 0 ? 
                    'Please check your email for confirmation.' : 
                    'Redirecting to dashboard...')
            );
            
            // If user is confirmed immediately, redirect to dashboard
            if (authData.user && !authData.user.identities?.length === 0) {
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            showAuthMessage('error', error.message || 'Registration failed');
            registerBtn.disabled = false;
            registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        }
    });
}

// Setup forgot password
function setupForgotPassword() {
    forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const email = prompt('Please enter your email address to reset password:');
        if (!email) return;
        
        if (!validateEmail(email)) {
            showAuthMessage('error', 'Please enter a valid email address');
            return;
        }
        
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });
            
            if (error) throw error;
            
            showAuthMessage('success', 'Password reset email sent! Please check your inbox.');
            
        } catch (error) {
            console.error('Password reset error:', error);
            showAuthMessage('error', error.message || 'Failed to send reset email');
        }
    });
}

// Validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Show auth message
function showAuthMessage(type, text) {
    const authMessage = document.getElementById('authMessage');
    if (!authMessage) return;
    
    authMessage.textContent = text;
    authMessage.className = `auth-message ${type}`;
    authMessage.style.display = 'block';
    
    setTimeout(() => {
        authMessage.style.display = 'none';
    }, 5000);
}

// Logout function
export async function logout() {
    try {
        await supabase.auth.signOut();
        localStorage.removeItem('remembered_email');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'login.html';
    }
}

// Export for other modules
export { showAuthMessage };