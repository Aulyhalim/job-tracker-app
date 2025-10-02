// --- GLOBAL STATE ---
const API_BASE_URL = 'https://job-tracker-app-production.up.railway.app'; 
let currentUser = null;
let applications = []; // Data ini sekarang akan diambil dari server
let settings = {};
let editingId = null;
let currentPage = 'dashboard';
let charts = {};
const defaultSettings = { darkMode: false };

// --- BARU: FUNGSI UNTUK MENAMPILKAN TOAST NOTIFICATION ---
function showToast(message, type = 'success', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fas fa-check-circle';
    if (type === 'error') iconClass = 'fas fa-times-circle';
    if (type === 'info') iconClass = 'fas fa-info-circle';
    
    toast.innerHTML = `<i class="toast-icon ${iconClass}"></i> ${message}`;
    
    container.appendChild(toast);

    // Hapus toast setelah durasi tertentu
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s ease forwards';
        setTimeout(() => toast.remove(), 500);
    }, duration);
}


// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    const loggedInUser = sessionStorage.getItem('jobTrackerCurrentUser');
    if (loggedInUser) {
        currentUser = loggedInUser;
        showMainApp();
    } else {
        showAuthPage();
    }
    setupAuthEventListeners();
}

// --- AUTHENTICATION ---
function setupAuthEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Logika Show/Hide Password
    document.querySelectorAll('.password-toggle').forEach(icon => {
        icon.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    });
}

function showAuthPage() {
    document.getElementById('authPage').classList.remove('hidden');
    document.querySelector('.app-wrapper').classList.add('hidden');
    showLoginForm();
}

async function showMainApp() {
    document.getElementById('authPage').classList.add('hidden');
    document.querySelector('.app-wrapper').classList.remove('hidden');
    setupAppEventListeners();
    settings = defaultSettings; 
    applyTheme();
    setTodayDate();
    updateHeader();
    await fetchApplications(); // Ambil data aplikasi dari server
    renderCurrentPage(); 
    setTimeout(initializeCharts, 100);
}

function showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginError').textContent = '';
}

function showRegisterForm() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    document.getElementById('registerError').textContent = '';
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        if (!response.ok) { throw new Error(data.error || 'Login failed'); }
        
        currentUser = data.user.username;
        sessionStorage.setItem('jobTrackerCurrentUser', data.user.username);
        sessionStorage.setItem('jobTrackerUserId', data.user.id);
        
        showMainApp();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const email = document.getElementById('registerEmail').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, email }),
        });
        const data = await response.json();
        if (!response.ok) { throw new Error(data.error || 'Registration failed'); }
        showToast('Registration successful! Please log in.', 'success');
        showLoginForm();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function handleLogout() {
    currentUser = null;
    sessionStorage.clear();
    applications = [];
    if (charts.trend) charts.trend.destroy();
    if (charts.status) charts.status.destroy();
    charts = {};
    showAuthPage();
}

function updateHeader() {
    if (!currentUser) return;
    document.getElementById('userName').textContent = currentUser;
    document.getElementById('userAvatar').textContent = currentUser.charAt(0);
}

async function fetchApplications() {
    const userId = sessionStorage.getItem('jobTrackerUserId');
    if (!userId) {
        console.error("User ID not found, cannot fetch applications.");
        applications = [];
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/api/applications/user/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch data.");
        const data = await response.json();
        applications = data;
    } catch (error) {
        console.error(error);
        applications = [];
    }
}

function setupAppEventListeners() {
    document.getElementById('applicationForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('searchInput').addEventListener('input', debounce(renderApplications, 300));
    document.getElementById('statusFilter').addEventListener('change', renderApplications);
    document.getElementById('sortBy').addEventListener('change', renderApplications);
    document.getElementById('status').addEventListener('change', toggleInterviewDateInput);
    
    // BARU: Event listener untuk form profil
    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
}

function toggleInterviewDateInput() {
    const isInterview = document.getElementById('status').value === 'interview';
    document.getElementById('interviewDateRow').style.display = isInterview ? 'flex' : 'none';
    document.getElementById('interviewDate').required = isInterview;
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId)?.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.page === pageId));
    document.getElementById('pageTitle').textContent = pageId.charAt(0).toUpperCase() + pageId.slice(1);
    currentPage = pageId;
    renderCurrentPage();
    if (window.innerWidth <= 1024) {
        document.getElementById('sidebar').classList.remove('active');
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
    if (window.innerWidth > 1024) {
        document.getElementById('mainContent').classList.toggle('shifted', sidebar.classList.contains('active'));
    }
}

function toggleTheme() {
    settings.darkMode = !settings.darkMode;
    applyTheme();
}

function applyTheme() {
    document.body.className = settings.darkMode ? 'dark' : '';
    document.getElementById('themeIcon').className = settings.darkMode ? 'fas fa-sun' : 'fas fa-moon';
    document.getElementById('darkModeToggle')?.classList.toggle('active', settings.darkMode);
    if (Object.keys(charts).length > 0) {
        setTimeout(() => {
            if (charts.trend) charts.trend.destroy();
            if (charts.status) charts.status.destroy();
            initializeCharts();
        }, 100);
    }
}

function openModal(id = null) {
    editingId = id;
    const form = document.getElementById('applicationForm');
    form.reset();
    
    if (id) {
        document.getElementById('modalTitle').textContent = 'Edit Application';
        const app = applications.find(app => app.id == id);
        if (app) {
            document.getElementById('companyName').value = app.company;
            document.getElementById('position').value = app.position;
            document.getElementById('applicationDate').value = app.applicationDate.split('T')[0];
            document.getElementById('status').value = app.status;
            document.getElementById('notes').value = app.notes || '';
            document.getElementById('expectedSalary').value = app.expectedSalary || '';
            document.getElementById('source').value = app.source || 'LinkedIn';
            const isInterview = app.status === 'interview';
            document.getElementById('interviewDateRow').style.display = isInterview ? 'flex' : 'none';
            document.getElementById('interviewDate').required = isInterview;
            document.getElementById('interviewDate').value = app.interviewDate ? app.interviewDate.split('T')[0] : '';
        }
    } else {
        document.getElementById('modalTitle').textContent = 'Add New Application';
        setTodayDate();
        document.getElementById('interviewDateRow').style.display = 'none'; 
        document.getElementById('interviewDate').required = false; 
    }
    document.getElementById('applicationModal').classList.add('active');
}

function closeModal() {
    document.getElementById('applicationModal').classList.remove('active');
    editingId = null;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const userId = sessionStorage.getItem('jobTrackerUserId');
    const applicationData = {
        company: document.getElementById('companyName').value,
        position: document.getElementById('position').value,
        applicationDate: document.getElementById('applicationDate').value,
        status: document.getElementById('status').value,
        notes: document.getElementById('notes').value,
        userId: parseInt(userId),
        expectedSalary: document.getElementById('expectedSalary').value,
        source: document.getElementById('source').value,
        interviewDate: document.getElementById('interviewDate').value || null 
    };

    let url = `${API_BASE_URL}/api/applications`;
    let method = 'POST';

    if (editingId) {
        url += `/${editingId}`;
        method = 'PUT';
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(applicationData)
        });
        if (!response.ok) throw new Error("Failed to save application.");
        
        await fetchApplications();
        
        renderDashboard();       
        renderApplications();    
        renderCompanies();       
        renderCalendar();        
        renderAnalytics();       

        showPage(currentPage);
        closeModal();
        showToast(editingId ? 'Application updated!' : 'Application added!', 'success');
    } catch (error) {
        showToast("Error saving application.", 'error');
    }
}

// --- BARU: LOGIKA UNTUK HALAMAN PROFIL ---
async function populateProfileForm() {
    const userId = sessionStorage.getItem('jobTrackerUserId');
    if (!userId) {
        showToast("User not found, please log in again.", 'error');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/api/user/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch profile data.');
        
        const user = await response.json();
        document.getElementById('profileUsername').value = user.username;
        document.getElementById('profileEmail').value = user.email;

        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';

    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const userId = sessionStorage.getItem('jobTrackerUserId');
    
    const username = document.getElementById('profileUsername').value;
    const email = document.getElementById('profileEmail').value;
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!currentPassword) {
        showToast('Current password is required to save changes.', 'error');
        return;
    }
    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match.', 'error');
        return;
    }
    
    const updateData = { username, email, currentPassword };
    if (newPassword) {
        updateData.newPassword = newPassword;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/user/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        const result = await response.json();
        if (!response.ok) { throw new Error(result.error || 'Failed to update profile.'); }
        
        showToast('Profile updated successfully!', 'success');
        
        sessionStorage.setItem('jobTrackerCurrentUser', result.username);
        currentUser = result.username;
        updateHeader();
        
        showPage('settings');
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// --- FUNGSI RENDER HALAMAN ---
function renderCompanies() {
    const page = document.getElementById('companiesGrid');
    if (!page) return;
    
    if (applications.length === 0) {
        page.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><div class="empty-icon"><i class="fas fa-building"></i></div><h3 class="empty-title">No Companies Tracked</h3><p class="empty-description">Add an application to see companies listed here.</p></div>`;
        return;
    }

    const companyMap = applications.reduce((acc, app) => {
        acc[app.company] = (acc[app.company] || 0) + 1;
        return acc;
    }, {});

    let html = '<div class="applications-grid">';
    for (const company in companyMap) {
        html += `
            <div class="application-card">
                <div class="company-name">${company}</div>
                <div class="position">${companyMap[company]} Applications Tracked</div>
                <button class="btn btn-sm btn-outline" onclick="document.getElementById('searchInput').value='${company}'; showPage('applications')"><i class="fas fa-search"></i> View Applications</button>
            </div>
        `;
    }
    html += '</div>';
    page.innerHTML = html;
}

function renderAnalytics() {
    const page = document.getElementById('analyticsGrid');
    if (!page) return;
    
    const validSalaries = applications
        .map(app => parseFloat(app.expectedSalary))
        .filter(salary => !isNaN(salary) && salary > 0);

    const avgSalary = validSalaries.length > 0 
        ? (validSalaries.reduce((sum, sal) => sum + sal, 0) / validSalaries.length) 
        : 0;

    const formattedAvgSalary = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(avgSalary);

    page.innerHTML = `
        <div class="dashboard-grid">
            <div class="stat-card info">
                <div class="stat-icon info"><i class="fas fa-money-bill-wave"></i></div>
                <div class="stat-number">${formattedAvgSalary}</div>
                <div class="stat-label">Avg. Expected Salary</div>
            </div>
        </div>
    `;
}

function renderCalendar() {
    const page = document.getElementById('calendarGrid');
    if (!page) return;

    const interviewApps = applications
        .filter(app => app.status === 'interview' && app.interviewDate)
        .sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate));
    
    if (interviewApps.length === 0) {
         page.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fas fa-calendar-alt"></i></div><h3 class="empty-title">No Interviews Scheduled</h3><p class="empty-description">Update an application status to 'Interview' and add a date to see it here.</p></div>`;
         return;
    }

    let html = '<h3>Upcoming Interviews</h3><ul class="interview-list" style="list-style: none; padding-left: 0;">';
    interviewApps.forEach(app => {
        const date = app.interviewDate ? formatDate(app.interviewDate) : 'Date TBD'; 
        html += `<li style="padding: 10px 0; border-bottom: 1px dashed var(--border-light);"><strong>${app.company}</strong> (${app.position}) - ${date}</li>`;
    });
    html += '</ul>';
    page.innerHTML = html;
}

function setTodayDate() {
    document.getElementById('applicationDate').valueAsDate = new Date();
}

function renderCurrentPage() {
    switch (currentPage) {
        case 'dashboard': renderDashboard(); break;
        case 'applications': renderApplications(); break;
        case 'analytics': renderAnalytics(); break;
        case 'calendar': renderCalendar(); break;
        case 'companies': renderCompanies(); break;
        case 'profile': populateProfileForm(); break; // BARU: Panggil fungsi render profil
        default:
            const page = document.getElementById(currentPage);
            if (page && !page.innerHTML) {
                page.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fas fa-tools"></i></div><h3 class="empty-title">Page Under Construction</h3></div>`;
            }
            break;
    }
}

function renderDashboard() {
    renderDashboardStats();
    if (charts.trend) updateChart(); else initializeTrendChart();
    if (charts.status) updateStatusChart(); else initializeStatusChart();
}

function renderDashboardStats() {
    const stats = calculateStats();
    const container = document.getElementById('dashboardStats');
    if (!container) return;
    container.innerHTML = `<div class="stat-card"><div class="stat-icon primary"><i class="fas fa-clipboard-list"></i></div><div class="stat-number">${stats.total}</div><div class="stat-label">Total Applications</div></div><div class="stat-card success"><div class="stat-icon success"><i class="fas fa-check-circle"></i></div><div class="stat-number">${stats.accepted}</div><div class="stat-label">Accepted</div></div><div class="stat-card warning"><div class="stat-icon warning"><i class="fas fa-users"></i></div><div class="stat-number">${stats.interview}</div><div class="stat-label">Interviews</div></div><div class="stat-card danger"><div class="stat-icon danger"><i class="fas fa-times-circle"></i></div><div class="stat-number">${stats.rejected}</div><div class="stat-label">Rejected</div></div>`;
}

function renderApplications() {
    const grid = document.getElementById('applicationsGrid');
    if (!grid) return;
    const filteredApps = getFilteredApplications();
    if (filteredApps.length === 0) {
        grid.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><div class="empty-icon"><i class="fas fa-folder-open"></i></div><h3 class="empty-title">No Applications Found</h3><p class="empty-description">Add your first application to get started!</p></div>`;
        return;
    }
    grid.innerHTML = filteredApps.map(app => {
        const salaryInfo = app.expectedSalary ? `<div class="detail-row" title="Expected Salary"><i class="fas fa-money-bill-wave"></i> ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(parseFloat(app.expectedSalary))}</div>` : '';
        const sourceInfo = app.source ? `<div class="detail-row" title="Source"><i class="fas fa-link"></i> Source: ${app.source}</div>` : '';
        const interviewInfo = app.status === 'interview' && app.interviewDate ? `<div class="detail-row" title="Interview Date"><i class="fas fa-calendar-alt"></i> Interview: ${formatDate(app.interviewDate)}</div>` : '';
        
        return `<div class="application-card status-${app.status} animate__animated animate__fadeInUp">
            <div class="application-header">
                <div class="company-info">
                    <div class="company-name">${app.company}</div>
                    <div class="position">${app.position}</div>
                </div>
                <div class="application-actions">
                    <button class="btn-sm btn-edit" onclick="openModal('${app.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-sm btn-delete" onclick="deleteApplication('${app.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="detail-row"><i class="fas fa-calendar"></i> Applied: ${formatDate(app.applicationDate)}</div>
            ${interviewInfo}
            ${salaryInfo}
            ${sourceInfo}
            <span class="status-badge status-${app.status}"><i class="fas fa-${getStatusIcon(app.status)}"></i> ${getStatusLabel(app.status)}</span>
            ${app.notes ? `<div class="notes">${app.notes.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>` : ''}
        </div>`;
    }).join('');
}

function calculateStats() {
    const initialStats = { total: 0, applied: 0, interview: 0, accepted: 0, rejected: 0 };
    return applications.reduce((stats, app) => {
        stats.total++;
        if (stats.hasOwnProperty(app.status)) { stats[app.status]++; }
        return stats;
    }, initialStats);
}

function getFilteredApplications() {
    let filtered = [...applications];
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const sortBy = document.getElementById('sortBy')?.value || 'date-desc';
    if (searchTerm) filtered = filtered.filter(app => app.company.toLowerCase().includes(searchTerm) || app.position.toLowerCase().includes(searchTerm) || (app.notes && app.notes.toLowerCase().includes(searchTerm)));
    if (statusFilter) filtered = filtered.filter(app => app.status === statusFilter);
    return filtered.sort((a, b) => {
        if (sortBy === 'date-asc') return new Date(a.applicationDate) - new Date(b.applicationDate);
        if (sortBy === 'company') return a.company.localeCompare(b.company);
        return new Date(b.applicationDate) - new Date(a.applicationDate);
    });
}

async function deleteApplication(id) {
    if (confirm('Are you sure you want to delete this application?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/applications/${id}`, { method: 'DELETE' });
            if (!response.ok && response.status !== 204) throw new Error("Failed to delete.");
            await fetchApplications();
            
            renderDashboard();       
            renderApplications();    
            renderCompanies();       
            renderCalendar();        
            renderAnalytics();       

            renderCurrentPage();
            showToast('Application deleted.', 'info');
        } catch (error) {
            showToast("Error deleting application.", 'error');
        }
    }
}

async function clearAllData() {
    if (confirm('DANGER! This will permanently delete all applications for your account. Are you sure?')) {
        const userId = sessionStorage.getItem('jobTrackerUserId');
        try {
            const response = await fetch(`${API_BASE_URL}/api/applications/user/${userId}`, { method: 'DELETE' });
            if (!response.ok && response.status !== 204) throw new Error("Failed to clear data.");
            await fetchApplications();
            
            renderDashboard();       
            renderApplications();    
            renderCompanies();       
            renderCalendar();        
            renderAnalytics();       

            renderCurrentPage();
            showToast('All data has been cleared!', 'success');
        } catch (error) {
            showToast("Error clearing data.", 'error');
        }
    }
}

function initializeCharts() { if (document.getElementById('trendChart')) initializeTrendChart(); if (document.getElementById('statusChart')) initializeStatusChart(); }
function initializeTrendChart() { const ctx = document.getElementById('trendChart').getContext('2d'); const chartData = getTrendData(30); charts.trend = new Chart(ctx, { type: 'line', data: { labels: chartData.labels, datasets: [{ label: 'Applications', data: chartData.data, borderColor: '#3b82f6', tension: 0.4, fill: true, backgroundColor: 'rgba(59, 130, 246, 0.1)' }] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: settings.darkMode ? '#94a3b8' : '#64748b' }, grid: { color: settings.darkMode ? '#334155' : '#e2e8f0' } }, y: { ticks: { color: settings.darkMode ? '#94a3b8' : '#64748b' }, grid: { color: settings.darkMode ? '#334155' : '#e2e8f0' } } }, plugins: { legend: { labels: { color: settings.darkMode ? '#f1f5f9' : '#0f172a' } } } } }); }
function initializeStatusChart() { const ctx = document.getElementById('statusChart').getContext('2d'); const chartData = getStatusData(); charts.status = new Chart(ctx, { type: 'doughnut', data: { labels: chartData.labels, datasets: [{ data: chartData.data, backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: settings.darkMode ? '#f1f5f9' : '#0f172a', padding: 20 } } } } }); }
function updateChart() { if (!charts.trend) return; const period = parseInt(document.getElementById('chartPeriod')?.value || '30'); const chartData = getTrendData(period); charts.trend.data.labels = chartData.labels; charts.trend.data.datasets[0].data = chartData.data; charts.trend.update(); }
function updateStatusChart() { if (!charts.status) return; const chartData = getStatusData(); charts.status.data.datasets[0].data = chartData.data; charts.status.update(); }
function getTrendData(days) { const labels = Array.from({ length: days }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d; }).reverse(); const data = labels.map(date => { const dateStr = date.toISOString().split('T')[0]; return applications.filter(app => app.applicationDate.startsWith(dateStr)).length; }); return { labels: labels.map(d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })), data }; }
function getStatusData() { const stats = calculateStats(); return { labels: ['Applied', 'Interview', 'Accepted', 'Rejected'], data: [stats.applied, stats.interview, stats.accepted, stats.rejected] }; }
function exportData() { 
    if (applications.length === 0) {
        showToast('No data to export.', 'info');
        return;
    }
    const jsonData = JSON.stringify({ applications, exportDate: new Date().toISOString() }, null, 2); 
    const blob = new Blob([jsonData], { type: 'application/json' }); 
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(blob); 
    a.download = `job_applications_${currentUser}_${new Date().toISOString().split('T')[0]}.json`; 
    a.click(); 
    URL.revokeObjectURL(a.href); 
}
function formatDate(d) { try { return new Date(d).toLocaleDateString('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }); } catch (e) { return 'Invalid Date'; } }
function getStatusLabel(s) { return { applied: 'Applied', interview: 'Interview', accepted: 'Accepted', rejected: 'Rejected' }[s] || 'N/A'; }
function getStatusIcon(s) { return { applied: 'paper-plane', interview: 'users', accepted: 'check-circle', rejected: 'times-circle' }[s] || 'circle'; }
function debounce(func, wait) { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); }; }