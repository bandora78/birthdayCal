document.addEventListener('DOMContentLoaded', () => {
    const kindergartenForm = document.getElementById('kindergartenRegistrationForm');
    const childrenList = document.getElementById('childrenList');
    const gardenLinkSection = document.getElementById('gardenLinkSection');
    const addChildForm = document.getElementById('addChildForm');
    const childrenTableBody = document.getElementById('childrenTableBody');
    
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
            
            // Show garden ID in admin mode
            document.getElementById('gardenLinkSection').style.display = 'block';
            document.getElementById('gardenIdDisplay').textContent = currentGardenId;
            const parentLink = `${window.location.origin}${window.location.pathname}?gardenId=${currentGardenId}`;
            document.getElementById('parentRegLink').value = parentLink;
            
            loadChildren(currentGardenId);
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
        
        // Show garden info for parents
        const kindergartens = storage.get('kindergartens') || [];
        const garden = kindergartens.find(k => k.gardenId === gardenIdFromUrl);
        if (garden) {
            const gardenInfo = document.createElement('div');
            gardenInfo.className = 'garden-info';
            gardenInfo.innerHTML = `
                <h3>פרטי הגן</h3>
                <p>שם הגן: ${garden.name}</p>
                <p>שנת לימודים: ${garden.schoolYear}</p>
                <p>גננת: ${garden.teacherName}</p>
            `;
            childrenList.insertBefore(gardenInfo, childrenList.firstChild);
        }
        
        // Only allow adding child, not editing list
        loadChildren(gardenIdFromUrl);
        // Hide delete buttons for parents
        document.getElementById('childrenTable').style.display = 'none';
        // Hide garden link section for parents
        document.getElementById('gardenLinkSection').style.display = 'none';
        
        // On submit, add child with gardenId
        addChildForm.onsubmit = function(e) {
            e.preventDefault();
            const childData = {
                id: Date.now(),
                childId: generateChildId(gardenIdFromUrl), // Add sequential child ID
                name: document.getElementById('childName').value,
                birthDate: document.getElementById('birthDate').value,
                gardenId: gardenIdFromUrl,
                parentName: document.getElementById('parentName').value, // Add parent name
                parentPhone: document.getElementById('parentPhone').value,
                parentEmail: document.getElementById('parentEmail').value
            };
            const children = storage.get('children') || [];
            children.push(childData);
            storage.set('children', children);
            addChildForm.reset();
            alert('הילד נרשם בהצלחה!');
            loadChildren(gardenIdFromUrl);
        };
        return;
    }

    // Add New Garden button
    const addNewGardenButton = document.createElement('button');
    addNewGardenButton.textContent = 'הוסף גן חדש';
    addNewGardenButton.className = 'feature-button';
    addNewGardenButton.style.marginTop = '20px';
    addNewGardenButton.onclick = function() {
        kindergartenForm.style.display = 'block';
        childrenList.style.display = 'none';
        gardenLinkSection.style.display = 'none';
    };
    
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
        currentGardenId = gardenId;
        
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

        // Hide form, show children list for adding children
        kindergartenForm.style.display = 'none';
        childrenList.style.display = 'block';
        
        // Prepend add new garden button
        childrenList.prepend(addNewGardenButton);
    });

    // Handle adding a new child (admin mode)
    addChildForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!currentGardenId) {
            // Get the latest kindergarten if currentGardenId is not set
            const kindergartens = storage.get('kindergartens') || [];
            const lastKindergarten = kindergartens[kindergartens.length - 1];
            if (!lastKindergarten) return;
            currentGardenId = lastKindergarten.gardenId;
        }
        
        const childData = {
            id: Date.now(),
            childId: generateChildId(currentGardenId), // Add sequential child ID
            name: document.getElementById('childName').value,
            birthDate: document.getElementById('birthDate').value,
            gardenId: currentGardenId,
            parentName: document.getElementById('parentName').value, // Add parent name
            parentPhone: document.getElementById('parentPhone').value,
            parentEmail: document.getElementById('parentEmail').value
        };
        const children = storage.get('children') || [];
        children.push(childData);
        storage.set('children', children);
        addChildForm.reset();
        loadChildren(currentGardenId);
    });

    // Load and display children for a specific gardenId
    function loadChildren(gardenId) {
        const children = (storage.get('children') || []).filter(c => c.gardenId === gardenId);
        childrenTableBody.innerHTML = '';
        children.forEach(child => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${child.name}</td>
                <td>${child.childId}</td>
                <td>${new Date(child.birthDate).toLocaleDateString('he-IL')}</td>
                <td>${child.parentName || '-'}</td>
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
        
        if (!currentGardenId) {
            // Get last kindergarten for admin mode
            const kindergartens = storage.get('kindergartens') || [];
            const lastKindergarten = kindergartens[kindergartens.length - 1];
            if (lastKindergarten) currentGardenId = lastKindergarten.gardenId;
        }
        
        loadChildren(currentGardenId);
    };

    // Check if kindergarten is already registered (admin mode)
    const kindergartens = storage.get('kindergartens') || [];
    if (kindergartens.length > 0 && !gardenIdFromUrl && !window.location.hash) {
        const lastKindergarten = kindergartens[kindergartens.length - 1];
        currentGardenId = lastKindergarten.gardenId;
        
        // Show garden ID and parent link
        document.getElementById('gardenLinkSection').style.display = 'block';
        document.getElementById('gardenIdDisplay').textContent = currentGardenId;
        const parentLink = `${window.location.origin}${window.location.pathname}?gardenId=${currentGardenId}`;
        document.getElementById('parentRegLink').value = parentLink;
        document.getElementById('copyParentLinkBtn').onclick = function() {
            navigator.clipboard.writeText(parentLink).then(() => {
                document.getElementById('copyParentLinkMsg').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('copyParentLinkMsg').style.display = 'none';
                }, 1500);
            });
        };
        
        // Hide form, show children list
        kindergartenForm.style.display = 'none';
        childrenList.style.display = 'block';
        
        // Prepend add new garden button
        childrenList.prepend(addNewGardenButton);
        
        // Load children for current garden
        loadChildren(currentGardenId);
    }
}); 