const API_URL = '/api';

// ==================== AUTHENTICATION ====================
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'admin' && password === 'admin123') {
        localStorage.setItem('user', JSON.stringify({ username, role: 'admin' }));
        window.location.href = 'dashboard.html';
    } else {
        showMessage('Invalid credentials', 'error');
    }
});

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Check authentication
if (!localStorage.getItem('user') && !window.location.href.includes('index.html')) {
    window.location.href = 'index.html';
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
    try {
        // Load stats
        const [employeesRes, departmentsRes] = await Promise.all([
            fetch(`${API_URL}/employees`).then(res => res.json()),
            fetch(`${API_URL}/departments`).then(res => res.json())
        ]);

        const employees = employeesRes.data || [];
        const departments = departmentsRes.data || [];

        document.getElementById('totalEmployees').textContent = employees.length;
        document.getElementById('totalDepartments').textContent = departments.length;
        
        const activeEmployees = employees.filter(emp => emp.status === 'active').length;
        document.getElementById('activeEmployees').textContent = activeEmployees;
        
        const avgSalary = employees.reduce((sum, emp) => sum + emp.salary, 0) / employees.length;
        document.getElementById('avgSalary').textContent = `$${avgSalary.toFixed(2)}`;

        // Load recent employees
        const recentEmployees = employees.slice(0, 5);
        displayRecentEmployees(recentEmployees);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function displayRecentEmployees(employees) {
    const tbody = document.getElementById('recentEmployeesBody');
    tbody.innerHTML = employees.map(emp => `
        <tr>
            <td>${emp.name}</td>
            <td>${emp.position}</td>
            <td>${emp.department_name || 'N/A'}</td>
            <td>${new Date(emp.join_date).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

// ==================== EMPLOYEES CRUD ====================
let currentEmployees = [];

async function loadEmployees() {
    try {
        const response = await fetch(`${API_URL}/employees`);
        const result = await response.json();
        currentEmployees = result.data || [];
        displayEmployees(currentEmployees);
        loadDepartmentFilter();
    } catch (error) {
        showMessage('Error loading employees', 'error');
    }
}

function displayEmployees(employees) {
    const tbody = document.getElementById('employeesBody');
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No employees found</td></tr>';
        return;
    }

    tbody.innerHTML = employees.map(emp => `
        <tr>
            <td>${emp.id}</td>
            <td>${emp.name}</td>
            <td>${emp.email}</td>
            <td>${emp.phone}</td>
            <td>${emp.position}</td>
            <td>${emp.department_name || 'N/A'}</td>
            <td>$${emp.salary.toLocaleString()}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editEmployee(${emp.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteEmployee(${emp.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function loadDepartmentFilter() {
    try {
        const response = await fetch(`${API_URL}/departments`);
        const result = await response.json();
        const departments = result.data || [];
        const select = document.getElementById('departmentFilter');
        select.innerHTML = '<option value="">All Departments</option>' + 
            departments.map(dept => `<option value="${dept.id}">${dept.name}</option>`).join('');
        
        // Also load departments for modal
        const deptSelect = document.getElementById('empDepartment');
        if (deptSelect) {
            deptSelect.innerHTML = departments.map(dept => 
                `<option value="${dept.id}">${dept.name}</option>`
            ).join('');
        }
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

function searchEmployees() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = currentEmployees.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm) ||
        emp.email.toLowerCase().includes(searchTerm) ||
        emp.position.toLowerCase().includes(searchTerm)
    );
    displayEmployees(filtered);
}

function filterByDepartment() {
    const deptId = document.getElementById('departmentFilter').value;
    if (!deptId) {
        displayEmployees(currentEmployees);
        return;
    }
    const filtered = currentEmployees.filter(emp => emp.department_id == deptId);
    displayEmployees(filtered);
}

function openAddEmployeeModal() {
    document.getElementById('modalTitle').textContent = 'Add Employee';
    document.getElementById('employeeForm').reset();
    document.getElementById('employeeId').value = '';
    document.getElementById('employeeModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('employeeModal').style.display = 'none';
}

async function editEmployee(id) {
    try {
        const response = await fetch(`${API_URL}/employees/${id}`);
        const result = await response.json();
        const employee = result.data;
        
        document.getElementById('modalTitle').textContent = 'Edit Employee';
        document.getElementById('employeeId').value = employee.id;
        document.getElementById('empName').value = employee.name;
        document.getElementById('empEmail').value = employee.email;
        document.getElementById('empPhone').value = employee.phone;
        document.getElementById('empPosition').value = employee.position;
        document.getElementById('empDepartment').value = employee.department_id;
        document.getElementById('empSalary').value = employee.salary;
        document.getElementById('empJoinDate').value = employee.join_date.split('T')[0];
        
        document.getElementById('employeeModal').style.display = 'flex';
    } catch (error) {
        showMessage('Error loading employee', 'error');
    }
}

document.getElementById('employeeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const employeeData = {
        name: document.getElementById('empName').value,
        email: document.getElementById('empEmail').value,
        phone: document.getElementById('empPhone').value,
        position: document.getElementById('empPosition').value,
        department_id: document.getElementById('empDepartment').value,
        salary: document.getElementById('empSalary').value,
        join_date: document.getElementById('empJoinDate').value
    };

    const id = document.getElementById('employeeId').value;
    const url = id ? `${API_URL}/employees/${id}` : `${API_URL}/employees`;
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        });

        if (response.ok) {
            showMessage(id ? 'Employee updated successfully' : 'Employee added successfully', 'success');
            closeModal();
            loadEmployees();
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error saving employee', 'error');
        }
    } catch (error) {
        showMessage('Error connecting to server', 'error');
    }
});

async function deleteEmployee(id) {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
        const response = await fetch(`${API_URL}/employees/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('Employee deleted successfully', 'success');
            loadEmployees();
        } else {
            showMessage('Error deleting employee', 'error');
        }
    } catch (error) {
        showMessage('Error connecting to server', 'error');
    }
}

// ==================== DEPARTMENTS CRUD ====================
async function loadDepartments() {
    try {
        const response = await fetch(`${API_URL}/departments`);
        const result = await response.json();
        const departments = result.data || [];
        displayDepartments(departments);
    } catch (error) {
        showMessage('Error loading departments', 'error');
    }
}

function displayDepartments(departments) {
    const grid = document.getElementById('departmentsGrid');
    if (departments.length === 0) {
        grid.innerHTML = '<p>No departments found</p>';
        return;
    }

    grid.innerHTML = departments.map(dept => `
        <div class="department-card">
            <h3>${dept.name}</h3>
            <p><strong>Location:</strong> ${dept.location}</p>
            <p><strong>Budget:</strong> $${dept.budget.toLocaleString()}</p>
            <p><strong>Employees:</strong> ${dept.employee_count || 0}</p>
            <div class="department-actions">
                <button class="btn btn-warning btn-sm" onclick="editDepartment(${dept.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteDepartment(${dept.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function openAddDepartmentModal() {
    document.getElementById('deptModalTitle').textContent = 'Add Department';
    document.getElementById('departmentForm').reset();
    document.getElementById('departmentId').value = '';
    document.getElementById('departmentModal').style.display = 'flex';
}

function closeDepartmentModal() {
    document.getElementById('departmentModal').style.display = 'none';
}

async function editDepartment(id) {
    try {
        const response = await fetch(`${API_URL}/departments/${id}`);
        const result = await response.json();
        const department = result.data;
        
        document.getElementById('deptModalTitle').textContent = 'Edit Department';
        document.getElementById('departmentId').value = department.id;
        document.getElementById('deptName').value = department.name;
        document.getElementById('deptLocation').value = department.location;
        document.getElementById('deptBudget').value = department.budget;
        
        document.getElementById('departmentModal').style.display = 'flex';
    } catch (error) {
        showMessage('Error loading department', 'error');
    }
}

document.getElementById('departmentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const departmentData = {
        name: document.getElementById('deptName').value,
        location: document.getElementById('deptLocation').value,
        budget: document.getElementById('deptBudget').value
    };

    const id = document.getElementById('departmentId').value;
    const url = id ? `${API_URL}/departments/${id}` : `${API_URL}/departments`;
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(departmentData)
        });

        if (response.ok) {
            showMessage(id ? 'Department updated successfully' : 'Department added successfully', 'success');
            closeDepartmentModal();
            loadDepartments();
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error saving department', 'error');
        }
    } catch (error) {
        showMessage('Error connecting to server', 'error');
    }
});

async function deleteDepartment(id) {
    if (!confirm('Are you sure you want to delete this department?')) return;

    try {
        const response = await fetch(`${API_URL}/departments/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('Department deleted successfully', 'success');
            loadDepartments();
        } else {
            showMessage('Error deleting department', 'error');
        }
    } catch (error) {
        showMessage('Error connecting to server', 'error');
    }
}

// ==================== UTILITIES ====================
function showMessage(text, type) {
    const messageBox = document.getElementById('messageBox');
    if (messageBox) {
        messageBox.textContent = text;
        messageBox.className = `message-box ${type}`;
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 3000);
    } else {
        alert(text);
    }
}

// Initialize page based on current file
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    
    if (path.includes('dashboard.html')) {
        loadDashboard();
    } else if (path.includes('employees.html')) {
        loadEmployees();
    } else if (path.includes('departments.html')) {
        loadDepartments();
    }
});