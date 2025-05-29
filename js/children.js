// This file handles the children list page logic

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

    // Load and display children
    loadChildren();

    // Add child button click handler
    const addChildBtn = document.getElementById('addChildBtn');
    if (addChildBtn) {
        addChildBtn.onclick = function() {
            const childName = prompt('הזן את שם הילד:');
            if (!childName) return;

            const parentName = prompt('הזן את שם ההורה:');
            if (!parentName) return;

            const birthDate = prompt('הזן את תאריך הלידה (YYYY-MM-DD):');
            if (!birthDate) return;

            // Validate date format
            if (!isValidDate(birthDate)) {
                alert('תאריך לא תקין. אנא השתמש בפורמט YYYY-MM-DD');
                return;
            }

            // Add child to storage
            const children = storage.get('children') || [];
            const newChild = {
                id: generateId(),
                gardenId: currentGardenId,
                name: childName,
                parentName: parentName,
                birthDate: birthDate
            };
            children.push(newChild);
            storage.set('children', children);

            // Reload children list
            loadChildren();
        };
    }
});

function loadChildren() {
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
}

// Make these functions global
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

function generateId() {
    return Math.random().toString(36).substr(2, 9);
} 