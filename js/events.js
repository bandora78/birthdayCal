// This file handles the events calendar and details logic

// Import necessary modules
import { supabase } from './main.js';
// import { storage } from './main.js'; // We will replace storage usage
import { formatDate } from './main.js'; // Import formatDate
// generateId is no longer needed as Supabase generates IDs
// import { generateId } from './main.js';

// Global variables
let currentDate = new Date();
let currentGardenId = null;

// Global DOM element references
let calendarGrid;
let currentMonthElement;
let prevMonthBtn;
let nextMonthBtn;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('events.js DOMContentLoaded fired');
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
    window.onclick = function(e) {
        if (e.target === eventFormModal) {
            window.closeEventModal(); // Use global function
        }
    }

    // Handle event type change in modal
    editEventTypeSelect.addEventListener('change', async () => {
        if (editEventTypeSelect.value === 'birthday') {
            editChildSelectGroup.style.display = 'block';
             // Load children if not already loaded
            if (editChildSelect.options.length <= 1) { // Check if only default option exists
                const currentGardenId = sessionStorage.getItem('currentGardenId'); // Get current garden id
                
                if (currentGardenId) {
                    const { data: children, error } = await supabase
                        .from('children')
                        .select('id, name')
                        .eq('garden_id', currentGardenId);

                    if (error) {
                        console.error('Error fetching children:', error);
                        alert('שגיאה בטעינת רשימת הילדים.');
                    } else {
                        editChildSelect.innerHTML = '<option value="">בחר ילד</option>';
                         children.forEach(child => {
                            const option = document.createElement('option');
                            option.value = child.id;
                            option.textContent = `${child.name} (מזהה: ${child.id})`;
                            editChildSelect.appendChild(option);
                        });
                    }
                } else {
                    console.warn('Cannot load children: Garden ID not available.');
                }
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
    eventFormModalContent.addEventListener('submit', async (e) => {
        e.preventDefault();

        const eventId = editEventIdInput.value;
        const eventType = editEventTypeSelect.value;
        const childId = eventType === 'birthday' ? editChildSelect.value : null;
        const eventDate = editEventDateInput.value;
        const location = editLocationSelect.value === 'kindergarten' ? 'בגן' : editOtherLocationInput.value;
        const notes = editNotesInput.value;
        const currentGardenId = sessionStorage.getItem('currentGardenId');

        if (eventType === 'birthday' && !childId) {
            alert('אנא בחר ילד עבור אירוע יום הולדת');
            return;
        }
        
        if (!currentGardenId) {
             alert('שגיאה: מזהה גן לא זמין.');
             console.error('Garden ID is null when submitting event form.');
             return;
        }

        // Data structure for Supabase insert/update
        const eventDataToSave = {
            type: eventType,
            child_id: childId,
            date: eventDate, // Supabase expects ISO 8601 format for timestamp/date types
            location: location,
            notes: notes,
            garden_id: currentGardenId // Link event to the current garden
        };

        if (eventId) {
            // Update existing event
            const { data, error } = await supabase
                .from('events')
                .update(eventDataToSave)
                .eq('id', eventId);

            if (error) {
                console.error('Error updating event:', error);
                alert('שגיאה בעדכון האירוע.');
            } else {
                alert('האירוע עודכן בהצלחה!');
                window.closeEventModal();
                renderCalendar(); // Re-render calendar to show updated event
                window.closeEventDetails(); // Close details as they might be outdated
            }
        } else {
             // This branch should ideally not be reachable with current flow (events are created via addEvent function)
             // If we were adding events via the modal, we would use insert here.
             console.error('Attempted to save event without an ID. Use addEvent function for new events.');
             alert('שגיאה: נסיון לשמור אירוע חדש דרך טופס העריכה.');
        }
    });

    // Initialize calendar and event listeners
    initCalendar();

    // Support direct eventId navigation and show details
    const eventIdParam = urlParams.get('eventId');
    if (eventIdParam) {
        const currentGardenId = sessionStorage.getItem('currentGardenId');
        if (currentGardenId) {
             const { data: events, error } = await supabase
                 .from('events')
                 .select('*, children(name)') // Select event fields and join with children table to get child name
                 .eq('id', eventIdParam)
                 .eq('garden_id', currentGardenId)
                 .single(); // Expecting a single event

             if (error) {
                 console.error('Error fetching event for direct link:', error);
                 alert('שגיאה בטעינת האירוע.');
             } else if (events) {
                 // event data structure from Supabase will be slightly different
                 // need to map it to the structure showEventDetails expects or update showEventDetails
                 // assuming showEventDetails expects { id, type, childId, date, location, notes, attendance: [...] }
                 // Supabase gives us { id, type, child_id, date, location, notes, garden_id, children: { name } }

                 // Fetch attendance separately
                 const { data: attendance, error: attendanceError } = await supabase
                     .from('attendance')
                     .select('*')
                     .eq('event_id', eventIdParam);

                 if (attendanceError) {
                     console.error('Error fetching attendance for direct link:', attendanceError);
                     // Proceed without attendance data if there's an error
                 }

                 const eventWithAttendance = {
                     id: events.id,
                     type: events.type,
                     childId: events.child_id, // Supabase uses child_id, our JS uses childId
                     date: events.date, // Keep ISO format for showEventDetails if it handles it
                     location: events.location,
                     notes: events.notes,
                     gardenId: events.garden_id,
                     childName: events.children ? events.children.name : null, // Get child name from joined data
                     attendance: attendance || [] // Attach fetched attendance data
                 };

                 window.showEventDetails(eventWithAttendance); // Use global function
                 setTimeout(() => {
                     const eventDetailsElement = document.getElementById('eventDetails');
                      if(eventDetailsElement) eventDetailsElement.scrollIntoView({behavior: 'smooth'});
                 }, 200);
             }
         } else {
             console.warn('Garden ID not available for direct event link.');
         }
    }

    // Show garden name and copy link
    // Fetch garden name from Supabase
    const currentGardenIdForDisplay = sessionStorage.getItem('currentGardenId');
    if (currentGardenIdForDisplay) {
        const { data: currentGarden, error: gardenError } = await supabase
            .from('kindergartens')
            .select('name')
            .eq('id', currentGardenIdForDisplay)  // Changed from garden_id to id
            .single();

        if (gardenError) {
            console.error('Error fetching garden name:', gardenError);
            // Handle error
        } else if (currentGarden) {
            const gardenNameDisplay = document.getElementById('gardenNameDisplay');
            if(gardenNameDisplay) {
                 gardenNameDisplay.textContent = `שם הגן: ${currentGarden.name}`;
            }
        }
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

    // Add event listeners for edit and delete buttons after showEventDetails is called
    // These event listeners are added to the buttons within the event details section,
    // which is updated when showEventDetails is called.
    const editEventBtn = document.getElementById('editEventBtn');
    const deleteEventBtn = document.getElementById('deleteEventBtn');

    if (editEventBtn) {
        editEventBtn.addEventListener('click', async () => {
            const eventDetailsElement = document.getElementById('eventDetails');
            const currentEventIdFromData = eventDetailsElement ? eventDetailsElement.dataset.currentEventId : null;
            if (currentEventIdFromData) {
                // Fetch full event data from Supabase
                const { data: eventData, error } = await supabase
                    .from('events')
                    .select('*')
                    .eq('id', currentEventIdFromData)
                    .single();

                if (error) {
                    console.error('Error fetching event for edit:', error);
                    alert('שגיאה בטעינת נתוני האירוע לעריכה.');
                    return;
                }

                if (eventData) {
                    // Map Supabase field names to expected format
                    const mappedEventData = {
                        id: eventData.id,
                        type: eventData.type,
                        childId: eventData.child_id,
                        date: eventData.date,
                        location: eventData.location,
                        notes: eventData.notes
                    };
                    window.showEventModal('עריכת אירוע', mappedEventData);
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

    // Add WhatsApp reminder button logic
    const sendReminderBtn = document.getElementById('sendReminderBtn');
    if (sendReminderBtn) {
        // הכנה מראש של כל הערכים להודעת הוואטסאפ
        const reminderEventType = event.type;
        const reminderChildName = event.childName;
        const reminderDate = formatDate(new Date(event.date));
        const reminderLocation = event.location;
        const reminderNotes = event.notes || '';
        const eventUrl = window.location.origin + window.location.pathname + '#event-' + event.id;

        sendReminderBtn.onclick = function() {
            let msg = 'שלום! תזכורת: אירוע בגן';
            msg += '\nסוג אירוע: ' + reminderEventType;
            if (reminderChildName && reminderChildName !== 'לא רלוונטי') {
                msg += '\nשם הילד: ' + reminderChildName;
            }
            msg += '\nתאריך: ' + reminderDate;
            msg += '\nמיקום: ' + reminderLocation;
            if (reminderNotes) {
                msg += '\nהערות: ' + reminderNotes;
            }
            msg += '\nלפרטים נוספים: ' + eventUrl;
            window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
        };
    }

});

// Global functions for managing events and modals

// Show Event Modal function (Global)
window.showEventModal = async function(title, eventData = null) {
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

        // Handle child select for birthday
        if (eventData.type === 'birthday') {
            editChildSelectGroup.style.display = 'block';
            
            // Load children from Supabase and select the correct child
            const currentGardenId = sessionStorage.getItem('currentGardenId');
            if (currentGardenId) {
                const { data: children, error } = await supabase
                    .from('children')
                    .select('id, name')
                    .eq('garden_id', currentGardenId);

                if (error) {
                    console.error('Error fetching children for edit modal:', error);
                } else {
                    editChildSelect.innerHTML = '<option value="">בחר ילד</option>';
                    children.forEach(child => {
                        const option = document.createElement('option');
                        option.value = child.id;
                        option.textContent = `${child.name} (מזהה: ${child.id})`;
                        editChildSelect.appendChild(option);
                    });
                    
                    // Select the correct child
                    editChildSelect.value = eventData.childId;
                }
            }

        } else {
            editChildSelectGroup.style.display = 'none';
             editChildSelect.value = ''; // Clear child selection for non-birthdays
        }

        // Set date using Flatpickr instance
        if (eventDatePickerInstance) {
             // Flatpickr expects a Date object or string in its configured format
             // Convert Supabase ISO string to Date object or YYYY-MM-DD string
             eventDatePickerInstance.setDate(eventData.date);
        }

        // Handle location
        if (eventData.location === 'בגן') {
            editLocationSelect.value = 'kindergarten';
            editOtherLocationDiv.style.display = 'none';
            editOtherLocationInput.value = '';
        } else {
            editLocationSelect.value = 'other';
            editOtherLocationDiv.style.display = 'block';
            editOtherLocationInput.value = eventData.location;
        }

        editNotesInput.value = eventData.notes;

    } else {
        // Reset form for adding new event (though new events are added via addEvent)
        editEventIdInput.value = ''; // Clear ID for new events
        editEventTypeSelect.value = 'birthday'; // Default to birthday for new events
        editChildSelectGroup.style.display = 'block'; // Show child select for default type
        editChildSelect.innerHTML = '<option value="">בחר ילד</option>'; // Clear children options
        
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
window.deleteEvent = async function(eventId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק אירוע זה?')) {
        return;
    }

     if (!eventId) {
         console.error('Cannot delete event: Event ID missing.');
         alert('שגיאה במחיקת אירוע: מזהה אירוע חסר.');
         return;
     }

    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

    if (error) {
        console.error('Error deleting event:', error);
        alert('שגיאה במחיקת האירוע.');
    } else {
        alert('האירוע נמחק בהצלחה!');
        renderCalendar(); // Re-render calendar
        window.closeEventDetails(); // Close details section
    }
};

// Keep showEventDetails globally accessible as it's called from renderCalendar
window.showEventDetails = async function(event) {
    if (!event) return;
    const eventDetailsElement = document.getElementById('eventDetails');
    const eventTitleElement = document.getElementById('eventTitle');
    const eventDateElement = document.getElementById('eventDate');
    const eventLocationElement = document.getElementById('eventLocation');
    const eventNotesElement = document.getElementById('eventNotes');
    const attendanceFormElement = document.getElementById('attendanceForm');
    const attendanceTableBodyElement = document.getElementById('attendanceTableBody');
    const attendanceStatusSelectElement = document.getElementById('attendanceStatus');
    const attendanceNotesInput = document.getElementById('attendanceNotes');
    const saveAttendanceBtn = document.getElementById('saveAttendanceBtn');

    if (!eventDetailsElement || !eventTitleElement || !eventDateElement || !eventLocationElement || !eventNotesElement || !attendanceFormElement || !attendanceTableBodyElement || !attendanceStatusSelectElement || !attendanceNotesInput || !saveAttendanceBtn) {
        console.error('One or more event details elements not found.');
        return; // Exit if essential elements are missing
    }

    // Store the current event ID on the details element for edit/delete
    eventDetailsElement.dataset.currentEventId = event.id;

    // Display event details
    let title = '';
    let childName = '';
    let eventType = '';

    if (event.type === 'birthday') {
        eventType = 'יום הולדת';
        // If event object already has childName (from direct link fetch with join)
        if (event.childName) {
             childName = event.childName;
        } else if (event.childId || event.child_id) {
            // Fetch child name if not already available
            const childId = event.childId || event.child_id; // Support both formats
            const { data: child, error: childError } = await supabase
                .from('children')
                .select('name')
                .eq('id', childId)
                .single();

            if (childError) {
                console.error('Error fetching child name for birthday:', childError);
                childName = 'שגיאה בטעינת שם הילד';
            } else if (child) {
                childName = child.name;
            }
        }
        title = `יום הולדת ${childName}`; // Use fetched or available child name
    } else {
        eventType = 'אירוע כללי';
        childName = 'לא רלוונטי';
        title = 'אירוע כללי';
    }

    eventTitleElement.textContent = title;
    
    // Update specific fields in HTML
    const eventChildNameElement = document.getElementById('eventChildName');
    const eventTypeTextElement = document.getElementById('eventTypeText');
    
    if (eventChildNameElement) {
        eventChildNameElement.textContent = childName;
    }
    if (eventTypeTextElement) {
        eventTypeTextElement.textContent = eventType;
    }
    
    // Format date using imported function
    eventDateElement.textContent = formatDate(new Date(event.date));

    eventLocationElement.textContent = event.location;
    eventNotesElement.textContent = event.notes || 'אין';

    // Load and display attendance
    await loadAttendance(event);

    // Handle attendance form submission
    // Remove previous listener if any to prevent duplicates
    const newAttendanceFormElement = attendanceFormElement.cloneNode(true);
    attendanceFormElement.parentNode.replaceChild(newAttendanceFormElement, attendanceFormElement);
    const finalAttendanceFormElement = document.getElementById('attendanceForm'); // Get reference to the new form

    finalAttendanceFormElement.onsubmit = async (e) => {
        e.preventDefault();
        const statusValue = attendanceStatusSelectElement.value;
        const parentName = document.getElementById('parentName').value;
        const childName = document.getElementById('childName').value;
        const eventId = eventDetailsElement.dataset.currentEventId;

        if (!eventId) {
            console.error('Cannot save attendance: Event ID not found.');
            alert('שגיאה בשמירת אישור הגעה: מזהה אירוע חסר.');
            return;
        }

        if (!parentName || !childName) {
            alert('אנא הזן שם הורה ושם ילד.');
            return;
        }

        // Convert status value to Hebrew text
        let statusText = '';
        switch (statusValue) {
            case 'yes':
                statusText = 'יגיע';
                break;
            case 'no':
                statusText = 'לא יגיע';
                break;
            case 'maybe':
                statusText = 'אולי יגיע';
                break;
            default:
                statusText = statusValue;
        }

        const attendanceDataToSave = {
            event_id: eventId,
            parent_name: parentName,
            child_name: childName,
            status: statusText
        };

        // Insert new record (always add new attendance, don't update existing)
        const { data, error } = await supabase
            .from('attendance')
            .insert([attendanceDataToSave]); // insert expects an array

        if (error) {
            console.error('Error inserting attendance:', error);
            alert('שגיאה בהוספת אישור הגעה.');
        } else {
            alert('אישור ההגעה נשמר בהצלחה!');
            finalAttendanceFormElement.reset(); // Clear form
            loadAttendance(event); // Reload attendance table
        }
    };

    // Show details section
    eventDetailsElement.style.display = 'block';

    // Scroll to details section
    eventDetailsElement.scrollIntoView({ behavior: 'smooth' });
};

// Global function to close event details section (called from deleteEvent)
window.closeEventDetails = function() {
    const eventDetailsElement = document.getElementById('eventDetails');
    if (eventDetailsElement) {
        eventDetailsElement.style.display = 'none';
        // Clear data from details section?
        // Optional: clear attendance form/table
    }
};

// Load attendance list
async function loadAttendance(event) {
    const attendanceTableBodyElement = document.getElementById('attendanceTableBody');
    if (!attendanceTableBodyElement) return;

    attendanceTableBodyElement.innerHTML = ''; // Clear current table

    if (!event || !event.id) {
         console.warn('Cannot load attendance: Event object or ID missing.');
         return;
    }

    // Fetch attendance records for the event
    const { data: attendanceRecords, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('event_id', event.id);

    if (error) {
        console.error('Error fetching attendance records:', error);
        // Show error message in table
        const row = attendanceTableBodyElement.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 3; // Span across status, garden, notes
        cell.textContent = 'שגיאה בטעינת אישורי הגעה.';
        return;
    }

    if (attendanceRecords && attendanceRecords.length > 0) {
        attendanceRecords.forEach(record => {
            const row = attendanceTableBodyElement.insertRow();
            const parentCell = row.insertCell();
            const childCell = row.insertCell();
            const statusCell = row.insertCell();

            parentCell.textContent = record.parent_name || '';
            childCell.textContent = record.child_name || '';
            statusCell.textContent = getAttendanceStatusText(record.status);
        });
    } else {
        const row = attendanceTableBodyElement.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 3;
        cell.textContent = 'אין אישורי הגעה עדיין.';
    }
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
    attendanceForm.addEventListener('submit', async (e) => {
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
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('*')
            .eq('id', currentEventId)
            .single();

        if (eventError) {
            console.error('Error fetching event:', eventError);
            return;
        }

        // Add attendance record
        const { data: attendance, error: attendanceError } = await supabase
            .from('attendance')
            .insert([{
                event_id: currentEventId,
                parent_name: attendanceData.parentName,
                child_name: attendanceData.childName,
                status: attendanceData.status
            }]);

        if (attendanceError) {
            console.error('Error adding attendance:', attendanceError);
            return;
        }

        // Reload attendance list
        loadAttendance(event);

        // Clear form
        attendanceForm.reset();
    });
}

// Initialize calendar
function initCalendar() {
    renderCalendar();
    setupEventListeners();
}

// Render calendar for current month
async function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const currentGardenId = sessionStorage.getItem('currentGardenId'); // Get current garden ID from session

    if (!currentGardenId) {
        console.warn('Cannot render calendar: Garden ID not available.');
        // Optionally redirect or show a message
        return;
    }
    
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

    // Get events for current month from Supabase
    // Filter by garden_id and date range for the current month
    const startOfMonth = new Date(year, month, 1).toISOString();
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString(); // End of the last day

    const { data: events, error } = await supabase
        .from('events')
        .select('id, type, child_id, date, location, notes, garden_id') // Select necessary fields
        .eq('garden_id', currentGardenId) // Filter by current garden
        .gte('date', startOfMonth) // Greater than or equal to start of month
        .lte('date', endOfMonth); // Less than or equal to end of month

    if (error) {
        console.error('Error fetching events:', error);
        // Handle error - maybe show an alert or message on the calendar
        return;
    }

    // Add days
    for (let day = 1; day <= totalDays; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;

        // Check if current day has events (from fetched events)
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
            // Pass the first event of the day to showEventDetails
            dayElement.addEventListener('click', () => {
                window.showEventDetails(dayEvents[0]); // Use global showEventDetails
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