// This file handles the children list page logic

console.log('children.js script started'); // Add log at the very beginning

// Import necessary modules
import { supabase } from './main.js';
// import { storage } from './main.js'; // We will replace storage usage
import { formatDate } from './main.js'; // Import formatDate
import { isValidDate } from './main.js'; // Import isValidDate

// Global functions for modal management
window.showModal = function(title, childData = null) {
    console.log('showModal called with title:', title, 'and data:', childData); // Log entry
    const modal = document.getElementById('childFormModal');
    console.log('Modal element found:', modal); // Log modal element
    const modalTitle = document.getElementById('modalTitle');
    const childForm = document.getElementById('childForm');
    const childIdInput = document.getElementById('childId');

    // Initialize or reinitialize Flatpickr
    let birthDatePicker = document.querySelector("#birthDate")._flatpickr;
    if (!birthDatePicker) {
        birthDatePicker = flatpickr("#birthDate", {
            locale: "he",
            dateFormat: "Y-m-DD", // Ensure date format is correct for Flatpickr
            maxDate: "today",
            disableMobile: "true",
            theme: "material_blue"
        });
    }

    modalTitle.textContent = title;
    if (childData) {
        // When editing, populate form fields using the mapped data keys
        childIdInput.value = childData.id;
        document.getElementById('childName').value = childData.name;
        document.getElementById('parentName').value = childData.parentName; // Use parentName
        birthDatePicker.setDate(childData.birthDate); // Use birthDate
    } else {
        // When adding new, reset form
        childForm.reset();
        childIdInput.value = '';
        birthDatePicker.clear();
    }
    modal.style.display = 'block';
};

window.closeModal = function() {
    const modal = document.getElementById('childFormModal');
    const childForm = document.getElementById('childForm');
    const birthDatePicker = document.querySelector("#birthDate")._flatpickr;

    modal.style.display = 'none';
    childForm.reset();
    if (birthDatePicker) {
        birthDatePicker.clear();
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded in children.js fired'); // Log DOMContentLoaded
    // Check if we have a gardenId in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const gardenIdFromUrl = urlParams.get('gardenId');
    
    // אם נכנסו עם gardenId ב-URL, בצע חיבור לגן (כמו ב-index)
    if (gardenIdFromUrl) {
        // בדוק אם זה גן אחר מהנוכחי
        if (sessionStorage.getItem('currentGardenId') !== gardenIdFromUrl) {
            // נביא את שם הגן מה-DB
            try {
                const { data: garden, error } = await supabase
                    .from('kindergartens')
                    .select('id, name')
                    .eq('id', gardenIdFromUrl)
                    .single();
                if (!error && garden) {
                    sessionStorage.setItem('currentGardenId', garden.id);
                    // שמור גם ב-localStorage (savedGardens)
                    let gardens = JSON.parse(localStorage.getItem('savedGardens') || '[]');
                    if (!gardens.find(g => g.id === garden.id)) {
                        gardens.push({ id: garden.id, name: garden.name });
                        localStorage.setItem('savedGardens', JSON.stringify(gardens));
                    }
                } else {
                    alert('מזהה הגן לא נמצא במערכת. אנא בדוק את המזהה או הירשם כגן חדש.');
                    window.location.href = 'index.html';
                    return;
                }
            } catch (err) {
                alert('שגיאה בחיבור לגן.');
                window.location.href = 'index.html';
                return;
            }
        }
    }

    const currentGardenId = sessionStorage.getItem('currentGardenId');
    if (!currentGardenId) {
        alert('יש לבחור גן קודם');
        window.location.href = 'index.html';
        return;
    }

    // Load garden data from Supabase
    const { data: kindergartens, error } = await supabase
        .from('kindergartens')
        .select('name')
        .eq('id', currentGardenId)
        .single();
    
    if (error) {
        console.error('Error fetching garden data:', error);
        if (error.message && error.message.includes('Failed to fetch')) {
            alert('לא ניתן להתחבר לשרת. בדוק חיבור לאינטרנט או נסה לרענן את הדף.');
        } else {
            alert('שגיאה בטעינת פרטי הגן.');
        }
        return;
    }

    // Check if a garden was found with the current ID
    const currentGarden = kindergartens;

    if (currentGarden) {
        // Update garden name display
        const gardenNameDisplay = document.getElementById('gardenNameDisplay');
        if (gardenNameDisplay) {
            gardenNameDisplay.textContent = currentGarden.name;
        }

        // Show garden info section
        const gardenInfoSection = document.getElementById('gardenInfoAndLink');
        if (gardenInfoSection) {
            gardenInfoSection.style.display = 'block';
        }

        // Update parent registration link
        const parentRegLink = document.getElementById('parentRegLink');
        if (parentRegLink) {
            const registrationLink = `${window.location.origin}/children.html?gardenId=${currentGardenId}`;
            parentRegLink.value = registrationLink;
        }

        // Copy link functionality
        const copyGardenLinkBtn = document.getElementById('copyGardenLinkBtn');
        const copyGardenLinkMsg = document.getElementById('copyGardenLinkMsg');
        if (copyGardenLinkBtn && copyGardenLinkMsg) {
            copyGardenLinkBtn.addEventListener('click', () => {
                parentRegLink.select();
                document.execCommand('copy');
                copyGardenLinkMsg.style.display = 'block';
                setTimeout(() => {
                    copyGardenLinkMsg.style.display = 'none';
                }, 2000);
            });
        }
        window.loadChildren();
    } else {
        alert('הגן לא נמצא במערכת. אנא וודא את מזהה הגן.');
        window.location.href = 'index.html';
        return;
    }

    // Initialize Flatpickr for date picker
    const birthDatePicker = flatpickr("#birthDate", {
        locale: "he",
        dateFormat: "Y-m-d",
        maxDate: "today",
        disableMobile: "true",
        theme: "material_blue"
    });

    // Modal elements
    const modal = document.getElementById('childFormModal');
    const closeBtn = document.querySelector('.close');
    const childForm = document.getElementById('childForm');

    // Close modal when clicking the X button
    if (closeBtn) {
        closeBtn.onclick = window.closeModal;
    }

    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target === modal) {
            window.closeModal();
        }
    }

    // Handle form submission
    childForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const childIdInput = document.getElementById('childId');
        const childId = childIdInput.value;

        const childData = {
            garden_id: currentGardenId,
            name: document.getElementById('childName').value,
            parent_name: document.getElementById('parentName').value,
            birth_date: document.getElementById('birthDate').value
        };

        let operationError = null;

        if (childId) {
            // Edit existing child
            const { error } = await supabase
                .from('children')
                .update(childData)
                .eq('id', childId);
            operationError = error;
            if (!error) alert('פרטי הילד עודכנו בהצלחה!');
        } else {
            // Add new child
            const { error } = await supabase
                .from('children')
                .insert([childData]);
            operationError = error;
            if (!error) alert('הילד נוסף בהצלחה!');
        }

        if (operationError) {
            console.error('Error saving child:', operationError);
            alert('שגיאה בשמירת פרטי הילד. אנא נסה שנית.');
            return;
        }

        // Reload children list and close modal
        window.loadChildren();
        window.closeModal();
    });

    // Add child button click handler
    const addChildBtn = document.getElementById('addChildBtn');
    console.log('addChildBtn element found:', addChildBtn); // Log button element
    if (addChildBtn) {
        addChildBtn.addEventListener('click', () => {
            console.log('addChildBtn clicked'); // Log button click
            window.showModal('הוספת ילד חדש');
        });
    }

    console.log('children.js DOMContentLoaded event listeners attached.'); // Log after attaching listeners
});

// Global functions for children management

// Edit child function
window.editChild = async function(childId) {
    console.log('Attempting to fetch child for edit with ID:', childId); // Log attempt
    // Fetch child data from Supabase
    const { data: child, error } = await supabase
        .from('children')
        .select('id, name, parent_name, birth_date')
        .eq('id', childId)
        .single();

    if (error) {
        console.error('Error fetching child for edit:', error);
        alert('שגיאה בטעינת פרטי הילד לעריכה.');
        return;
    }

    if (child) {
        console.log('Child data fetched from Supabase:', child); // Log fetched data
        // Map Supabase data fields to existing function expectations
        const childDataForModal = {
            id: child.id,
            name: child.name,
            parentName: child.parent_name, // Ensure correct mapping
            birthDate: child.birth_date // Ensure correct mapping
        };
        console.log('Data prepared for modal:', childDataForModal); // Log data for modal
        window.showModal('עריכת ילד', childDataForModal);
    } else {
        console.warn('Child not found for edit:', childId);
        alert('הילד לא נמצא.');
    }
};

// Delete child function (will be updated to use Supabase DELETE)
window.deleteChild = async function(childId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק ילד זה?')) return;

    // Delete child from Supabase
    const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', childId);

    if (error) {
        console.error('Error deleting child:', error);
        alert('שגיאה במחיקת הילד. אנא נסה שנית.');
        return;
    }

    alert('הילד נמחק בהצלחה!');
    // Reload children list after deletion
    window.loadChildren();
};

// Load and display children from Supabase
window.loadChildren = async function() {
    const currentGardenId = sessionStorage.getItem('currentGardenId');
    const tbody = document.getElementById('childrenTableBody');

    if (!currentGardenId || !tbody) {
        console.warn('Cannot load children: Garden ID or table body not available.');
        return;
    }

    // Fetch children from Supabase for the current garden
    const { data: children, error } = await supabase
        .from('children')
        .select('id, name, parent_name, birth_date, garden_id')
        .eq('garden_id', currentGardenId)
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching children:', error);
        alert('שגיאה בטעינת רשימת הילדים. אנא נסה שנית.');
        tbody.innerHTML = '<tr><td colspan="4">שגיאה בטעינת הילדים.</td></tr>';
        return;
    }

    // Clear current table rows
    tbody.innerHTML = '';

    // Populate table with children data from Supabase
    if (children && children.length > 0) {
        children.forEach(child => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${child.name}</td>
                <td>${child.parent_name}</td>
                <td>${formatDate(child.birth_date)}</td>
                <td>
                    <button onclick="window.editChild('${child.id}')" class="edit-btn">ערוך</button>
                    <button onclick="window.deleteChild('${child.id}')" class="delete-btn">מחק</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        // Display a message if no children are found
        tbody.innerHTML = '<tr><td colspan="4">לא נמצאו ילדים בגן זה.</td></tr>';
    }
}; 