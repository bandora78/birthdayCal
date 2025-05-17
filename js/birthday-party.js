document.addEventListener('DOMContentLoaded', () => {
    const partyForm = document.getElementById('birthdayPartyForm');
    const childSelect = document.getElementById('childSelect');
    const locationSelect = document.getElementById('location');
    const otherLocationDiv = document.getElementById('otherLocationDiv');
    const partiesList = document.getElementById('partiesList');

    // Get current garden ID
    const kindergartens = storage.get('kindergartens') || [];
    // Check if we have any gardens at all
    if (kindergartens.length === 0) {
        alert('יש להשלים קודם את רישום הגן');
        window.location.href = 'register.html';
        return;
    }
    
    const currentGarden = kindergartens[kindergartens.length - 1];
    // Check if the garden has a valid ID
    if (!currentGarden || !currentGarden.gardenId) {
        alert('אירעה שגיאה במערכת - נא להירשם מחדש');
        window.location.href = 'register.html';
        return;
    }
    
    const currentGardenId = currentGarden.gardenId;

    // Load children into select dropdown
    function loadChildren() {
        const children = (storage.get('children') || []).filter(child => child.gardenId === currentGardenId);
        childSelect.innerHTML = '<option value="">בחר ילד</option>';
        
        children.forEach(child => {
            const option = document.createElement('option');
            option.value = child.id;
            option.textContent = `${child.name} (מזהה: ${child.childId})`;
            childSelect.appendChild(option);
        });
    }

    // Handle location selection change
    locationSelect.addEventListener('change', () => {
        otherLocationDiv.style.display = 
            locationSelect.value === 'other' ? 'block' : 'none';
    });

    // Handle party form submission
    partyForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const partyData = {
            id: Date.now(),
            childId: parseInt(childSelect.value),
            date: document.getElementById('partyDate').value,
            location: locationSelect.value === 'kindergarten' ? 'בגן' : 
                     document.getElementById('otherLocation').value,
            notes: document.getElementById('notes').value,
            attendance: [],
            gardenId: currentGardenId
        };

        // Save party data
        const events = storage.get('events') || [];
        events.push(partyData);
        storage.set('events', events);

        // Clear form and reload parties
        partyForm.reset();
        otherLocationDiv.style.display = 'none';
        loadParties();
    });

    // Load and display parties
    function loadParties() {
        const events = (storage.get('events') || []).filter(event => event.gardenId === currentGardenId);
        const children = (storage.get('children') || []).filter(child => child.gardenId === currentGardenId);
        partiesList.innerHTML = '';

        // Sort events by date
        events.sort((a, b) => new Date(a.date) - new Date(b.date));

        events.forEach(event => {
            const child = children.find(c => c.id === event.childId);
            if (!child) return;

            const partyCard = document.createElement('div');
            partyCard.className = 'event-card';
            partyCard.innerHTML = `
                <h3>יום הולדת של ${child.name}</h3>
                <p>תאריך: ${new Date(event.date).toLocaleDateString('he-IL')}</p>
                <p>מיקום: ${event.location}</p>
                <p>הערות: ${event.notes || 'אין'}</p>
                <p>מספר אישורי הגעה: ${event.attendance.length}</p>
                <button class="copy-link-btn" title="העתק קישור לאירוע">📋 העתק קישור</button>
            `;

            // Add copy link button functionality
            const copyBtn = partyCard.querySelector('.copy-link-btn');
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = `${window.location.origin}/events.html?eventId=${event.id}&gardenId=${currentGardenId}&childId=${child.childId}`;
                navigator.clipboard.writeText(url).then(() => {
                    copyBtn.textContent = '✔️ הועתק!';
                    setTimeout(() => { copyBtn.textContent = '📋 העתק קישור'; }, 1500);
                });
            });

            partiesList.appendChild(partyCard);
        });
    }

    // Initial load
    loadChildren();
    loadParties();
}); 