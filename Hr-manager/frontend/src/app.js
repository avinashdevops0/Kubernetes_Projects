const API_GATEWAY_URL = 'http://localhost:3000';

let currentEditType = '';
let currentEditId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initForms();
    initModal();
    initRefreshButtons();
    
    checkGatewayHealth();
    setInterval(checkGatewayHealth, 30000);
    
    loadDashboard();
    loadEmployees();
    loadDepartments();
    loadLeaves();
    loadReviews();
    
    document.getElementById('emp-hire-date').valueAsDate = new Date();
    document.getElementById('review-date').valueAsDate = new Date();
    document.getElementById('att-date').valueAsDate = new Date();
    
    loadAttendance();
    loadPayroll();
    loadAnnouncements();
});

// Load Dashboard
async function loadDashboard() {
    try {
        const [employeesResponse, departmentsResponse, leavesResponse, reviewsResponse] = await Promise.all([
            fetch(`${API_GATEWAY_URL}/employees`),
            fetch(`${API_GATEWAY_URL}/departments`),
            fetch(`${API_GATEWAY_URL}/leaves`),
            fetch(`${API_GATEWAY_URL}/reviews`)
        ]);

        const employees = employeesResponse.ok ? await employeesResponse.json() : [];
        const departments = departmentsResponse.ok ? await departmentsResponse.json() : [];
        const leaves = leavesResponse.ok ? await leavesResponse.json() : [];
        const reviews = reviewsResponse.ok ? await reviewsResponse.json() : [];

        document.getElementById('total-employees').textContent = employees.length;
        document.getElementById('total-departments').textContent = departments.length;
        document.getElementById('pending-leaves').textContent = leaves.filter(l => l.status === 'pending').length;
        
        const currentYear = new Date().getFullYear();
        document.getElementById('total-reviews').textContent = reviews.filter(r => new Date(r.review_date).getFullYear() === currentYear).length;

        const deptStatsGrid = document.getElementById('dept-stats-grid');
        if (departments.length > 0) {
            deptStatsGrid.innerHTML = departments.map(dept => {
                const empCount = employees.filter(e => e.department_id === dept.id).length;
                return `<div class="stat-card"><span class="stat-label">${dept.name}</span><span class="stat-count">${empCount}</span></div>`;
            }).join('');
        } else {
            deptStatsGrid.innerHTML = '<div class="stat-card"><span class="stat-label">No departments</span><span class="stat-count">0</span></div>';
        }

        const recentEmployees = document.getElementById('recent-employees');
        if (employees.length > 0) {
            const sorted = [...employees].sort((a, b) => new Date(b.hire_date) - new Date(a.hire_date)).slice(0, 4);
            recentEmployees.innerHTML = sorted.map(emp => `
                <div class="item-card">
                    <div class="item-header"><span class="item-id">Employee #${emp.id}</span></div>
                    <div class="item-detail"><span>Name:</span><span>${emp.name}</span></div>
                    <div class="item-detail"><span>Position:</span><span>${emp.position}</span></div>
                    <div class="item-detail"><span>Hire Date:</span><span>${new Date(emp.hire_date).toLocaleDateString()}</span></div>
                </div>
            `).join('');
        } else {
            recentEmployees.innerHTML = '<div class="empty-message">No employees yet</div>';
        }
    } catch (error) { console.error('Error loading dashboard:', error); }
}

// Navigation
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === sectionId + '-section') section.classList.add('active');
            });
            if (sectionId === 'dashboard') loadDashboard();
        });
    });
}

// Gateway Health Check
async function checkGatewayHealth() {
    try {
        const response = await fetch(`${API_GATEWAY_URL}/health`);
        const data = await response.json();
        updateGatewayStatus(data.status === 'healthy');
    } catch (error) {
        updateGatewayStatus(false);
    }
}

function updateGatewayStatus(isHealthy) {
    const statusElement = document.getElementById('gateway-status');
    if (statusElement) {
        statusElement.textContent = isHealthy ? 'Connected' : 'Disconnected';
        statusElement.className = 'status-value ' + (isHealthy ? 'healthy' : 'unhealthy');
    }
}

// Forms Initialization
function initForms() {
    const employeeForm = document.getElementById('employee-form');
    if (employeeForm) employeeForm.addEventListener('submit', handleEmployeeSubmit);

    const departmentForm = document.getElementById('department-form');
    if (departmentForm) departmentForm.addEventListener('submit', handleDepartmentSubmit);

    const leaveForm = document.getElementById('leave-form');
    if (leaveForm) leaveForm.addEventListener('submit', handleLeaveSubmit);

    const reviewForm = document.getElementById('review-form');
    if (reviewForm) reviewForm.addEventListener('submit', handleReviewSubmit);
    
    const attendanceForm = document.getElementById('attendance-form');
    if (attendanceForm) attendanceForm.addEventListener('submit', handleAttendanceSubmit);
    
    const payrollForm = document.getElementById('payroll-form');
    if (payrollForm) payrollForm.addEventListener('submit', handlePayrollSubmit);
    
    const announcementForm = document.getElementById('announcement-form');
    if (announcementForm) announcementForm.addEventListener('submit', handleAnnouncementSubmit);
}

// Populate dropdowns
async function populateDropdowns() {
    const empDeptSelect = document.getElementById('emp-department');
    const leaveEmpSelect = document.getElementById('leave-employee');
    const reviewEmpSelect = document.getElementById('review-employee');
    const deptManagerSelect = document.getElementById('dept-manager');
    const attEmpSelect = document.getElementById('att-employee');
    const payEmpSelect = document.getElementById('pay-employee');
    
    if (empDeptSelect) empDeptSelect.innerHTML = '<option value="">-- Select Department --</option>';
    if (leaveEmpSelect) leaveEmpSelect.innerHTML = '<option value="">-- Select Employee --</option>';
    if (reviewEmpSelect) reviewEmpSelect.innerHTML = '<option value="">-- Select Employee --</option>';
    if (deptManagerSelect) deptManagerSelect.innerHTML = '<option value="">-- Select Manager --</option>';
    if (attEmpSelect) attEmpSelect.innerHTML = '<option value="">-- Select Employee --</option>';
    if (payEmpSelect) payEmpSelect.innerHTML = '<option value="">-- Select Employee --</option>';
    
    try {
        const employeesResponse = await fetch(`${API_GATEWAY_URL}/employees`);
        if (employeesResponse.ok) {
            const employees = await employeesResponse.json();
            [leaveEmpSelect, reviewEmpSelect, deptManagerSelect, attEmpSelect, payEmpSelect].forEach(select => {
                if (select) {
                    employees.forEach(emp => {
                        const option = document.createElement('option');
                        option.value = emp.id;
                        option.textContent = `${emp.name} (${emp.position})`;
                        select.appendChild(option);
                    });
                }
            });
        }
    } catch (error) { console.error('Error loading employees:', error); }
    
    try {
        const deptsResponse = await fetch(`${API_GATEWAY_URL}/departments`);
        if (deptsResponse.ok) {
            const departments = await deptsResponse.json();
            if (empDeptSelect) {
                departments.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept.id;
                    option.textContent = dept.name;
                    empDeptSelect.appendChild(option);
                });
            }
        }
    } catch (error) { console.error('Error loading departments:', error); }
}

// EMPLOYEES CRUD
async function handleEmployeeSubmit(e) {
    e.preventDefault();
    const departmentId = toNullableInt(document.getElementById('emp-department').value);
    const employeeData = {
        name: document.getElementById('emp-name').value,
        email: document.getElementById('emp-email').value,
        position: document.getElementById('emp-position').value,
        department_id: departmentId,
        salary: parseFloat(document.getElementById('emp-salary').value) || 0,
        hire_date: document.getElementById('emp-hire-date').value
    };
    try {
        const response = await fetch(`${API_GATEWAY_URL}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        });
        const data = await response.json();
        if (response.ok) {
            showMessage('employee-message', `Employee created! ID: ${data.id}`, true);
            document.getElementById('employee-form').reset();
            document.getElementById('emp-hire-date').valueAsDate = new Date();
            loadEmployees(); loadDashboard(); populateDropdowns();
        } else {
            showMessage('employee-message', `Error: ${data.error || 'Failed'}`, false);
        }
    } catch (error) { showMessage('employee-message', 'Error: Could not connect', false); }
}

async function loadEmployees() {
    const employeesList = document.getElementById('employees-list');
    const loadingElement = document.getElementById('employees-loading');
    const errorElement = document.getElementById('employees-error');
    if (!employeesList) return;
    loadingElement.classList.remove('hidden');
    errorElement.classList.add('hidden');
    employeesList.innerHTML = '';
    
    let departments = [];
    try { const deptsResponse = await fetch(`${API_GATEWAY_URL}/departments`); if (deptsResponse.ok) departments = await deptsResponse.json(); } 
    catch (e) { console.error('Error:', e); }
    
    try {
        const response = await fetch(`${API_GATEWAY_URL}/employees`);
        if (!response.ok) throw new Error('Failed');
        const employees = await response.json();
        loadingElement.classList.add('hidden');
        if (employees.length === 0) { employeesList.innerHTML = '<div class="empty-message">No employees found</div>'; return; }
        employeesList.innerHTML = employees.map(emp => {
            const dept = departments.find(d => d.id === emp.department_id);
            return `<div class="item-card"><div class="item-header"><span class="item-id">Employee #${emp.id}</span><div class="item-actions"><button class="btn btn-delete" onclick="deleteEmployee(${emp.id})">🗑️ Delete</button></div></div><div class="item-detail"><span>Name:</span><span>${emp.name}</span></div><div class="item-detail"><span>Email:</span><span>${emp.email}</span></div><div class="item-detail"><span>Position:</span><span>${emp.position}</span></div><div class="item-detail"><span>Department:</span><span>${dept ? dept.name : 'N/A'}</span></div><div class="item-detail"><span>Salary:</span><span>$${parseFloat(emp.salary).toLocaleString()}</span></div></div>`;
        }).join('');
    } catch (error) {
        loadingElement.classList.add('hidden');
        errorElement.textContent = 'Failed to load employees';
        errorElement.classList.remove('hidden');
    }
}

async function deleteEmployee(id) {
    if (!confirm('Delete this employee?')) return;
    try {
        const response = await fetch(`${API_GATEWAY_URL}/employees/${id}`, { method: 'DELETE' });
        if (response.ok) { showMessage('employee-message', 'Deleted!', true); loadEmployees(); loadDashboard(); populateDropdowns(); }
        else { const data = await response.json(); showMessage('employee-message', 'Error: ' + (data.error || 'Failed'), false); }
    } catch (error) { showMessage('employee-message', 'Error: Could not connect', false); }
}

// DEPARTMENTS CRUD
async function handleDepartmentSubmit(e) {
    e.preventDefault();
    const managerId = document.getElementById('dept-manager').value;
    const departmentData = { name: document.getElementById('dept-name').value, description: document.getElementById('dept-description').value || undefined, manager_id: managerId ? parseInt(managerId) : null };
    try {
        const response = await fetch(`${API_GATEWAY_URL}/departments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(departmentData) });
        const data = await response.json();
        if (response.ok) { showMessage('department-message', `Department created! ID: ${data.id}`, true); document.getElementById('department-form').reset(); loadDepartments(); loadDashboard(); populateDropdowns(); }
        else { showMessage('department-message', 'Error: ' + (data.error || 'Failed'), false); }
    } catch (error) { showMessage('department-message', 'Error: Could not connect', false); }
}

async function loadDepartments() {
    const departmentsList = document.getElementById('departments-list');
    const loadingElement = document.getElementById('departments-loading');
    const errorElement = document.getElementById('departments-error');
    if (!departmentsList) return;
    loadingElement.classList.remove('hidden');
    errorElement.classList.add('hidden');
    departmentsList.innerHTML = '';
    
    let employees = [];
    try { const empResponse = await fetch(`${API_GATEWAY_URL}/employees`); if (empResponse.ok) employees = await empResponse.json(); } 
    catch (e) { console.error('Error:', e); }
    
    try {
        const response = await fetch(`${API_GATEWAY_URL}/departments`);
        if (!response.ok) throw new Error('Failed');
        const departments = await response.json();
        loadingElement.classList.add('hidden');
        if (departments.length === 0) { departmentsList.innerHTML = '<div class="empty-message">No departments found</div>'; return; }
        departmentsList.innerHTML = departments.map(dept => {
            const manager = employees.find(e => e.id === dept.manager_id);
            const empCount = employees.filter(e => e.department_id === dept.id).length;
            return `<div class="item-card"><div class="item-header"><span class="item-id">Department #${dept.id}</span><div class="item-actions"><button class="btn btn-delete" onclick="deleteDepartment(${dept.id})">🗑️ Delete</button></div></div><div class="item-detail"><span>Name:</span><span>${dept.name}</span></div><div class="item-detail"><span>Description:</span><span>${dept.description || 'N/A'}</span></div><div class="item-detail"><span>Manager:</span><span>${manager ? manager.name : 'Not assigned'}</span></div><div class="item-detail"><span>Employees:</span><span>${empCount}</span></div></div>`;
        }).join('');
    } catch (error) {
        loadingElement.classList.add('hidden');
        errorElement.textContent = 'Failed to load departments';
        errorElement.classList.remove('hidden');
    }
}

async function deleteDepartment(id) {
    if (!confirm('Delete this department?')) return;
    try {
        const response = await fetch(`${API_GATEWAY_URL}/departments/${id}`, { method: 'DELETE' });
        if (response.ok) { showMessage('department-message', 'Deleted!', true); loadDepartments(); loadDashboard(); populateDropdowns(); }
        else { const data = await response.json(); showMessage('department-message', 'Error: ' + (data.error || 'Failed'), false); }
    } catch (error) { showMessage('department-message', 'Error: Could not connect', false); }
}

// LEAVE REQUESTS CRUD
async function handleLeaveSubmit(e) {
    e.preventDefault();
    const employeeId = toRequiredInt(document.getElementById('leave-employee').value);
    if (employeeId === null) {
        showMessage('leave-message', 'Error: Please select an employee', false);
        return;
    }
    const leaveData = { employee_id: employeeId, leave_type: document.getElementById('leave-type').value, start_date: document.getElementById('leave-start').value, end_date: document.getElementById('leave-end').value, reason: document.getElementById('leave-reason').value || undefined, status: 'pending' };
    try {
        const response = await fetch(`${API_GATEWAY_URL}/leaves`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(leaveData) });
        const data = await response.json();
        if (response.ok) { showMessage('leave-message', `Leave submitted! ID: ${data.id}`, true); document.getElementById('leave-form').reset(); loadLeaves(); loadDashboard(); }
        else { showMessage('leave-message', 'Error: ' + (data.error || 'Failed'), false); }
    } catch (error) { showMessage('leave-message', 'Error: Could not connect', false); }
}

async function loadLeaves() {
    const leavesList = document.getElementById('leaves-list');
    const loadingElement = document.getElementById('leaves-loading');
    const errorElement = document.getElementById('leaves-error');
    if (!leavesList) return;
    loadingElement.classList.remove('hidden');
    errorElement.classList.add('hidden');
    leavesList.innerHTML = '';
    
    let employees = [];
    try { const empResponse = await fetch(`${API_GATEWAY_URL}/employees`); if (empResponse.ok) employees = await empResponse.json(); } 
    catch (e) { console.error('Error:', e); }
    
    try {
        const response = await fetch(`${API_GATEWAY_URL}/leaves`);
        if (!response.ok) throw new Error('Failed');
        const leaves = await response.json();
        loadingElement.classList.add('hidden');
        if (leaves.length === 0) { leavesList.innerHTML = '<div class="empty-message">No leave requests found</div>'; return; }
        leavesList.innerHTML = leaves.map(leave => {
            const employee = employees.find(e => e.id === leave.employee_id);
            return `<div class="item-card"><div class="item-header"><span class="item-id">Leave #${leave.id}</span><span class="leave-status ${leave.status}">${leave.status}</span></div><div class="item-detail"><span>Employee:</span><span>${employee ? employee.name : 'ID: ' + leave.employee_id}</span></div><div class="item-detail"><span>Type:</span><span>${leave.leave_type}</span></div><div class="item-detail"><span>Start:</span><span>${new Date(leave.start_date).toLocaleDateString()}</span></div><div class="item-detail"><span>End:</span><span>${new Date(leave.end_date).toLocaleDateString()}</span></div><div class="item-actions" style="margin-top:10px;">${leave.status === 'pending' ? `<button class="btn btn-approve" onclick="updateLeaveStatus(${leave.id}, 'approved')">✓ Approve</button><button class="btn btn-reject" onclick="updateLeaveStatus(${leave.id}, 'rejected')">✗ Reject</button>` : ''}<button class="btn btn-delete" onclick="deleteLeave(${leave.id})">🗑️ Delete</button></div></div>`;
        }).join('');
    } catch (error) {
        loadingElement.classList.add('hidden');
        errorElement.textContent = 'Failed to load leaves';
        errorElement.classList.remove('hidden');
    }
}

async function updateLeaveStatus(id, status) {
    try {
        const response = await fetch(`${API_GATEWAY_URL}/leaves/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
        if (response.ok) { showMessage('leave-message', `Leave ${status}!`, true); loadLeaves(); loadDashboard(); }
        else { const data = await response.json(); showMessage('leave-message', 'Error: ' + (data.error || 'Failed'), false); }
    } catch (error) { showMessage('leave-message', 'Error: Could not connect', false); }
}

async function deleteLeave(id) {
    if (!confirm('Delete this leave request?')) return;
    try {
        const response = await fetch(`${API_GATEWAY_URL}/leaves/${id}`, { method: 'DELETE' });
        if (response.ok) { showMessage('leave-message', 'Deleted!', true); loadLeaves(); loadDashboard(); }
        else { const data = await response.json(); showMessage('leave-message', 'Error: ' + (data.error || 'Failed'), false); }
    } catch (error) { showMessage('leave-message', 'Error: Could not connect', false); }
}

// PERFORMANCE REVIEWS CRUD
async function handleReviewSubmit(e) {
    e.preventDefault();
    const employeeId = toRequiredInt(document.getElementById('review-employee').value);
    if (employeeId === null) {
        showMessage('review-message', 'Error: Please select an employee', false);
        return;
    }
    const reviewData = { employee_id: employeeId, review_date: document.getElementById('review-date').value, rating: parseInt(document.getElementById('review-rating').value), comments: document.getElementById('review-comments').value || undefined };
    try {
        const response = await fetch(`${API_GATEWAY_URL}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reviewData) });
        const data = await response.json();
        if (response.ok) { showMessage('review-message', `Review created! ID: ${data.id}`, true); document.getElementById('review-form').reset(); document.getElementById('review-date').valueAsDate = new Date(); loadReviews(); loadDashboard(); }
        else { showMessage('review-message', 'Error: ' + (data.error || 'Failed'), false); }
    } catch (error) { showMessage('review-message', 'Error: Could not connect', false); }
}

async function loadReviews() {
    const reviewsList = document.getElementById('reviews-list');
    const loadingElement = document.getElementById('reviews-loading');
    const errorElement = document.getElementById('reviews-error');
    if (!reviewsList) return;
    loadingElement.classList.remove('hidden');
    errorElement.classList.add('hidden');
    reviewsList.innerHTML = '';
    
    let employees = [];
    try { const empResponse = await fetch(`${API_GATEWAY_URL}/employees`); if (empResponse.ok) employees = await empResponse.json(); } 
    catch (e) { console.error('Error:', e); }
    
    try {
        const response = await fetch(`${API_GATEWAY_URL}/reviews`);
        if (!response.ok) throw new Error('Failed');
        const reviews = await response.json();
        loadingElement.classList.add('hidden');
        if (reviews.length === 0) { reviewsList.innerHTML = '<div class="empty-message">No reviews found</div>'; return; }
        reviewsList.innerHTML = reviews.map(review => {
            const employee = employees.find(e => e.id === review.employee_id);
            return `<div class="item-card"><div class="item-header"><span class="item-id">Review #${review.id}</span><div class="review-rating">${[1,2,3,4,5].map(i => `<span class="star ${i <= review.rating ? '' : 'empty'}">★</span>`).join('')}</div></div><div class="item-detail"><span>Employee:</span><span>${employee ? employee.name : 'ID: ' + review.employee_id}</span></div><div class="item-detail"><span>Date:</span><span>${new Date(review.review_date).toLocaleDateString()}</span></div><div class="item-detail"><span>Rating:</span><span>${review.rating}/5</span></div><div class="item-detail"><span>Comments:</span><span>${review.comments || 'N/A'}</span></div><div class="item-actions" style="margin-top:10px;"><button class="btn btn-delete" onclick="deleteReview(${review.id})">🗑️ Delete</button></div></div>`;
        }).join('');
    } catch (error) {
        loadingElement.classList.add('hidden');
        errorElement.textContent = 'Failed to load reviews';
        errorElement.classList.remove('hidden');
    }
}

async function deleteReview(id) {
    if (!confirm('Delete this review?')) return;
    try {
        const response = await fetch(`${API_GATEWAY_URL}/reviews/${id}`, { method: 'DELETE' });
        if (response.ok) { showMessage('review-message', 'Deleted!', true); loadReviews(); loadDashboard(); }
        else { const data = await response.json(); showMessage('review-message', 'Error: ' + (data.error || 'Failed'), false); }
    } catch (error) { showMessage('review-message', 'Error: Could not connect', false); }
}

// ATTENDANCE CRUD
async function handleAttendanceSubmit(e) {
    e.preventDefault();
    const employeeId = toRequiredInt(document.getElementById('att-employee').value);
    if (employeeId === null) {
        showMessage('attendance-message', 'Error: Please select an employee', false);
        return;
    }
    const attendanceData = { employee_id: employeeId, date: document.getElementById('att-date').value, clock_in: document.getElementById('att-clock-in').value, clock_out: document.getElementById('att-clock-out').value || null, notes: document.getElementById('att-notes').value || undefined };
    try {
        const response = await fetch(`${API_GATEWAY_URL}/attendance`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(attendanceData) });
        const data = await response.json();
        if (response.ok) { showMessage('attendance-message', 'Attendance recorded!', true); document.getElementById('attendance-form').reset(); document.getElementById('att-date').valueAsDate = new Date(); loadAttendance(); }
        else { showMessage('attendance-message', 'Error: ' + (data.error || 'Failed'), false); }
    } catch (error) { showMessage('attendance-message', 'Error: Could not connect', false); }
}

async function loadAttendance() {
    const attendanceList = document.getElementById('attendance-list');
    const loadingElement = document.getElementById('attendance-loading');
    const errorElement = document.getElementById('attendance-error');
    if (!attendanceList) return;
    loadingElement.classList.remove('hidden');
    errorElement.classList.add('hidden');
    attendanceList.innerHTML = '';
    
    let employees = [];
    try { const empResponse = await fetch(`${API_GATEWAY_URL}/employees`); if (empResponse.ok) employees = await empResponse.json(); } 
    catch (e) { console.error('Error:', e); }
    
    try {
        const response = await fetch(`${API_GATEWAY_URL}/attendance`);
        if (!response.ok) throw new Error('Failed');
        const records = await response.json();
        loadingElement.classList.add('hidden');
        if (records.length === 0) { attendanceList.innerHTML = '<div class="empty-message">No attendance records found</div>'; return; }
        attendanceList.innerHTML = records.map(record => {
            const employee = employees.find(e => e.id === record.employee_id);
            return `<div class="item-card"><div class="item-header"><span class="item-id">Record #${record.id}</span><span class="leave-status ${record.clock_out ? 'approved' : 'pending'}">${record.clock_out ? 'Completed' : 'In Progress'}</span></div><div class="item-detail"><span>Employee:</span><span>${employee ? employee.name : 'ID: ' + record.employee_id}</span></div><div class="item-detail"><span>Date:</span><span>${new Date(record.date).toLocaleDateString()}</span></div><div class="item-detail"><span>Clock In:</span><span>${record.clock_in || 'N/A'}</span></div><div class="item-detail"><span>Clock Out:</span><span>${record.clock_out || 'Not clocked out'}</span></div><div class="item-actions" style="margin-top:10px;"><button class="btn btn-delete" onclick="deleteAttendance(${record.id})">🗑️ Delete</button></div></div>`;
        }).join('');
    } catch (error) {
        loadingElement.classList.add('hidden');
        errorElement.textContent = 'Failed to load attendance';
        errorElement.classList.remove('hidden');
    }
}

async function deleteAttendance(id) {
    if (!confirm('Delete this record?')) return;
    try {
        const response = await fetch(`${API_GATEWAY_URL}/attendance/${id}`, { method: 'DELETE' });
        if (response.ok) { showMessage('attendance-message', 'Deleted!', true); loadAttendance(); }
        else { const data = await response.json(); showMessage('attendance-message', 'Error: ' + (data.error || 'Failed'), false); }
    } catch (error) { showMessage('attendance-message', 'Error: Could not connect', false); }
}

// PAYROLL CRUD
async function handlePayrollSubmit(e) {
    e.preventDefault();
    const employeeId = toRequiredInt(document.getElementById('pay-employee').value);
    if (employeeId === null) {
        showMessage('payroll-message', 'Error: Please select an employee', false);
        return;
    }
    const basic = parseFloat(document.getElementById('pay-basic').value) || 0;
    const allow = parseFloat(document.getElementById('pay-allowances').value) || 0;
    const ded = parseFloat(document.getElementById('pay-deductions').value) || 0;
    const payrollData = { employee_id: employeeId, period_start: document.getElementById('pay-period-start').value, period_end: document.getElementById('pay-period-end').value, basic_salary: basic, allowances: allow, deductions: ded, net_salary: basic + allow - ded, status: document.getElementById('pay-status').value };
    try {
        const response = await fetch(`${API_GATEWAY_URL}/payroll`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payrollData) });
        const data = await response.json();
        if (response.ok) { showMessage('payroll-message', 'Payroll processed!', true); document.getElementById('payroll-form').reset(); loadPayroll(); }
        else { showMessage('payroll-message', 'Error: ' + (data.error || 'Failed'), false); }
    } catch (error) { showMessage('payroll-message', 'Error: Could not connect', false); }
}

async function loadPayroll() {
    const payrollList = document.getElementById('payroll-list');
    const loadingElement = document.getElementById('payroll-loading');
    const errorElement = document.getElementById('payroll-error');
    if (!payrollList) return;
    loadingElement.classList.remove('hidden');
    errorElement.classList.add('hidden');
    payrollList.innerHTML = '';
    
    let employees = [];
    try { const empResponse = await fetch(`${API_GATEWAY_URL}/employees`); if (empResponse.ok) employees = await empResponse.json(); } 
    catch (e) { console.error('Error:', e); }
    
    try {
        const response = await fetch(`${API_GATEWAY_URL}/payroll`);
        if (!response.ok) throw new Error('Failed');
        const records = await response.json();
        loadingElement.classList.add('hidden');
        if (records.length === 0) { payrollList.innerHTML = '<div class="empty-message">No records found</div>'; return; }
        payrollList.innerHTML = records.map(record => {
            const employee = employees.find(e => e.id === record.employee_id);
            return `<div class="item-card"><div class="item-header"><span class="item-id">Payroll #${record.id}</span><span class="leave-status ${record.status === 'paid' ? 'approved' : record.status === 'processed' ? 'pending' : 'rejected'}">${record.status}</span></div><div class="item-detail"><span>Employee:</span><span>${employee ? employee.name : 'ID: ' + record.employee_id}</span></div><div class="item-detail"><span>Period:</span><span>${new Date(record.period_start).toLocaleDateString()} - ${new Date(record.period_end).toLocaleDateString()}</span></div><div class="item-detail"><span>Net:</span><span>$${parseFloat(record.net_salary).toLocaleString()}</span></div><div class="item-actions" style="margin-top:10px;"><button class="btn btn-delete" onclick="deletePayroll(${record.id})">🗑️ Delete</button></div></div>`;
        }).join('');
    } catch (error) {
        loadingElement.classList.add('hidden');
        errorElement.textContent = 'Failed to load payroll';
        errorElement.classList.remove('hidden');
    }
}

async function deletePayroll(id) {
    if (!confirm('Delete this record?')) return;
    try {
        const response = await fetch(`${API_GATEWAY_URL}/payroll/${id}`, { method: 'DELETE' });
        if (response.ok) { showMessage('payroll-message', 'Deleted!', true); loadPayroll(); }
        else { const data = await response.json(); showMessage('payroll-message', 'Error: ' + (data.error || 'Failed'), false); }
    } catch (error) { showMessage('payroll-message', 'Error: Could not connect', false); }
}

// ANNOUNCEMENTS CRUD
async function handleAnnouncementSubmit(e) {
    e.preventDefault();
    const announcementData = { title: document.getElementById('ann-title').value, category: document.getElementById('ann-category').value, posted_date: document.getElementById('ann-date').value, content: document.getElementById('ann-content').value };
    try {
        const response = await fetch(`${API_GATEWAY_URL}/announcements`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(announcementData) });
        const data = await response.json();
        if (response.ok) { showMessage('announcement-message', 'Posted!', true); document.getElementById('announcement-form').reset(); document.getElementById('ann-date').valueAsDate = new Date(); loadAnnouncements(); }
        else { showMessage('announcement-message', 'Error: ' + (data.error || 'Failed'), false); }
    } catch (error) { showMessage('announcement-message', 'Error: Could not connect', false); }
}

async function loadAnnouncements() {
    const announcementsList = document.getElementById('announcements-list');
    const loadingElement = document.getElementById('announcements-loading');
    const errorElement = document.getElementById('announcements-error');
    if (!announcementsList) return;
    loadingElement.classList.remove('hidden');
    errorElement.classList.add('hidden');
    announcementsList.innerHTML = '';
    
    try {
        const response = await fetch(`${API_GATEWAY_URL}/announcements`);
        if (!response.ok) throw new Error('Failed');
        const announcements = await response.json();
        loadingElement.classList.add('hidden');
        if (announcements.length === 0) { announcementsList.innerHTML = '<div class="empty-message">No announcements found</div>'; return; }
        announcementsList.innerHTML = announcements.map(ann => `<div class="item-card"><div class="item-header"><span class="item-id">#${ann.id}</span><span class="leave-status ${ann.category === 'urgent' ? 'rejected' : ann.category === 'holiday' ? 'approved' : 'pending'}">${ann.category}</span></div><div class="item-detail"><span>Title:</span><span>${ann.title}</span></div><div class="item-detail"><span>Category:</span><span>${ann.category}</span></div><div class="item-detail"><span>Date:</span><span>${new Date(ann.posted_date).toLocaleDateString()}</span></div><div class="item-detail"><span>Content:</span><span>${ann.content}</span></div><div class="item-actions" style="margin-top:10px;"><button class="btn btn-delete" onclick="deleteAnnouncement(${ann.id})">🗑️ Delete</button></div></div>`).join('');
    } catch (error) {
        loadingElement.classList.add('hidden');
        errorElement.textContent = 'Failed to load';
        errorElement.classList.remove('hidden');
    }
}

async function deleteAnnouncement(id) {
    if (!confirm('Delete this announcement?')) return;
    try {
        const response = await fetch(`${API_GATEWAY_URL}/announcements/${id}`, { method: 'DELETE' });
        if (response.ok) { showMessage('announcement-message', 'Deleted!', true); loadAnnouncements(); }
        else { const data = await response.json(); showMessage('announcement-message', 'Error: ' + (data.error || 'Failed'), false); }
    } catch (error) { showMessage('announcement-message', 'Error: Could not connect', false); }
}

// MODAL FUNCTIONS
function initModal() {
    const modal = document.getElementById('edit-modal');
    const closeBtn = document.getElementById('modal-close');
    const cancelBtn = document.getElementById('modal-cancel');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (modal) modal.addEventListener('click', function(e) { if (e.target === modal) closeModal(); });
    const editForm = document.getElementById('edit-form');
    if (editForm) editForm.addEventListener('submit', handleEditSubmit);
    populateDropdowns();
}

function closeModal() {
    const modal = document.getElementById('edit-modal');
    modal.classList.add('hidden');
    currentEditType = '';
    currentEditId = null;
}

async function handleEditSubmit(e) {
    e.preventDefault();
    let url = '', data = {};
    if (currentEditType === 'employee') {
        const departmentId = toNullableInt(document.getElementById('edit-department').value);
        const salary = parseFloat(document.getElementById('edit-salary').value);
        if (Number.isNaN(salary)) {
            alert('Error: Salary must be a valid number');
            return;
        }
        url = `${API_GATEWAY_URL}/employees/${currentEditId}`;
        data = { name: document.getElementById('edit-name').value, email: document.getElementById('edit-email').value, position: document.getElementById('edit-position').value, department_id: departmentId, salary, hire_date: document.getElementById('edit-hire-date').value };
    }
    // Add other edit handlers as needed
    try {
        const response = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (response.ok) { closeModal(); showMessage(currentEditType + '-message', 'Updated!', true); loadEmployees(); loadDepartments(); loadLeaves(); loadReviews(); loadAttendance(); loadPayroll(); loadAnnouncements(); loadDashboard(); populateDropdowns(); }
        else { const result = await response.json(); alert('Error: ' + (result.error || 'Failed')); }
    } catch (error) { alert('Error: Could not connect'); }
}

// REFRESH BUTTONS
function initRefreshButtons() {
    const refreshEmployees = document.getElementById('refresh-employees');
    if (refreshEmployees) refreshEmployees.addEventListener('click', () => { loadEmployees(); loadDashboard(); });
    const refreshDepartments = document.getElementById('refresh-departments');
    if (refreshDepartments) refreshDepartments.addEventListener('click', () => { loadDepartments(); loadDashboard(); });
    const refreshLeaves = document.getElementById('refresh-leaves');
    if (refreshLeaves) refreshLeaves.addEventListener('click', () => { loadLeaves(); loadDashboard(); });
    const refreshReviews = document.getElementById('refresh-reviews');
    if (refreshReviews) refreshReviews.addEventListener('click', () => { loadReviews(); loadDashboard(); });
    const refreshAttendance = document.getElementById('refresh-attendance');
    if (refreshAttendance) refreshAttendance.addEventListener('click', loadAttendance);
    const refreshPayroll = document.getElementById('refresh-payroll');
    if (refreshPayroll) refreshPayroll.addEventListener('click', loadPayroll);
    const refreshAnnouncements = document.getElementById('refresh-announcements');
    if (refreshAnnouncements) refreshAnnouncements.addEventListener('click', loadAnnouncements);
}

// Helper function
function toNullableInt(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
}

function toRequiredInt(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
}

function showMessage(elementId, message, isSuccess) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = 'message ' + (isSuccess ? 'success' : 'error');
        element.style.display = 'block';
        setTimeout(() => { element.style.display = 'none'; }, 5000);
    }
}
