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
        // We're in parent registration mode
        if (kindergartenForm) kindergartenForm.style.display = 'none';
        if (registrationForm) registrationForm.style.display = 'block';
        if (gardenLinkSection) gardenLinkSection.style.display = 'none';

        // Add child button functionality
        if (addChildBtn) {
            addChildBtn.addEventListener('click', () => {
                if (childCount >= 5) {
                    alert('לא ניתן להוסיף יותר מ-5 ילדים ברישום אחד');
                    return;
                }
                childCount++;
                
                const childEntry = document.createElement('div');
                childEntry.className = 'child-entry';
                childEntry.innerHTML = `
                    <h3>ילד/ה ${childCount}</h3>
                    <div class="form-group">
                        <label for="childName${childCount}">שם הילד/ה:</label>
                        <input type="text" id="childName${childCount}" required>
                    </div>
                    <div class="form-group">
                        <label for="childBirthday${childCount}">תאריך לידה:</label>
                        <input type="date" id="childBirthday${childCount}" required>
                    </div>
                `;
                if (childrenContainer) childrenContainer.appendChild(childEntry);
            });
        }

        // Handle parent registration form submission
        if (registrationForm) {
            registrationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const parentData = {
                    name: document.getElementById('parentName').value,
                    phone: document.getElementById('parentPhone').value,
                    email: document.getElementById('parentEmail').value
                };

                const children = [];
                for (let i = 1; i <= childCount; i++) {
                    children.push({
                        id: Date.now().toString() + i,
                        name: document.getElementById(`childName${i}`).value,
                        birthday: document.getElementById(`childBirthday${i}`).value,
                        gardenId: gardenIdFromUrl,
                        parentName: parentData.name,
                        parentPhone: parentData.phone,
                        parentEmail: parentData.email
                    });
                }

                // Save to storage
                const childrenList = storage.get('children') || [];
                children.forEach(child => {
                    childrenList.push(child);
                });
                storage.set('children', childrenList);

                alert('הרישום בוצע בהצלחה!');
                window.location.href = 'index.html';
            });
        }
    } else {
        // We're in kindergarten registration mode
        if (kindergartenForm) {
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

                // Show success message and garden ID
                if (gardenLinkSection) {
                    gardenLinkSection.style.display = 'block';
                    document.getElementById('gardenIdDisplay').textContent = gardenId;
                    const parentLink = `${window.location.origin}${window.location.pathname}?gardenId=${gardenId}`;
                    document.getElementById('parentRegLink').value = parentLink;
                }

                // Store current garden ID and redirect
                sessionStorage.setItem('currentGardenId', gardenId);
                window.location.href = 'events.html';
            });
        }
    }

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
        childrenList.prepend(addChildBtn);
        
        // Load children for current garden
        loadChildren(currentGardenId);
    }
}); 