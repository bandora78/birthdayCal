// Import necessary functions from main.js
import { supabase } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Clear session storage when entering registration page
    sessionStorage.clear();

    // Get form elements
    const kindergartenForm = document.getElementById('kindergartenRegistrationForm');
    const gardenLinkSection = document.getElementById('gardenLinkSection');
    const childrenList = document.getElementById('childrenList');
    const gardenIdDisplay = document.getElementById('gardenIdDisplay');
    const parentRegLink = document.getElementById('parentRegLink');
    const copyParentLinkBtn = document.getElementById('copyParentLinkBtn');
    const copyParentLinkMsg = document.getElementById('copyParentLinkMsg');

    // Check if we have a gardenId in the URL (Parent mode)
    const urlParams = new URLSearchParams(window.location.search);
    const gardenIdFromUrl = urlParams.get('gardenId');

    if (gardenIdFromUrl) {
        // If we have a gardenId in the URL, we're in parent registration mode
        sessionStorage.setItem('currentGardenId', gardenIdFromUrl);
        if (kindergartenForm) kindergartenForm.style.display = 'none';
        if (gardenLinkSection) gardenLinkSection.style.display = 'none';
        if (childrenList) childrenList.style.display = 'block';
    } else {
        // We're in garden registration mode - show the form
        if (kindergartenForm) kindergartenForm.style.display = 'block';
        if (gardenLinkSection) gardenLinkSection.style.display = 'none';
        if (childrenList) childrenList.style.display = 'none';

        // Handle form submission
        if (kindergartenForm) {
            kindergartenForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const gardenData = {
                    name: document.getElementById('kindergartenName').value,
                    admin_email: document.getElementById('email').value
                };
                
                console.log('Attempting to save garden data:', gardenData); // Debug log
                
                // Insert new garden into Supabase
                const { data, error } = await supabase
                    .from('kindergartens')
                    .insert([gardenData])
                    .select();

                if (error) {
                    console.error('Error saving kindergarten:', error);
                    alert('שגיאה בשמירת פרטי הגן. אנא נסה שנית.');
                    return;
                }
                
                if (!data || data.length === 0) {
                    console.error('Insert successful, but no data returned:', data);
                    alert('שגיאה בשמירת פרטי הגן: לא התקבלו פרטי הגן שנשמרו.');
                    return;
                }

                const insertedKindergarten = data[0];
                const newGardenId = insertedKindergarten.id;

                // Store new garden ID in session storage
                sessionStorage.setItem('currentGardenId', newGardenId);

                // Show success message and garden details
                alert('הגן נרשם בהצלחה!');
                
                // Show garden link section
                if (gardenLinkSection) gardenLinkSection.style.display = 'block';
                if (gardenIdDisplay) gardenIdDisplay.textContent = newGardenId;
                
                // Update parent registration link
                const parentLink = `${window.location.origin}/children.html?gardenId=${newGardenId}`;
                if (parentRegLink) parentRegLink.value = parentLink;

                // Redirect to children page
                window.location.href = `children.html?gardenId=${newGardenId}`;
            });
        }
    }

    // Copy link functionality
    if (copyParentLinkBtn) {
        copyParentLinkBtn.addEventListener('click', () => {
            if (parentRegLink) {
                parentRegLink.select();
                document.execCommand('copy');
                if (copyParentLinkMsg) {
                    copyParentLinkMsg.style.display = 'block';
                    setTimeout(() => {
                        copyParentLinkMsg.style.display = 'none';
                    }, 2000);
                }
            }
        });
    }
}); 