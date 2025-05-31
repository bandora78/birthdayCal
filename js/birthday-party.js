// Import necessary modules and functions
import { supabase } from './main.js';
import { formatDate } from './main.js';

// Global variables
let currentGardenId = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('birthday-party.js DOMContentLoaded fired');
    
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

    // Initialize Flatpickr for event date picker with better configuration
    const eventDateElement = document.getElementById("eventDate");
    console.log('eventDateElement found for Flatpickr:', eventDateElement);
    
    if (eventDateElement) {
        // Wait for Flatpickr to be fully loaded
        if (typeof flatpickr !== 'undefined') {
            const fp = flatpickr(eventDateElement, {
                locale: {
                    weekdays: {
                        shorthand: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
                        longhand: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
                    },
                    months: {
                        shorthand: ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'],
                        longhand: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
                    },
                    firstDayOfWeek: 0,
                    rangeSeparator: ' עד ',
                    weekAbbreviation: 'שבוע',
                    scrollTitle: 'גלול כדי להגדיל',
                    toggleTitle: 'לחץ כדי להחליף'
                },
                dateFormat: "Y-m-d",
                disableMobile: true,
                allowInput: true,
                minDate: "today",
                appendTo: document.body,
                position: "auto",
                onReady: function(selectedDates, dateStr, instance) {
                    console.log('Flatpickr is ready');
                    // Add RTL class to calendar
                    instance.calendarContainer.classList.add('rtl');
                },
                onChange: function(selectedDates, dateStr, instance) {
                    console.log('Date selected:', dateStr);
                },
                onOpen: function(selectedDates, dateStr, instance) {
                    // ודא שהחצים מוחלפים גם בפתיחה
                    setTimeout(() => {
                        if (instance.calendarContainer.classList.contains('rtl')) {
                            const monthsDiv = instance.calendarContainer.querySelector('.flatpickr-months');
                            const prev = monthsDiv.querySelector('.flatpickr-prev-month');
                            const next = monthsDiv.querySelector('.flatpickr-next-month');
                            if (prev && next && prev.nextSibling !== next) {
                                monthsDiv.insertBefore(next, prev);
                            }
                        }
                    }, 0);
                }
            });
            // החלף חצים מיד אחרי האתחול
            setTimeout(() => {
                const months = document.querySelectorAll('.flatpickr-calendar.rtl .flatpickr-months');
                months.forEach(monthsDiv => {
                    const prev = monthsDiv.querySelector('.flatpickr-prev-month');
                    const next = monthsDiv.querySelector('.flatpickr-next-month');
                    if (prev && next && prev.nextSibling !== next) {
                        monthsDiv.insertBefore(next, prev);
                    }
                });
            }, 0);
        } else {
            console.error('Flatpickr not loaded');
            // Fallback - use regular date input
            eventDateElement.type = 'date';
        }
    }

    // Load and display garden information
    await loadGardenInfo();

    // Script to toggle child selection based on event type
    const eventTypeSelect = document.getElementById('eventType');
    const childSelectGroup = document.getElementById('childSelectGroup');
    const childSelect = document.getElementById('childSelect');

    function toggleChildSelect() {
        if (eventTypeSelect.value === 'birthday') {
            childSelectGroup.style.display = 'block';
            childSelect.setAttribute('required', 'true');
        } else {
            childSelectGroup.style.display = 'none';
            childSelect.removeAttribute('required');
        }
    }

    // Initial check and event listener
    toggleChildSelect();
    eventTypeSelect.addEventListener('change', toggleChildSelect);

    // Handle location change
    const locationSelect = document.getElementById('location');
    const otherLocationDiv = document.getElementById('otherLocationDiv');
    const otherLocationInput = document.getElementById('otherLocation');

    locationSelect.addEventListener('change', () => {
        if (locationSelect.value === 'other') {
            otherLocationDiv.style.display = 'block';
            otherLocationInput.setAttribute('required', 'true');
        } else {
            otherLocationDiv.style.display = 'none';
            otherLocationInput.removeAttribute('required');
        }
    });

    // Handle form submission
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const eventType = eventTypeSelect.value;
            const childId = eventType === 'birthday' ? childSelect.value : null;
            const eventDate = eventDateElement.value;
            const location = locationSelect.value === 'kindergarten' ? 'בגן' : otherLocationInput.value;
            const notes = document.getElementById('notes').value;

            // Validation
            if (eventType === 'birthday' && !childId) {
                alert('אנא בחר ילד עבור אירוע יום הולדת');
                return;
            }

            if (!eventDate) {
                alert('אנא בחר תאריך לאירוע');
                return;
            }

            if (locationSelect.value === 'other' && !otherLocationInput.value.trim()) {
                alert('אנא הזן פרטי מיקום');
                return;
            }

            try {
                // Data structure for Supabase insert
                const eventData = {
                    type: eventType,
                    child_id: childId,
                    date: eventDate,
                    location: location,
                    notes: notes,
                    garden_id: currentGardenId
                };

                const { data, error } = await supabase
                    .from('events')
                    .insert([eventData]);

                if (error) {
                    console.error('Error adding event:', error);
                    alert('שגיאה בהוספת האירוע: ' + error.message);
                } else {
                    alert('האירוע נוסף בהצלחה!');
                    // Clear form
                    eventForm.reset();
                    toggleChildSelect(); // Reset child select visibility
                    // Optionally redirect to events page
                    // window.location.href = 'events.html';
                }
            } catch (error) {
                console.error('Unexpected error:', error);
                alert('שגיאה בלתי צפויה. אנא נסה שנית.');
            }
        });
    }

    // Load children for birthday events
    await loadChildren();
    
    // Load upcoming events
    await loadUpcomingEvents();
});

async function loadGardenInfo() {
    if (!currentGardenId) return;

    try {
        const { data: garden, error } = await supabase
            .from('kindergartens')
            .select('name')
            .eq('id', currentGardenId)
            .single();

        if (error) {
            console.error('Error fetching garden info:', error);
            return;
        }

        const gardenInfoDiv = document.getElementById('gardenInfoAndLink');
        const gardenNameDisplay = document.getElementById('gardenNameDisplay');
        const parentRegLink = document.getElementById('parentRegLink');
        const copyButton = document.getElementById('copyGardenLinkBtn');

        if (garden && gardenInfoDiv && gardenNameDisplay) {
            gardenNameDisplay.textContent = garden.name;
            
            if (parentRegLink) {
                const parentLink = `${window.location.origin}/children.html?gardenId=${currentGardenId}`;
                parentRegLink.value = parentLink;
            }

            if (copyButton) {
                copyButton.onclick = function() {
                    const msg = `היי! מצרף קישור לרישום ילדים לגן שלנו (${garden.name}):%0A${parentRegLink.value}`;
                    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
                    window.open(waUrl, '_blank');
                    
                    const copyMsg = document.getElementById('copyGardenLinkMsg');
                    if (copyMsg) {
                        copyMsg.style.display = 'block';
                        setTimeout(() => { copyMsg.style.display = 'none'; }, 3000);
                    }
                };
            }

            gardenInfoDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading garden info:', error);
    }
}

async function loadChildren() {
    if (!currentGardenId) return;

    try {
        const { data: children, error } = await supabase
            .from('children')
            .select('id, name')
            .eq('garden_id', currentGardenId)
            .order('name');

        const childSelect = document.getElementById('childSelect');
        if (childSelect) {
            childSelect.innerHTML = '<option value="">בחר ילד</option>';
            
            if (error) {
                console.error('Error fetching children:', error);
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'שגיאה בטעינת רשימת הילדים';
                childSelect.appendChild(option);
            } else if (children && children.length > 0) {
                children.forEach(child => {
                    const option = document.createElement('option');
                    option.value = child.id;
                    option.textContent = child.name;
                    childSelect.appendChild(option);
                });
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'אין ילדים רשומים בגן';
                childSelect.appendChild(option);
            }
        }
    } catch (error) {
        console.error('Error loading children:', error);
    }
}

async function loadUpcomingEvents() {
    if (!currentGardenId) return;

    try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data: events, error } = await supabase
            .from('events')
            .select(`
                *,
                children (name)
            `)
            .eq('garden_id', currentGardenId)
            .gte('date', today)
            .order('date');

        const partiesList = document.getElementById('partiesList');
        const upcomingEventsList = document.getElementById('upcomingEventsList');

        if (error) {
            console.error('Error fetching events:', error);
            return;
        }

        // Clear existing content
        if (partiesList) partiesList.innerHTML = '';
        if (upcomingEventsList) upcomingEventsList.innerHTML = '';

        if (events && events.length > 0) {
            const birthdays = events.filter(event => event.type === 'birthday');
            const otherEvents = events.filter(event => event.type !== 'birthday');

            // Display birthdays
            if (partiesList && birthdays.length > 0) {
                birthdays.forEach(event => {
                    const eventDiv = document.createElement('div');
                    eventDiv.className = 'event-card';
                    eventDiv.innerHTML = `
                        <h3>🎂 יום הולדת של ${event.children ? event.children.name : 'ילד לא ידוע'}</h3>
                        <p><strong>תאריך:</strong> ${formatDate(event.date)}</p>
                        <p><strong>מיקום:</strong> ${event.location}</p>
                        ${event.notes ? `<p><strong>הערות:</strong> ${event.notes}</p>` : ''}
                    `;
                    partiesList.appendChild(eventDiv);
                });
            } else if (partiesList) {
                partiesList.innerHTML = '<p>אין ימי הולדת קרובים</p>';
            }

            // Display other events
            if (upcomingEventsList && otherEvents.length > 0) {
                otherEvents.forEach(event => {
                    const eventDiv = document.createElement('div');
                    eventDiv.className = 'event-card';
                    eventDiv.innerHTML = `
                        <h3>📅 אירוע</h3>
                        <p><strong>תאריך:</strong> ${formatDate(event.date)}</p>
                        <p><strong>מיקום:</strong> ${event.location}</p>
                        ${event.notes ? `<p><strong>הערות:</strong> ${event.notes}</p>` : ''}
                    `;
                    upcomingEventsList.appendChild(eventDiv);
                });
            } else if (upcomingEventsList) {
                upcomingEventsList.innerHTML = '<p>אין אירועים אחרים קרובים</p>';
            }
        } else {
            if (partiesList) partiesList.innerHTML = '<p>אין ימי הולדת קרובים</p>';
            if (upcomingEventsList) upcomingEventsList.innerHTML = '<p>אין אירועים אחרים קרובים</p>';
        }
    } catch (error) {
        console.error('Error loading upcoming events:', error);
    }
}