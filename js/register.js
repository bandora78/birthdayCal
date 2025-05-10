document.addEventListener('DOMContentLoaded', () => {
    const kindergartenForm = document.getElementById('kindergartenRegistrationForm');
    const childrenList = document.getElementById('childrenList');
    const addChildForm = document.getElementById('addChildForm');
    const childrenTableBody = document.getElementById('childrenTableBody');

    // Check if we should show children list directly
    if (window.location.hash === '#childrenList') {
        const kindergartens = storage.get('kindergartens') || [];
        if (kindergartens.length > 0) {
            kindergartenForm.style.display = 'none';
            childrenList.style.display = 'block';
            loadChildren();
        } else {
            alert('יש להשלים קודם את רישום הגן');
            window.location.href = 'register.html';
        }
    }

    // Handle kindergarten registration
    kindergartenForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const kindergartenData = {
            id: Date.now(),
            name: document.getElementById('kindergartenName').value,
            schoolYear: document.getElementById('schoolYear').value,
            teacherName: document.getElementById('teacherName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value
        };

        // Save kindergarten data
        const kindergartens = storage.get('kindergartens') || [];
        kindergartens.push(kindergartenData);
        storage.set('kindergartens', kindergartens);

        // Show children list section and hide form
        childrenList.style.display = 'block';
        kindergartenForm.style.display = 'none';

        // Load existing children
        loadChildren();

        // Update URL to show children list
        window.location.hash = 'childrenList';
    });

    // Handle adding a new child
    addChildForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const childData = {
            id: Date.now(),
            name: document.getElementById('childName').value,
            birthDate: document.getElementById('birthDate').value,
            kindergartenId: storage.get('kindergartens')[0].id // Assuming single kindergarten for now
        };

        // Save child data
        const children = storage.get('children') || [];
        children.push(childData);
        storage.set('children', children);

        // Clear form and reload children list
        addChildForm.reset();
        loadChildren();
    });

    // Load and display children
    function loadChildren() {
        const children = storage.get('children') || [];
        childrenTableBody.innerHTML = '';

        children.forEach(child => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${child.name}</td>
                <td>${new Date(child.birthDate).toLocaleDateString('he-IL')}</td>
                <td>
                    <button onclick="deleteChild(${child.id})" class="delete-btn">מחק</button>
                </td>
            `;
            childrenTableBody.appendChild(row);
        });
    }

    // Delete child function
    window.deleteChild = (childId) => {
        if (confirm('האם אתה בטוח שברצונך למחוק את הילד הזה?')) {
            let children = storage.get('children') || [];
            children = children.filter(child => child.id !== childId);
            storage.set('children', children);
            loadChildren();
        }
    };

    // Check if kindergarten is already registered
    const kindergartens = storage.get('kindergartens') || [];
    if (kindergartens.length > 0) {
        kindergartenForm.style.display = 'none';
        childrenList.style.display = 'block';
        loadChildren();
        // Update URL to show children list
        window.location.hash = 'childrenList';
    }
}); 