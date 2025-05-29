document.addEventListener('DOMContentLoaded', () => {
    const partyForm = document.getElementById('eventForm');
    const childSelect = document.getElementById('childSelect');
    const locationSelect = document.getElementById('location');
    const otherLocationDiv = document.getElementById('otherLocationDiv');
    const partiesList = document.getElementById('partiesList');
    const upcomingEventsList = document.getElementById('upcomingEventsList');
    const eventTypeSelect = document.getElementById('eventType');
    const childSelectGroup = document.getElementById('childSelectGroup');

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
            option.textContent = `${child.name} (מזהה: ${child.id})`;
            childSelect.appendChild(option);
        });
    }

    // Handle location selection change
    locationSelect.addEventListener('change', () => {
        otherLocationDiv.style.display = 
            locationSelect.value === 'other' ? 'block' : 'none';
    });

    // Handle party form submission - now handles general events
    if (partyForm) {
        partyForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Get element references inside the submit handler to ensure they exist
            const eventDateInput = document.getElementById('eventDate');
            const locationSelectInput = document.getElementById('location');
            const otherLocationInput = document.getElementById('otherLocation');
            const eventTypeSelectInput = document.getElementById('eventType');
            const childSelectInput = document.getElementById('childSelect');

            // Basic checks for element existence
            if (!eventDateInput || !locationSelectInput || !eventTypeSelectInput) {
                 console.error('Missing form elements!');
                 return;
            }

            const eventType = eventTypeSelectInput.value; // Get selected event type

            const eventData = {
                id: Date.now(),
                type: eventType, // Save event type
                gardenId: currentGardenId,
                date: eventDateInput.value,
                location: locationSelectInput.value === 'kindergarten' ? 'בגן' : 
                         (otherLocationInput ? otherLocationInput.value : ''),
                notes: document.getElementById('notes').value,
                attendance: [],
                childId: eventType === 'birthday' ? childSelectInput.value : null
            };

            // Add childId only if event type is birthday
            if (eventType === 'birthday' && !eventData.childId) {
                alert('אנא בחר ילד עבור אירוע יום הולדת');
                return;
            }

            console.log('Attempting to save event:', eventData); // Log event data

            // Save event data
            const events = storage.get('events') || [];
            console.log('Current events before push:', events); // Log current events
            events.push(eventData);
            console.log('Events after push:', events); // Log events after new data is added
            storage.set('events', events);
            console.log('Events saved to storage.'); // Confirm storage call
            console.log('localStorage events after set:', localStorage.getItem('events')); // Verify localStorage directly

            // Clear form and reload lists
            partyForm.reset();
            otherLocationDiv.style.display = 'none';
            toggleChildSelect(); // Reset child select visibility
            loadParties();
            loadUpcomingEvents();
        });
    }

    // Load and display parties - now specifically for birthday parties
    function loadParties() {
        console.log('Loading birthday parties...'); // Log start of function
        const events = (storage.get('events') || []).filter(event => 
             event.gardenId === currentGardenId && event.type === 'birthday'); // Filter by type
        console.log('Birthday events loaded:', events); // Log events data
        const children = (storage.get('children') || []).filter(child => child.gardenId === currentGardenId);
        console.log('Children loaded for parties:', children); // Log children data
        partiesList.innerHTML = '';

        // Sort events by date
        events.sort((a, b) => new Date(a.date) - new Date(b.date));

        events.forEach(event => {
            // Ensure event is a birthday party (has childId)
            if (!event.childId) {
                 console.warn('Event without childId found in loadParties:', event); // Warn if child missing
                 return;
            }

            const child = children.find(c => c.id === event.childId); // Comparison should work
            if (!child) {
                 console.warn('Child not found for birthday event:', event); // Warn if child missing
                 return;
            }

            const partyCard = document.createElement('div');
            partyCard.className = 'event-card';
            partyCard.innerHTML = `
                <h3>יום הולדת של ${child.name}</h3>
                <p>תאריך: ${new Date(event.date).toLocaleDateString('he-IL', { year: 'numeric', month: 'numeric', day: 'numeric' })}</p>
                <p>מיקום: ${event.location}</p>
                <p>הערות: ${event.notes || 'אין'}</p>
                <p>מספר אישורי הגעה: ${event.attendance.length}</p>
                <button class="copy-link-btn" title="העתק קישור לאירוע">📋 העתק קישור</button>
            `;

            // Add copy link button functionality
            const copyBtn = partyCard.querySelector('.copy-link-btn');
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Use event.childId which is the correct child ID stored in the event object
                const url = `${window.location.origin}/events.html?eventId=${event.id}&gardenId=${currentGardenId}&childId=${event.childId}`;
                navigator.clipboard.writeText(url).then(() => {
                    copyBtn.textContent = '✔️ הועתק!';
                    setTimeout(() => { copyBtn.textContent = '📋 העתק קישור'; }, 1500);
                });
            });

            partiesList.appendChild(partyCard);
        });
        console.log('Finished loading birthday parties.'); // Log end of function
    }

    // Load and display upcoming events - now specifically for other events
    function loadUpcomingEvents() {
        console.log('Loading upcoming other events...'); // Log start of function
        const events = (storage.get('events') || []).filter(event => 
            event.gardenId === currentGardenId && event.type === 'other'); // Filter by type
        console.log('Other upcoming events loaded:', events); // Log events data
        const upcomingEventsList = document.getElementById('upcomingEventsList');
        if (!upcomingEventsList) return; // Check if the element exists

        upcomingEventsList.innerHTML = '';

        // Filter for upcoming events (from today onwards) and sort by date
        const now = new Date();
        events.filter(event => new Date(event.date) >= now)
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .forEach(event => {
                  // Display other event details
                  const eventElement = document.createElement('div');
                  eventElement.className = 'upcoming-event';
                  // Assuming childId only exists for birthday parties, so no need to look up child here
                  const eventTitle = 'אירוע אחר'; 

                  eventElement.innerHTML = `
                      <h4>${eventTitle} - ${new Date(event.date).toLocaleDateString('he-IL', { year: 'numeric', month: 'numeric', day: 'numeric' })}</h4>
                      <p>מיקום: ${event.location}</p>
                      <p>הערות: ${event.notes || 'אין'}</p>
                  `;
                  upcomingEventsList.appendChild(eventElement);
              });
        console.log('Finished loading upcoming other events.'); // Log end of function
    }

    // Initial load
    loadChildren();
    loadParties(); // Load birthday parties
    loadUpcomingEvents(); // Load other upcoming events

    // Script to toggle child selection based on event type
    function toggleChildSelect() {
        if (eventTypeSelect.value === 'birthday') {
            if (childSelectGroup) childSelectGroup.style.display = 'block';
            if (childSelect) childSelect.setAttribute('required', 'true');
        } else {
            if (childSelectGroup) childSelectGroup.style.display = 'none';
            if (childSelect) childSelect.removeAttribute('required');
        }
    }

    // Initial check and event listener for event type change
    if (eventTypeSelect) {
        toggleChildSelect();
        eventTypeSelect.addEventListener('change', toggleChildSelect);
    }

    // Location select logic
    if (locationSelect) {
        locationSelect.addEventListener('change', () => {
            if (otherLocationDiv) {
                 otherLocationDiv.style.display =
                    locationSelect.value === 'other' ? 'block' : 'none';
            }
        });
    }
}); 