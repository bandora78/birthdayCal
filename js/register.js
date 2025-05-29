// Import necessary functions from main.js
import { generateGardenId } from './main.js';
// We will replace usage of storage for kindergartens with Supabase calls
// import { storage } from './main.js'; // No longer needed for kindergartens
import { supabase } from './main.js'; // Import supabase

document.addEventListener('DOMContentLoaded', async () => {
    // Get form elements
    const kindergartenForm = document.getElementById('kindergartenRegistrationForm');
    const gardenLinkSection = document.getElementById('gardenLinkSection');
    const childrenList = document.getElementById('childrenList');
    const childrenTableBody = document.getElementById('childrenTableBody');
    const gardenIdDisplay = document.getElementById('gardenIdDisplay');
    const parentRegLink = document.getElementById('parentRegLink');
    const copyParentLinkBtn = document.getElementById('copyParentLinkBtn');
    const copyParentLinkMsg = document.getElementById('copyParentLinkMsg');
    
    let currentGardenId = null;
    
    // Clear hash on load to prevent automatic redirection
    if (window.location.hash && !window.location.search) {
        history.replaceState(null, '', window.location.pathname);
    }

    // Check if we should show children list directly
    if (window.location.hash === '#childrenList') {
        // const kindergartens = storage.get('kindergartens') || []; // Removed storage call
        const { data: kindergartens, error } = await supabase
            .from('kindergartens')
            .select('id, garden_id, name') // Select relevant fields
            .limit(1) // Assuming only one kindergarten per admin for now
            .order('created_at', { ascending: false }); // Get the latest one

        if (error) {
            console.error('Error fetching kindergartens:', error);
            alert('שגיאה בטעינת פרטי הגן.');
            // Decide how to handle this error - maybe redirect to registration?
            window.location.href = 'register.html';
            return;
        }

        if (kindergartens && kindergartens.length > 0) {
            kindergartenForm.style.display = 'none';
            childrenList.style.display = 'block';
            const lastKindergarten = kindergartens[0]; // Get the first (latest) one
            // Use the garden_id field from Supabase if you added it, otherwise use the generated one if you saved it.
            // Based on the SQL schema, we used the auto-generated UUID as 'id'.
            // Let's assume for now we are using the auto-generated UUID from Supabase as the unique identifier.
            // If you intended to use the client-generated gardenId for the URL/session, we need to adjust.
            // Let's stick to the Supabase UUID for consistency going forward.

            // --- Assuming we use the Supabase 'id' (UUID) as the primary garden identifier ---
            currentGardenId = lastKindergarten.id; // Use Supabase ID
            sessionStorage.setItem('currentGardenId', currentGardenId); // Store Supabase ID in session

            // Show garden ID in admin mode
            gardenLinkSection.style.display = 'block';
            gardenIdDisplay.textContent = currentGardenId; // Display Supabase ID
            const parentLink = `${window.location.origin}/children.html?gardenId=${currentGardenId}`;
            parentRegLink.value = parentLink;

            // window.loadChildren(); // We will update loadChildren later in children.js
            // For now, maybe just show the children list structure without data or add a placeholder

        } else {
            alert('יש להשלים קודם את רישום הגן');
            window.location.href = 'register.html';
        }
    }

    // Check if we have a gardenId in the URL (Parent mode)
    const urlParams = new URLSearchParams(window.location.search);
    const gardenIdFromUrl = urlParams.get('gardenId');

    if (gardenIdFromUrl) {
        // If we have a gardenId in the URL, we're in parent registration mode
        sessionStorage.setItem('currentGardenId', gardenIdFromUrl); // Store URL ID in session
        kindergartenForm.style.display = 'none';
        gardenLinkSection.style.display = 'none';
        childrenList.style.display = 'block';
        // window.loadChildren(); // We will update loadChildren later in children.js
    } else {
        // We're in garden registration mode
        kindergartenForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const kindergartenName = document.getElementById('kindergartenName').value;
            const schoolYear = document.getElementById('schoolYear').value;
            const teacherName = document.getElementById('teacherName').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            
            // Generate a unique garden ID (Supabase will generate UUID for id)
            // We still generate a unique gardenId for the link/session storage for now
            const gardenId = window.generateGardenId(); 
            
            // Create new kindergarten object
            const newKindergarten = {
                // Supabase will generate id (UUID)
                name: kindergartenName,
                admin_email: email, // Use the email as admin_email
                // schoolYear, // Decide if we need these fields in DB
                // teacherName,
                // phone
            };
            
            // Save to Supabase
            const { data, error } = await supabase
                .from('kindergartens')
                .insert([newKindergarten]);

            if (error) {
                console.error('Error saving kindergarten:', error);
                alert('שגיאה בשמירת פרטי הגן. אנא נסה שנית.');
                return;
            }
            
            // Assuming the insert was successful, store the generated ID and redirect
            const insertedKindergarten = data[0];
            const newGardenSupabaseId = insertedKindergarten.id; // Get the UUID generated by Supabase
            const newGardenDisplayId = gardenId; // Use the generated display ID for the link/session

            // Store current garden ID in session storage (using the display ID for consistency with URL parameter)
            sessionStorage.setItem('currentGardenId', newGardenDisplayId);
            // Optionally store the Supabase UUID if needed later, e.g., sessionStorage.setItem('currentGardenSupabaseId', newGardenSupabaseId);

            alert('הגן נרשם בהצלחה!');
            
            // Redirect to children page with the new garden display ID
            window.location.href = `children.html?gardenId=${newGardenDisplayId}`;
        });
    }

    // Check if kindergarten is already registered (admin mode - initial load)
    // This block is similar to the #childrenList block, let's consolidate or refine.
    // Given the #childrenList logic handles the display if a garden exists,
    // this block might be redundant or need adjustment for initial load without hash.

    // Let's refine the logic: on DOMContentLoaded, check for gardenId in URL first.
    // If no gardenId in URL, check if any kindergartens exist in Supabase.
    // If kindergartens exist, show admin view with latest garden.
    // If no kindergartens exist, show registration form.

    if (!gardenIdFromUrl) { // If not in parent mode (no gardenId in URL)
         // Check if any kindergartens exist in Supabase
        const { data: kindergartens, error } = await supabase
            .from('kindergartens')
            .select('id, name') // Select relevant fields (removed garden_id as id is the UUID)
            .limit(1) // Check for existence of at least one
            .order('created_at', { ascending: false }); // Get the latest one if exists

        if (error) {
            console.error('Error fetching kindergartens on initial load:', error);
            alert('שגיאה בטעינת פרטי הגן.');
            // Stay on registration page in case of error
             // Ensure registration form is shown if there's an error fetching kindergartens
            kindergartenForm.style.display = 'block';
            gardenLinkSection.style.display = 'none';
            childrenList.style.display = 'none';
            return; // Stop further execution if error
        }

        if (kindergartens && kindergartens.length > 0) {
            // Kindergarten(s) exist, show admin view
            const latestKindergarten = kindergartens[0];
            currentGardenId = latestKindergarten.id; // Use Supabase ID
            sessionStorage.setItem('currentGardenId', currentGardenId); // Store Supabase ID

            gardenLinkSection.style.display = 'block';
            gardenIdDisplay.textContent = currentGardenId; // Display Supabase ID
            const parentLink = `${window.location.origin}/children.html?gardenId=${currentGardenId}`;
            parentRegLink.value = parentLink;

            kindergartenForm.style.display = 'none';
            childrenList.style.display = 'block';

            // window.loadChildren(); // Update later in children.js

        } else {
            // No kindergartens exist, show registration form
            kindergartenForm.style.display = 'block';
            gardenLinkSection.style.display = 'none';
            childrenList.style.display = 'none';
        }
    }

    // Copy link functionality (moved outside the conditions to avoid duplication)
    if (copyParentLinkBtn) {
        copyParentLinkBtn.addEventListener('click', () => {
            parentRegLink.select();
            document.execCommand('copy');
            copyParentLinkMsg.style.display = 'block';
            setTimeout(() => {
                copyParentLinkMsg.style.display = 'none';
            }, 2000);
        });
    }

     // If in parent mode (gardenId in URL), simply ensure relevant sections are displayed
     // The logic for this is already mostly handled by the initial if(gardenIdFromUrl) block
     // We might need to fetch garden details here if we want to display the garden name in parent mode
}); 