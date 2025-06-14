// This is the main entry point for global scripts and helpers

const supabaseUrl = 'https://ffqgmoqawlfwluddvmfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmcWdtb3Fhd2xmd2x1ZGR2bWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2Mjc1MjAsImV4cCI6MjA2MzIwMzUyMH0.KPGYFxv1JzOhsUXXXaUequhpjiwDcBSzNG5RDVl1A3Q';

// Initialize Supabase client immediately
export const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Global function to exit the current garden
window.exitGarden = function() {
    if (confirm('האם אתה בטוח שברצונך לצאת מהגן?')) {
        // Clear session storage
        const currentGardenId = sessionStorage.getItem('currentGardenId');
        sessionStorage.clear();
        // Remove current garden from savedGardens
        if (currentGardenId) {
            let gardens = JSON.parse(localStorage.getItem('savedGardens') || '[]');
            gardens = gardens.filter(g => g.id !== currentGardenId);
            localStorage.setItem('savedGardens', JSON.stringify(gardens));
        }
        // Redirect to the home page after exiting
        window.location.href = 'index.html';
    }
};

// Helper function to format date (DD/MM/YYYY)
export function formatDate(dateInput) {
    if (!dateInput) return '';
    let year, month, day;
    if (typeof dateInput === 'string') {
        [year, month, day] = dateInput.split('-');
    } else if (dateInput instanceof Date) {
        year = dateInput.getFullYear();
        month = String(dateInput.getMonth() + 1).padStart(2, '0');
        day = String(dateInput.getDate()).padStart(2, '0');
    } else {
        return '';
    }
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

// Global function to handle new garden registration
window.startNewGardenRegistration = function() {
    // Clear session storage
    sessionStorage.clear();
    // Redirect to registration page
    window.location.href = 'register.html';
};

// --- ניהול גנים מרובים ב-localStorage --- //
function getSavedGardens() {
    return JSON.parse(localStorage.getItem('savedGardens') || '[]');
}
function saveGarden(garden) {
    const gardens = getSavedGardens();
    if (!gardens.find(g => g.id === garden.id)) {
        gardens.push(garden);
        localStorage.setItem('savedGardens', JSON.stringify(gardens));
    }
}
function removeGarden(gardenId) {
    let gardens = getSavedGardens();
    gardens = gardens.filter(g => g.id !== gardenId);
    localStorage.setItem('savedGardens', JSON.stringify(gardens));
}
function setActiveGarden(gardenId) {
    sessionStorage.setItem('currentGardenId', gardenId);
    window.location.reload();
}

// --- מסך בחירת גן --- //
function showGardenSelection(gardens) {
    // צור מודל בסיסי
    let modal = document.getElementById('gardenSelectModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'gardenSelectModal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.5)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '9999';
        document.body.appendChild(modal);
    }
    modal.innerHTML = `<div style="background:#fff;padding:2em;border-radius:10px;min-width:300px;text-align:right;max-width:90vw;">
        <h2>בחר גן</h2>
        <ul style='list-style:none;padding:0;'>
            ${gardens.map(g => `
                <li style='margin-bottom:1em;'>
                    <b>${g.name}</b><br><span style='font-size:0.9em;color:#888;'>ID: ${g.id}</span>
                    <button style='margin-right:1em;' onclick='setActiveGarden("${g.id}")'>היכנס</button>
                    <button style='color:red;' onclick='removeGardenAndRefresh("${g.id}")'>הסר</button>
                </li>`).join('')}
        </ul>
        <button onclick='clearAllGardens()' style='margin-top:1em;'>נקה הכל</button>
    </div>`;
    window.setActiveGarden = setActiveGarden;
    window.removeGardenAndRefresh = function(gardenId) {
        removeGarden(gardenId);
        modal.remove();
        const gardens = getSavedGardens();
        if (gardens.length === 1) {
            setActiveGarden(gardens[0].id);
        } else if (gardens.length > 1) {
            showGardenSelection(gardens);
        } else {
            sessionStorage.removeItem('currentGardenId');
            window.location.reload();
        }
    };
    window.clearAllGardens = function() {
        localStorage.removeItem('savedGardens');
        sessionStorage.removeItem('currentGardenId');
        modal.remove();
        window.location.reload();
    };
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('main.js DOMContentLoaded fired.');

    // Add click handlers for new garden registration links
    const registerLinks = document.querySelectorAll('a[href="register.html"]');
    registerLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.startNewGardenRegistration();
        });
    });

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
        if (gardenExitSection) gardenExitSection.style.display = 'block';

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
                // If error fetching garden, clear session and show entry options
                sessionStorage.removeItem('currentGardenId');
                window.location.reload();
            } else if (garden) {
                homeGardenName.textContent = `שם הגן: ${garden.name}`;
                const parentLink = `${window.location.origin}/children.html?gardenId=${currentGardenId}`;
                homeParentRegLink.value = parentLink;

                homeCopyGardenLinkBtn.onclick = function() {
                    const msg = `היי! מצרף קישור לרישום ילדים לגן שלנו (${garden.name}):%0A${parentLink}`;
                    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
                    window.open(waUrl, '_blank');
                    if(homeCopyGardenLinkMsg) {
                        homeCopyGardenLinkMsg.style.display = 'block';
                        setTimeout(() => { homeCopyGardenLinkMsg.style.display = 'none'; }, 3000);
                    }
                };
            } else {
                // Garden not found in Supabase, clear session and show entry options
                sessionStorage.removeItem('currentGardenId');
                window.location.reload();
            }
            if (gardenInfoAndLink) gardenInfoAndLink.style.display = 'block';
        }
    } else {
        // User is not connected to a garden
        if (registerGardenLink) registerGardenLink.style.display = 'list-item';
        if (childrenListLink) childrenListLink.style.display = 'none';
        if (gardenEntrySection) gardenEntrySection.style.display = 'block';
        if (newGardenSection) newGardenSection.style.display = 'block';
        if (gardenExitSection) gardenExitSection.style.display = 'none';
        if (gardenInfoAndLink) gardenInfoAndLink.style.display = 'none';
    }

    // Handle garden entry form submission (Supabase lookup)
    const gardenEntryForm = document.getElementById('gardenEntryForm');
    if (gardenEntryForm) {
        gardenEntryForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const gardenIdInput = document.getElementById('gardenId');
            const gardenId = gardenIdInput.value.trim();

            if (!gardenId) {
                alert('אנא הזן מזהה גן.');
                return;
            }

            // Clear session storage
            sessionStorage.clear();

            // Fetch garden from Supabase using the provided ID
            const { data: garden, error } = await supabase
                .from('kindergartens')
                .select('id, name')
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
                window.location.href = 'events.html';
            } else {
                // Garden not found with this ID
                alert('מזהה הגן לא נמצא במערכת. אנא בדוק את המזהה או הירשם כגן חדש.');
            }
        });
    }

    // ניהול גנים מרובים
    const urlParams = new URLSearchParams(window.location.search);
    const gardenIdFromUrl = urlParams.get('gardenId');
    let savedGardens = getSavedGardens();
    if (gardenIdFromUrl) {
        // אם נכנסו עם gardenId ב-URL, נבדוק אם קיים ואם לא נוסיף
        // נביא את שם הגן מה-DB
        const { data: garden, error } = await supabase
            .from('kindergartens')
            .select('id, name')
            .eq('id', gardenIdFromUrl)
            .single();
        if (!error && garden) {
            saveGarden({ id: garden.id, name: garden.name });
            setActiveGarden(garden.id);
            return;
        }
    }
    savedGardens = getSavedGardens();
    if (savedGardens.length > 1) {
        showGardenSelection(savedGardens);
        return;
    } else if (savedGardens.length === 1) {
        if (sessionStorage.getItem('currentGardenId') !== savedGardens[0].id) {
            setActiveGarden(savedGardens[0].id);
            return;
        }
        // אחרת, כבר מחובר - לא לעשות כלום
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