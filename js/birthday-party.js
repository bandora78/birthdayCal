document.addEventListener('DOMContentLoaded', () => {
    const partyForm = document.getElementById('birthdayPartyForm');
    const childSelect = document.getElementById('childSelect');
    const locationSelect = document.getElementById('location');
    const otherLocationDiv = document.getElementById('otherLocationDiv');
    const partiesList = document.getElementById('partiesList');

    // Load children into select dropdown
    function loadChildren() {
        const children = storage.get('children') || [];
        childSelect.innerHTML = '<option value="">בחר ילד</option>';
        
        children.forEach(child => {
            const option = document.createElement('option');
            option.value = child.id;
            option.textContent = child.name;
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
            attendance: []
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
        const events = storage.get('events') || [];
        const children = storage.get('children') || [];
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
                <p>תאריך: ${formatDate(event.date)}</p>
                <p>מיקום: ${event.location}</p>
                <p>הערות: ${event.notes || 'אין'}</p>
                <p>מספר אישורי הגעה: ${event.attendance.length}</p>
            `;
            partiesList.appendChild(partyCard);
        });
    }

    // Initial load
    loadChildren();
    loadParties();
}); 