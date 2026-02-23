const API_GATEWAY_URL = '/api';

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
    
    loadUsers();
    loadProducts();
    loadOrders();
    loadStatistics();
    
    // Load dropdowns for order form
    populateOrderDropdowns();
});

// Load Statistics for Overview Section
async function loadStatistics() {
    try {
        // Fetch all data in parallel
        const [usersResponse, productsResponse, ordersResponse] = await Promise.all([
            fetch(`${API_GATEWAY_URL}/users`),
            fetch(`${API_GATEWAY_URL}/products`),
            fetch(`${API_GATEWAY_URL}/orders`)
        ]);

        const users = usersResponse.ok ? await usersResponse.json() : [];
        const products = productsResponse.ok ? await productsResponse.json() : [];
        const orders = ordersResponse.ok ? await ordersResponse.json() : [];

        // Update total counts
        document.getElementById('total-users').textContent = users.length;
        document.getElementById('total-products').textContent = products.length;
        document.getElementById('total-orders').textContent = orders.length;

        // Calculate total revenue (only from completed orders)
        const totalRevenue = orders
            .filter(order => order.status === 'completed')
            .reduce((sum, order) => sum + parseFloat(order.total_price), 0);
        document.getElementById('total-revenue').textContent = '$' + totalRevenue.toFixed(2);

        // Count orders by status
        const statusCounts = {
            pending: 0,
            processing: 0,
            completed: 0,
            cancelled: 0
        };

        orders.forEach(order => {
            if (statusCounts.hasOwnProperty(order.status)) {
                statusCounts[order.status]++;
            }
        });

        document.getElementById('orders-pending').textContent = statusCounts.pending;
        document.getElementById('orders-processing').textContent = statusCounts.processing;
        document.getElementById('orders-completed').textContent = statusCounts.completed;
        document.getElementById('orders-cancelled').textContent = statusCounts.cancelled;

    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Populate user and product dropdowns for order form
async function populateOrderDropdowns() {
    const userSelect = document.getElementById('order-user');
    const productSelect = document.getElementById('order-product');
    
    // Load users
    try {
        const usersResponse = await fetch(`${API_GATEWAY_URL}/users`);
        if (usersResponse.ok) {
            const users = await usersResponse.json();
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.name} (${user.email})`;
                userSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading users for dropdown:', error);
    }
    
    // Load products
    try {
        const productsResponse = await fetch(`${API_GATEWAY_URL}/products`);
        if (productsResponse.ok) {
            const products = await productsResponse.json();
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} - $${product.price}`;
                productSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading products for dropdown:', error);
    }
}

// Refresh dropdowns when users or products are updated
function refreshOrderDropdowns() {
    const userSelect = document.getElementById('order-user');
    const productSelect = document.getElementById('order-product');
    
    // Clear existing options (keep the first placeholder option)
    userSelect.innerHTML = '<option value="">-- Select User --</option>';
    productSelect.innerHTML = '<option value="">-- Select Product --</option>';
    
    // Repopulate
    populateOrderDropdowns();
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
                if (section.id === sectionId + '-section') {
                    section.classList.add('active');
                }
            });
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
        console.error('Gateway health check failed:', error);
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
    // User Form
    const userForm = document.getElementById('user-form');
    if (userForm) {
        userForm.addEventListener('submit', handleUserSubmit);
    }

    // Product Form
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }

    // Order Form
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmit);
    }
}

// User CRUD Operations
async function handleUserSubmit(e) {
    e.preventDefault();
    
    const userData = {
        name: document.getElementById('user-name').value,
        email: document.getElementById('user-email').value
    };
    
    try {
        const response = await fetch(`${API_GATEWAY_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('user-message', `User created successfully! ID: ${data.id}`, true);
            document.getElementById('user-form').reset();
            loadUsers();
            loadStatistics();
        } else {
            showMessage('user-message', `Error: ${data.error || 'Failed to create user'}`, false);
        }
    } catch (error) {
        showMessage('user-message', 'Error: Could not connect to server', false);
    }
}

async function loadUsers() {
    const usersList = document.getElementById('users-list');
    const loadingElement = document.getElementById('users-loading');
    const errorElement = document.getElementById('users-error');
    
    if (!usersList) return;
    
    loadingElement.classList.remove('hidden');
    errorElement.classList.add('hidden');
    usersList.innerHTML = '';
    
    try {
        const response = await fetch(`${API_GATEWAY_URL}/users`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        
        const users = await response.json();
        
        loadingElement.classList.add('hidden');
        
        if (users.length === 0) {
            usersList.innerHTML = '<div class="empty-message">No users found</div>';
            return;
        }
        
        usersList.innerHTML = users.map(user => `
            <div class="item-card">
                <div class="item-header">
                    <span class="item-id">User #${user.id}</span>
                    <div class="item-actions">
                        <button class="btn btn-edit" onclick="openEditModal('user', ${user.id}, {name: '${user.name}', email: '${user.email}'})">✏️ Edit</button>
                        <button class="btn btn-delete" onclick="deleteUser(${user.id})">🗑️ Delete</button>
                    </div>
                </div>
                <div class="item-detail">
                    <span>Name:</span>
                    <span>${user.name}</span>
                </div>
                <div class="item-detail">
                    <span>Email:</span>
                    <span>${user.email}</span>
                </div>
                <div class="item-detail">
                    <span>Created:</span>
                    <span>${new Date(user.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading users:', error);
        loadingElement.classList.add('hidden');
        errorElement.textContent = 'Failed to load users. Please try again.';
        errorElement.classList.remove('hidden');
    }
}

async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        const response = await fetch(`${API_GATEWAY_URL}/users/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('user-message', 'User deleted successfully!', true);
            loadUsers();
            loadStatistics();
        } else {
            const data = await response.json();
            showMessage('user-message', `Error: ${data.error || 'Failed to delete user'}`, false);
        }
    } catch (error) {
        showMessage('user-message', 'Error: Could not connect to server', false);
    }
}

// Product CRUD Operations
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const productData = {
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-price').value),
        description: document.getElementById('product-description').value || undefined
    };
    
    try {
        const response = await fetch(`${API_GATEWAY_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('product-message', `Product created successfully! ID: ${data.id}`, true);
            document.getElementById('product-form').reset();
            loadProducts();
            loadStatistics();
        } else {
            showMessage('product-message', `Error: ${data.error || 'Failed to create product'}`, false);
        }
    } catch (error) {
        showMessage('product-message', 'Error: Could not connect to server', false);
    }
}

async function loadProducts() {
    const productsList = document.getElementById('products-list');
    const loadingElement = document.getElementById('products-loading');
    const errorElement = document.getElementById('products-error');
    
    if (!productsList) return;
    
    loadingElement.classList.remove('hidden');
    errorElement.classList.add('hidden');
    productsList.innerHTML = '';
    
    try {
        const response = await fetch(`${API_GATEWAY_URL}/products`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        
        const products = await response.json();
        
        loadingElement.classList.add('hidden');
        
        if (products.length === 0) {
            productsList.innerHTML = '<div class="empty-message">No products found</div>';
            return;
        }
        
        productsList.innerHTML = products.map(product => `
            <div class="item-card">
                <div class="item-header">
                    <span class="item-id">Product #${product.id}</span>
                    <div class="item-actions">
                        <button class="btn btn-edit" onclick="openEditModal('product', ${product.id}, {name: '${product.name}', price: ${product.price}, description: '${product.description || ''}'})">✏️ Edit</button>
                        <button class="btn btn-delete" onclick="deleteProduct(${product.id})">🗑️ Delete</button>
                    </div>
                </div>
                <div class="item-detail">
                    <span>Name:</span>
                    <span>${product.name}</span>
                </div>
                <div class="item-detail">
                    <span>Price:</span>
                    <span>$${product.price}</span>
                </div>
                <div class="item-detail">
                    <span>Description:</span>
                    <span>${product.description || 'N/A'}</span>
                </div>
                <div class="item-detail">
                    <span>Created:</span>
                    <span>${new Date(product.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading products:', error);
        loadingElement.classList.add('hidden');
        errorElement.textContent = 'Failed to load products. Please try again.';
        errorElement.classList.remove('hidden');
    }
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const response = await fetch(`${API_GATEWAY_URL}/products/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('product-message', 'Product deleted successfully!', true);
            loadProducts();
            loadStatistics();
        } else {
            const data = await response.json();
            showMessage('product-message', `Error: ${data.error || 'Failed to delete product'}`, false);
        }
    } catch (error) {
        showMessage('product-message', 'Error: Could not connect to server', false);
    }
}

// Order CRUD Operations
async function handleOrderSubmit(e) {
    e.preventDefault();
    
    const orderData = {
        userId: parseInt(document.getElementById('order-user').value),
        productId: parseInt(document.getElementById('order-product').value),
        quantity: parseInt(document.getElementById('order-quantity').value)
    };
    
    try {
        const response = await fetch(`${API_GATEWAY_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('order-message', `Order placed successfully! Order ID: ${data.id}`, true);
            document.getElementById('order-form').reset();
            loadOrders();
            loadStatistics();
        } else {
            showMessage('order-message', `Error: ${data.error || 'Failed to place order'}`, false);
        }
    } catch (error) {
        showMessage('order-message', 'Error: Could not connect to server', false);
    }
}

async function loadOrders() {
    const ordersList = document.getElementById('orders-list');
    const loadingElement = document.getElementById('orders-loading');
    const errorElement = document.getElementById('orders-error');
    
    if (!ordersList) return;
    
    loadingElement.classList.remove('hidden');
    errorElement.classList.add('hidden');
    ordersList.innerHTML = '';
    
    try {
        const response = await fetch(`${API_GATEWAY_URL}/orders`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }
        
        const orders = await response.json();
        
        loadingElement.classList.add('hidden');
        
        if (orders.length === 0) {
            ordersList.innerHTML = '<div class="empty-message">No orders found</div>';
            return;
        }
        
        ordersList.innerHTML = orders.map(order => `
            <div class="item-card order-card">
                <div class="item-header">
                    <span class="item-id">Order #${order.id}</span>
                    <span class="order-status ${order.status}">${order.status}</span>
                </div>
                <div class="item-detail">
                    <span>User:</span>
                    <span>${order.user?.name || 'ID: ' + order.user_id}</span>
                </div>
                <div class="item-detail">
                    <span>Product:</span>
                    <span>${order.product?.name || 'ID: ' + order.product_id}</span>
                </div>
                <div class="item-detail">
                    <span>Quantity:</span>
                    <span>${order.quantity}</span>
                </div>
                <div class="order-total">
                    Total: $${order.total_price}
                </div>
                <div class="item-detail">
                    <span>Date:</span>
                    <span>${new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div class="item-actions" style="margin-top: 10px;">
                    <button class="btn btn-edit" onclick="openEditModal('order', ${order.id}, {quantity: ${order.quantity}, status: '${order.status}'})">✏️ Edit</button>
                    <button class="btn btn-delete" onclick="deleteOrder(${order.id})">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading orders:', error);
        loadingElement.classList.add('hidden');
        errorElement.textContent = 'Failed to load orders. Please try again.';
        errorElement.classList.remove('hidden');
    }
}

async function deleteOrder(id) {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    try {
        const response = await fetch(`${API_GATEWAY_URL}/orders/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('order-message', 'Order deleted successfully!', true);
            loadOrders();
            loadStatistics();
        } else {
            const data = await response.json();
            showMessage('order-message', `Error: ${data.error || 'Failed to delete order'}`, false);
        }
    } catch (error) {
        showMessage('order-message', 'Error: Could not connect to server', false);
    }
}

// Modal Functions
function initModal() {
    const modal = document.getElementById('edit-modal');
    const closeBtn = document.getElementById('modal-close');
    const cancelBtn = document.getElementById('modal-cancel');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    const editForm = document.getElementById('edit-form');
    if (editForm) {
        editForm.addEventListener('submit', handleEditSubmit);
    }
}

function openEditModal(type, id, data) {
    currentEditType = type;
    currentEditId = id;
    
    const modal = document.getElementById('edit-modal');
    const title = document.getElementById('modal-title');
    const fieldsContainer = document.getElementById('edit-form-fields');
    
    let fieldsHtml = '';
    
    if (type === 'user') {
        title.textContent = 'Edit User';
        fieldsHtml = `
            <div class="form-group">
                <label for="edit-name">Name:</label>
                <input type="text" id="edit-name" value="${data.name}" required>
            </div>
            <div class="form-group">
                <label for="edit-email">Email:</label>
                <input type="email" id="edit-email" value="${data.email}" required>
            </div>
        `;
    } else if (type === 'product') {
        title.textContent = 'Edit Product';
        fieldsHtml = `
            <div class="form-group">
                <label for="edit-name">Name:</label>
                <input type="text" id="edit-name" value="${data.name}" required>
            </div>
            <div class="form-group">
                <label for="edit-price">Price ($):</label>
                <input type="number" id="edit-price" step="0.01" min="0.01" value="${data.price}" required>
            </div>
            <div class="form-group">
                <label for="edit-description">Description:</label>
                <input type="text" id="edit-description" value="${data.description || ''}">
            </div>
        `;
    } else if (type === 'order') {
        title.textContent = 'Edit Order';
        fieldsHtml = `
            <div class="form-group">
                <label for="edit-quantity">Quantity:</label>
                <input type="number" id="edit-quantity" min="1" value="${data.quantity}" required>
            </div>
            <div class="form-group">
                <label for="edit-status">Status:</label>
                <select id="edit-status" required style="width:100%;padding:12px 15px;border:2px solid #e1e1e1;border-radius:10px;font-size:1rem;">
                    <option value="pending" ${data.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="processing" ${data.status === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="completed" ${data.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${data.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>
        `;
    }
    
    fieldsContainer.innerHTML = fieldsHtml;
    modal.classList.remove('hidden');
}

function closeModal() {
    const modal = document.getElementById('edit-modal');
    modal.classList.add('hidden');
    currentEditType = '';
    currentEditId = null;
}

async function handleEditSubmit(e) {
    e.preventDefault();
    
    let url = '';
    let data = {};
    
    if (currentEditType === 'user') {
        url = `${API_GATEWAY_URL}/users/${currentEditId}`;
        data = {
            name: document.getElementById('edit-name').value,
            email: document.getElementById('edit-email').value
        };
    } else if (currentEditType === 'product') {
        url = `${API_GATEWAY_URL}/products/${currentEditId}`;
        data = {
            name: document.getElementById('edit-name').value,
            price: parseFloat(document.getElementById('edit-price').value),
            description: document.getElementById('edit-description').value || undefined
        };
    } else if (currentEditType === 'order') {
        url = `${API_GATEWAY_URL}/orders/${currentEditId}`;
        data = {
            quantity: parseInt(document.getElementById('edit-quantity').value),
            status: document.getElementById('edit-status').value
        };
    }
    
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeModal();
            if (currentEditType === 'user') {
                showMessage('user-message', 'Updated successfully!', true);
                loadUsers();
            } else if (currentEditType === 'product') {
                showMessage('product-message', 'Updated successfully!', true);
                loadProducts();
            } else if (currentEditType === 'order') {
                showMessage('order-message', 'Updated successfully!', true);
                loadOrders();
            }
            loadStatistics();
        } else {
            const result = await response.json();
            alert('Error: ' + (result.error || 'Failed to update'));
        }
    } catch (error) {
        alert('Error: Could not connect to server');
    }
}

// Refresh Buttons
function initRefreshButtons() {
    const refreshUsers = document.getElementById('refresh-users');
    if (refreshUsers) {
        refreshUsers.addEventListener('click', () => {
            loadUsers();
            loadStatistics();
        });
    }

    const refreshProducts = document.getElementById('refresh-products');
    if (refreshProducts) {
        refreshProducts.addEventListener('click', () => {
            loadProducts();
            loadStatistics();
        });
    }

    const refreshOrders = document.getElementById('refresh-orders');
    if (refreshOrders) {
        refreshOrders.addEventListener('click', () => {
            loadOrders();
            loadStatistics();
        });
    }
}

// Helper function to show messages
function showMessage(elementId, message, isSuccess) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = 'message ' + (isSuccess ? 'success' : 'error');
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}
