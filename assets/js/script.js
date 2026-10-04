const API_BASE = window.location.pathname.includes('pages/') ? '../php/api/' : 'php/api/';
let currentUser = null;
let currentDepartmentId = null;
let currentPlanId = null;

async function checkAuth() {
    try {
        const response = await fetch(API_BASE + 'auth.php');
        const data = await response.json();
        
        if (data.authenticated) {
            currentUser = data.user;
            if (window.location.pathname.includes('login.html')) {
                window.location.href = '../index.html';
            }
            return true;
        } else {
            if (!window.location.pathname.includes('login.html')) {
                const loginPath = window.location.pathname.includes('pages/') ? 'login.html' : 'pages/login.html';
                window.location.href = loginPath;
            }
            return false;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        if (!window.location.pathname.includes('login.html')) {
            const loginPath = window.location.pathname.includes('pages/') ? 'login.html' : 'pages/login.html';
            window.location.href = loginPath;
        }
        return false;
    }
}

async function loadDepartments() {
    try {
        const response = await fetch(API_BASE + 'departments.php');
        const departments = await response.json();
        
        const list = document.getElementById('departmentsList');
        if (!list) return;
        list.innerHTML = '';
        
        departments.forEach(dept => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = dept.name;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                loadDepartment(dept.id, dept.name);
            });
            li.appendChild(a);
            list.appendChild(li);
        });
        
        if (currentUser && currentUser.role === 'admin') {
            const adminSection = document.getElementById('adminSection');
            if (adminSection) {
                adminSection.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Failed to load departments:', error);
    }
}

async function loadDepartment(departmentId, departmentName) {
    currentDepartmentId = departmentId;
    
    const welcomeScreen = document.getElementById('welcomeScreen');
    const planDetailsView = document.getElementById('planDetailsView');
    const departmentView = document.getElementById('departmentView');
    const deptName = document.getElementById('deptName');
    
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    if (planDetailsView) planDetailsView.style.display = 'none';
    if (departmentView) {
        departmentView.style.display = 'block';
    } else {
        const indexPath = window.location.pathname.includes('pages/') ? '../index.html' : 'index.html';
        window.location.href = indexPath;
        return;
    }
    if (deptName) deptName.textContent = departmentName;
    
    const content = document.querySelector('.content');
    if (content) {
        content.scrollTop = 0;
    }
    
    const canAddPlan = currentUser && (currentUser.role === 'admin' || 
        (currentUser.role === 'committee_head' && currentUser.department_id == departmentId));
    const addPlanBtn = document.getElementById('addPlanBtn');
    if (addPlanBtn) {
        addPlanBtn.style.display = canAddPlan ? 'block' : 'none';
    }
    
    try {
        const response = await fetch(API_BASE + `plans.php?department_id=${departmentId}`);
        const plans = await response.json();
        
        const container = document.getElementById('plansContainer');
        if (!container) {
            const indexPath = window.location.pathname.includes('pages/') ? '../index.html' : 'index.html';
            window.location.href = indexPath;
            return;
        }
        container.innerHTML = '';
        
        if (plans.length === 0) {
            container.innerHTML = '<p style="color: #6B7280; font-weight: 400; padding: 2rem; text-align: center;">لا توجد خطط لهذا القسم</p>';
            return;
        }
        
        plans.forEach(plan => {
            const card = document.createElement('div');
            card.className = 'plan-card';
            card.innerHTML = `
                <h3>${plan.title}</h3>
                <div class="progress-bar-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${plan.progress}%"></div>
                    </div>
                    <span>${parseFloat(plan.progress).toFixed(1).replace(/\s/g, '')}%</span>
                </div>
                <p style="color: #6B7280; font-size: 0.9rem; font-weight: 300;">تاريخ الإنشاء: ${new Date(plan.created_at).toLocaleDateString('ar-SA')}</p>
            `;
            card.onclick = () => loadPlanDetails(plan.id, plan.title);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load plans:', error);
    }
}

async function loadPlanDetails(planId, planTitle) {
    currentPlanId = planId;
    
    const departmentView = document.getElementById('departmentView');
    const planDetailsView = document.getElementById('planDetailsView');
    const planTitleEl = document.getElementById('planTitle');
    
    if (departmentView) departmentView.style.display = 'none';
    if (planDetailsView) planDetailsView.style.display = 'block';
    if (planTitleEl) planTitleEl.textContent = planTitle;
    
    const content = document.querySelector('.content');
    if (content) {
        content.scrollTop = 0;
    }
    
    try {
        const response = await fetch(API_BASE + `plans.php?department_id=${currentDepartmentId}`);
        const plans = await response.json();
        const plan = plans.find(p => p.id == planId);
        
        if (plan) {
            const planProgressFill = document.getElementById('planProgressFill');
            const planProgressText = document.getElementById('planProgressText');
            if (planProgressFill) planProgressFill.style.width = plan.progress + '%';
            if (planProgressText) planProgressText.textContent = parseFloat(plan.progress).toFixed(1).replace(/\s/g, '') + '%';
        }
        
        const goalsResponse = await fetch(API_BASE + `goals.php?plan_id=${planId}`);
        const goals = await goalsResponse.json();
        
        const container = document.getElementById('goalsContainer');
        container.innerHTML = '';
        
        if (goals.length === 0) {
            container.innerHTML = '<p>لا توجد أهداف لهذه الخطة</p>';
            return;
        }
        
        for (const goal of goals) {
            await renderGoal(goal, container);
        }
    } catch (error) {
        console.error('Failed to load plan details:', error);
    }
}

async function renderGoal(goal, container) {
    const goalCard = document.createElement('div');
    goalCard.className = 'goal-card';
    
    const canEdit = currentUser && (currentUser.role === 'admin' || currentUser.role === 'committee_head');
    
    goalCard.innerHTML = `
        <div class="goal-header">
            <div style="flex: 1; min-width: 200px;">
                <h3>${goal.title}</h3>
                <div class="goal-progress-section">
                    <div class="progress-bar-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${goal.progress}%"></div>
                        </div>
                        <span>${parseFloat(goal.progress).toFixed(1).replace(/\s/g, '')}%</span>
                    </div>
                </div>
            </div>
            ${canEdit ? `
                <div class="goal-actions">
                    <button class="btn btn-primary btn-small" onclick="showAddActivityModal(${goal.id})">إضافة نشاط</button>
                    <button class="btn btn-danger btn-small" onclick="deleteGoal(${goal.id})">حذف الهدف</button>
                </div>
            ` : ''}
        </div>
        <div class="activities-list" id="activities-${goal.id}"></div>
    `;
    
    container.appendChild(goalCard);
    
    try {
        const response = await fetch(API_BASE + `activities.php?goal_id=${goal.id}`);
        const activities = await response.json();
        
        const activitiesList = document.getElementById(`activities-${goal.id}`);
        
        if (activities.length === 0) {
            activitiesList.innerHTML = '<p style="color: #6B7280; font-weight: 300;">لا توجد أنشطة لهذا الهدف</p>';
            return;
        }
        
        activities.forEach(activity => {
            renderActivity(activity, activitiesList);
        });
    } catch (error) {
        console.error('Failed to load activities:', error);
    }
}

function renderActivity(activity, container) {
    const activityItem = document.createElement('div');
    activityItem.className = `activity-item ${activity.status}`;
    
    const canEdit = currentUser && (currentUser.role === 'admin' || currentUser.role === 'committee_head');
    const canUpdateProgress = currentUser && (currentUser.role === 'admin' || currentUser.role === 'committee_head' || currentUser.role === 'faculty_member');
    const canUploadDoc = currentUser && (currentUser.role === 'admin' || currentUser.role === 'committee_head' || currentUser.role === 'faculty_member');
    
    activityItem.innerHTML = `
        <div class="activity-header">
            <div class="activity-title">
                <span class="activity-status ${activity.status_color}"></span>
                ${activity.title}
            </div>
            ${canEdit ? `
                <button class="btn btn-danger btn-small" onclick="deleteActivity(${activity.id})">حذف</button>
            ` : ''}
        </div>
        <div class="activity-meta">
            <div>
                <strong>الموعد النهائي:</strong> ${new Date(activity.deadline).toLocaleDateString('ar-SA')}
            </div>
            <div class="activity-progress">
                <label>نسبة الإنجاز:</label>
                ${canUpdateProgress ? `
                    <input type="number" min="0" max="100" value="${activity.progress}" 
                           onchange="updateActivityProgress(${activity.id}, this.value)" 
                           style="width: 80px; padding: 0.25rem;">
                    <span>%</span>
                ` : `
                    <span>${parseFloat(activity.progress).toFixed(1).replace(/\s/g, '')}%</span>
                `}
            </div>
        </div>
        <div class="documents-list" id="documents-${activity.id}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <strong>الأدلة:</strong>
                ${canUploadDoc ? `
                    <button class="btn btn-success btn-small" onclick="showUploadDocumentModal(${activity.id})">رفع دليل</button>
                ` : ''}
            </div>
            <div id="docs-list-${activity.id}"></div>
        </div>
    `;
    
    container.appendChild(activityItem);
    loadDocuments(activity.id);
}

async function loadDocuments(activityId) {
    try {
        const response = await fetch(API_BASE + `documents.php?activity_id=${activityId}`);
        const documents = await response.json();
        
        const docsList = document.getElementById(`docs-list-${activityId}`);
        docsList.innerHTML = '';
        
        if (documents.length === 0) {
            docsList.innerHTML = '<p style="color: #6B7280; font-size: 0.9rem; font-weight: 300;">لا توجد أدلة مرفوعة</p>';
            return;
        }
        
        documents.forEach(doc => {
            const docItem = document.createElement('div');
            docItem.className = 'document-item';
            
            const canDelete = currentUser && (currentUser.role === 'admin' || currentUser.role === 'committee_head');
            
            docItem.innerHTML = `
                <a href="${doc.file_url}" target="_blank">${doc.file_name}</a>
                <span style="color: #6B7280; font-size: 0.85rem; font-weight: 300;">رفع بواسطة: ${doc.user_name}</span>
                ${canDelete ? `
                    <button class="btn btn-danger btn-small" onclick="deleteDocument(${doc.id}, ${activityId})">حذف</button>
                ` : ''}
            `;
            docsList.appendChild(docItem);
        });
    } catch (error) {
        console.error('Failed to load documents:', error);
    }
}

async function updateActivityProgress(activityId, progress) {
    try {
        const response = await fetch(API_BASE + 'activities.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: activityId,
                progress: parseFloat(progress)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadPlanDetails(currentPlanId, document.getElementById('planTitle').textContent);
        } else {
            alert(data.error || 'فشل تحديث نسبة الإنجاز');
        }
    } catch (error) {
        console.error('Failed to update progress:', error);
        alert('حدث خطأ أثناء تحديث نسبة الإنجاز');
    }
}

function showModal(content) {
    const modalBody = document.getElementById('modalBody');
    const modal = document.getElementById('modal');
    const closeModalBtn = document.getElementById('closeModal');
    
    if (!modalBody || !modal) {
        console.error('Modal elements not found');
        return;
    }
    
    modalBody.innerHTML = content;
    modal.style.display = 'block';
    
    if (closeModalBtn) {
        closeModalBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        };
    }
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeModal();
        }
    };
}

function closeModal() {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');
    
    if (modal) {
        modal.style.display = 'none';
    }
    if (modalBody) {
        modalBody.innerHTML = '';
    }
}

function showAddPlanModal() {
    const content = `
        <h2>إضافة خطة جديدة</h2>
        <form id="addPlanForm">
            <div class="form-group">
                <label>عنوان الخطة</label>
                <input type="text" name="title" required>
            </div>
            <input type="hidden" name="department_id" value="${currentDepartmentId}">
            <button type="submit" class="btn btn-primary btn-block">إضافة</button>
        </form>
    `;
    showModal(content);
    
    document.getElementById('addPlanForm').onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const response = await fetch(API_BASE + 'plans.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                closeModal();
                loadDepartment(currentDepartmentId, document.getElementById('deptName').textContent);
            } else {
                alert(data.error || 'فشل إضافة الخطة');
            }
        } catch (error) {
            console.error('Failed to add plan:', error);
            alert('حدث خطأ أثناء إضافة الخطة');
        }
    };
}

function showAddGoalModal() {
    const content = `
        <h2>إضافة هدف جديد</h2>
        <form id="addGoalForm">
            <div class="form-group">
                <label>عنوان الهدف</label>
                <textarea name="title" rows="3" required></textarea>
            </div>
            <input type="hidden" name="plan_id" value="${currentPlanId}">
            <button type="submit" class="btn btn-primary btn-block">إضافة</button>
        </form>
    `;
    showModal(content);
    
    document.getElementById('addGoalForm').onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const response = await fetch(API_BASE + 'goals.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                closeModal();
                loadPlanDetails(currentPlanId, document.getElementById('planTitle').textContent);
            } else {
                alert(data.error || 'فشل إضافة الهدف');
            }
        } catch (error) {
            console.error('Failed to add goal:', error);
            alert('حدث خطأ أثناء إضافة الهدف');
        }
    };
}

function showAddActivityModal(goalId) {
    const content = `
        <h2>إضافة نشاط جديد</h2>
        <form id="addActivityForm">
            <div class="form-group">
                <label>عنوان النشاط</label>
                <textarea name="title" rows="3" required></textarea>
            </div>
            <div class="form-group">
                <label>الموعد النهائي</label>
                <input type="date" name="deadline" required>
            </div>
            <input type="hidden" name="goal_id" value="${goalId}">
            <button type="submit" class="btn btn-primary btn-block">إضافة</button>
        </form>
    `;
    showModal(content);
    
    document.getElementById('addActivityForm').onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const response = await fetch(API_BASE + 'activities.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                closeModal();
                loadPlanDetails(currentPlanId, document.getElementById('planTitle').textContent);
            } else {
                alert(data.error || 'فشل إضافة النشاط');
            }
        } catch (error) {
            console.error('Failed to add activity:', error);
            alert('حدث خطأ أثناء إضافة النشاط');
        }
    };
}

function showUploadDocumentModal(activityId) {
    const content = `
        <h2>رفع دليل</h2>
        <form id="uploadDocumentForm" enctype="multipart/form-data">
            <div class="form-group">
                <label>اختر الملف</label>
                <input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt" required>
            </div>
            <input type="hidden" name="activity_id" value="${activityId}">
            <button type="submit" class="btn btn-primary btn-block">رفع</button>
        </form>
    `;
    showModal(content);
    
    document.getElementById('uploadDocumentForm').onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const response = await fetch(API_BASE + 'documents.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                closeModal();
                loadDocuments(activityId);
            } else {
                alert(data.error || 'فشل رفع الملف');
            }
        } catch (error) {
            console.error('Failed to upload document:', error);
            alert('حدث خطأ أثناء رفع الملف');
        }
    };
}

async function deleteGoal(goalId) {
    if (!confirm('هل أنت متأكد من حذف هذا الهدف؟')) return;
    
    try {
        const response = await fetch(API_BASE + `goals.php?id=${goalId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadPlanDetails(currentPlanId, document.getElementById('planTitle').textContent);
        } else {
            alert(data.error || 'فشل حذف الهدف');
        }
    } catch (error) {
        console.error('Failed to delete goal:', error);
        alert('حدث خطأ أثناء حذف الهدف');
    }
}

async function deleteActivity(activityId) {
    if (!confirm('هل أنت متأكد من حذف هذا النشاط؟')) return;
    
    try {
        const response = await fetch(API_BASE + `activities.php?id=${activityId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadPlanDetails(currentPlanId, document.getElementById('planTitle').textContent);
        } else {
            alert(data.error || 'فشل حذف النشاط');
        }
    } catch (error) {
        console.error('Failed to delete activity:', error);
        alert('حدث خطأ أثناء حذف النشاط');
    }
}

async function deleteDocument(docId, activityId) {
    if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return;
    
    try {
        const response = await fetch(API_BASE + `documents.php?id=${docId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadDocuments(activityId);
        } else {
            alert(data.error || 'فشل حذف الملف');
        }
    } catch (error) {
        console.error('Failed to delete document:', error);
        alert('حدث خطأ أثناء حذف الملف');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

async function init() {
    if (window.location.pathname.includes('login.html')) {
        return;
    }
    
    const authenticated = await checkAuth();
    
    if (!authenticated) {
        return;
    }
    
    const userName = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');
    const closeModalBtn = document.getElementById('closeModal');
    const addPlanBtn = document.getElementById('addPlanBtn');
    const backToDeptBtn = document.getElementById('backToDeptBtn');
    const addDeptBtn = document.getElementById('addDeptBtn');
    const manageUsersBtn = document.getElementById('manageUsersBtn');
    
    if (userName) userName.textContent = currentUser.name;
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            window.location.href = 'php/logout.php';
        };
    }
    
    if (closeModalBtn) {
        closeModalBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        };
    }
    if (addPlanBtn) addPlanBtn.onclick = showAddPlanModal;
    if (backToDeptBtn) {
        backToDeptBtn.onclick = () => {
            const deptNameEl = document.getElementById('deptName');
            if (deptNameEl && currentDepartmentId) {
                loadDepartment(currentDepartmentId, deptNameEl.textContent);
            }
        };
    }
    
    if (currentUser && currentUser.role === 'admin') {
        if (addDeptBtn) addDeptBtn.onclick = showAddDepartmentModal;
        if (manageUsersBtn) manageUsersBtn.onclick = showManageUsersModal;
    }
    
    await loadDepartments();
    
    initHeaderScroll();
    initMobileMenu();
    
    window.showAddGoalModal = () => {
        const content = `
            <h2>إضافة هدف جديد</h2>
            <form id="addGoalForm">
                <div class="form-group">
                    <label>عنوان الهدف</label>
                    <textarea name="title" rows="3" required></textarea>
                </div>
                <input type="hidden" name="plan_id" value="${currentPlanId}">
                <button type="submit" class="btn btn-primary btn-block">إضافة</button>
            </form>
        `;
        showModal(content);
        
        document.getElementById('addGoalForm').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            try {
                const response = await fetch(API_BASE + 'goals.php', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    closeModal();
                    loadPlanDetails(currentPlanId, document.getElementById('planTitle').textContent);
                } else {
                    alert(data.error || 'فشل إضافة الهدف');
                }
            } catch (error) {
                console.error('Failed to add goal:', error);
                alert('حدث خطأ أثناء إضافة الهدف');
            }
        };
    };
    
    const planDetailsView = document.getElementById('planDetailsView');
    if (planDetailsView) {
        const existingBtn = planDetailsView.querySelector('.add-goal-btn');
        if (!existingBtn) {
            const addGoalBtn = document.createElement('button');
            addGoalBtn.className = 'btn btn-primary add-goal-btn';
            addGoalBtn.textContent = 'إضافة هدف';
            addGoalBtn.onclick = window.showAddGoalModal;
            addGoalBtn.style.marginBottom = '1rem';
            addGoalBtn.style.display = (currentUser && (currentUser.role === 'admin' || currentUser.role === 'committee_head')) ? 'block' : 'none';
            const planTitle = document.getElementById('planTitle');
            if (planTitle && planTitle.nextSibling) {
                planDetailsView.insertBefore(addGoalBtn, planTitle.nextSibling);
            } else {
                planDetailsView.appendChild(addGoalBtn);
            }
        }
    }
}

function showAddDepartmentModal() {
    const content = `
        <h2>إضافة قسم جديد</h2>
        <form id="addDeptForm">
            <div class="form-group">
                <label>اسم القسم</label>
                <input type="text" name="name" required>
            </div>
            <button type="submit" class="btn btn-primary btn-block">إضافة</button>
        </form>
    `;
    showModal(content);
    
    document.getElementById('addDeptForm').onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const response = await fetch(API_BASE + 'departments.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                closeModal();
                await loadDepartments();
            } else {
                alert(data.error || 'فشل إضافة القسم');
            }
        } catch (error) {
            console.error('Failed to add department:', error);
            alert('حدث خطأ أثناء إضافة القسم');
        }
    };
}

async function showManageUsersModal() {
    try {
        const response = await fetch(API_BASE + 'users.php');
        const users = await response.json();
        
        let usersHTML = '<h2>إدارة المستخدمين</h2>';
        usersHTML += '<button class="btn btn-primary" onclick="showAddUserModal()" style="margin-bottom: 1rem;">إضافة مستخدم جديد</button>';
        usersHTML += '<div class="table-wrapper"><table><thead><tr><th>الاسم</th><th>البريد الإلكتروني</th><th>الدور</th><th>القسم</th><th>إجراءات</th></tr></thead><tbody>';
        
        users.forEach(user => {
            usersHTML += `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${getRoleName(user.role)}</td>
                    <td>${user.department_name || '-'}</td>
                    <td>
                        <button class="btn btn-danger btn-small" onclick="deleteUser(${user.id})">حذف</button>
                    </td>
                </tr>
            `;
        });
        
        usersHTML += '</tbody></table></div>';
        showModal(usersHTML);
    } catch (error) {
        console.error('Failed to load users:', error);
        alert('حدث خطأ أثناء تحميل المستخدمين');
    }
}

function getRoleName(role) {
    const roles = {
        'admin': 'أدمن',
        'committee_head': 'رئيس اللجنة',
        'faculty_member': 'عضو هيئة تدريس',
        'department_head': 'رئيس القسم'
    };
    return roles[role] || role;
}

function showAddUserModal() {
    closeModal();
    
    const content = `
        <h2>إضافة مستخدم جديد</h2>
        <form id="addUserForm">
            <div class="form-group">
                <label>الاسم</label>
                <input type="text" name="name" required>
            </div>
            <div class="form-group">
                <label>البريد الإلكتروني</label>
                <input type="email" name="email" required>
            </div>
            <div class="form-group">
                <label>كلمة المرور</label>
                <input type="password" name="password" required>
            </div>
            <div class="form-group">
                <label>الدور</label>
                <select name="role" required>
                    <option value="admin">أدمن</option>
                    <option value="committee_head">رئيس اللجنة</option>
                    <option value="faculty_member">عضو هيئة تدريس</option>
                    <option value="department_head">رئيس القسم</option>
                </select>
            </div>
            <div class="form-group">
                <label>القسم (اختياري)</label>
                <select name="department_id" id="userDeptSelect">
                    <option value="">بدون قسم</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary btn-block">إضافة</button>
        </form>
    `;
    showModal(content);
    
    fetch(API_BASE + 'departments.php').then(r => r.json()).then(depts => {
        const select = document.getElementById('userDeptSelect');
        depts.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.id;
            option.textContent = dept.name;
            select.appendChild(option);
        });
    });
    
    document.getElementById('addUserForm').onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const response = await fetch(API_BASE + 'users.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                closeModal();
                showManageUsersModal();
            } else {
                alert(data.error || 'فشل إضافة المستخدم');
            }
        } catch (error) {
            console.error('Failed to add user:', error);
            alert('حدث خطأ أثناء إضافة المستخدم');
        }
    };
}

async function deleteUser(userId) {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    
    try {
        const response = await fetch(API_BASE + `users.php?id=${userId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showManageUsersModal();
        } else {
            alert(data.error || 'فشل حذف المستخدم');
        }
    } catch (error) {
        console.error('Failed to delete user:', error);
        alert('حدث خطأ أثناء حذف المستخدم');
    }
}

let lastScrollTop = 0;
let header = null;

function initHeaderScroll() {
    header = document.querySelector('header');
    if (!header) return;
    
    let ticking = false;
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                if (window.innerWidth <= 768) {
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    
                    if (scrollTop > lastScrollTop && scrollTop > 100) {
                        header.classList.add('hidden');
                    } else {
                        header.classList.remove('hidden');
                    }
                    
                    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
                } else {
                    header.classList.remove('hidden');
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (!mobileMenuToggle || !sidebar) {
        console.log('Mobile menu elements not found');
        return;
    }
    
    mobileMenuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Menu toggle clicked');
        mobileMenuToggle.classList.toggle('active');
        sidebar.classList.toggle('mobile-open');
    });
    
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            sidebar.classList.contains('mobile-open') &&
            !sidebar.contains(e.target) && 
            !mobileMenuToggle.contains(e.target)) {
            mobileMenuToggle.classList.remove('active');
            sidebar.classList.remove('mobile-open');
        }
    });
    
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            mobileMenuToggle.classList.remove('active');
            sidebar.classList.remove('mobile-open');
        }
    });
}

window.closeModal = closeModal;
window.showAddActivityModal = showAddActivityModal;
window.showUploadDocumentModal = showUploadDocumentModal;
window.updateActivityProgress = updateActivityProgress;
window.deleteGoal = deleteGoal;
window.deleteActivity = deleteActivity;
window.deleteDocument = deleteDocument;
window.showAddUserModal = showAddUserModal;
window.deleteUser = deleteUser;

