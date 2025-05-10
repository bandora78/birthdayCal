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

// Local Storage Management
const storage = {
    get: (key) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },
    set: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    },
    remove: (key) => {
        localStorage.removeItem(key);
    }
};

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