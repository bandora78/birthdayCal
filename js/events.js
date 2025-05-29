// This file handles the events calendar and details logic

// Global variables
let currentDate = new Date();
let currentGardenId = null;

// Global DOM element references
let calendarGrid;
let currentMonthElement;
let prevMonthBtn;
let nextMonthBtn;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM element references
    calendarGrid = document.getElementById('calendarGrid');
    currentMonthElement = document.getElementById('currentMonth');
    prevMonthBtn = document.getElementById('prevMonth');
    nextMonthBtn = document.getElementById('nextMonth');
    // eventDetails, attendanceForm, attendanceTableBody will be accessed later in showEventDetails or within event listeners

    // Get garden ID from URL or session storage
    const urlParams = new URLSearchParams(window.location.search);
    const gardenIdFromUrl = urlParams.get('gardenId');
    currentGardenId = sessionStorage.getItem('currentGardenId');

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

    // Event Form Modal elements - Get references inside DOMContentLoaded
    const eventFormModal = document.getElementById('eventFormModal');
    const eventFormModalContent = document.getElementById('eventFormModalContent');
    const eventModalTitle = document.getElementById('eventModalTitle');
    const editEventIdInput = document.getElementById('editEventId');
    const editEventTypeSelect = document.getElementById('editEventType');
    const editChildSelectGroup = document.getElementById('editChildSelectGroup');
    const editChildSelect = document.getElementById('editChildSelect');
    const editEventDateInput = document.getElementById('editEventDate');
    const editLocationSelect = document.getElementById('editLocation');
    const editOtherLocationDiv = document.getElementById('editOtherLocationDiv');
    const editOtherLocationInput = document.getElementById('editOtherLocation');
    const editNotesInput = document.getElementById('editNotes');

    // Initialize Flatpickr for event date picker in modal (Inside DOMContentLoaded)
    // Ensure the element exists before initializing
    const eventDateElement = document.getElementById("editEventDate");
    let eventDatePickerInstance = null; // Declare instance variable
    if (eventDateElement) {
        eventDatePickerInstance = flatpickr(eventDateElement, {
            locale: "he",
            dateFormat: "Y-m-d",
            disableMobile: "true",
            theme: "material_blue"
        });
    }

    // Close event form modal when clicking the X button
    const eventModalCloseBtn = eventFormModal.querySelector('.close');
    if (eventModalCloseBtn) {
        eventModalCloseBtn.onclick = window.closeEventModal; // Use global function
    }

    // Close event form modal when clicking outside
    window.onclick = function(event) {
        if (event.target === eventFormModal) {
            window.closeEventModal(); // Use global function
        }
    }

    // Handle event type change in modal
    editEventTypeSelect.addEventListener('change', () => {
        if (editEventTypeSelect.value === 'birthday') {
            editChildSelectGroup.style.display = 'block';
             // Load children if not already loaded
            if (editChildSelect.options.length <= 1) { // Check if only default option exists
                const currentGardenId = sessionStorage.getItem('currentGardenId'); // Get current garden id
                const children = (storage.get('children') || []).filter(child => child.gardenId === currentGardenId);
                editChildSelect.innerHTML = '<option value="">בחר ילד</option>';
                 children.forEach(child => {
                    const option = document.createElement('option');
                    option.value = child.id;
                    option.textContent = `${child.name} (מזהה: ${child.id})`;
                    editChildSelect.appendChild(option);
                });
            }
        } else {
            editChildSelectGroup.style.display = 'none';
        }
    });

    // Handle location change in modal
    editLocationSelect.addEventListener('change', () => {
        editOtherLocationDiv.style.display =
            editLocationSelect.value === 'other' ? 'block' : 'none';
    });

    // Handle event form modal submission
    eventFormModalContent.addEventListener('submit', (e) => {
        e.preventDefault();

        const eventId = editEventIdInput.value;
        const eventType = editEventTypeSelect.value;
        const childId = eventType === 'birthday' ? editChildSelect.value : null;
        const eventDate = editEventDateInput.value;
        const location = editLocationSelect.value === 'kindergarten' ? 'בגן' : editOtherLocationInput.value;
        const notes = editNotesInput.value;

        if (eventType === 'birthday' && !childId) {
            alert('אנא בחר ילד עבור אירוע יום הולדת');
            return;
        }

        const events = storage.get('events') || [];
        const eventIndex = events.findIndex(ev => String(ev.id) === String(eventId));

        if (eventIndex !== -1) {
            // Update existing event
            events[eventIndex] = {
                ...events[eventIndex],
                type: eventType,
                childId: childId,
                date: eventDate,
                location: location,
                notes: notes
            };
            storage.set('events', events);
            alert('האירוע עודכן בהצלחה!');
            window.closeEventModal(); // Use global function
            renderCalendar(); // Re-render calendar to show updated event
            window.closeEventDetails(); // Use global function
        } else {
             // This case should ideally not happen with current flow, but good to have
             console.error('Event not found for update');
        }
    });

    // Initialize calendar and event listeners
    initCalendar();

    // Support direct eventId navigation and show details
    const eventIdParam = urlParams.get('eventId');
    if (eventIdParam) {
        const events = storage.get('events') || [];
        const event = events.find(ev => String(ev.id) === String(eventIdParam) && ev.gardenId === currentGardenId);
        if (event) {
            window.showEventDetails(event); // Use global function
            setTimeout(() => {
                const eventDetailsElement = document.getElementById('eventDetails');
                 if(eventDetailsElement) eventDetailsElement.scrollIntoView({behavior: 'smooth'});
            }, 200);
        }
    }

    // Show garden name and copy link
    const kindergartens = storage.get('kindergartens') || [];
    const currentGarden = kindergartens.find(k => k.gardenId === currentGardenId);
    if (currentGarden) {
        const gardenNameDisplay = document.getElementById('gardenNameDisplay');
        if(gardenNameDisplay) {
             gardenNameDisplay.textContent = `שם הגן: ${currentGarden.name}`;
        }

        // The parentRegLink input should probably be for the children registration page
        const parentRegLinkInput = document.getElementById('parentRegLink');
        if(parentRegLinkInput) {
             parentRegLinkInput.value = `${window.location.origin}/register.html?gardenId=${currentGardenId}`;
        }

        const copyBtn = document.getElementById('copyGardenLinkBtn');
        if (copyBtn) {
            copyBtn.onclick = function() {
                const registrationLink = `${window.location.origin}/register.html?gardenId=${currentGardenId}`;
                const msg = `היי! מצרף קישור לרישום ילדים לגן שלנו (${currentGarden.name}):%0A${registrationLink}`;
                const waUrl = `https://wa.me/?text=${msg}`;
                window.open(waUrl, '_blank');
            };
        }
    }

    // Add event listeners for edit and delete buttons after showEventDetails is called
    // These event listeners are added to the buttons within the event details section,
    // which is updated when showEventDetails is called.
    const editEventBtn = document.getElementById('editEventBtn');
    const deleteEventBtn = document.getElementById('deleteEventBtn');

    if (editEventBtn) {
        editEventBtn.addEventListener('click', () => {
            const eventDetailsElement = document.getElementById('eventDetails');
            const currentEventIdFromData = eventDetailsElement ? eventDetailsElement.dataset.currentEventId : null;
            if (currentEventIdFromData) {
                 const events = storage.get('events') || [];
                 const eventToEdit = events.find(ev => String(ev.id) === String(currentEventIdFromData));
                 if (eventToEdit) {
                    window.showEventModal('עריכת אירוע', eventToEdit); // Use global function
                 }
            }
        });
    }

    if (deleteEventBtn) {
        deleteEventBtn.addEventListener('click', () => {
             const eventDetailsElement = document.getElementById('eventDetails');
             const currentEventIdFromData = eventDetailsElement ? eventDetailsElement.dataset.currentEventId : null;
            if (currentEventIdFromData) {
                window.deleteEvent(currentEventIdFromData); // Use global function
            }
        });
    }

     // Close event details when clicking the X button
     const closeDetailsBtn = document.querySelector('.close-details');
     if (closeDetailsBtn) {
         closeDetailsBtn.onclick = window.closeEventDetails; // Use global function
     }

});

// Global functions for managing events and modals

// Show Event Modal function (Global)
window.showEventModal = function(title, eventData = null) {
    const eventFormModal = document.getElementById('eventFormModal');
    const eventFormModalContent = document.getElementById('eventFormModalContent');
    const eventModalTitle = document.getElementById('eventModalTitle');
    const editEventIdInput = document.getElementById('editEventId');
    const editEventTypeSelect = document.getElementById('editEventType');
    const editChildSelectGroup = document.getElementById('editChildSelectGroup');
    const editChildSelect = document.getElementById('editChildSelect');
    const editEventDateInput = document.getElementById('editEventDate');
    const editLocationSelect = document.getElementById('editLocation');
    const editOtherLocationDiv = document.getElementById('editOtherLocationDiv');
    const editOtherLocationInput = document.getElementById('editOtherLocation');
    const editNotesInput = document.getElementById('editNotes');

    // Ensure eventDatePicker is accessible and initialized
    const eventDatePickerInput = document.querySelector("#editEventDate");
    const eventDatePickerInstance = eventDatePickerInput ? eventDatePickerInput._flatpickr : null; // Get Flatpickr instance

    eventModalTitle.textContent = title;
    eventFormModalContent.reset(); // Reset form before filling
    editOtherLocationDiv.style.display = 'none'; // Hide other location initially

    if (eventData) {
        editEventIdInput.value = eventData.id;
        editEventTypeSelect.value = eventData.type;

        // Load children for birthday event type
        const currentGardenId = sessionStorage.getItem('currentGardenId'); // Get current garden id
        const children = (storage.get('children') || []).filter(child => child.gardenId === currentGardenId);
        editChildSelect.innerHTML = '<option value="">בחר ילד</option>';
        children.forEach(child => {
            const option = document.createElement('option');
            option.value = child.id;
            option.textContent = `${child.name} (מזהה: ${child.id})`;
            editChildSelect.appendChild(option);
        });

        if (eventData.type === 'birthday') {
            editChildSelectGroup.style.display = 'block';
            editChildSelect.value = eventData.childId || '';
        } else {
            editChildSelectGroup.style.display = 'none';
        }

         if (eventDatePickerInstance && eventData.date) { // Check if eventDatePicker exists and date is provided
            eventDatePickerInstance.setDate(eventData.date);
        }

        editLocationSelect.value = eventData.location === 'בגן' ? 'kindergarten' : 'other';
        if (eventData.location !== 'בגן' && eventData.location !== '') {
            editOtherLocationDiv.style.display = 'block';
            editOtherLocationInput.value = eventData.location;
        }
        editNotesInput.value = eventData.notes || '';
    } else {
         // For new event (though currently only editing is implemented via modal)
         editEventIdInput.value = '';
         editEventTypeSelect.value = 'birthday'; // Default to birthday for new events
         editChildSelectGroup.style.display = 'block'; // Show child select for default type
         editChildSelect.innerHTML = ''; // Clear children options
         // Load children for new event
         const currentGardenId = sessionStorage.getItem('currentGardenId'); // Get current garden id
         const children = (storage.get('children') || []).filter(child => child.gardenId === currentGardenId);
         editChildSelect.innerHTML = '<option value="">בחר ילד</option>';
         children.forEach(child => {
             const option = document.createElement('option');
             option.value = child.id;
             option.textContent = `${child.name} (מזהה: ${child.id})`;
             editChildSelect.appendChild(option);
         });
         if (eventDatePickerInstance) { // Check if eventDatePicker exists
             eventDatePickerInstance.clear();
         }
    }

    eventFormModal.style.display = 'block';
};

// Close Event Modal function (Global)
window.closeEventModal = function() {
    const eventFormModal = document.getElementById('eventFormModal');
    if (eventFormModal) {
         eventFormModal.style.display = 'none';
         const eventFormModalContent = document.getElementById('eventFormModalContent');
         if(eventFormModalContent) eventFormModalContent.reset();
         const eventDatePickerInput = document.querySelector("#editEventDate");
         if (eventDatePickerInput && eventDatePickerInput._flatpickr) { // Check if element and instance exist
             eventDatePickerInput._flatpickr.clear();
         }
         const editOtherLocationDiv = document.getElementById('editOtherLocationDiv');
         if(editOtherLocationDiv) editOtherLocationDiv.style.display = 'none';
    }
};

// Delete event function (Global)
window.deleteEvent = function(eventId) {
    if (confirm('האם אתה בטוח שברצונך למחוק את האירוע?')) {
        const events = storage.get('events') || [];
        const updatedEvents = events.filter(event => String(event.id) !== String(eventId));
        storage.set('events', updatedEvents);
        alert('האירוע נמחק בהצלחה!');
        // Re-render calendar and hide details section after deletion
        const calendarGrid = document.getElementById('calendarGrid');
        if (calendarGrid && calendarGrid._eventCalendar) { // Check if calendar instance exists
             calendarGrid._eventCalendar.renderCalendar();
        } else {
            // Fallback if calendar instance not stored, re-init or reload
             // window.initCalendar(); // If initCalendar is global and safe to call multiple times
             // Or simply reload the page if complex re-rendering is difficult
             window.location.reload(); // Simple reload for now
        }
        window.closeEventDetails(); // Use global function
    }
};

// Keep showEventDetails globally accessible as it's called from renderCalendar
window.showEventDetails = function(event) {
    const eventDetails = document.getElementById('eventDetails');
    const attendanceTableBody = document.getElementById('attendanceTableBody');
    const eventChildNameElement = document.getElementById('eventChildName');
    const eventDateElement = document.getElementById('eventDate');
    const eventLocationElement = document.getElementById('eventLocation');
    const eventNotesElement = document.getElementById('eventNotes');
    const eventTypeTextElement = document.getElementById('eventTypeText');

    // Ensure elements exist before accessing
    if (!eventDetails || !attendanceTableBody || !eventChildNameElement || !eventDateElement || !eventLocationElement || !eventNotesElement || !eventTypeTextElement) {
        console.error("One or more event details elements not found!");
        return;
    }

    // Store the currently viewed event ID using a data attribute on the details section
    eventDetails.dataset.currentEventId = event.id;

    // Reset child name display
    eventChildNameElement.textContent = '';

    // Display child name only if it's a birthday party
    if (event.type === 'birthday' && event.childId) {
        const children = (storage.get('children') || []).filter(child => child.gardenId === currentGardenId);
        const child = children.find(c => c.id === event.childId);
        if (child) {
            eventChildNameElement.textContent = child.name;
        }
    }

    // Display event type
    eventTypeTextElement.textContent = event.type === 'birthday' ? 'יום הולדת' : 'אחר';

    // Format and display date
    const eventDate = new Date(event.date);
    eventDateElement.textContent = eventDate.toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    eventLocationElement.textContent = event.location;
    eventNotesElement.textContent = event.notes || 'אין';

    // Initialize attendance array if it doesn't exist
    if (!event.attendance) {
        event.attendance = [];
    }

    // Show attendance section
    eventDetails.style.display = 'block';
    loadAttendance(event);

    // Scroll to event details
    eventDetails.scrollIntoView({ behavior: 'smooth' });
};

// Global function to close event details section (called from deleteEvent)
window.closeEventDetails = function() {
    const eventDetails = document.getElementById('eventDetails');
    if (eventDetails) eventDetails.style.display = 'none';
};

// Load attendance list
function loadAttendance(event) {
    const attendanceTableBody = document.getElementById('attendanceTableBody');
    if (!attendanceTableBody) return; // Ensure element exists

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
const attendanceForm = document.getElementById('attendanceForm');
if (attendanceForm) {
    attendanceForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const eventDetailsElement = document.getElementById('eventDetails');
        const currentEventId = eventDetailsElement ? eventDetailsElement.dataset.currentEventId : null;

        if (!currentEventId) return;

        const attendanceData = {
            parentName: document.getElementById('parentName').value,
            childName: document.getElementById('childName').value,
            status: document.getElementById('attendanceStatus').value
        };

        // Update event attendance
        const events = storage.get('events') || [];
        const eventIndex = events.findIndex(e => String(e.id) === String(currentEventId));

        if (eventIndex !== -1) {
            // Ensure attendance array exists
            if (!events[eventIndex].attendance) {
                 events[eventIndex].attendance = [];
            }
            events[eventIndex].attendance.push(attendanceData);
            storage.set('events', events);

            // Reload attendance list
            loadAttendance(events[eventIndex]);

            // Clear form
            attendanceForm.reset();
        }
    });
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