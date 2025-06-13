// Utility functions for the WorkFlow Portal

// Local Storage Keys
const STORAGE_KEYS = {
    USERS: 'workflow_users',
    TASKS: 'workflow_tasks',
    CURRENT_USER: 'workflow_current_user'
};

// Initialize default data
function initializeDefaultData() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        const defaultUsers = [
            {
                id: generateId(),
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                email: 'admin@workflow.com',
                fullName: 'System Administrator',
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
    }
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// User management functions
function getUsers() {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function getCurrentUser() {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
}

function setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

function clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

// Task management functions
function getTasks() {
    const tasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    return tasks ? JSON.parse(tasks) : [];
}

function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
}

// Authentication functions
function authenticate(username, password) {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        setCurrentUser(user);
        return { success: true, user };
    }
    
    return { success: false, message: 'Invalid username or password' };
}

function logout() {
    clearCurrentUser();
    window.location.href = 'index.html';
}

function checkAuth() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

function checkAdminAuth() {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

// Date formatting
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Input validation
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password && password.length >= 6;
}

function validateUsername(username) {
    return username && username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
}

// Initialize data when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeDefaultData();
});

// Error handling
function handleError(error, context = '') {
    console.error(`Error in ${context}:`, error);
    showNotification(`An error occurred${context ? ` in ${context}` : ''}. Please try again.`, 'error');
}

// Local storage space check
function checkStorageSpace() {
    try {
        const testKey = 'storage_test';
        const testValue = 'x'.repeat(1024); // 1KB test
        localStorage.setItem(testKey, testValue);
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
}

// Export functions for use in other scripts
window.WorkFlowUtils = {
    generateId,
    getUsers,
    saveUsers,
    getCurrentUser,
    setCurrentUser,
    clearCurrentUser,
    getTasks,
    saveTasks,
    authenticate,
    logout,
    checkAuth,
    checkAdminAuth,
    showNotification,
    formatDate,
    formatDateTime,
    validateEmail,
    validatePassword,
    validateUsername,
    handleError,
    checkStorageSpace
};