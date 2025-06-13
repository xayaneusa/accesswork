// Authentication handling for the login page

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    
    // Check if user is already logged in
    const currentUser = getCurrentUser();
    if (currentUser) {
        redirectToDashboard(currentUser.role);
        return;
    }
    
    // Handle login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        // Basic validation
        if (!username || !password) {
            showError('Please fill in all fields');
            return;
        }
        
        // Attempt authentication
        const authResult = authenticate(username, password);
        
        if (authResult.success) {
            showSuccess('Login successful! Redirecting...');
            setTimeout(() => {
                redirectToDashboard(authResult.user.role);
            }, 1000);
        } else {
            showError(authResult.message);
        }
    });
    
    // Add enter key support for better UX
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            loginForm.dispatchEvent(new Event('submit'));
        }
    });
});

function redirectToDashboard(role) {
    if (role === 'admin') {
        window.location.href = 'admin-dashboard.html';
    } else {
        window.location.href = 'worker-dashboard.html';
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.style.backgroundColor = '#fed7d7';
    errorDiv.style.color = '#e53e3e';
    errorDiv.style.border = '1px solid #feb2b2';
    errorDiv.style.padding = '12px';
    errorDiv.style.borderRadius = '8px';
    errorDiv.style.marginTop = '15px';
    
    // Hide error after 5 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.style.backgroundColor = '#c6f6d5';
    errorDiv.style.color = '#22543d';
    errorDiv.style.border = '1px solid #9ae6b4';
    errorDiv.style.padding = '12px';
    errorDiv.style.borderRadius = '8px';
    errorDiv.style.marginTop = '15px';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 3000);
}