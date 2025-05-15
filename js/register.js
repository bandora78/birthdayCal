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

    // Utility to generate unique 8-char gardenId
    function generateGardenId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';
        for (let i = 0; i < 8; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }

    // Check for gardenId in URL (parent registration mode)
    const urlParams = new URLSearchParams(window.location.search);
    const gardenIdFromUrl = urlParams.get('gardenId');
    if (gardenIdFromUrl) {
        // Hide kindergarten form, show only add child form
        document.getElementById('kindergartenRegistrationForm').style.display = 'none';
        document.getElementById('childrenList').style.display = 'block';
        document.querySelector('#childrenList h2').textContent = 'רישום ילד לגן';
        // Only allow adding child, not editing list
        loadChildren(gardenIdFromUrl);
        // Hide delete buttons for parents
        document.getElementById('childrenTable').style.display = 'none';
        // On submit, add child with gardenId
        addChildForm.onsubmit = function(e) {
            e.preventDefault();
            const childData = {
                id: Date.now(),
                name: document.getElementById('childName').value,
                birthDate: document.getElementById('birthDate').value,
                gardenId: gardenIdFromUrl
            };
            const children = storage.get('children') || [];
            children.push(childData);
            storage.set('children', children);
            addChildForm.reset();
            alert('הילד נרשם בהצלחה!');
        };
        return;
    }

    // Handle kindergarten registration
    kindergartenForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const gardenId = generateGardenId();
        const kindergartenData = {
            id: Date.now(),
            name: document.getElementById('kindergartenName').value,
            schoolYear: document.getElementById('schoolYear').value,
            teacherName: document.getElementById('teacherName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            gardenId: gardenId
        };

        // Save kindergarten data
        const kindergartens = storage.get('kindergartens') || [];
        kindergartens.push(kindergartenData);
        storage.set('kindergartens', kindergartens);

        // Show parent link section
        document.getElementById('gardenLinkSection').style.display = 'block';
        document.getElementById('gardenIdDisplay').textContent = gardenId;
        const parentLink = `${window.location.origin}${window.location.pathname}?gardenId=${gardenId}`;
        document.getElementById('parentRegLink').value = parentLink;
        document.getElementById('copyParentLinkBtn').onclick = function() {
            navigator.clipboard.writeText(parentLink).then(() => {
                document.getElementById('copyParentLinkMsg').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('copyParentLinkMsg').style.display = 'none';
                }, 1500);
            });
        };

        // Hide form, children list (admin adds children after parent reg)
        kindergartenForm.style.display = 'none';
        childrenList.style.display = 'none';
    });

    // Handle adding a new child (admin mode)
    addChildForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Get the latest kindergarten (assume only one for now)
        const kindergartens = storage.get('kindergartens') || [];
        const lastKindergarten = kindergartens[kindergartens.length - 1];
        if (!lastKindergarten) return;
        const childData = {
            id: Date.now(),
            name: document.getElementById('childName').value,
            birthDate: document.getElementById('birthDate').value,
            gardenId: lastKindergarten.gardenId
        };
        const children = storage.get('children') || [];
        children.push(childData);
        storage.set('children', children);
        addChildForm.reset();
        loadChildren(lastKindergarten.gardenId);
    });

    // Load and display children for a specific gardenId
    function loadChildren(gardenId) {
        const children = (storage.get('children') || []).filter(c => c.gardenId === gardenId);
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

    // Delete child function (admin only)
    window.deleteChild = (childId) => {
        let children = storage.get('children') || [];
        children = children.filter(child => child.id !== childId);
        storage.set('children', children);
        // Get last kindergarten for admin mode
        const kindergartens = storage.get('kindergartens') || [];
        const lastKindergarten = kindergartens[kindergartens.length - 1];
        if (lastKindergarten) loadChildren(lastKindergarten.gardenId);
    };

    // Check if kindergarten is already registered (admin mode)
    const kindergartens = storage.get('kindergartens') || [];
    if (kindergartens.length > 0 && !gardenIdFromUrl) {
        kindergartenForm.style.display = 'none';
        childrenList.style.display = 'block';
        loadChildren(kindergartens[kindergartens.length - 1].gardenId);
        window.location.hash = 'childrenList';
    }
}); 