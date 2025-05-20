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
        localStorage.setItem(key, JSON.stringify(value));
    },
    remove: (key) => {
        localStorage.removeItem(key);
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
    // Check if this is the first visit
    if (!storage.get('isInitialized')) {
        // Initialize storage with empty data structures
        storage.set('kindergartens', []);
        storage.set('children', []);
        storage.set('events', []);
        storage.set('isInitialized', true);
    }
}); 