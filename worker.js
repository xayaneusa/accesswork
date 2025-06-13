// Worker dashboard functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check worker authentication
    if (!checkAuth()) {
        return;
    }
    
    const currentUser = getCurrentUser();
    if (currentUser.role !== 'worker') {
        window.location.href = 'admin-dashboard.html';
        return;
    }
    
    // Load dashboard data
    loadWorkerStats();
    loadWorkerTasks();
    
    // Set welcome message
    const welcomeElement = document.getElementById('welcomeMessage');
    if (welcomeElement) {
        welcomeElement.textContent = `Welcome, ${currentUser.fullName || currentUser.username}`;
    }
});

function loadWorkerStats() {
    try {
        const currentUser = getCurrentUser();
        const tasks = getTasks();
        const workerTasks = tasks.filter(task => task.assignedTo === currentUser.id);
        const completedTasks = workerTasks.filter(task => task.status === 'completed');
        const pendingTasks = workerTasks.filter(task => task.status === 'pending');
        
        const completionRate = workerTasks.length > 0 
            ? Math.round((completedTasks.length / workerTasks.length) * 100) 
            : 0;
        
        // Update stat cards
        updateStatCard('assignedTasks', workerTasks.length);
        updateStatCard('pendingTasks', pendingTasks.length);
        updateStatCard('completedTasks', completedTasks.length);
        updateStatCard('completionRate', `${completionRate}%`);
    } catch (error) {
        handleError(error, 'loading worker stats');
    }
}

function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function loadWorkerTasks() {
    try {
        const currentUser = getCurrentUser();
        const tasks = getTasks();
        const workerTasks = tasks
            .filter(task => task.assignedTo === currentUser.id)
            .sort((a, b) => {
                // Sort by status (pending first) then by due date
                if (a.status !== b.status) {
                    return a.status === 'pending' ? -1 : 1;
                }
                return new Date(a.dueDate) - new Date(b.dueDate);
            });
        
        const workerTasksContainer = document.getElementById('workerTasks');
        if (workerTasksContainer) {
            workerTasksContainer.innerHTML = '';
            
            if (workerTasks.length === 0) {
                workerTasksContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #718096;">
                        <div style="font-size: 3rem; margin-bottom: 20px;">📋</div>
                        <h3>No tasks assigned yet</h3>
                        <p>Check back later for new assignments from your admin.</p>
                    </div>
                `;
                return;
            }
            
            workerTasks.forEach(task => {
                const taskElement = createWorkerTaskElement(task);
                workerTasksContainer.appendChild(taskElement);
            });
        }
    } catch (error) {
        handleError(error, 'loading worker tasks');
    }
}

function createWorkerTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item priority-${task.priority}`;
    
    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
    const daysUntilDue = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    let dueDateDisplay = formatDate(task.dueDate);
    if (isOverdue) {
        dueDateDisplay += ' (Overdue)';
    } else if (daysUntilDue <= 1 && task.status !== 'completed') {
        dueDateDisplay += ' (Due Soon)';
    }
    
    const priorityColors = {
        low: '#48bb78',
        medium: '#f6ad55',
        high: '#e53e3e'
    };
    
    taskDiv.innerHTML = `
        <div class="task-header">
            <div class="task-title">${task.title}</div>
            <div class="task-status ${task.status}">${task.status.charAt(0).toUpperCase() + task.status.slice(1)}</div>
        </div>
        <div class="task-description">${task.description}</div>
        <div class="task-meta">
            <div style="display: flex; align-items: center; gap: 5px;">
                <span style="display: inline-block; width: 10px; height: 10px; background: ${priorityColors[task.priority]}; border-radius: 50%;"></span>
                <span>${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority</span>
            </div>
            <span style="color: ${isOverdue ? '#e53e3e' : '#718096'}; font-weight: ${isOverdue ? '600' : 'normal'};">
                Due: ${dueDateDisplay}
            </span>
        </div>
        <div class="task-meta" style="margin-top: 10px; font-size: 0.8rem;">
            <span>Assigned: ${formatDate(task.createdAt)}</span>
            ${task.completedAt ? `<span>Completed: ${formatDate(task.completedAt)}</span>` : ''}
        </div>
        <div class="task-actions">
            ${task.status === 'pending' ? `
                <button class="task-btn" style="background: #f6ad55; color: white;" onclick="markInProgress('${task.id}')">
                    Start Work
                </button>
                <button class="task-btn complete" onclick="markCompleted('${task.id}')">
                    Mark Complete
                </button>
            ` : task.status === 'in-progress' ? `
                <button class="task-btn complete" onclick="markCompleted('${task.id}')">
                    Mark Complete
                </button>
                <button class="task-btn" style="background: #a0aec0; color: white;" onclick="markPending('${task.id}')">
                    Mark Pending
                </button>
            ` : `
                <button class="task-btn" style="background: #a0aec0; color: white;" disabled>
                    ✅ Completed
                </button>
            `}
        </div>
    `;
    
    return taskDiv;
}

function markInProgress(taskId) {
    updateTaskStatus(taskId, 'in-progress');
}

function markCompleted(taskId) {
    if (confirm('Are you sure you want to mark this task as completed?')) {
        const tasks = getTasks();
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            tasks[taskIndex].status = 'completed';
            tasks[taskIndex].completedAt = new Date().toISOString();
            
            saveTasks(tasks);
            showNotification('Task completed successfully! 🎉', 'success');
            loadWorkerStats();
            loadWorkerTasks();
        }
    }
}

function markPending(taskId) {
    updateTaskStatus(taskId, 'pending');
}

function updateTaskStatus(taskId, status) {
    const tasks = getTasks();
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
        tasks[taskIndex].status = status;
        
        if (status === 'completed') {
            tasks[taskIndex].completedAt = new Date().toISOString();
        } else {
            delete tasks[taskIndex].completedAt;
        }
        
        saveTasks(tasks);
        
        const statusMessages = {
            'pending': 'Task marked as pending',
            'in-progress': 'Task started! Good luck! 💪',
            'completed': 'Task completed successfully! 🎉'
        };
        
        showNotification(statusMessages[status], 'success');
        loadWorkerStats();
        loadWorkerTasks();
    }
}

// Add some motivational messages based on worker performance
function showMotivationalMessage() {
    const currentUser = getCurrentUser();
    const tasks = getTasks();
    const workerTasks = tasks.filter(task => task.assignedTo === currentUser.id);
    const completedTasks = workerTasks.filter(task => task.status === 'completed');
    const completionRate = workerTasks.length > 0 ? (completedTasks.length / workerTasks.length) * 100 : 0;
    
    let message = '';
    if (completionRate === 100 && workerTasks.length > 0) {
        message = '🎉 Excellent work! You\'ve completed all your tasks!';
    } else if (completionRate >= 80) {
        message = '🌟 Great job! You\'re doing amazing work!';
    } else if (completionRate >= 60) {
        message = '👍 Good progress! Keep up the good work!';
    } else if (completionRate > 0) {
        message = '💪 You\'re on your way! Every task completed is progress!';
    }
    
    if (message) {
        setTimeout(() => {
            showNotification(message, 'info');
        }, 2000);
    }
}

// Show motivational message after loading tasks
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(showMotivationalMessage, 3000);
});

// Add task filtering and search functionality
function addTaskFilters() {
    const workerTasksContainer = document.getElementById('workerTasks');
    if (!workerTasksContainer) return;
    
    const filterContainer = document.createElement('div');
    filterContainer.className = 'task-filters';
    filterContainer.style.cssText = `
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
        padding: 15px;
        background: #f8fafc;
        border-radius: 10px;
        flex-wrap: wrap;
        align-items: center;
    `;
    
    filterContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <label style="font-weight: 500; color: #4a5568;">Filter:</label>
            <select id="statusFilter" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: white;">
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
            </select>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
            <label style="font-weight: 500; color: #4a5568;">Priority:</label>
            <select id="priorityFilter" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: white;">
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
            </select>
        </div>
    `;
    
    workerTasksContainer.parentNode.insertBefore(filterContainer, workerTasksContainer);
    
    // Add event listeners for filters
    document.getElementById('statusFilter').addEventListener('change', filterTasks);
    document.getElementById('priorityFilter').addEventListener('change', filterTasks);
}

function filterTasks() {
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const priorityFilter = document.getElementById('priorityFilter')?.value || 'all';
    
    const taskItems = document.querySelectorAll('.task-item');
    
    taskItems.forEach(taskItem => {
        const status = taskItem.querySelector('.task-status').textContent.toLowerCase().replace(' ', '-');
        const priority = taskItem.className.includes('priority-high') ? 'high' : 
                        taskItem.className.includes('priority-medium') ? 'medium' : 'low';
        
        const statusMatch = statusFilter === 'all' || status === statusFilter;
        const priorityMatch = priorityFilter === 'all' || priority === priorityFilter;
        
        if (statusMatch && priorityMatch) {
            taskItem.style.display = 'block';
        } else {
            taskItem.style.display = 'none';
        }
    });
}

// Initialize filters after loading tasks
setTimeout(() => {
    if (document.getElementById('workerTasks')) {
        addTaskFilters();
    }
}, 1000);