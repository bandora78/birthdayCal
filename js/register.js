document.addEventListener('DOMContentLoaded', () => {
    // Get form elements
    const kindergartenForm = document.getElementById('kindergartenRegistrationForm');
    const registrationForm = document.getElementById('registrationForm');
    const childrenContainer = document.getElementById('childrenContainer');
    const addChildBtn = document.getElementById('addChildBtn');
    const gardenLinkSection = document.getElementById('gardenLinkSection');
    const childrenList = document.getElementById('childrenList');
    const addChildForm = document.getElementById('addChildForm');
    const childrenTableBody = document.getElementById('childrenTableBody');
    const gardenIdDisplay = document.getElementById('gardenIdDisplay');
    const parentRegLink = document.getElementById('parentRegLink');
    const copyParentLinkBtn = document.getElementById('copyParentLinkBtn');
    const copyParentLinkMsg = document.getElementById('copyParentLinkMsg');
    
    let childCount = 1;
    let currentGardenId = null;
    
    // Clear hash on load to prevent automatic redirection
    if (window.location.hash && !window.location.search) {
        history.replaceState(null, '', window.location.pathname);
    }

    // Check if we should show children list directly
    if (window.location.hash === '#childrenList') {
        const kindergartens = storage.get('kindergartens') || [];
        if (kindergartens.length > 0) {
            kindergartenForm.style.display = 'none';
            childrenList.style.display = 'block';
            const lastKindergarten = kindergartens[kindergartens.length - 1];
            currentGardenId = lastKindergarten.gardenId;
            sessionStorage.setItem('currentGardenId', currentGardenId);
            
            // Show garden ID in admin mode
            gardenLinkSection.style.display = 'block';
            gardenIdDisplay.textContent = currentGardenId;
            const parentLink = `${window.location.origin}/children.html?gardenId=${currentGardenId}`;
            parentRegLink.value = parentLink;
            
            loadChildren();
        } else {
            alert('יש להשלים קודם את רישום הגן');
            window.location.href = 'register.html';
        }
    }

    // Check if we have a gardenId in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const gardenIdFromUrl = urlParams.get('gardenId');

    if (gardenIdFromUrl) {
        // If we have a gardenId in the URL, we're in parent registration mode
        sessionStorage.setItem('currentGardenId', gardenIdFromUrl);
        kindergartenForm.style.display = 'none';
        gardenLinkSection.style.display = 'none';
        childrenList.style.display = 'block';
        loadChildren();
    } else {
        // We're in garden registration mode
        kindergartenForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const kindergartenName = document.getElementById('kindergartenName').value;
            const schoolYear = document.getElementById('schoolYear').value;
            const teacherName = document.getElementById('teacherName').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            
            // Generate a unique garden ID
            const gardenId = generateGardenId();
            
            // Create new kindergarten object
            const newKindergarten = {
                gardenId,
                name: kindergartenName,
                schoolYear,
                teacherName,
                email,
                phone
            };
            
            // Save to storage
            const kindergartens = storage.get('kindergartens') || [];
            kindergartens.push(newKindergarten);
            storage.set('kindergartens', kindergartens);
            
            // Store current garden ID in session storage
            sessionStorage.setItem('currentGardenId', gardenId);
            
            // Show success message and garden link
            kindergartenForm.style.display = 'none';
            gardenLinkSection.style.display = 'block';
            childrenList.style.display = 'block';
            
            // Display garden ID
            gardenIdDisplay.textContent = gardenId;
            
            // Create and display parent registration link
            const registrationLink = `${window.location.origin}/children.html?gardenId=${gardenId}`;
            parentRegLink.value = registrationLink;
            
            // Copy link functionality
            copyParentLinkBtn.addEventListener('click', () => {
                parentRegLink.select();
                document.execCommand('copy');
                copyParentLinkMsg.style.display = 'block';
                setTimeout(() => {
                    copyParentLinkMsg.style.display = 'none';
                }, 2000);
            });
        });
    }

    // Check if kindergarten is already registered (admin mode)
    const kindergartens = storage.get('kindergartens') || [];
    if (kindergartens.length > 0 && !gardenIdFromUrl && !window.location.hash) {
        const lastKindergarten = kindergartens[kindergartens.length - 1];
        currentGardenId = lastKindergarten.gardenId;
        sessionStorage.setItem('currentGardenId', currentGardenId);
        
        // Show garden ID and parent link
        gardenLinkSection.style.display = 'block';
        gardenIdDisplay.textContent = currentGardenId;
        const parentLink = `${window.location.origin}/children.html?gardenId=${currentGardenId}`;
        parentRegLink.value = parentLink;
        
        // Copy link functionality
        copyParentLinkBtn.addEventListener('click', () => {
            parentRegLink.select();
            document.execCommand('copy');
            copyParentLinkMsg.style.display = 'block';
            setTimeout(() => {
                copyParentLinkMsg.style.display = 'none';
            }, 2000);
        });
        
        // Hide form, show children list
        kindergartenForm.style.display = 'none';
        childrenList.style.display = 'block';
        
        // Load children for current garden
        loadChildren();
    }
});

function generateGardenId() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
}

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
            <td>${formatDate(child.birthDate)}</td>
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
    if (!isValidDate(newBirthDate)) {
        alert('תאריך לא תקין. אנא השתמש בפורמט YYYY-MM-DD');
        return;
    }

    // Update child in storage
    child.name = newName;
    child.parentName = newParentName;
    child.birthDate = newBirthDate;
    storage.set('children', children);

    // Reload children list
    loadChildren();
};

window.deleteChild = function(childId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הילד?')) return;

    const children = storage.get('children') || [];
    const updatedChildren = children.filter(c => c.id !== childId);
    storage.set('children', updatedChildren);

    // Reload children list
    loadChildren();
};

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
}

function isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
} 