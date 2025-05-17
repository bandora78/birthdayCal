document.addEventListener('DOMContentLoaded', () => {
    const monthFilter = document.getElementById('monthFilter');
    const eventsList = document.getElementById('eventsList');
    const eventDetails = document.getElementById('eventDetails');
    const attendanceForm = document.getElementById('attendanceForm');
    const attendanceTableBody = document.getElementById('attendanceTableBody');

    let currentEventId = null;

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

    // Load and display events
    function loadEvents(month = 'all') {
        const events = (storage.get('events') || []).filter(event => event.gardenId === currentGardenId);
        const children = (storage.get('children') || []).filter(child => child.gardenId === currentGardenId);
        eventsList.innerHTML = '';

        // Filter events by month if specified
        const filteredEvents = month === 'all' ? events : 
            events.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.getMonth() + 1 === parseInt(month);
            });

        // Sort events by date
        filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

        filteredEvents.forEach(event => {
            const child = children.find(c => c.id === event.childId);
            if (!child) return;

            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.innerHTML = `
                <h3>יום הולדת של ${child.name}</h3>
                <p>תאריך: ${formatDate(event.date)}</p>
                <p>מיקום: ${event.location}</p>
                <p>מספר אישורי הגעה: ${event.attendance.length}</p>
                <button class="copy-link-btn" title="העתק קישור לאירוע">📋 העתק קישור</button>
            `;

            // Add click event to show details
            eventCard.addEventListener('click', (e) => {
                // Prevent event if copy-link-btn was clicked
                if (e.target.classList.contains('copy-link-btn')) return;
                showEventDetails(event);
            });

            // Copy link button logic
            const copyBtn = eventCard.querySelector('.copy-link-btn');
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = `${window.location.origin}${window.location.pathname}?eventId=${event.id}&gardenId=${currentGardenId}&childId=${child.childId}`;
                navigator.clipboard.writeText(url).then(() => {
                    copyBtn.textContent = '✔️ הועתק!';
                    setTimeout(() => { copyBtn.textContent = '📋 העתק קישור'; }, 1500);
                });
            });

            eventsList.appendChild(eventCard);
        });
    }

    // Show event details
    function showEventDetails(event) {
        currentEventId = event.id;
        const children = (storage.get('children') || []).filter(child => child.gardenId === currentGardenId);
        const child = children.find(c => c.id === event.childId);

        document.getElementById('eventChildName').textContent = child.name;
        document.getElementById('eventDate').textContent = formatDate(event.date);
        document.getElementById('eventLocation').textContent = event.location;
        document.getElementById('eventNotes').textContent = event.notes || 'אין';

        // Show attendance section
        eventDetails.style.display = 'block';
        loadAttendance(event);
    }

    // Load attendance list
    function loadAttendance(event) {
        attendanceTableBody.innerHTML = '';
        
        event.attendance.forEach(attendance => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${attendance.parentName}</td>
                <td>${attendance.childName}</td>
                <td>${getAttendanceStatusText(attendance.status)}</td>
            `;
            attendanceTableBody.appendChild(row);
        });
    }

    // Get attendance status text
    function getAttendanceStatusText(status) {
        switch (status) {
            case 'yes': return 'יגיע';
            case 'no': return 'לא יגיע';
            case 'maybe': return 'אולי יגיע';
            default: return status;
        }
    }

    // Handle attendance form submission
    attendanceForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!currentEventId) return;

        const attendanceData = {
            parentName: document.getElementById('parentName').value,
            childName: document.getElementById('childName').value,
            status: document.getElementById('attendanceStatus').value
        };

        // Update event attendance
        const events = storage.get('events') || [];
        const eventIndex = events.findIndex(e => e.id === currentEventId);
        
        if (eventIndex !== -1) {
            events[eventIndex].attendance.push(attendanceData);
            storage.set('events', events);
            
            // Reload attendance list
            loadAttendance(events[eventIndex]);
            
            // Clear form
            attendanceForm.reset();
        }
    });

    // Handle month filter change
    monthFilter.addEventListener('change', () => {
        loadEvents(monthFilter.value);
    });

    // Initial load
    loadEvents();

    // Support direct eventId navigation
    const params = new URLSearchParams(window.location.search);
    const eventIdParam = params.get('eventId');
    const gardenIdParam = params.get('gardenId');
    const childIdParam = params.get('childId');
    
    if (eventIdParam && gardenIdParam === currentGardenId) {
        const events = storage.get('events') || [];
        const event = events.find(ev => String(ev.id) === String(eventIdParam));
        if (event) {
            showEventDetails(event);
            setTimeout(() => {
                document.getElementById('eventDetails').scrollIntoView({behavior: 'smooth'});
            }, 200);
        }
    }
}); 