// This is the main entry point for global scripts and helpers

const supabaseUrl = 'https://ffqgmoqawlfwluddvmfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmcWdtb3Fhd2xmd2x1ZGR2bWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2Mjc1MjAsImV4cCI6MjA2MzIwMzUyMH0.KPGYFxv1JzOhsUXXXaUequhpjiwDcBSzNG5RDVl1A3Q';

// Initialize Supabase client immediately
export const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Storage helper (keeping for now, though moving towards Supabase)
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

// Make clearStorage globally accessible
window.clearStorage = storage.clear.bind(storage);

// Global function to exit the current garden
window.exitGarden = function() {
    if (confirm('האם אתה בטוח שברצונך לצאת מהגן?')) {
        // Clear all garden-related data from session storage
        sessionStorage.clear();
        // Redirect to the home page after exiting
        window.location.href = 'index.html';
    }
};

// Helper function to format date (DD/MM/YYYY)
export function formatDate(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

// Helper function to validate date format (YYYY-MM-DD)
export function isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    const [year, month, day] = dateString.split('-').map(Number);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

// Helper function to generate a simple unique ID (client-side, for temporary use before Supabase insert)
export function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Helper function to generate a garden ID (not used anymore with Supabase UUIDs, but keeping for reference/cleanup)
export function generateGardenId() {
     // This is the old 8-character logic, no longer needed for Supabase UUIDs
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('main.js DOMContentLoaded fired.');
    
    // Initialize storage if not already done (for backward compatibility or local testing)
    if (!storage.get('isInitialized')) {
        console.log('Storage not initialized, performing initial setup.');
        storage.clear(); // This also sets isInitialized to true
    } else {
        console.log('Storage already initialized.');
    }

    // Hamburger menu toggle (keeping for now)
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navList = document.getElementById('navList');

    if (hamburgerBtn && navList) {
        hamburgerBtn.addEventListener('click', function() {
            const expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !expanded);
            navList.classList.toggle('open');
        });
    }

    // Show/hide navigation links and sections based on garden connection status
    const currentGardenId = sessionStorage.getItem('currentGardenId');
    const registerGardenLink = document.getElementById('registerGardenLink');
    const childrenListLink = document.getElementById('childrenListLink');
    const gardenEntrySection = document.getElementById('gardenEntrySection');
    const newGardenSection = document.getElementById('newGardenSection');
    const gardenExitSection = document.getElementById('gardenExitSection');
    const gardenInfoAndLink = document.getElementById('gardenInfoAndLink');

    if (currentGardenId) {
        // User is connected to a garden
        if (registerGardenLink) registerGardenLink.style.display = 'none';
        if (childrenListLink) childrenListLink.style.display = 'list-item';
        if (gardenEntrySection) gardenEntrySection.style.display = 'none';
        if (newGardenSection) newGardenSection.style.display = 'none';
        if (gardenExitSection) gardenExitSection.style.display = 'block'; // Show exit button

        // Logic for showing garden link on home page
        const homeGardenName = document.getElementById('homeGardenName');
        const homeParentRegLink = document.getElementById('homeParentRegLink');
        const homeCopyGardenLinkBtn = document.getElementById('homeCopyGardenLinkBtn');
        const homeCopyGardenLinkMsg = document.getElementById('homeCopyGardenLinkMsg');

        if (gardenInfoAndLink && homeGardenName && homeParentRegLink && homeCopyGardenLinkBtn) {
            // Fetch garden name from Supabase
            const { data: garden, error } = await supabase
                .from('kindergartens')
                .select('name')
                .eq('id', currentGardenId)
                .single();

            if (error) {
                console.error('Error fetching garden name:', error);
                homeGardenName.textContent = 'שגיאה בטעינת שם הגן';
            } else if (garden) {
                homeGardenName.textContent = `שם הגן: ${garden.name}`;
                const parentLink = `${window.location.origin}/register.html?gardenId=${currentGardenId}`;
                homeParentRegLink.value = parentLink;

                 homeCopyGardenLinkBtn.onclick = function() {
                    const msg = `היי! מצרף קישור לרישום ילדים לגן שלנו (${garden.name}):%0A${parentLink}`;
                    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`; // Use encodeURIComponent
                    window.open(waUrl, '_blank');
                    // Optional: Show a confirmation message briefly
                    if(homeCopyGardenLinkMsg) {
                         homeCopyGardenLinkMsg.style.display = 'block';
                         setTimeout(() => { homeCopyGardenLinkMsg.style.display = 'none'; }, 3000);
                    }
                };

            } else {
                homeGardenName.textContent = 'הגן לא נמצא';
                // If garden not found in Supabase, clear session and show entry options
                sessionStorage.removeItem('currentGardenId');
                window.location.reload(); // Reload to show entry options
            }
             if (gardenInfoAndLink) gardenInfoAndLink.style.display = 'block'; // Show the garden info section
        }

    } else {
        // User is not connected to a garden
        if (registerGardenLink) registerGardenLink.style.display = 'list-item';
        if (childrenListLink) childrenListLink.style.display = 'none';
        if (gardenEntrySection) gardenEntrySection.style.display = 'block'; // Show entry form
        if (newGardenSection) newGardenSection.style.display = 'block'; // Show new garden link
        if (gardenExitSection) gardenExitSection.style.display = 'none'; // Hide exit button
        if (gardenInfoAndLink) gardenInfoAndLink.style.display = 'none'; // Hide garden info section
    }

    // Handle garden entry form submission (Supabase lookup)
    const gardenEntryForm = document.getElementById('gardenEntryForm');
    if (gardenEntryForm) {
        gardenEntryForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const gardenIdInput = document.getElementById('gardenId');
            const gardenId = gardenIdInput.value.trim(); // Trim whitespace

            // Basic validation for non-empty
            if (!gardenId) {
                alert('אנא הזן מזהה גן.');
                return;
            }

            // Clear any existing garden data
            sessionStorage.clear();

            // Fetch garden from Supabase using the provided ID
            const { data: garden, error } = await supabase
                .from('kindergartens')
                .select('id, name') // Select both ID and name
                .eq('id', gardenId)
                .single();

            if (error) {
                console.error('Error fetching garden during entry:', error);
                alert('שגיאה בבדיקת מזהה הגן. אנא נסה שנית.');
                return;
            }

            if (garden) {
                // Garden found, store ID and redirect
                sessionStorage.setItem('currentGardenId', garden.id);
                alert(`ברוכים הבאים לגן ${garden.name}!`);
                window.location.href = 'events.html'; // Redirect to events page
            } else {
                // Garden not found with this ID
                alert('מזהה הגן לא נמצא במערכת. אנא בדוק את המזהה או הירשם כגן חדש.');
            }
        });
    }

    // Function to close event details section (keeping for now)
    function closeEventDetails() {
        const eventDetails = document.getElementById('eventDetails');
        if (eventDetails) eventDetails.style.display = 'none';
    }

    // Close event details when clicking the X button (keeping for now)
    const closeDetailsBtn = document.querySelector('.close-details');
    if (closeDetailsBtn) {
        closeDetailsBtn.onclick = closeEventDetails;
    }
});

// Export functions that need to be accessible from other modules
// Note: supabase is already exported directly at the top

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