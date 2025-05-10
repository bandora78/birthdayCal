document.addEventListener('DOMContentLoaded', () => {
    const monthFilter = document.getElementById('monthFilter');
    const eventsList = document.getElementById('eventsList');
    const eventDetails = document.getElementById('eventDetails');
    const attendanceForm = document.getElementById('attendanceForm');
    const attendanceTableBody = document.getElementById('attendanceTableBody');

    let currentEventId = null;

    // Load and display events
    function loadEvents(month = 'all') {
        const events = storage.get('events') || [];
        const children = storage.get('children') || [];
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
            `;

            // Add click event to show details
            eventCard.addEventListener('click', () => showEventDetails(event));
            eventsList.appendChild(eventCard);
        });
    }

    // Show event details
    function showEventDetails(event) {
        currentEventId = event.id;
        const children = storage.get('children') || [];
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
}); 