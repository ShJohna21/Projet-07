// Variables globales
let tasks = [];
let currentFilter = 'all';
let startX = 0;
let currentSwipe = null;
let deferredPrompt = null;

// Éléments du DOM
const elements = {
    taskInput: document.getElementById('taskInput'),
    addButton: document.getElementById('addButton'),
    taskList: document.getElementById('taskList'),
    taskCount: document.getElementById('taskCount'),
    emptyState: document.getElementById('emptyState'),
    clearCompleted: document.getElementById('clearCompleted'),
    addExample: document.getElementById('addExample'),
    shareApp: document.getElementById('shareApp'),
    exportTasks: document.getElementById('exportTasks'),
    exportModal: document.getElementById('exportModal'),
    importModal: document.getElementById('importModal'),
    copyExport: document.getElementById('copyExport'),
    closeExport: document.getElementById('closeExport'),
    confirmImport: document.getElementById('confirmImport'),
    closeImport: document.getElementById('closeImport'),
    exportData: document.getElementById('exportData'),
    importData: document.getElementById('importData'),
    installPrompt: document.getElementById('installPrompt'),
    installBtn: document.getElementById('installBtn'),
    dismissInstall: document.getElementById('dismissInstall'),
    viewSource: document.getElementById('viewSource')
};

// Initialisation
function init() {
    loadTasks();
    setupEventListeners();
    checkEmptyState();
    setupServiceWorker();
}

// Service Worker pour PWA
function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('Service Worker enregistré'))
            .catch(err => console.log('Échec Service Worker:', err));
    }
}

// Événements
function setupEventListeners() {
    // Ajout de tâche
    elements.addButton.addEventListener('click', addTask);
    elements.taskInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') addTask();
    });
    
    // Filtres
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => filterTasks(btn.dataset.filter));
    });
    
    // Actions
    elements.clearCompleted.addEventListener('click', clearCompletedTasks);
    elements.addExample.addEventListener('click', addExampleTasks);
    elements.shareApp.addEventListener('click', shareApp);
    elements.exportTasks.addEventListener('click', showExportModal);
    elements.viewSource.addEventListener('click', showSourceCode);
    
    // Modales
    elements.copyExport.addEventListener('click', copyExportData);
    elements.closeExport.addEventListener('click', () => elements.exportModal.style.display = 'none');
    elements.confirmImport.addEventListener('click', importTasks);
    elements.closeImport.addEventListener('click', () => elements.importModal.style.display = 'none');
    
    // Installation PWA
    elements.installBtn.addEventListener('click', installApp);
    elements.dismissInstall.addEventListener('click', () => elements.installPrompt.style.display = 'none');
    
    // Installation PWA - détecter le prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        setTimeout(() => {
            if (deferredPrompt) {
                elements.installPrompt.style.display = 'block';
            }
        }, 3000);
    });
    
    // Partage
    if (navigator.share) {
        elements.shareApp.innerHTML = '<i class="fas fa-share"></i> Partager';
    }
}

// Gestion des tâches
function loadTasks() {
    const saved = localStorage.getItem('tasks');
    tasks = saved ? JSON.parse(saved) : [];
    updateTaskList();
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateTaskCount();
    checkEmptyState();
}

function addTask() {
    const text = elements.taskInput.value.trim();
    if (!text) {
        showToast('Entrez une tâche d\'abord!', 'warning');
        return;
    }
    
    const task = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(task); // Ajouter au début
    elements.taskInput.value = '';
    saveTasks();
    updateTaskList();
    
    // Feedback visuel
    showToast('Tâche ajoutée!', 'success');
    elements.taskInput.focus();
}

function deleteTask(id) {
    // Confirmation tactile (swipe déjà fait)
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    updateTaskList();
    showToast('Tâche supprimée', 'error');
}

function toggleTask(id) {
    tasks = tasks.map(task => 
        task.id === id ? {...task, completed: !task.completed} : task
    );
    saveTasks();
    updateTaskList();
}

function clearCompletedTasks() {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
        showToast('Aucune tâche terminée', 'info');
        return;
    }
    
    if (confirm(`Supprimer ${completedCount} tâche(s) terminée(s) ?`)) {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        updateTaskList();
        showToast(`${completedCount} tâche(s) supprimée(s)`, 'success');
    }
}

// Filtres
function filterTasks(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    updateTaskList();
}

// Mise à jour de l'interface
function updateTaskList() {
    elements.taskList.innerHTML = '';
    
    // Filtrer
    let filteredTasks = tasks;
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(t => t.completed);
    }
    
    // Afficher
    filteredTasks.forEach(task => {
        const li = createTaskElement(task);
        elements.taskList.appendChild(li);
    });
    
    updateTaskCount();
}

function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.dataset.id = task.id;
    
    // Créer le contenu
    li.innerHTML = `
        <div class="swipe-area"></div>
        <button class="complete-btn" onclick="toggleTask(${task.id})">
            <i class="fas fa-${task.completed ? 'check-circle' : 'circle'}"></i>
        </button>
        <span class="task-text">${escapeHtml(task.text)}</span>
        <div class="task-actions">
            <button class="delete-btn" onclick="deleteTask(${task.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Swipe pour mobile
    setupSwipe(li);
    
    return li;
}

// Swipe pour supprimer
function setupSwipe(element) {
    let startX = 0;
    let currentX = 0;
    let isSwiping = false;
    
    element.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        isSwiping = true;
    }, { passive: true });
    
    element.addEventListener('touchmove', e => {
        if (!isSwiping) return;
        currentX = e.touches[0].clientX - startX;
        
        // Limiter le swipe à 80px
        if (currentX < 0 && currentX > -80) {
            element.style.transform = `translateX(${currentX}px)`;
            element.classList.add('swiping');
        }
    }, { passive: true });
    
    element.addEventListener('touchend', () => {
        if (!isSwiping) return;
        isSwiping = false;
        
        // Si swipe suffisant, supprimer
        if (currentX < -50) {
            const id = parseInt(element.dataset.id);
            deleteTask(id);
        } else {
            // Sinon, revenir
            element.style.transform = '';
            element.classList.remove('swiping');
        }
        
        startX = 0;
        currentX = 0;
    });
}

function updateTaskCount() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    
    if (total === 0) {
        elements.taskCount.textContent = '0 tâche';
    } else if (completed === total) {
        elements.taskCount.textContent = `${total} tâche(s) - Bravo !`;
    } else {
        elements.taskCount.textContent = `${active} active(s), ${completed} terminée(s)`;
    }
}

function checkEmptyState() {
    const filteredTasks = getFilteredTasks();
    if (filteredTasks.length === 0) {
        elements.emptyState.style.display = 'block';
        elements.taskList.style.display = 'none';
    } else {
        elements.emptyState.style.display = 'none';
        elements.taskList.style.display = 'block';
    }
}

function getFilteredTasks() {
    if (currentFilter === 'active') return tasks.filter(t => !t.completed);
    if (currentFilter === 'completed') return tasks.filter(t => t.completed);
    return tasks;
}

// Exemples
function addExampleTasks() {
    const examples = [
        "Acheter du pain",
        "Appeler le médecin",
        "Payer les factures",
        "Faire du sport",
        "Lire un livre"
    ];
    
    examples.forEach(text => {
        const task = {
            id: Date.now() + Math.random(),
            text: text,
            completed: Math.random() > 0.7,
            createdAt: new Date().toISOString()
        };
        tasks.unshift(task);
    });
    
    saveTasks();
    updateTaskList();
    showToast('Exemples ajoutés!', 'success');
}

// Export/Import
function showExportModal() {
    const data = JSON.stringify(tasks, null, 2);
    elements.exportData.value = data;
    elements.exportModal.style.display = 'flex';
}

function copyExportData() {
    elements.exportData.select();
    document.execCommand('copy');
    showToast('Copié dans le presse-papier!', 'success');
}

function importTasks() {
    try {
        const data = JSON.parse(elements.importData.value);
        if (Array.isArray(data)) {
            tasks = data;
            saveTasks();
            updateTaskList();
            elements.importModal.style.display = 'none';
            elements.importData.value = '';
            showToast('Tâches importées!', 'success');
        } else {
            throw new Error('Format invalide');
        }
    } catch (error) {
        showToast('Erreur d\'import: format JSON invalide', 'error');
    }
}

// Partage
async function shareApp() {
    const shareData = {
        title: 'Mon Gestionnaire de Tâches',
        text: 'Découvrez cette super app de gestion de tâches!',
        url: window.location.href
    };
    
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            // Fallback pour desktop
            await navigator.clipboard.writeText(window.location.href);
            showToast('Lien copié dans le presse-papier!', 'success');
        }
    } catch (err) {
        console.log('Erreur de partage:', err);
    }
}

// Installation PWA
async function installApp() {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        showToast('Application installée!', 'success');
        elements.installPrompt.style.display = 'none';
    }
    
    deferredPrompt = null;
}

function showSourceCode() {
    window.open('https://github.com', '_blank');
}

// Utilitaires
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    // Créer un toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#ff4757' : '#4a6fa5'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 10000;
        animation: fadeInOut 3s ease-in-out;
    `;
    
    document.body.appendChild(toast);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s ease-out';
        setTimeout(() => toast.remove(), 500);
    }, 2500);
}

// Style CSS pour l'animation du toast
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-20px); }
        15% { opacity: 1; transform: translateY(0); }
        85% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// Démarrer l'app
document.addEventListener('DOMContentLoaded', init);

// Service Worker (fichier sw.js à créer)
// Créez un fichier sw.js avec ce contenu:
// self.addEventListener('install', e => {
//     console.log('Service Worker installé');
// });
// self.addEventListener('fetch', e => {
//     console.log('Fetch:', e.request.url);
// });-