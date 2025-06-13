// Admin dashboard functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check admin authentication
    if (!checkAdminAuth()) {
        return;
    }
    
    // Load dashboard data
    loadDashboardStats();
    loadRecentTasks();
    
    // Set welcome message
    const currentUser = getCurrentUser();
    const welcomeElement = document.getElementById('welcomeMessage');
    if (welcomeElement) {
        welcomeElement.textContent = `Welcome, ${currentUser.fullName || currentUser.username}`;
    }
});

// Dashboard statistics
function loadDashboardStats() {
    try {
        const users = getUsers();
        const tasks = getTasks();
        const workers = users.filter(user => user.role === 'worker');
        const completedTasks = tasks.filter(task => task.status === 'completed');
        
        // Update stat cards
        updateStatCard('totalUsers', users.length);
        updateStatCard('totalWorkers', workers.length);
        updateStatCard('totalTasks', tasks.length);
        updateStatCard('completedTasks', completedTasks.length);
    } catch (error) {
        handleError(error, 'loading dashboard stats');
    }
}

function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function loadRecentTasks() {
    try {
        const tasks = getTasks();
        const recentTasks = tasks
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        
        const recentTasksContainer = document.getElementById('recentTasks');
        if (recentTasksContainer) {
            recentTasksContainer.innerHTML = '';
            
            if (recentTasks.length === 0) {
                recentTasksContainer.innerHTML = '<p class="text-center" style="color: #718096;">No tasks created yet.</p>';
                return;
            }
            
            recentTasks.forEach(task => {
                const taskElement = createTaskElement(task);
                recentTasksContainer.appendChild(taskElement);
            });
        }
    } catch (error) {
        handleError(error, 'loading recent tasks');
    }
}

function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item priority-${task.priority}`;
    
    const assignedUser = getUsers().find(user => user.id === task.assignedTo);
    const assignedName = assignedUser ? assignedUser.fullName || assignedUser.username : 'Unknown';
    
    taskDiv.innerHTML = `
        <div class="task-header">
            <div class="task-title">${task.title}</div>
            <div class="task-status ${task.status}">${task.status.charAt(0).toUpperCase() + task.status.slice(1)}</div>
        </div>
        <div class="task-description">${task.description}</div>
        <div class="task-meta">
            <span>Assigned to: ${assignedName}</span>
            <span>Due: ${formatDate(task.dueDate)}</span>
        </div>
    `;
    
    return taskDiv;
}

// User Management Functions
function loadUsers() {
    try {
        const users = getUsers();
        const usersGrid = document.getElementById('usersGrid');
        
        if (usersGrid) {
            usersGrid.innerHTML = '';
            
            users.forEach(user => {
                const userCard = createUserCard(user);
                usersGrid.appendChild(userCard);
            });
        }
    } catch (error) {
        handleError(error, 'loading users');
    }
}

function createUserCard(user) {
    const userDiv = document.createElement('div');
    userDiv.className = 'user-card';
    
    const avatarText = (user.fullName || user.username).charAt(0).toUpperCase();
    
    userDiv.innerHTML = `
        <div class="user-avatar">${avatarText}</div>
        <div class="user-info">
            <h3>${user.fullName || user.username}</h3>
            <div class="user-role ${user.role}">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</div>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email || 'Not provided'}</p>
            <p><strong>Created:</strong> ${formatDate(user.createdAt)}</p>
        </div>
        <div class="user-actions">
            <button class="user-btn edit" onclick="editUser('${user.id}')">Edit</button>
            ${user.username !== 'admin' ? `<button class="user-btn delete" onclick="deleteUser('${user.id}')">Delete</button>` : ''}
        </div>
    `;
    
    return userDiv;
}

function showAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Clear form
        document.getElementById('addUserForm').reset();
    }
}

function hideAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Handle add user form submission
document.addEventListener('DOMContentLoaded', function() {
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('newUsername').value.trim();
            const password = document.getElementById('newPassword').value;
            const role = document.getElementById('newRole').value;
            const email = document.getElementById('newEmail').value.trim();
            const fullName = document.getElementById('newFullName').value.trim();
            
            // Validation
            if (!validateUsername(username)) {
                showNotification('Username must be at least 3 characters and contain only letters, numbers, and underscores', 'error');
                return;
            }
            
            if (!validatePassword(password)) {
                showNotification('Password must be at least 6 characters long', 'error');
                return;
            }
            
            if (!validateEmail(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // Check if username already exists
            const users = getUsers();
            if (users.find(user => user.username === username)) {
                showNotification('Username already exists', 'error');
                return;
            }
            
            // Create new user
            const newUser = {
                id: generateId(),
                username,
                password,
                role,
                email,
                fullName,
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            saveUsers(users);
            
            showNotification('User created successfully', 'success');
            hideAddUserModal();
            loadUsers();
            loadDashboardStats();
        });
    }
});

function editUser(userId) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    
    if (user) {
        // Populate modal with user data
        document.getElementById('newUsername').value = user.username;
        document.getElementById('newPassword').value = user.password;
        document.getElementById('newRole').value = user.role;
        document.getElementById('newEmail').value = user.email || '';
        document.getElementById('newFullName').value = user.fullName || '';
        
        // Change form behavior to edit mode
        const form = document.getElementById('addUserForm');
        form.onsubmit = function(e) {
            e.preventDefault();
            updateUser(userId);
        };
        
        // Change modal title and button text
        document.querySelector('#addUserModal .modal-header h2').textContent = 'Edit User';
        document.querySelector('#addUserModal button[type="submit"]').textContent = 'Update User';
        
        showAddUserModal();
    }
}

function updateUser(userId) {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
        const username = document.getElementById('newUsername').value.trim();
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('newRole').value;
        const email = document.getElementById('newEmail').value.trim();
        const fullName = document.getElementById('newFullName').value.trim();
        
        // Validation
        if (!validateUsername(username)) {
            showNotification('Username must be at least 3 characters and contain only letters, numbers, and underscores', 'error');
            return;
        }
        
        if (!validatePassword(password)) {
            showNotification('Password must be at least 6 characters long', 'error');
            return;
        }
        
        if (!validateEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        // Check if username already exists (excluding current user)
        if (users.find(user => user.username === username && user.id !== userId)) {
            showNotification('Username already exists', 'error');
            return;
        }
        
        // Update user
        users[userIndex] = {
            ...users[userIndex],
            username,
            password,
            role,
            email,
            fullName
        };
        
        saveUsers(users);
        
        showNotification('User updated successfully', 'success');
        hideAddUserModal();
        loadUsers();
        
        // Reset form behavior
        const form = document.getElementById('addUserForm');
        form.onsubmit = null;
        document.querySelector('#addUserModal .modal-header h2').textContent = 'Add New User';
        document.querySelector('#addUserModal button[type="submit"]').textContent = 'Add User';
    }
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        const users = getUsers();
        const updatedUsers = users.filter(user => user.id !== userId);
        
        saveUsers(updatedUsers);
        showNotification('User deleted successfully', 'success');
        loadUsers();
        loadDashboardStats();
    }
}

// Task Management Functions
function loadTasks() {
    try {
        const tasks = getTasks();
        const tasksGrid = document.getElementById('tasksGrid');
        
        if (tasksGrid) {
            tasksGrid.innerHTML = '';
            
            if (tasks.length === 0) {
                tasksGrid.innerHTML = '<p class="text-center" style="color: #718096; grid-column: 1 / -1;">No tasks created yet.</p>';
                return;
            }
            
            tasks.forEach(task => {
                const taskCard = createTaskCard(task);
                tasksGrid.appendChild(taskCard);
            });
        }
    } catch (error) {
        handleError(error, 'loading tasks');
    }
}

function createTaskCard(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-card';
    
    const assignedUser = getUsers().find(user => user.id === task.assignedTo);
    const assignedName = assignedUser ? assignedUser.fullName || assignedUser.username : 'Unknown';
    
    const priorityColor = {
        low: '#48bb78',
        medium: '#f6ad55',
        high: '#e53e3e'
    };
    
    taskDiv.innerHTML = `
        <div class="task-header">
            <h3>${task.title}</h3>
            <div class="task-status ${task.status}">${task.status.charAt(0).toUpperCase() + task.status.slice(1)}</div>
        </div>
        <p class="task-description">${task.description}</p>
        <div class="task-meta">
            <div style="display: flex; align-items: center; gap: 5px;">
                <span style="display: inline-block; width: 10px; height: 10px; background: ${priorityColor[task.priority]}; border-radius: 50%;"></span>
                <span>${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority</span>
            </div>
            <span>Due: ${formatDate(task.dueDate)}</span>
        </div>
        <div style="margin-top: 15px;">
            <strong>Assigned to:</strong> ${assignedName}
        </div>
        <div class="task-actions">
            <button class="task-btn complete" onclick="toggleTaskStatus('${task.id}')" ${task.status === 'completed' ? 'style="background: #a0aec0;"' : ''}>
                ${task.status === 'completed' ? 'Completed' : 'Mark Complete'}
            </button>
            <button class="task-btn delete" onclick="deleteTask('${task.id}')">Delete</button>
        </div>
    `;
    
    return taskDiv;
}

function showAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Clear form
        document.getElementById('addTaskForm').reset();
        
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dueDate').min = today;
    }
}

function hideAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function loadWorkersForAssignment() {
    const users = getUsers();
    const workers = users.filter(user => user.role === 'worker');
    const select = document.getElementById('assignedTo');
    
    if (select) {
        select.innerHTML = '<option value="">Select Worker</option>';
        
        workers.forEach(worker => {
            const option = document.createElement('option');
            option.value = worker.id;
            option.textContent = worker.fullName || worker.username;
            select.appendChild(option);
        });
    }
}

// Handle add task form submission
document.addEventListener('DOMContentLoaded', function() {
    const addTaskForm = document.getElementById('addTaskForm');
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const title = document.getElementById('taskTitle').value.trim();
            const description = document.getElementById('taskDescription').value.trim();
            const assignedTo = document.getElementById('assignedTo').value;
            const priority = document.getElementById('priority').value;
            const dueDate = document.getElementById('dueDate').value;
            
            // Validation
            if (!title || !description || !assignedTo || !priority || !dueDate) {
                showNotification('Please fill in all fields', 'error');
                return;
            }
            
            // Create new task
            const newTask = {
                id: generateId(),
                title,
                description,
                assignedTo,
                priority,
                dueDate,
                status: 'pending',
                createdAt: new Date().toISOString(),
                createdBy: getCurrentUser().id
            };
            
            const tasks = getTasks();
            tasks.push(newTask);
            saveTasks(tasks);
            
            showNotification('Task created successfully', 'success');
            hideAddTaskModal();
            loadTasks();
            loadDashboardStats();
        });
    }
});

function toggleTaskStatus(taskId) {
    const tasks = getTasks();
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
        const currentStatus = tasks[taskIndex].status;
        tasks[taskIndex].status = currentStatus === 'completed' ? 'pending' : 'completed';
        
        if (tasks[taskIndex].status === 'completed') {
            tasks[taskIndex].completedAt = new Date().toISOString();
        } else {
            delete tasks[taskIndex].completedAt;
        }
        
        saveTasks(tasks);
        showNotification(`Task ${tasks[taskIndex].status === 'completed' ? 'completed' : 'reopened'}`, 'success');
        loadTasks();
        loadDashboardStats();
    }
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
        const tasks = getTasks();
        const updatedTasks = tasks.filter(task => task.id !== taskId);
        
        saveTasks(updatedTasks);
        showNotification('Task deleted successfully', 'success');
        loadTasks();
        loadDashboardStats();
    }
}

function viewReports() {
    const users = getUsers();
    const tasks = getTasks();
    const workers = users.filter(user => user.role === 'worker');
    
    let reportContent = 'WORKFLOW PORTAL REPORT\n';
    reportContent += '='.repeat(30) + '\n\n';
    reportContent += `Generated on: ${new Date().toLocaleString()}\n\n`;
    
    reportContent += 'SUMMARY:\n';
    reportContent += `---------\n`;
    reportContent += `Total Users: ${users.length}\n`;
    reportContent += `Total Workers: ${workers.length}\n`;
    reportContent += `Total Tasks: ${tasks.length}\n`;
    reportContent += `Completed Tasks: ${tasks.filter(t => t.status === 'completed').length}\n`;
    reportContent += `Pending Tasks: ${tasks.filter(t => t.status === 'pending').length}\n\n`;
    
    reportContent += 'WORKER PERFORMANCE:\n';
    reportContent += '-------------------\n';
    workers.forEach(worker => {
        const workerTasks = tasks.filter(task => task.assignedTo === worker.id);
        const completedTasks = workerTasks.filter(task => task.status === 'completed');
        const completionRate = workerTasks.length > 0 ? Math.round((completedTasks.length / workerTasks.length) * 100) : 0;
        
        reportContent += `${worker.fullName || worker.username}:\n`;
        reportContent += `  - Assigned Tasks: ${workerTasks.length}\n`;
        reportContent += `  - Completed: ${completedTasks.length}\n`;
        reportContent += `  - Completion Rate: ${completionRate}%\n\n`;
    });
    
    // Create and download report file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Report downloaded successfully', 'success');
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});