// This file handles the children list page logic

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

document.addEventListener('DOMContentLoaded', () => {
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

    // Load garden data
    const kindergartens = storage.get('kindergartens') || [];
    const currentGarden = kindergartens.find(k => k.gardenId === currentGardenId);
    
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
            const registrationLink = `${window.location.origin}${window.location.pathname}?gardenId=${currentGardenId}`;
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

    // Handle form submission
    childForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const childIdInput = document.getElementById('childId'); // Get reference inside submit handler
        const childData = {
            id: childIdInput.value || window.generateId(),
            gardenId: currentGardenId,
            name: document.getElementById('childName').value,
            parentName: document.getElementById('parentName').value,
            birthDate: document.getElementById('birthDate').value
        };

        const children = storage.get('children') || [];
        
        if (childIdInput.value) {
            // Edit existing child
            const index = children.findIndex(c => c.id === childIdInput.value);
            if (index !== -1) {
                children[index] = childData;
            }
        } else {
            // Add new child
            children.push(childData);
        }

        storage.set('children', children);
        window.loadChildren();
        window.closeModal(); // Use global closeModal
    });

    // Load and display children
    window.loadChildren();

    // Add child button click handler
    const addChildBtn = document.getElementById('addChildBtn');
    if (addChildBtn) {
        addChildBtn.onclick = () => window.showModal('הוספת ילד חדש'); // Use global showModal
    }
});

// Global functions for children management
window.editChild = function(childId) {
    const children = storage.get('children') || [];
    const child = children.find(c => c.id === childId);
    if (child) {
        window.showModal('עריכת ילד', child); // Use global showModal
    }
};

window.deleteChild = function(childId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הילד?')) return;

    const children = storage.get('children') || [];
    const updatedChildren = children.filter(c => c.id !== childId);
    storage.set('children', updatedChildren);

    // Reload children list
    window.loadChildren();
}; 