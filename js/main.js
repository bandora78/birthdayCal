// This is the main entry point for global scripts and helpers

const supabaseUrl = 'https://ffqgmoqawlfwluddvmfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmcWdtb3Fhd2xmd2x1ZGR2bWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2Mjc1MjAsImV4cCI6MjA2MzIwMzUyMH0.KPGYFxv1JzOhsUXXXaUequhpjiwDcBSzNG5RDVl1A3Q';

// Declare supabase client variable globally but initialize within DOMContentLoaded
export let supabase;

// Storage helper
const storage = {
    get: function(key) {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    },
    set: function(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    remove: function(key) {
        localStorage.removeItem(key);
        console.log(`storage.remove: Key '${key}' removed from localStorage.`); // Log removal
    },
    clear: function() {
        localStorage.clear();
        sessionStorage.clear();
        console.log('storage.clear: localStorage and sessionStorage cleared.'); // Log clear
        // Initialize storage with empty data structures
        this.set('kindergartens', []);
        this.set('children', []);
        this.set('events', []);
        this.set('isInitialized', true);
    }
};

// Generate unique child ID for a specific garden
function generateChildId(gardenId) {
    const children = storage.get('children') || [];
    const gardenChildren = children.filter(child => child.gardenId === gardenId);
    return gardenChildren.length + 1; // Simple sequential number
}

// Garden ID validation
function isValidGardenId(gardenId) {
    return gardenId && gardenId.length === 8;
}

// Debug helper
function debugStorage() {
    console.log('Kindergartens:', storage.get('kindergartens'));
    console.log('Children:', storage.get('children'));
    console.log('Current Garden ID:', sessionStorage.getItem('currentGardenId'));
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('main.js DOMContentLoaded fired.'); // Log when main.js DOMContentLoaded starts
    
    // Initialize Supabase client here to ensure the CDN library is loaded
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log('Supabase client initialized.', supabase);
    } else {
        console.error('Supabase client not available. Ensure the CDN script is loaded correctly.');
    }

    // Check if this is the first visit
    if (!storage.get('isInitialized')) {
        console.log('Storage not initialized, performing initial setup.'); // Log if initialization is needed
        // Initialize storage with empty data structures
        storage.set('kindergartens', []);
        storage.set('children', []);
        storage.set('events', []);
        storage.set('isInitialized', true);
        console.log('Storage initialized.'); // Log after initialization
    } else {
        console.log('Storage already initialized.'); // Log if storage is already initialized
    }

    // Hamburger menu toggle
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navList = document.getElementById('navList');

    if (hamburgerBtn && navList) {
        hamburgerBtn.addEventListener('click', function() {
            const expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !expanded);
            navList.classList.toggle('open');
        });
    }

    // Show/hide navigation links based on garden connection
    const currentGardenId = sessionStorage.getItem('currentGardenId');
    const registerGardenLink = document.getElementById('registerGardenLink');
    const childrenListLink = document.getElementById('childrenListLink');

    if (currentGardenId) {
        // User is connected to a garden
        if (registerGardenLink) registerGardenLink.style.display = 'none';
        if (childrenListLink) childrenListLink.style.display = 'list-item'; // Or 'block', etc. depending on your CSS

        // Hide garden entry and new garden sections, show exit button
        const gardenEntrySection = document.getElementById('gardenEntrySection');
        const newGardenSection = document.getElementById('newGardenSection');
        const gardenExitSection = document.getElementById('gardenExitSection');
        
        if (gardenEntrySection) gardenEntrySection.style.display = 'none';
        if (newGardenSection) newGardenSection.style.display = 'none';
        if (gardenExitSection) gardenExitSection.style.display = 'block';

        // --- Add logic for showing garden link on home page ---
        const gardenInfoAndLink = document.getElementById('gardenInfoAndLink');
        const homeGardenName = document.getElementById('homeGardenName');
        const homeParentRegLink = document.getElementById('homeParentRegLink');
        const homeCopyGardenLinkBtn = document.getElementById('homeCopyGardenLinkBtn');
        const homeCopyGardenLinkMsg = document.getElementById('homeCopyGardenLinkMsg');

        if (gardenInfoAndLink && homeGardenName && homeParentRegLink && homeCopyGardenLinkBtn) {
            gardenInfoAndLink.style.display = 'block'; // Show the section

            const kindergartens = storage.get('kindergartens') || [];
            const currentGarden = kindergartens.find(k => k.gardenId === currentGardenId);

            if (currentGarden) {
                homeGardenName.textContent = `שם הגן: ${currentGarden.name}`;
                const parentLink = `${window.location.origin}/register.html?gardenId=${currentGardenId}`;
                homeParentRegLink.value = parentLink;

                homeCopyGardenLinkBtn.onclick = function() {
                    const msg = `היי! מצרף קישור לרישום ילדים לגן שלנו (${currentGarden.name}):%0A${parentLink}`;
                    const waUrl = `https://wa.me/?text=${msg}`;
                    window.open(waUrl, '_blank');
                    // Optional: Show a confirmation message briefly
                    if(homeCopyGardenLinkMsg) {
                         homeCopyGardenLinkMsg.style.display = 'block';
                         setTimeout(() => { homeCopyGardenLinkMsg.style.display = 'none'; }, 3000);
                    }
                };
            }
        }
        // --- End logic for showing garden link ---

    } else {
        // User is not connected to a garden
        if (registerGardenLink) registerGardenLink.style.display = 'list-item'; // Or 'block', etc.
        if (childrenListLink) childrenListLink.style.display = 'none';

        // Show garden entry and new garden sections, hide exit button
        const gardenEntrySection = document.getElementById('gardenEntrySection');
        const newGardenSection = document.getElementById('newGardenSection');
        const gardenExitSection = document.getElementById('gardenExitSection');
        
        if (gardenEntrySection) gardenEntrySection.style.display = 'block';
        if (newGardenSection) newGardenSection.style.display = 'block';
        if (gardenExitSection) gardenExitSection.style.display = 'none';
    }
});

// Global functions for children management
window.loadChildren = function() {
    const children = storage.get('children') || [];
    const currentGardenId = sessionStorage.getItem('currentGardenId');
    const gardenChildren = children.filter(child => child.gardenId === currentGardenId);
    
    const tbody = document.getElementById('childrenTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    gardenChildren.forEach(child => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${child.name}</td>
            <td>${child.parentName}</td>
            <td>${window.formatDate(child.birthDate)}</td>
            <td>
                <button onclick="editChild('${child.id}')" class="edit-btn">ערוך</button>
                <button onclick="deleteChild('${child.id}')" class="delete-btn">מחק</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.editChild = function(childId) {
    const children = storage.get('children') || [];
    const child = children.find(c => c.id === childId);
    if (!child) return;

    const newName = prompt('שם הילד:', child.name);
    if (!newName) return;

    const newParentName = prompt('שם ההורה:', child.parentName);
    if (!newParentName) return;

    const newBirthDate = prompt('תאריך לידה (YYYY-MM-DD):', child.birthDate);
    if (!newBirthDate) return;

    // Validate date format
    if (!window.isValidDate(newBirthDate)) {
        alert('תאריך לא תקין. אנא השתמש בפורמט YYYY-MM-DD');
        return;
    }

    // Update child in storage
    child.name = newName;
    child.parentName = newParentName;
    child.birthDate = newBirthDate;
    storage.set('children', children);

    // Reload children list
    window.loadChildren();
};

window.deleteChild = function(childId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הילד?')) return;

    const children = storage.get('children') || [];
    const updatedChildren = children.filter(c => c.id !== childId);
    storage.set('children', updatedChildren);

    // Reload children list
    window.loadChildren();
};

// Utility functions
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
}

export function isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

export function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

export function generateGardenId() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
} 