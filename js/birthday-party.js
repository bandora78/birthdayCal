// Import necessary modules and functions
import { supabase } from './main.js';
import { formatDate } from './main.js';
// generateId is no longer needed as Supabase generates IDs
// import { generateId } from './main.js'; 

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

    // Initialize Flatpickr for event date picker
    const eventDateElement = document.getElementById("eventDate");
    if (eventDateElement) {
        flatpickr(eventDateElement, {
            locale: "he",
            dateFormat: "Y-m-d",
            disableMobile: "true",
            theme: "material_blue"
        });
    }

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
        otherLocationDiv.style.display =
            locationSelect.value === 'other' ? 'block' : 'none';
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

            if (eventType === 'birthday' && !childId) {
                alert('אנא בחר ילד עבור אירוע יום הולדת');
                return;
            }

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
                alert('שגיאה בהוספת האירוע.');
            } else {
                alert('האירוע נוסף בהצלחה!');
                window.location.href = 'events.html';
            }
        });
    }

    // Load children for birthday events
    if (childSelect) {
        const { data: children, error } = await supabase
            .from('children')
            .select('id, name')
            .eq('garden_id', currentGardenId);

        if (error) {
            console.error('Error fetching children:', error);
            alert('שגיאה בטעינת רשימת הילדים.');
        } else {
            childSelect.innerHTML = '<option value="">בחר ילד</option>';
            children.forEach(child => {
                const option = document.createElement('option');
                option.value = child.id;
                option.textContent = child.name;
                childSelect.appendChild(option);
            });
        }
    }
}); 