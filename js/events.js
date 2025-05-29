document.addEventListener('DOMContentLoaded', () => {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthElement = document.getElementById('currentMonth');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const eventDetails = document.getElementById('eventDetails');
    const attendanceForm = document.getElementById('attendanceForm');
    const attendanceTableBody = document.getElementById('attendanceTableBody');

    let currentDate = new Date();
    let currentEventId = null;

    // Get garden ID from URL or session storage
    const urlParams = new URLSearchParams(window.location.search);
    const gardenIdFromUrl = urlParams.get('gardenId');
    let currentGardenId = sessionStorage.getItem('currentGardenId');

    if (gardenIdFromUrl && gardenIdFromUrl !== currentGardenId) {
        // If gardenId in URL is different from session, update session
        currentGardenId = gardenIdFromUrl;
        sessionStorage.setItem('currentGardenId', currentGardenId);
    } else if (!currentGardenId) {
        // If no gardenId in URL and not in session, redirect to home
        alert('יש להיכנס לגן תחילה');
        window.location.href = 'index.html';
        return;
    }

    // Initialize calendar
    function initCalendar() {
        renderCalendar();
        setupEventListeners();
    }

    // Render calendar for current month
    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Set current month title
        currentMonthElement.textContent = new Date(year, month).toLocaleDateString('he-IL', { 
            year: 'numeric', 
            month: 'long' 
        });

        // Clear calendar grid
        calendarGrid.innerHTML = '';

        // Add day headers
        const days = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
        days.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });

        // Get first day of month and total days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const totalDays = lastDay.getDate();
        const startingDay = firstDay.getDay();

        // Add empty cells for days before first of month
        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            calendarGrid.appendChild(emptyDay);
        }

        // Get events for current month
        const events = (storage.get('events') || []).filter(event => {
            const eventDate = new Date(event.date);
            return event.gardenId === currentGardenId &&
                   eventDate.getFullYear() === year &&
                   eventDate.getMonth() === month;
        });

        // Add days
        for (let day = 1; day <= totalDays; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;

            // Check if current day has events
            const dayEvents = events.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.getDate() === day;
            });

            if (dayEvents.length > 0) {
                dayElement.classList.add('has-event');
                
                // Add event icons
                dayEvents.forEach(event => {
                    const icon = document.createElement('span');
                    icon.className = 'event-icon';
                    icon.textContent = event.location === 'בגן' ? '👕' : '🎈';
                    icon.classList.add(event.location === 'בגן' ? 'shirt' : 'balloon');
                    dayElement.appendChild(icon);
                });

                // Add click event to show details
                dayElement.addEventListener('click', () => {
                    showEventDetails(dayEvents[0]);
                });
            }

            // Highlight today
            if (day === new Date().getDate() && 
                month === new Date().getMonth() && 
                year === new Date().getFullYear()) {
                dayElement.classList.add('today');
            }

            calendarGrid.appendChild(dayElement);
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });

        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }

    // Show event details
    function showEventDetails(event) {
        currentEventId = event.id;
        const children = (storage.get('children') || []).filter(child => child.gardenId === currentGardenId);
        
        const eventChildNameElement = document.getElementById('eventChildName');
        const eventDateElement = document.getElementById('eventDate');
        const eventLocationElement = document.getElementById('eventLocation');
        const eventNotesElement = document.getElementById('eventNotes');

        // Reset child name display
        if (eventChildNameElement) eventChildNameElement.textContent = '';

        // Display child name only if it's a birthday party
        if (event.type === 'birthday' && event.childId) {
             const child = children.find(c => c.id === event.childId);
             if (child && eventChildNameElement) {
                 eventChildNameElement.textContent = child.name;
             }
        }

        if (eventDateElement) eventDateElement.textContent = window.formatDate(event.date);
        if (eventLocationElement) eventLocationElement.textContent = event.location;
        if (eventNotesElement) eventNotesElement.textContent = event.notes || 'אין';

        // Show attendance section
        if (eventDetails) eventDetails.style.display = 'block';
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

    // Initialize calendar
    initCalendar();

    // Support direct eventId navigation
    const params = new URLSearchParams(window.location.search);
    const eventIdParam = params.get('eventId');
    // No longer checking gardenIdParam === currentGardenId here
    
    if (eventIdParam) {
        const events = storage.get('events') || [];
        const event = events.find(ev => String(ev.id) === String(eventIdParam) && ev.gardenId === currentGardenId);
        if (event) {
            showEventDetails(event);
            setTimeout(() => {
                document.getElementById('eventDetails').scrollIntoView({behavior: 'smooth'});
            }, 200);
        }
    }

    // Show garden name and copy link
    const kindergartens = storage.get('kindergartens') || [];
    // Use currentGardenId which is now guaranteed to be set from URL or session
    const currentGarden = kindergartens.find(k => k.gardenId === currentGardenId);
    if (currentGarden) {
        document.getElementById('gardenNameDisplay').textContent = `שם הגן: ${currentGarden.name}`;
        // Update the link to point to events.html with event and child IDs
        const parentLinkInput = document.getElementById('parentRegLink');
        if (parentLinkInput) {
             parentLinkInput.value = `${window.location.origin}/events.html?gardenId=${currentGardenId}&eventId=`; // Base link
        }

        const copyBtn = document.getElementById('copyGardenLinkBtn');
        copyBtn.onclick = function() {
            // This button is meant for garden registration, not event attendance
            // The copy link for events is within the event card now.
            // Keeping old functionality for now, but it might be confusing.
            const registrationLink = `${window.location.origin}/register.html?gardenId=${currentGardenId}`;
            const msg = `היי! מצרף קישור לרישום ילדים לגן שלנו (${currentGarden.name}):%0A${registrationLink}`;
            const waUrl = `https://wa.me/?text=${msg}`;
            window.open(waUrl, '_blank');
        };
    }
}); 