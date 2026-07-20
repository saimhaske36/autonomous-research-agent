// API Base Config
const BASE_URL = "/api/v1";

// Admin Portal State
const state = {
    currentView: "dashboard",
    activeJobId: null
};

// CUSTOM ADMIN FETCH WRAPPER
async function adminFetch(url, options = {}) {
    const token = localStorage.getItem("admin_auth_token");
    if (!options.headers) {
        options.headers = {};
    }
    if (token) {
        options.headers["Authorization"] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(url, options);
        if (response.status === 401 || response.status === 403) {
            handleLogout();
            throw new Error("Admin authorization expired or denied.");
        }
        return response;
    } catch (err) {
        console.error("Admin Fetch API error:", err);
        throw err;
    }
}

// INITIALIZE PORTAL
document.addEventListener("DOMContentLoaded", () => {
    initRouter();
    initEventListeners();
    checkAuthState();
});

// ROUTING
function initRouter() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const view = item.getAttribute("data-view");
            loadView(view);
        });
    });
}

function checkAuthState() {
    const token = localStorage.getItem("admin_auth_token");
    const loginScreen = document.getElementById("admin-login-screen");
    const appContainer = document.querySelector(".app-container");
    
    if (token && (token === "admin-secret-token" || token.split('.').length === 3)) {
        loginScreen.classList.add("hidden");
        appContainer.classList.remove("hidden");
        
        lucide.createIcons();
        loadView("dashboard");
    } else {
        loginScreen.classList.remove("hidden");
        appContainer.classList.add("hidden");
        lucide.createIcons();
    }
}

function loadView(viewName) {
    if (!localStorage.getItem("admin_auth_token")) {
        checkAuthState();
        return;
    }

    state.currentView = viewName;

    // Toggle Active Nav
    document.querySelectorAll(".nav-item").forEach(item => {
        if (item.getAttribute("data-view") === viewName) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Toggle Panels
    document.querySelectorAll(".view-section").forEach(sec => {
        sec.classList.remove("active");
    });
    
    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
        targetSection.classList.add("active");
    }

    // Set View Title
    const titleText = viewName.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    document.getElementById("current-view-title").innerText = viewName === "dashboard" ? "Master Stats" : titleText;

    switch (viewName) {
        case "dashboard":
            loadDashboard();
            break;
        case "audit":
            loadAdminAudit();
            break;
        case "settings":
            clearAdminProfileForm();
            break;
    }
}

// EVENT LISTENERS
function initEventListeners() {
    // Admin Login button
    document.getElementById("admin-login-btn").addEventListener("click", () => {
        handleLogin();
    });

    document.getElementById("admin-password").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleLogin();
        }
    });

    // Logout
    document.getElementById("admin-logout-btn").addEventListener("click", (e) => {
        e.preventDefault();
        handleLogout();
    });

    // Back link in report viewer
    document.getElementById("report-back-btn").addEventListener("click", (e) => {
        e.preventDefault();
        loadView("audit");
    });

    // Download report
    document.getElementById("report-download-pdf-btn").addEventListener("click", () => {
        if (state.activeJobId) {
            downloadPDF(state.activeJobId);
        }
    });

    // Back to Users list in Audit tab
    document.getElementById("audit-back-to-users-btn").addEventListener("click", () => {
        document.getElementById("audit-jobs-panel").classList.add("hidden");
        document.getElementById("audit-users-panel").classList.remove("hidden");
    });

    // Tab switcher in report modal
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

            btn.classList.add("active");
            const tabName = btn.getAttribute("data-tab");
            document.getElementById(`tab-pane-${tabName}`).classList.add("active");
        });
    });
}

// LOGIN LOGIC
async function handleLogin() {
    const usernameEl = document.getElementById("admin-username");
    const passwordEl = document.getElementById("admin-password");
    const errorEl = document.getElementById("admin-login-error-msg");

    const username = usernameEl.value.trim();
    const password = passwordEl.value;

    if (!username || !password) {
        showLoginError("Email address and password are required.");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
        showLoginError("Please enter a valid email address.");
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, portal: "admin" })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.token) {
                localStorage.setItem("admin_auth_token", data.token);
                errorEl.classList.add("hidden");
                usernameEl.value = "";
                passwordEl.value = "";
                checkAuthState();
            } else {
                showLoginError("Access Denied: Non-administrative profile.");
            }
        } else {
            const errData = await response.json().catch(() => ({}));
            showLoginError(errData.detail || "Invalid administrative credentials.");
        }
    } catch (err) {
        console.error("Login connection error:", err);
        showLoginError("Error connecting to authorization backend.");
    }
}

function showLoginError(msg) {
    const errorEl = document.getElementById("admin-login-error-msg");
    errorEl.innerText = msg;
    errorEl.classList.remove("hidden");
}

function handleLogout() {
    localStorage.removeItem("admin_auth_token");
    state.activeJobId = null;
    checkAuthState();
}

// DASHBOARD STATE LOAD
async function loadDashboard() {
    document.getElementById("stat-total-jobs").innerHTML = `<span class="skeleton-placeholder skeleton-line" style="width: 40px; height: 30px; margin: 0;"></span>`;
    document.getElementById("stat-total-sources").innerHTML = `<span class="skeleton-placeholder skeleton-line" style="width: 40px; height: 30px; margin: 0;"></span>`;
    document.getElementById("stat-total-findings").innerHTML = `<span class="skeleton-placeholder skeleton-line" style="width: 40px; height: 30px; margin: 0;"></span>`;

    try {
        const response = await adminFetch(`${BASE_URL}/research/stats`);
        const stats = await response.json();
        
        document.getElementById("stat-total-jobs").innerText = stats.total_jobs || 0;
        document.getElementById("stat-total-sources").innerText = stats.total_sources || 0;
        document.getElementById("stat-total-findings").innerText = stats.total_findings || 0;
    } catch (err) {
        console.error("Error loading master statistics:", err);
    }
}

// LOAD AUDIT USER RECORDS
async function loadAdminAudit() {
    // Reset view panels to show users list first
    document.getElementById("audit-jobs-panel").classList.add("hidden");
    document.getElementById("audit-users-panel").classList.remove("hidden");
    document.getElementById("legacy-jobs-banner").classList.add("hidden");

    const tbody = document.getElementById("audit-users-tbody");
    tbody.innerHTML = `
        <tr>
            <td><div class="skeleton-placeholder skeleton-line"></div></td>
            <td><div class="skeleton-placeholder skeleton-line"></div></td>
            <td><div class="skeleton-placeholder skeleton-line"></div></td>
            <td><div class="skeleton-placeholder skeleton-line"></div></td>
        </tr>
    `;

    try {
        // Fetch legacy/guest jobs from full list to populate banner
        const jobsResponse = await adminFetch(`${BASE_URL}/research`);
        const jobs = await jobsResponse.json();
        
        const legacyJobs = jobs.filter(job => !job.user_id || job.user_id === "admin");
        if (legacyJobs.length > 0) {
            document.getElementById("legacy-jobs-count-text").innerText = `There are ${legacyJobs.length} legacy / guest research runs logged under system fallback.`;
            document.getElementById("legacy-jobs-banner").classList.remove("hidden");
        }

        const response = await adminFetch(`${BASE_URL}/auth/users`);
        const users = await response.json();
        
        tbody.innerHTML = "";
        if (!users || users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No users found in database.</td></tr>`;
            lucide.createIcons();
            return;
        }

        users.forEach(u => {
            const row = document.createElement("tr");
            const formattedDate = u.created_at ? new Date(u.created_at).toLocaleDateString() : "N/A (System)";
            const pwdHashTrunc = u.password_hash ? u.password_hash.substring(0, 12) + "..." : "N/A";
            
            const statusBadge = u.is_blocked 
                ? `<span class="badge" style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">Suspended</span>` 
                : `<span class="badge" style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); color: #22c55e; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">Active</span>`;
            
            const toggleText = u.is_blocked ? "Unsuspend" : "Suspend";
            const toggleIcon = u.is_blocked ? "unlock" : "lock";
            const toggleStyle = u.is_blocked 
                ? "background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff;"
                : "background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: #f59e0b;";
            
            row.innerHTML = `
                <td><strong>${escapeHtml(u.username)}</strong></td>
                <td><code title="${escapeHtml(u.password_hash)}" style="cursor: help;">${escapeHtml(pwdHashTrunc)}</code></td>
                <td>${statusBadge}</td>
                <td><code>${formattedDate}</code></td>
                <td><span class="badge badge-indigo">${u.job_count} Jobs</span></td>
                <td>
                    <div style="display: flex; gap: 0.4rem; align-items: center;">
                        <button class="btn btn-primary btn-sm" onclick="inspectUserJobs('${u.id}', '${escapeHtml(u.username)}')">
                            <i data-lucide="eye" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"></i>
                            <span>Audit</span>
                        </button>
                        <button class="btn btn-sm" style="${toggleStyle} padding: 0.35rem 0.65rem;" onclick="toggleBlockUser('${u.id}', ${u.is_blocked})">
                            <i data-lucide="${toggleIcon}" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"></i>
                            <span>${toggleText}</span>
                        </button>
                        <button class="btn btn-sm" style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; padding: 0.35rem 0.65rem;" onclick="deleteUser('${u.id}', '${escapeHtml(u.username)}')">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"></i>
                            <span>Remove</span>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        lucide.createIcons();
    } catch (err) {
        console.error("Error loading admin audit users:", err);
    }
}

// DRILL DOWN INSPECT USER JOBS
async function inspectUserJobs(userId, username) {
    document.getElementById("audit-users-panel").classList.add("hidden");
    document.getElementById("audit-jobs-panel").classList.remove("hidden");
    
    document.getElementById("audit-jobs-title").innerText = `Auditing: ${username}`;

    const tbody = document.getElementById("audit-jobs-tbody");
    tbody.innerHTML = `
        <tr>
            <td><div class="skeleton-placeholder skeleton-line"></div></td>
            <td><div class="skeleton-placeholder skeleton-line"></div></td>
            <td><div class="skeleton-placeholder skeleton-line"></div></td>
            <td><div class="skeleton-placeholder skeleton-line"></div></td>
            <td><div class="skeleton-placeholder skeleton-line"></div></td>
            <td><div class="skeleton-placeholder skeleton-line"></div></td>
        </tr>
    `;

    try {
        const response = await adminFetch(`${BASE_URL}/research`);
        const jobs = await response.json();
        
        tbody.innerHTML = "";
        
        // Filter jobs matching select user profile
        const userJobs = jobs.filter(job => {
            if (userId === "admin") {
                return !job.user_id || job.user_id === "admin";
            }
            return job.user_id === userId;
        });

        if (!userJobs || userJobs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No research runs logged for this account.</td></tr>`;
            return;
        }

        userJobs.forEach(job => {
            const row = document.createElement("tr");
            const badgeClass = getStatusBadgeClass(job.status);
            const statusLabel = formatStatusText(job.status);

            row.innerHTML = `
                <td><code>${job.id.substring(0, 8)}...</code></td>
                <td><strong>${escapeHtml(job.topic)}</strong></td>
                <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
                <td>${job.source_count || 0}</td>
                <td>${job.finding_count || 0}</td>
                <td>
                    <div style="display:flex;gap:0.5rem;">
                        <button class="btn btn-primary btn-sm" onclick="openReport('${job.id}')">
                            <i data-lucide="file-text" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"></i>
                            <span>View</span>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="confirmDeleteJob('${job.id}', '${userId}', '${escapeHtml(username)}')">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"></i>
                            <span>Delete</span>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        lucide.createIcons();
    } catch (err) {
        console.error("Error inspecting user jobs:", err);
    }
}

// MASTER DETAIL REPORT VIEWER
async function openReport(jobId) {
    state.activeJobId = jobId;
    
    // Toggle active report panel
    document.querySelectorAll(".view-section").forEach(sec => sec.classList.remove("active"));
    document.getElementById("view-report").classList.add("active");

    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    document.querySelector('[data-tab="summary"]').classList.add("active");
    document.getElementById("tab-pane-summary").classList.add("active");

    document.getElementById("report-summary-text").innerHTML = `
        <div class="skeleton-placeholder skeleton-line"></div>
        <div class="skeleton-placeholder skeleton-line"></div>
        <div class="skeleton-placeholder skeleton-line short"></div>
    `;
    document.getElementById("report-trends-list").innerHTML = `<li><div class="skeleton-placeholder skeleton-line short" style="margin: 0;"></div></li>`;
    document.getElementById("report-opportunities-list").innerHTML = `<li><div class="skeleton-placeholder skeleton-line short" style="margin: 0;"></div></li>`;
    document.getElementById("report-risks-list").innerHTML = `<li><div class="skeleton-placeholder skeleton-line short" style="margin: 0;"></div></li>`;

    try {
        const jobResponse = await adminFetch(`${BASE_URL}/research/${jobId}`);
        const job = await jobResponse.json();
        
        document.getElementById("report-topic-heading").innerText = job.topic;
        document.getElementById("report-job-id-text").innerText = jobId;

        const analysisResponse = await adminFetch(`${BASE_URL}/research/${jobId}/analysis`);
        const analysis = await analysisResponse.json();

        document.getElementById("report-summary-text").innerHTML = marked.parse(analysis.executive_summary || "No executive summary generated.");

        const trendsContainer = document.getElementById("report-trends-list");
        trendsContainer.innerHTML = "";
        const trends = analysis.trends || [];
        trends.forEach(t => {
            const li = document.createElement("li");
            li.innerHTML = marked.parseInline(t);
            trendsContainer.appendChild(li);
        });

        const oppContainer = document.getElementById("report-opportunities-list");
        oppContainer.innerHTML = "";
        const opportunities = analysis.opportunities || [];
        opportunities.forEach(o => {
            const li = document.createElement("li");
            li.innerHTML = marked.parseInline(o);
            oppContainer.appendChild(li);
        });

        const riskContainer = document.getElementById("report-risks-list");
        riskContainer.innerHTML = "";
        const risks = analysis.risks || [];
        risks.forEach(r => {
            const li = document.createElement("li");
            li.innerHTML = marked.parseInline(r);
            riskContainer.appendChild(li);
        });

        const findingsResponse = await adminFetch(`${BASE_URL}/research/${jobId}/findings`);
        const findings = await findingsResponse.json();
        
        document.getElementById("tab-count-findings").innerText = findings.length;
        const findingsContainer = document.getElementById("report-findings-container");
        findingsContainer.innerHTML = "";
        findings.forEach(f => {
            const item = document.createElement("div");
            item.className = "finding-item";
            item.innerHTML = `
                <p class="finding-text">${marked.parseInline(f.finding)}</p>
                ${f.source_url ? `<a href="${f.source_url}" target="_blank" class="source-link-btn mt-2"><i data-lucide="external-link" style="width:12px;height:12px;"></i> Reference Source</a>` : ""}
            `;
            findingsContainer.appendChild(item);
        });

        const sourcesResponse = await adminFetch(`${BASE_URL}/research/${jobId}/sources`);
        const sources = await sourcesResponse.json();
        
        document.getElementById("tab-count-sources").innerText = sources.length;
        const sourcesContainer = document.getElementById("report-sources-container");
        sourcesContainer.innerHTML = "";
        sources.forEach((s, idx) => {
            const item = document.createElement("div");
            item.className = "source-item";
            const contentPreview = s.content ? s.content.substring(0, 500) + "..." : "No preview content available.";
            item.innerHTML = `
                <div class="source-header" onclick="toggleSourceDetails(this)">
                    <h4>${escapeHtml(s.title || `Source #${idx + 1}`)}</h4>
                    <i data-lucide="chevron-down" class="source-chevron"></i>
                </div>
                <div class="source-body">
                    <a href="${s.url}" target="_blank" class="source-link-btn">
                        <i data-lucide="external-link" style="width: 14px; height: 14px;"></i>
                        <span>${escapeHtml(s.url)}</span>
                    </a>
                    <p class="source-preview">${marked.parseInline(contentPreview)}</p>
                </div>
            `;
            sourcesContainer.appendChild(item);
        });

        lucide.createIcons();
    } catch (err) {
        console.error("Error opening audit report details:", err);
    }
}

function toggleSourceDetails(headerEl) {
    const bodyEl = headerEl.nextElementSibling;
    const chevron = headerEl.querySelector(".source-chevron");
    
    if (bodyEl.classList.contains("open")) {
        bodyEl.classList.remove("open");
        if (chevron) chevron.style.transform = "rotate(0deg)";
    } else {
        bodyEl.classList.add("open");
        if (chevron) chevron.style.transform = "rotate(180deg)";
    }
}

async function downloadPDF(jobId) {
    try {
        const response = await adminFetch(`${BASE_URL}/research/${jobId}/report`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Audit_Report_${jobId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (err) {
        console.error("PDF download failure:", err);
    }
}

// AUDIT RECORD PURGE
async function confirmDeleteJob(jobId, userId = null, username = null) {
    if (confirm("WARNING: Are you sure you want to permanently delete this user's research job? This will delete the database records and purge the report PDF file from disk.")) {
        try {
            const response = await adminFetch(`${BASE_URL}/research/${jobId}`, {
                method: "DELETE"
            });
            if (response.ok) {
                alert("Research run deleted successfully.");
                loadAdminAudit(); // Refresh background audit table job counts instantly
                if (userId && username) {
                    inspectUserJobs(userId, username);
                }
            } else {
                alert("Failed to delete the job.");
            }
        } catch (err) {
            console.error("Error deleting job run:", err);
        }
    }
}

// Expose globals for DOM triggers
window.confirmDeleteJob = confirmDeleteJob;
window.openReport = openReport;
window.inspectUserJobs = inspectUserJobs;

// HELPERS
function getStatusBadgeClass(status) {
    switch (status) {
        case "completed": return "badge-success";
        case "planning":
        case "collecting_sources":
        case "extracting_findings":
        case "analyzing":
        case "generating_report":
            return "badge-active";
        default: return "badge-warning";
    }
}

function formatStatusText(status) {
    const mapping = {
        "planning": "Planning",
        "collecting_sources": "Collecting Sources",
        "extracting_findings": "Extracting Findings",
        "analyzing": "Analyzing",
        "generating_report": "Generating Report",
        "completed": "Completed"
    };
    return mapping[status] || status;
}

function escapeHtml(text) {
    if (!text) return "";
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, function(m) { return map[m]; });
}

function clearAdminProfileForm() {
    document.getElementById("settings-admin-username").value = "";
    document.getElementById("settings-admin-password").value = "";
    document.getElementById("settings-admin-confirm").value = "";
    document.getElementById("settings-success-msg").classList.add("hidden");
    document.getElementById("settings-error-msg").classList.add("hidden");
}

async function handleUpdateAdminProfile() {
    const username = document.getElementById("settings-admin-username").value.trim();
    const password = document.getElementById("settings-admin-password").value;
    const confirm = document.getElementById("settings-admin-confirm").value;

    const successEl = document.getElementById("settings-success-msg");
    const errorEl = document.getElementById("settings-error-msg");

    successEl.classList.add("hidden");
    errorEl.classList.add("hidden");

    if (!username || !password || !confirm) {
        errorEl.innerText = "Email address and password fields are required.";
        errorEl.classList.remove("hidden");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
        errorEl.innerText = "Please enter a valid email address.";
        errorEl.classList.remove("hidden");
        return;
    }

    if (password !== confirm) {
        errorEl.innerText = "Passwords do not match.";
        errorEl.classList.remove("hidden");
        return;
    }

    try {
        const response = await adminFetch(`${BASE_URL}/auth/admin/profile`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ new_username: username, new_password: password })
        });

        if (response.ok) {
            successEl.classList.remove("hidden");
            // Clear inputs
            document.getElementById("settings-admin-username").value = "";
            document.getElementById("settings-admin-password").value = "";
            document.getElementById("settings-admin-confirm").value = "";
            
            // Log out after 2 seconds to force sign in with new credentials!
            setTimeout(() => {
                handleLogout();
            }, 2000);
        } else {
            const errData = await response.json().catch(() => ({}));
            errorEl.innerText = errData.detail || "Failed to update profile settings.";
            errorEl.classList.remove("hidden");
        }
    } catch (err) {
        console.error("Error updating profile settings:", err);
        errorEl.innerText = "Error connecting to authorization backend.";
        errorEl.classList.remove("hidden");
    }
}

window.handleUpdateAdminProfile = handleUpdateAdminProfile;
window.clearAdminProfileForm = clearAdminProfileForm;

function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    if (input.type === "password") {
        input.type = "text";
        btn.innerHTML = `<i data-lucide="eye-off" style="width: 18px; height: 18px;"></i>`;
    } else {
        input.type = "password";
        btn.innerHTML = `<i data-lucide="eye" style="width: 18px; height: 18px;"></i>`;
    }
    lucide.createIcons();
}

window.togglePasswordVisibility = togglePasswordVisibility;

async function toggleBlockUser(userId, currentStatus) {
    const action = currentStatus ? "unsuspend" : "suspend";
    if (!confirm(`Are you sure you want to ${action} this user account?`)) return;

    try {
        const response = await adminFetch(`${BASE_URL}/auth/users/${userId}/toggle-block`, {
            method: "PUT"
        });

        if (response.ok) {
            loadAdminAudit();
        } else {
            const errData = await response.json().catch(() => ({}));
            alert(errData.detail || "Failed to update suspension status.");
        }
    } catch (err) {
        console.error("Error toggling block status:", err);
        alert("Error connecting to server.");
    }
}

async function deleteUser(userId, username) {
    if (!confirm(`WARNING: Are you sure you want to permanently delete user "${username}" and all of their research jobs? This action cannot be undone.`)) return;

    try {
        const response = await adminFetch(`${BASE_URL}/auth/users/${userId}`, {
            method: "DELETE"
        });

        if (response.ok) {
            alert("User account and associated research history deleted successfully.");
            loadAdminAudit();
        } else {
            const errData = await response.json().catch(() => ({}));
            alert(errData.detail || "Failed to delete user account.");
        }
    } catch (err) {
        console.error("Error deleting user:", err);
        alert("Error connecting to server.");
    }
}

window.toggleBlockUser = toggleBlockUser;
window.deleteUser = deleteUser;
