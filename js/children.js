// This file handles the children list page logic

// Import necessary modules
import { supabase } from './main.js';
// import { storage } from './main.js'; // We will replace storage usage
import { generateId } from './main.js'; // Assuming generateId is still needed for local use or new children before saving
import { formatDate } from './main.js'; // Import formatDate
import { isValidDate } from './main.js'; // Import isValidDate

// Global functions for modal management
window.showModal = function(title, childData = null) {
    const modal = document.getElementById('childFormModal');
    const modalTitle = document.getElementById('modalTitle');
    const childForm = document.getElementById('childForm');
    const childIdInput = document.getElementById('childId');
    const birthDatePicker = flatpickr("#birthDate", { // Re-initialize or get instance if needed, for now assuming it's available
        locale: "he",
        dateFormat: "Y-m-d",
        maxDate: "today",
        disableMobile: "true",
        theme: "material_blue"
    });

    modalTitle.textContent = title;
    if (childData) {
        childIdInput.value = childData.id;
        document.getElementById('childName').value = childData.name;
        document.getElementById('parentName').value = childData.parentName;
        birthDatePicker.setDate(childData.birthDate);
    } else {
        childForm.reset();
        childIdInput.value = '';
        birthDatePicker.clear();
    }
    modal.style.display = 'block';
};

window.closeModal = function() {
    const modal = document.getElementById('childFormModal');
    const childForm = document.getElementById('childForm');
    const birthDatePicker = document.querySelector("#birthDate")._flatpickr; // Get Flatpickr instance

    modal.style.display = 'none';
    childForm.reset();
    if (birthDatePicker) { // Clear date picker only if instance is found
        birthDatePicker.clear();
    }
};

document.addEventListener('DOMContentLoaded', async () => { // Made async to allow await calls
    // Check if we have a gardenId in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const gardenIdFromUrl = urlParams.get('gardenId');
    
    // If we have a gardenId in the URL, set it in sessionStorage
    if (gardenIdFromUrl) {
        sessionStorage.setItem('currentGardenId', gardenIdFromUrl);
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
        .select('name') // Select only the name
        .eq('id', currentGardenId) // Filter by the current garden ID
        .single(); // Expecting only one result
    
    if (error) {
        console.error('Error fetching garden data:', error);
        alert('שגיאה בטעינת פרטי הגן.');
        // Decide how to handle this error - maybe redirect or show a message
        return; // Stop further execution if garden data cannot be loaded
    }

    // Check if a garden was found with the current ID
    const currentGarden = kindergartens; // Since we used .single(), data is the object or null

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

        // Update parent registration link (using the garden ID from session/URL)
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
    } else {
         // Garden ID is in session/URL but no matching garden found in Supabase
         alert('הגן לא נמצא במערכת. אנא וודא את מזהה הגן.');
         window.location.href = 'index.html'; // Redirect to home or registration
         return; // Stop further execution
    }

    // Initialize Flatpickr for date picker
    // Moved Flatpickr initialization inside DOMContentLoaded to ensure the input field exists
    const birthDatePicker = flatpickr("#birthDate", {
        locale: "he",
        dateFormat: "Y-m-d",
        maxDate: "today",
        disableMobile: "true",
        theme: "material_blue"
    });

    // Modal elements - Get references inside DOMContentLoaded
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

    // Handle form submission (will be updated to use Supabase INSERT/UPDATE)
    childForm.addEventListener('submit', async (e) => { // Made async
        e.preventDefault();

        const childIdInput = document.getElementById('childId'); // Get reference inside submit handler
        const childId = childIdInput.value; // Get the existing child ID if in edit mode

        const childData = {
            // id is generated by Supabase on INSERT
            garden_id: currentGardenId, // Link child to current garden by ID
            name: document.getElementById('childName').value,
            parent_name: document.getElementById('parentName').value, // Use parent_name column name
            birth_date: document.getElementById('birthDate').value // Use birth_date column name
        };

        let operationError = null;

        if (childId) {
            // Edit existing child (Supabase UPDATE)
            const { error } = await supabase
                .from('children')
                .update(childData) // Data to update
                .eq('id', childId); // Condition to find the child
            operationError = error;
            if (!error) alert('פרטי הילד עודכנו בהצלחה!');

        } else {
            // Add new child (Supabase INSERT)
            const { error } = await supabase
                .from('children')
                .insert([childData]); // Data to insert (as an array)
            operationError = error;
             if (!error) alert('הילד נוסף בהצלחה!');
        }

        if (operationError) {
            console.error('Error saving child:', operationError);
            alert('שגיאה בשמירת פרטי הילד. אנא נסה שנית.');
            return;
        }

        // Reload children list and close modal after successful operation
        window.loadChildren(); // Call the updated function
        window.closeModal(); // Use global closeModal
    });

    // Load and display children (call the updated function)
    window.loadChildren();

    // Add child button click handler
    const addChildBtn = document.getElementById('addChildBtn');
    if (addChildBtn) {
        addChildBtn.onclick = () => window.showModal('הוספת ילד חדש'); // Use global showModal
    }
});

// Global functions for children management

// Edit child function (will be updated to use Supabase data)
window.editChild = async function(childId) { // Made async
    // Fetch child data from Supabase
    const { data: child, error } = await supabase
        .from('children')
        .select('id, name, parent_name, birth_date') // Select necessary fields
        .eq('id', childId) // Filter by child ID
        .single(); // Expecting one result

    if (error) {
        console.error('Error fetching child for edit:', error);
        alert('שגיאה בטעינת פרטי הילד לעריכה.');
        return;
    }

    if (child) {
        // Map Supabase data fields to existing function expectations
        const childDataForModal = {
            id: child.id,
            name: child.name,
            parentName: child.parent_name, // Map parent_name from Supabase
            birthDate: child.birth_date // Map birth_date from Supabase
        };
        window.showModal('עריכת ילד', childDataForModal); // Use global showModal
    } else {
        console.warn('Child not found for edit:', childId);
        alert('הילד לא נמצא.');
    }
};

// Delete child function (will be updated to use Supabase DELETE)
window.deleteChild = async function(childId) { // Made async
    if (!confirm('האם אתה בטוח שברצונך למחוק את הילד?')) return;

    // Delete child from Supabase
    const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', childId); // Condition to find the child

    if (error) {
        console.error('Error deleting child:', error);
        alert('שגיאה במחיקת הילד. אנא נסה שנית.');
        return;
    }

    alert('הילד נמחק בהצלחה!');
    // Reload children list after deletion
    window.loadChildren(); // Call the updated function
};

// Load and display children from Supabase
window.loadChildren = async function() { // Made function async
    const currentGardenId = sessionStorage.getItem('currentGardenId');
    const tbody = document.getElementById('childrenTableBody');

    if (!currentGardenId || !tbody) {
        console.warn('Cannot load children: Garden ID or table body not available.');
        return;
    }

    // Fetch children from Supabase for the current garden
    const { data: children, error } = await supabase
        .from('children')
        .select('id, name, parent_name, birth_date, garden_id') // Select required fields
        .eq('garden_id', currentGardenId) // Filter by current garden ID
        .order('name', { ascending: true }); // Order by name (optional)

    if (error) {
        console.error('Error fetching children:', error);
        alert('שגיאה בטעינת רשימת הילדים. אנא נסה שנית.');
        tbody.innerHTML = '<tr><td colspan="4">שגיאה בטעינת הילדים.</td></tr>'; // Display error message
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
                <td>${child.id}</td> <!-- Display Supabase ID -->
                <td>${formatDate(child.birth_date)}</td> <!-- Use birth_date and imported formatDate -->
                <td>${child.parent_name}</td> <!-- Use parent_name -->
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