// Common utility functions
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Generate unique child ID for a specific garden
function generateChildId(gardenId) {
    const children = storage.get('children') || [];
    const gardenChildren = children.filter(child => child.gardenId === gardenId);
    return gardenChildren.length + 1; // Simple sequential number
}

// Storage helper
const storage = {
    get: function(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    },
    set: function(key, value) {
        try {
            const stringifiedValue = JSON.stringify(value);
            localStorage.setItem(key, stringifiedValue);
            console.log(`storage.set: Key '${key}' set successfully in localStorage.`); // Log success
            // Verify immediately after setting
            const verifiedItem = localStorage.getItem(key);
            console.log(`storage.set: Verification for key '${key}':`, verifiedItem ? JSON.parse(verifiedItem) : null); // Verify
        } catch (error) {
            console.error(`storage.set: Error setting key '${key}' in localStorage:`, error);
        }
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