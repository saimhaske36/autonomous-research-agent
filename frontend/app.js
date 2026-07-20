// API Base Config
const BASE_URL = "/api/v1";

// Application State
const state = {
    currentView: "dashboard",
    activeJobId: null,
    pollingInterval: null,
    pendingEmail: null,
    charts: {
        sources: null,
        findings: null
    }
};

// CUSTOM AUTH FETCH WRAPPER (Production-Grade)
async function authFetch(url, options = {}) {
    const token = localStorage.getItem("research_auth_token");
    if (!options.headers) {
        options.headers = {};
    }
    if (token) {
        options.headers["Authorization"] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(url, options);
        // Intercept unauthorized requests to clear session
        if (response.status === 401) {
            handleLogout();
            throw new Error("Session expired. Please log in again.");
        }
        return response;
    } catch (err) {
        console.error("Fetch API error:", err);
        throw err;
    }
}

// INITIALIZE APP
document.addEventListener("DOMContentLoaded", () => {
    // Setup Navigation Routing
    initRouter();

    // Setup Event Listeners
    initEventListeners();

    // Check URL parameters for direct password reset link redirection
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get("action");
    const email = urlParams.get("email");
    const token = urlParams.get("token");

    if (action === "reset-password" && email && token) {
        showAuthPanel("login");
        document.getElementById("forgot-password-modal").classList.remove("hidden");
        document.getElementById("recovery-email-phase").classList.add("hidden");
        document.getElementById("recovery-reset-phase").classList.remove("hidden");
        document.getElementById("recovery-reset-error-msg").classList.add("hidden");
        document.getElementById("recovery-email").value = email;
        document.getElementById("recovery-token").value = token;
        
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check Auth State on Boot
    checkAuthState();
});

// ROUTING LOGIC
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
    const token = localStorage.getItem("research_auth_token");
    const loginScreen = document.getElementById("login-screen");
    const appContainer = document.querySelector(".app-container");
    
    if (token) {
        loginScreen.classList.add("hidden");
        appContainer.classList.remove("hidden");
        
        // Extract username and render avatar initials dynamically
        let username = "User";
        if (token === "admin-secret-token") {
            username = "admin";
        } else if (token.split('.').length === 3) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const payload = JSON.parse(jsonPayload);
                username = payload.sub || "User";
            } catch (e) {
                console.error("Error decoding JWT payload:", e);
                username = "User";
            }
        } else if (token.startsWith("token-")) {
            username = token.replace("token-", "");
        }
        
        const initials = username.substring(0, 2).toUpperCase();
        document.getElementById("user-avatar-initials").innerText = initials;
        document.getElementById("user-profile-name").innerText = username;

        // Load Lucide Icons
        lucide.createIcons();
        
        // Load default view
        loadView("dashboard");
    } else {
        loginScreen.classList.remove("hidden");
        appContainer.classList.add("hidden");
        
        // Ensure Lucide Icons load inside the login screen
        lucide.createIcons();
    }
}

function loadView(viewName) {
    // Auth Guard check
    if (!localStorage.getItem("research_auth_token")) {
        checkAuthState();
        return;
    }

    // Clear any polling when changing views (unless it's the monitor view)
    if (viewName !== "new-research" && state.pollingInterval) {
        clearInterval(state.pollingInterval);
        state.pollingInterval = null;
    }

    state.currentView = viewName;

    // Toggle Active Class on Nav Items
    document.querySelectorAll(".nav-item").forEach(item => {
        if (item.getAttribute("data-view") === viewName) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Toggle Active Class on Sections
    document.querySelectorAll(".view-section").forEach(sec => {
        sec.classList.remove("active");
    });
    
    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
        targetSection.classList.add("active");
    }

    // Set View Title
    const titleText = viewName.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    document.getElementById("current-view-title").innerText = titleText;

    // Trigger View-Specific Loading Logic
    switch (viewName) {
        case "dashboard":
            loadDashboard();
            break;
        case "archive":
            loadArchive();
            break;
        case "analytics":
            loadAnalytics();
            break;
        case "admin":
            loadAdmin();
            break;
        case "new-research":
            if (state.activeJobId) {
                verifyActiveJobStatus(state.activeJobId);
            } else {
                resetNewResearchView();
            }
            break;
    }
}

// EVENT LISTENERS
function initEventListeners() {
    // Start Research Button
    document.getElementById("start-research-btn").addEventListener("click", () => {
        const topic = document.getElementById("research-topic-input").value.trim();
        if (topic) {
            startResearch(topic);
        } else {
            alert("Please enter a research topic first.");
        }
    });

    // Quick Start Research Widget
    document.getElementById("quick-research-btn").addEventListener("click", () => {
        const topic = document.getElementById("quick-research-input").value.trim();
        if (topic) {
            loadView("new-research");
            document.getElementById("research-topic-input").value = topic;
            startResearch(topic);
            document.getElementById("quick-research-input").value = "";
        } else {
            alert("Please enter a research topic first.");
        }
    });

    // Quick Start Input Keypress
    document.getElementById("quick-research-input").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            document.getElementById("quick-research-btn").click();
        }
    });

    // Archive Search Input
    document.getElementById("archive-search-input").addEventListener("input", (e) => {
        filterArchive(e.target.value);
    });

    // Report Tab Buttons
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

            btn.classList.add("active");
            const tabName = btn.getAttribute("data-tab");
            document.getElementById(`tab-pane-${tabName}`).classList.add("active");
        });
    });

    // Back to Archive Button in Report Viewer
    document.getElementById("report-back-btn").addEventListener("click", (e) => {
        e.preventDefault();
        loadView("archive");
    });

    // Download PDF Button
    document.getElementById("report-download-pdf-btn").addEventListener("click", () => {
        if (state.activeJobId) {
            downloadPDF(state.activeJobId);
        }
    });

    // View report from monitor page
    document.getElementById("monitor-view-report-btn").addEventListener("click", () => {
        if (state.activeJobId) {
            openReport(state.activeJobId);
        }
    });

    // Login Action Handlers
    document.getElementById("login-btn").addEventListener("click", () => {
        handleLogin();
    });

    document.getElementById("login-password").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleLogin();
        }
    });

    // Signup Action Handlers
    document.getElementById("signup-btn").addEventListener("click", () => {
        handleSignUp();
    });

    document.getElementById("signup-password").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleSignUp();
        }
    });

    // Toggle Screen Links
    document.getElementById("toggle-to-signup").addEventListener("click", (e) => {
        e.preventDefault();
        showAuthPanel("signup");
    });

    document.getElementById("toggle-to-login").addEventListener("click", (e) => {
        e.preventDefault();
        showAuthPanel("login");
    });

    // Signup Password Complexity Strength Meter Check
    const signupPasswordEl = document.getElementById("signup-password");
    if (signupPasswordEl) {
        signupPasswordEl.addEventListener("input", (e) => {
            const pwd = e.target.value;
            const segments = [
                document.getElementById("strength-bar-1"),
                document.getElementById("strength-bar-2"),
                document.getElementById("strength-bar-3")
            ];
            const label = document.getElementById("strength-label");
            
            // Reset segments
            segments.forEach(seg => {
                seg.className = "strength-bar-segment";
                seg.style.background = "rgba(255, 255, 255, 0.1)";
            });

            if (!pwd) {
                label.innerText = "Complexity: Empty";
                label.style.color = "#94a3b8";
                return;
            }

            // Calculate strength
            let score = 0;
            if (pwd.length >= 8) score++;
            if (/[0-9]/.test(pwd) && /[a-zA-Z]/.test(pwd)) score++;
            if (/[^A-Za-z0-9]/.test(pwd)) score++;

            if (score === 1) {
                segments[0].style.background = "#ef4444"; // Red
                label.innerText = "Complexity: Weak";
                label.style.color = "#ef4444";
            } else if (score === 2) {
                segments[0].style.background = "#eab308"; // Yellow
                segments[1].style.background = "#eab308";
                label.innerText = "Complexity: Medium";
                label.style.color = "#eab308";
            } else if (score === 3) {
                segments[0].style.background = "#22c55e"; // Green
                segments[1].style.background = "#22c55e";
                segments[2].style.background = "#22c55e";
                label.innerText = "Complexity: Strong";
                label.style.color = "#22c55e";
            }
        });
    }

    // Forgot Password Action Trigger Listeners
    const forgotLink = document.getElementById("forgot-password-link");
    if (forgotLink) {
        forgotLink.addEventListener("click", (e) => {
            e.preventDefault();
            document.getElementById("forgot-password-modal").classList.remove("hidden");
            document.getElementById("recovery-email-phase").classList.remove("hidden");
            document.getElementById("recovery-reset-phase").classList.add("hidden");
            document.getElementById("recovery-email-error-msg").classList.add("hidden");
            document.getElementById("recovery-email").value = "";
        });
    }

    // Cancel recovery
    const cancelRecoveryBtn = document.getElementById("recovery-cancel-btn");
    if (cancelRecoveryBtn) {
        cancelRecoveryBtn.addEventListener("click", () => {
            document.getElementById("forgot-password-modal").classList.add("hidden");
        });
    }

    // Send code
    const sendCodeBtn = document.getElementById("recovery-send-btn");
    if (sendCodeBtn) {
        sendCodeBtn.addEventListener("click", async () => {
            const email = document.getElementById("recovery-email").value.trim();
            const errorEl = document.getElementById("recovery-email-error-msg");
            if (!email) {
                errorEl.innerText = "Please enter your email address.";
                errorEl.classList.remove("hidden");
                return;
            }

            try {
                const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email })
                });

                if (response.ok) {
                    const data = await response.json();
                    errorEl.classList.add("hidden");
                    
                    // Show Mock email Toast Notification in bottom-right corner!
                    showMockEmailNotification(email, data.simulated_token);

                    // Move to reset override code phase inside modal
                    document.getElementById("recovery-email-phase").classList.add("hidden");
                    document.getElementById("recovery-reset-phase").classList.remove("hidden");
                    document.getElementById("recovery-reset-error-msg").classList.add("hidden");
                    document.getElementById("recovery-token").value = "";
                    document.getElementById("recovery-new-password").value = "";
                } else {
                    const errData = await response.json().catch(() => ({}));
                    errorEl.innerText = errData.detail || "Email address not registered.";
                    errorEl.classList.remove("hidden");
                }
            } catch (err) {
                console.error("Error triggering forgot password:", err);
                errorEl.innerText = "Error connecting to authorization backend.";
                errorEl.classList.remove("hidden");
            }
        });
    }

    // Submit token & new password
    const submitRecoveryBtn = document.getElementById("recovery-submit-btn");
    if (submitRecoveryBtn) {
        submitRecoveryBtn.addEventListener("click", async () => {
            const email = document.getElementById("recovery-email").value.trim();
            const token = document.getElementById("recovery-token").value.trim();
            const newPassword = document.getElementById("recovery-new-password").value;
            const errorEl = document.getElementById("recovery-reset-error-msg");

            if (!token || !newPassword) {
                errorEl.innerText = "All fields are required.";
                errorEl.classList.remove("hidden");
                return;
            }

            try {
                const response = await fetch(`${BASE_URL}/auth/reset-password`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, token, new_password: newPassword })
                });

                if (response.ok) {
                    errorEl.classList.add("hidden");
                    alert("Password updated successfully! You can now log in.");
                    document.getElementById("forgot-password-modal").classList.add("hidden");
                    document.getElementById("mock-email-notification").classList.add("hidden");
                } else {
                    const errData = await response.json().catch(() => ({}));
                    errorEl.innerText = errData.detail || "Invalid or expired recovery code.";
                    errorEl.classList.remove("hidden");
                }
            } catch (err) {
                console.error("Error resetting password:", err);
                errorEl.innerText = "Error connecting to authorization backend.";
                errorEl.classList.remove("hidden");
            }
        });
    }

    // Resend Recovery Token
    const resendCodeBtn = document.getElementById("recovery-resend-btn");
    if (resendCodeBtn) {
        resendCodeBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            const email = document.getElementById("recovery-email").value.trim();
            const errorEl = document.getElementById("recovery-reset-error-msg");
            
            const originalText = resendCodeBtn.innerText;
            resendCodeBtn.innerText = "Sending...";
            resendCodeBtn.style.pointerEvents = "none";
            resendCodeBtn.style.opacity = "0.7";

            try {
                const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email })
                });

                if (response.ok) {
                    const data = await response.json();
                    errorEl.classList.add("hidden");
                    
                    showMockEmailNotification(email, data.simulated_token);

                    resendCodeBtn.innerText = "Code Resent!";
                    setTimeout(() => {
                        resendCodeBtn.innerText = originalText;
                        resendCodeBtn.style.pointerEvents = "auto";
                        resendCodeBtn.style.opacity = "1";
                    }, 2000);
                } else {
                    const errData = await response.json().catch(() => ({}));
                    errorEl.innerText = errData.detail || "Failed to resend code.";
                    errorEl.classList.remove("hidden");
                    resendCodeBtn.innerText = originalText;
                    resendCodeBtn.style.pointerEvents = "auto";
                    resendCodeBtn.style.opacity = "1";
                }
            } catch (err) {
                console.error("Error resending code:", err);
                errorEl.innerText = "Error connecting to authorization backend.";
                errorEl.classList.remove("hidden");
                resendCodeBtn.innerText = originalText;
                resendCodeBtn.style.pointerEvents = "auto";
                resendCodeBtn.style.opacity = "1";
            }
        });
    }

    // Logout Action Handler
    const logoutBtn = document.getElementById("sidebar-logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
}

// VIEW LOADER: DASHBOARD
async function loadDashboard() {
    // Show stats placeholder skeletons
    document.getElementById("stat-total-jobs").innerHTML = `<span class="skeleton-placeholder skeleton-line" style="width: 40px; height: 30px; margin: 0;"></span>`;
    document.getElementById("stat-total-sources").innerHTML = `<span class="skeleton-placeholder skeleton-line" style="width: 40px; height: 30px; margin: 0;"></span>`;
    document.getElementById("stat-total-findings").innerHTML = `<span class="skeleton-placeholder skeleton-line" style="width: 40px; height: 30px; margin: 0;"></span>`;

    try {
        const response = await authFetch(`${BASE_URL}/research/stats`);
        const stats = await response.json();
        
        document.getElementById("stat-total-jobs").innerText = stats.total_jobs || 0;
        document.getElementById("stat-total-sources").innerText = stats.total_sources || 0;
        document.getElementById("stat-total-findings").innerText = stats.total_findings || 0;
    } catch (err) {
        console.error("Error loading dashboard stats:", err);
    }
}

// VIEW LOADER: NEW RESEARCH
function resetNewResearchView() {
    document.getElementById("research-topic-input").value = "";
    document.getElementById("research-monitor-panel").classList.add("hidden");
    document.getElementById("monitor-completed-actions").classList.add("hidden");
    
    // Reset Timeline Steps
    const steps = ["step-planning", "step-collecting", "step-extracting", "step-analyzing", "step-writing"];
    steps.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.className = "timeline-item";
    });
}

async function verifyActiveJobStatus(jobId) {
    try {
        const response = await authFetch(`${BASE_URL}/research/${jobId}`);
        if (!response.ok) {
            state.activeJobId = null;
            if (state.pollingInterval) {
                clearInterval(state.pollingInterval);
                state.pollingInterval = null;
            }
            resetNewResearchView();
            return;
        }
        
        const job = await response.json();
        const progress = job.progress || 0;
        const status = job.status;
        
        document.getElementById("monitor-progress-percentage").innerText = `${progress}%`;
        document.getElementById("monitor-progress-fill").style.width = `${progress}%`;
        document.getElementById("monitor-badge-status").innerText = formatStatusText(status);
        updateTimelineSteps(status);
        
        if (status === "completed" || progress >= 100) {
            document.getElementById("monitor-badge-status").innerText = "Completed";
            document.getElementById("monitor-badge-status").className = "badge badge-success";
            document.getElementById("monitor-completed-actions").classList.remove("hidden");
            
            if (state.pollingInterval) {
                clearInterval(state.pollingInterval);
                state.pollingInterval = null;
            }
        } else {
            document.getElementById("monitor-badge-status").className = "badge badge-active";
            document.getElementById("monitor-completed-actions").classList.add("hidden");
            
            if (!state.pollingInterval) {
                state.pollingInterval = setInterval(() => pollJobStatus(jobId), 1000);
            }
        }
    } catch (err) {
        console.error("Error verifying active job status:", err);
        state.activeJobId = null;
        if (state.pollingInterval) {
            clearInterval(state.pollingInterval);
            state.pollingInterval = null;
        }
        resetNewResearchView();
    }
}

async function startResearch(topic) {
    try {
        const response = await authFetch(`${BASE_URL}/research`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic })
        });
        const data = await response.json();
        
        state.activeJobId = data.job_id;
        
        // Show Monitor
        document.getElementById("research-monitor-panel").classList.remove("hidden");
        document.getElementById("monitor-topic-title").innerText = topic;
        document.getElementById("monitor-job-id").innerText = data.job_id;
        document.getElementById("monitor-badge-status").innerText = "Planning";
        document.getElementById("monitor-badge-status").className = "badge badge-active";
        
        // Start Polling
        if (state.pollingInterval) clearInterval(state.pollingInterval);
        state.pollingInterval = setInterval(() => pollJobStatus(data.job_id), 1000);
    } catch (err) {
        console.error("Error starting research workflow:", err);
        alert("Failed to contact the backend service. Check if backend is running.");
    }
}

async function pollJobStatus(jobId) {
    try {
        const response = await authFetch(`${BASE_URL}/research/${jobId}`);
        if (!response.ok) throw new Error("Job not found");
        
        const job = await response.json();
        
        const progress = job.progress || 0;
        const status = job.status;
        
        // Update Progress Bar
        document.getElementById("monitor-progress-percentage").innerText = `${progress}%`;
        document.getElementById("monitor-progress-fill").style.width = `${progress}%`;
        document.getElementById("monitor-badge-status").innerText = formatStatusText(status);

        // Update Steps Timeline
        updateTimelineSteps(status);

        if (status === "completed" || progress >= 100) {
            clearInterval(state.pollingInterval);
            state.pollingInterval = null;
            
            document.getElementById("monitor-badge-status").innerText = "Completed";
            document.getElementById("monitor-badge-status").className = "badge badge-success";
            
            // Show view report buttons
            document.getElementById("monitor-completed-actions").classList.remove("hidden");
        }
    } catch (err) {
        console.error("Error polling job status:", err);
        clearInterval(state.pollingInterval);
    }
}

function updateTimelineSteps(status) {
    const steps = [
        { id: "step-planning", key: "planning", icon: "clipboard-list" },
        { id: "step-collecting", key: "collecting_sources", icon: "search" },
        { id: "step-extracting", key: "extracting_findings", icon: "book-open" },
        { id: "step-analyzing", key: "analyzing", icon: "brain" },
        { id: "step-writing", key: "generating_report", icon: "file-text" }
    ];

    let currentIdx = steps.findIndex(s => s.key === status);
    if (status === "completed") currentIdx = 5;

    steps.forEach((step, idx) => {
        const el = document.getElementById(step.id);
        if (!el) return;

        const marker = el.querySelector(".timeline-marker");
        if (idx < currentIdx) {
            el.className = "timeline-item completed";
            if (marker) marker.innerHTML = `<i data-lucide="check"></i>`;
        } else if (idx === currentIdx) {
            el.className = "timeline-item active";
            if (marker) marker.innerHTML = `<i data-lucide="loader" class="spin"></i>`;
        } else {
            el.className = "timeline-item";
            if (marker) marker.innerHTML = `<i data-lucide="${step.icon}"></i>`;
        }
    });

    lucide.createIcons();
}

// VIEW LOADER: ARCHIVE
async function loadArchive() {
    const container = document.getElementById("archive-jobs-container");
    // Show Skeletons during load
    container.innerHTML = `
        <div class="skeleton-card">
            <div class="skeleton-placeholder skeleton-line medium"></div>
            <div class="skeleton-placeholder skeleton-line short"></div>
        </div>
        <div class="skeleton-card">
            <div class="skeleton-placeholder skeleton-line medium"></div>
            <div class="skeleton-placeholder skeleton-line short"></div>
        </div>
    `;

    try {
        const response = await authFetch(`${BASE_URL}/research`);
        const jobs = await response.json();
        
        container.innerHTML = "";
        
        if (!jobs || jobs.length === 0) {
            container.innerHTML = `<div class="text-center py-5 text-muted">No research jobs archived yet.</div>`;
            return;
        }

        jobs.forEach(job => {
            const card = document.createElement("div");
            card.className = "archive-card mb-3";
            card.setAttribute("data-topic", job.topic.toLowerCase());
            
            const badgeClass = getStatusBadgeClass(job.status);
            const statusLabel = formatStatusText(job.status);

            card.innerHTML = `
                <div class="archive-card-header" onclick="toggleArchiveCard(this)">
                    <div>
                        <h4 class="archive-card-title">${escapeHtml(job.topic)}</h4>
                        <p class="text-muted text-sm mt-1">ID: <code>${job.id}</code></p>
                    </div>
                    <div class="archive-card-meta">
                        <span class="badge ${badgeClass}">${statusLabel}</span>
                        <div class="meta-item">
                            <i data-lucide="globe" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"></i>
                            <span>${job.source_count || 0} Sources</span>
                        </div>
                        <div class="meta-item">
                            <i data-lucide="lightbulb" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"></i>
                            <span>${job.finding_count || 0} Findings</span>
                        </div>
                        <i data-lucide="chevron-down" class="accordion-chevron"></i>
                    </div>
                </div>
                <div class="archive-card-body hidden pt-3 mt-3 border-top" style="border-top: 1px solid rgba(255,255,255,0.04);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="text-muted">Research completed successfully. Full report, analytics, sources lists, and synthesized matrix are compiled.</span>
                        <button class="btn btn-primary btn-sm" onclick="openReport('${job.id}')">
                            <i data-lucide="file-text"></i>
                            <span>Open Full Report</span>
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        lucide.createIcons();
    } catch (err) {
        console.error("Error loading archive:", err);
    }
}

function toggleArchiveCard(headerEl) {
    const cardBody = headerEl.nextElementSibling;
    const chevron = headerEl.querySelector(".accordion-chevron");
    
    if (cardBody.classList.contains("hidden")) {
        cardBody.classList.remove("hidden");
        if (chevron) chevron.style.transform = "rotate(180deg)";
    } else {
        cardBody.classList.add("hidden");
        if (chevron) chevron.style.transform = "rotate(0deg)";
    }
}

function filterArchive(query) {
    const cards = document.querySelectorAll(".archive-card");
    const cleanQuery = query.trim().toLowerCase();
    
    cards.forEach(card => {
        const topic = card.getAttribute("data-topic");
        if (topic.includes(cleanQuery)) {
            card.classList.remove("hidden");
        } else {
            card.classList.add("hidden");
        }
    });
}

// VIEW LOADER: REPORT VIEWER (DYNAMIC RUN DETAIL)
async function openReport(jobId) {
    state.activeJobId = jobId;
    loadView("report");
    
    // Reset tabs
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    document.querySelector('[data-tab="summary"]').classList.add("active");
    document.getElementById("tab-pane-summary").classList.add("active");

    // Setup Skeletons while fetching
    document.getElementById("report-summary-text").innerHTML = `
        <div class="skeleton-placeholder skeleton-line"></div>
        <div class="skeleton-placeholder skeleton-line"></div>
        <div class="skeleton-placeholder skeleton-line short"></div>
    `;
    document.getElementById("report-trends-list").innerHTML = `<li><div class="skeleton-placeholder skeleton-line short" style="margin: 0;"></div></li>`;
    document.getElementById("report-opportunities-list").innerHTML = `<li><div class="skeleton-placeholder skeleton-line short" style="margin: 0;"></div></li>`;
    document.getElementById("report-risks-list").innerHTML = `<li><div class="skeleton-placeholder skeleton-line short" style="margin: 0;"></div></li>`;
    
    document.getElementById("tab-count-findings").innerText = "...";
    document.getElementById("tab-count-sources").innerText = "...";

    try {
        // Fetch Job Details
        const jobResponse = await authFetch(`${BASE_URL}/research/${jobId}`);
        const job = await jobResponse.json();
        
        document.getElementById("report-topic-heading").innerText = job.topic;
        document.getElementById("report-job-id-text").innerText = jobId;

        // Fetch Analysis Synthesis
        const analysisResponse = await authFetch(`${BASE_URL}/research/${jobId}/analysis`);
        const analysis = await analysisResponse.json();

        // Fill Synthesis Summary parsed with Marked.js
        const rawSummary = analysis.executive_summary || "No executive summary generated.";
        document.getElementById("report-summary-text").innerHTML = marked.parse(rawSummary);

        // Fill Trends List
        const trendsContainer = document.getElementById("report-trends-list");
        trendsContainer.innerHTML = "";
        const trends = analysis.trends || [];
        if (trends.length > 0) {
            trends.forEach(t => {
                const li = document.createElement("li");
                li.innerHTML = marked.parseInline(t);
                trendsContainer.appendChild(li);
            });
        } else {
            trendsContainer.innerHTML = `<li class="text-muted">No trends identified.</li>`;
        }

        // Fill Opportunities
        const oppContainer = document.getElementById("report-opportunities-list");
        oppContainer.innerHTML = "";
        const opportunities = analysis.opportunities || [];
        if (opportunities.length > 0) {
            opportunities.forEach(o => {
                const li = document.createElement("li");
                li.innerHTML = marked.parseInline(o);
                oppContainer.appendChild(li);
            });
        } else {
            oppContainer.innerHTML = `<li class="text-muted">No opportunities identified.</li>`;
        }

        // Fill Risks
        const riskContainer = document.getElementById("report-risks-list");
        riskContainer.innerHTML = "";
        const risks = analysis.risks || [];
        if (risks.length > 0) {
            risks.forEach(r => {
                const li = document.createElement("li");
                li.innerHTML = marked.parseInline(r);
                riskContainer.appendChild(li);
            });
        } else {
            riskContainer.innerHTML = `<li class="text-muted">No critical risks identified.</li>`;
        }

        // Fetch Findings
        const findingsResponse = await authFetch(`${BASE_URL}/research/${jobId}/findings`);
        const findings = await findingsResponse.json();
        
        document.getElementById("tab-count-findings").innerText = findings.length;
        const findingsContainer = document.getElementById("report-findings-container");
        findingsContainer.innerHTML = "";
        
        if (findings.length > 0) {
            findings.forEach(f => {
                const item = document.createElement("div");
                item.className = "finding-item";
                item.innerHTML = `
                    <p class="finding-text">${marked.parseInline(f.finding)}</p>
                    ${f.source_url ? `<a href="${f.source_url}" target="_blank" class="source-link-btn mt-2"><i data-lucide="external-link" style="width:12px;height:12px;"></i> Reference Source</a>` : ""}
                `;
                findingsContainer.appendChild(item);
            });
        } else {
            findingsContainer.innerHTML = `<p class="text-muted text-center py-4">No findings extracted for this job.</p>`;
        }

        // Fetch Sources
        const sourcesResponse = await authFetch(`${BASE_URL}/research/${jobId}/sources`);
        const sources = await sourcesResponse.json();
        
        document.getElementById("tab-count-sources").innerText = sources.length;
        const sourcesContainer = document.getElementById("report-sources-container");
        sourcesContainer.innerHTML = "";
        
        if (sources.length > 0) {
            sources.forEach((s, idx) => {
                const item = document.createElement("div");
                item.className = "source-item";
                // Preview content is parsed inline with Marked.js
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
        } else {
            sourcesContainer.innerHTML = `<p class="text-muted text-center py-4">No sources collected for this job.</p>`;
        }

        lucide.createIcons();
    } catch (err) {
        console.error("Error opening report:", err);
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
        const response = await authFetch(`${BASE_URL}/research/${jobId}/report`);
        if (!response.ok) throw new Error("Failed to download PDF");
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Research_Report_${jobId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Error downloading report:", err);
        alert("Failed to download report PDF. Ensure research is completed.");
    }
}

// VIEW LOADER: ANALYTICS
async function loadAnalytics() {
    const tbody = document.getElementById("analytics-table-tbody");
    tbody.innerHTML = `
        <tr>
            <td><div class="skeleton-placeholder skeleton-line"></div></td>
            <td><div class="skeleton-placeholder skeleton-line"></div></td>
            <td><div class="skeleton-placeholder skeleton-line"></div></td>
            <td><div class="skeleton-placeholder skeleton-line"></div></td>
        </tr>
    `;

    try {
        const response = await authFetch(`${BASE_URL}/research`);
        const jobs = await response.json();
        
        tbody.innerHTML = "";
        
        if (!jobs || jobs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No research jobs completed to analyze.</td></tr>`;
            return;
        }

        // Draw Analytics Table
        jobs.forEach(job => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${escapeHtml(job.topic)}</strong></td>
                <td><span class="badge ${getStatusBadgeClass(job.status)}">${formatStatusText(job.status)}</span></td>
                <td>${job.source_count || 0}</td>
                <td>${job.finding_count || 0}</td>
            `;
            tbody.appendChild(row);
        });

        // Setup Chart Data
        const labels = jobs.map(j => j.topic.length > 25 ? j.topic.substring(0, 25) + "..." : j.topic);
        const sourceData = jobs.map(j => j.source_count || 0);
        const findingData = jobs.map(j => j.finding_count || 0);

        // Chart styles config
        const gridColor = "rgba(255, 255, 255, 0.05)";
        const labelColor = "#94a3b8";

        // Render Sources Chart
        if (state.charts.sources) state.charts.sources.destroy();
        const ctxSources = document.getElementById("chart-sources").getContext("2d");
        state.charts.sources = new Chart(ctxSources, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Sources Count",
                    data: sourceData,
                    backgroundColor: "rgba(99, 102, 241, 0.65)",
                    borderColor: "rgba(99, 102, 241, 1)",
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: labelColor }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { color: labelColor, stepSize: 1 }
                    }
                }
            }
        });

        // Render Findings Chart
        if (state.charts.findings) state.charts.findings.destroy();
        const ctxFindings = document.getElementById("chart-findings").getContext("2d");
        state.charts.findings = new Chart(ctxFindings, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Findings Count",
                    data: findingData,
                    backgroundColor: "rgba(168, 85, 247, 0.65)",
                    borderColor: "rgba(168, 85, 247, 1)",
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: labelColor }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { color: labelColor, stepSize: 1 }
                    }
                }
            }
        });

    } catch (err) {
        console.error("Error loading analytics:", err);
    }
}

// LOGIN ACTION LOGIC
async function handleLogin() {
    const usernameEl = document.getElementById("login-username");
    const passwordEl = document.getElementById("login-password");
    const errorEl = document.getElementById("login-error-msg");

    const username = usernameEl.value.trim();
    const password = passwordEl.value;

    if (!username || !password) {
        errorEl.innerText = "Email address and password are required.";
        errorEl.classList.remove("hidden");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
        errorEl.innerText = "Please enter a valid email address.";
        errorEl.classList.remove("hidden");
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, portal: "user" })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                localStorage.setItem("research_auth_token", data.token);
                errorEl.classList.add("hidden");
                usernameEl.value = "";
                passwordEl.value = "";
                checkAuthState();
            } else {
                showLoginError(data.message || "Invalid credentials.");
            }
        } else {
            const errData = await response.json().catch(() => ({}));
            showLoginError(errData.detail || "Invalid credentials.");
        }
    } catch (err) {
        console.error("Error logging in:", err);
        showLoginError("Error connecting to authorization backend.");
    }
}

function showLoginError(msg) {
    const errorEl = document.getElementById("login-error-msg");
    errorEl.innerText = msg;
    errorEl.classList.remove("hidden");
    
    // Shake animation reset
    errorEl.style.animation = 'none';
    errorEl.offsetHeight; // trigger reflow
    errorEl.style.animation = null;
}

function handleLogout() {
    localStorage.removeItem("research_auth_token");
    state.activeJobId = null;
    if (state.pollingInterval) {
        clearInterval(state.pollingInterval);
        state.pollingInterval = null;
    }
    checkAuthState();
}

// VIEW LOADER: ADMIN PANEL
async function loadAdmin() {
    const tbody = document.getElementById("admin-jobs-tbody");
    // Show Skeletons while loading
    tbody.innerHTML = `
        <tr>
            <td><div class="skeleton-placeholder skeleton-line" style="height: 14px;"></div></td>
            <td><div class="skeleton-placeholder skeleton-line" style="height: 14px;"></div></td>
            <td><div class="skeleton-placeholder skeleton-line" style="height: 14px;"></div></td>
            <td><div class="skeleton-placeholder skeleton-line" style="height: 14px;"></div></td>
            <td><div class="skeleton-placeholder skeleton-line" style="height: 14px;"></div></td>
            <td><div class="skeleton-placeholder skeleton-line" style="height: 14px;"></div></td>
        </tr>
    `;

    try {
        const response = await authFetch(`${BASE_URL}/research`);
        const jobs = await response.json();
        
        tbody.innerHTML = "";
        
        if (!jobs || jobs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No research database records found.</td></tr>`;
            return;
        }

        jobs.forEach(job => {
            const row = document.createElement("tr");
            const badgeClass = getStatusBadgeClass(job.status);
            const statusLabel = formatStatusText(job.status);

            row.innerHTML = `
                <td><code>${job.id}</code></td>
                <td><strong>${escapeHtml(job.topic)}</strong></td>
                <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
                <td>${job.source_count || 0}</td>
                <td>${job.finding_count || 0}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="confirmDeleteJob('${job.id}')">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"></i>
                        <span>Delete</span>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        lucide.createIcons();
    } catch (err) {
        console.error("Error loading admin panel:", err);
    }
}

// DELETE JOB FUNCTION
async function confirmDeleteJob(jobId) {
    if (confirm("Are you sure you want to permanently delete this research job? This will delete the database record, sources list, findings, analysis, and its PDF report from disk.")) {
        try {
            const response = await authFetch(`${BASE_URL}/research/${jobId}`, {
                method: "DELETE"
            });
            if (response.ok) {
                alert("Research job deleted successfully.");
                if (state.currentView === "admin") {
                    loadAdmin();
                } else if (state.currentView === "dashboard") {
                    loadDashboard();
                }
            } else {
                alert("Failed to delete the job.");
            }
        } catch (err) {
            console.error("Error deleting job:", err);
            alert("Error connecting to backend API.");
        }
    }
}

// Expose confirmDeleteJob globally
window.confirmDeleteJob = confirmDeleteJob;

// AUTH PANEL TOGGLING
function showAuthPanel(panelName) {
    const loginPanel = document.getElementById("login-panel");
    const signupPanel = document.getElementById("signup-panel");
    const loginError = document.getElementById("login-error-msg");
    const signupError = document.getElementById("signup-error-msg");
    const signupSuccess = document.getElementById("signup-success-msg");

    // Clear input fields
    document.getElementById("login-username").value = "";
    document.getElementById("login-password").value = "";
    document.getElementById("signup-username").value = "";
    document.getElementById("signup-password").value = "";

    // Hide error/success messages
    loginError.classList.add("hidden");
    signupError.classList.add("hidden");
    signupSuccess.classList.add("hidden");

    if (panelName === "signup") {
        loginPanel.classList.add("hidden");
        signupPanel.classList.remove("hidden");
    } else {
        loginPanel.classList.remove("hidden");
        signupPanel.classList.add("hidden");
    }
}

// SIGNUP ACTION LOGIC
async function handleSignUp() {
    const usernameEl = document.getElementById("signup-username");
    const emailEl = document.getElementById("signup-email");
    const passwordEl = document.getElementById("signup-password");
    const errorEl = document.getElementById("signup-error-msg");
    const successEl = document.getElementById("signup-success-msg");

    const username = usernameEl.value.trim();
    const email = emailEl.value.trim();
    const password = passwordEl.value;

    if (!username || !email || !password) {
        showSignUpError("Username, email, and password are required.");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showSignUpError("Please enter a valid email address.");
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                errorEl.classList.add("hidden");
                successEl.classList.remove("hidden");
                
                // Clear inputs to prevent browser autocomplete popups
                usernameEl.value = "";
                emailEl.value = "";
                passwordEl.value = "";

                setTimeout(() => {
                    successEl.classList.add("hidden");
                    showAuthPanel("login");
                    document.getElementById("login-username").focus();
                }, 1500);
            } else {
                showSignUpError(data.message || "Registration failed.");
            }
        } else {
            const errData = await response.json().catch(() => ({}));
            showSignUpError(errData.detail || "Registration failed. Username or email may be taken.");
        }
    } catch (err) {
        console.error("Error signing up:", err);
        showSignUpError("Error connecting to registration backend.");
    }
}

function showSignUpError(msg) {
    const errorEl = document.getElementById("signup-error-msg");
    errorEl.innerText = msg;
    errorEl.classList.remove("hidden");
    
    // Shake animation
    errorEl.style.animation = 'none';
    errorEl.offsetHeight; // trigger reflow
    errorEl.style.animation = null;
}

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

function showMockEmailNotification(email, token) {
    const mockEmailEl = document.getElementById("mock-email-notification");
    if (mockEmailEl) {
        document.getElementById("mock-email-to").innerText = email;
        document.getElementById("mock-email-token").innerText = token;
        mockEmailEl.classList.remove("hidden");
    }
}

window.showMockEmailNotification = showMockEmailNotification;
