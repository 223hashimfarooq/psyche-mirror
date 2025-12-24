// Global variables
let currentSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
let currentEmotionalState = '';
let currentActivity = null;
let activityTimer = null;
let activityStartTime = null;
let isActivityRunning = false;

// DOM elements - will be initialized after DOM is loaded
let emotionalStateSelect;
let intensitySelect;
let getRecommendationsBtn;
let recommendationsSection;
let recommendationsContent;
let activityTypesSection;
let activityDisplaySection;
let activityTitle;
let activityContent;
let multimediaSection;
let feedbackSection;
const loadingOverlay = document.getElementById('loadingOverlay');
const closeActivityBtn = document.getElementById('closeActivity');
const startActivityBtn = document.getElementById('startActivity');
const pauseActivityBtn = document.getElementById('pauseActivity');
const stopActivityBtn = document.getElementById('stopActivity');
const timeDisplay = document.getElementById('timeDisplay');
const submitFeedbackBtn = document.getElementById('submitFeedback');

// Initialize DOM elements
function initializeDOMElements() {
    emotionalStateSelect = document.getElementById('emotionalState');
    intensitySelect = document.getElementById('intensity');
    getRecommendationsBtn = document.getElementById('getRecommendations');
    recommendationsSection = document.getElementById('recommendationsSection');
    recommendationsContent = document.getElementById('recommendationsContent');
    activityTypesSection = document.getElementById('activityTypesSection');
    activityDisplaySection = document.getElementById('activityDisplaySection');
    activityTitle = document.getElementById('activityTitle');
    activityContent = document.getElementById('activityContent');
    multimediaSection = document.getElementById('multimediaSection');
    feedbackSection = document.getElementById('feedbackSection');
    
    console.log('DOM elements initialized:', {
        emotionalStateSelect: !!emotionalStateSelect,
        intensitySelect: !!intensitySelect,
        getRecommendationsBtn: !!getRecommendationsBtn,
        recommendationsSection: !!recommendationsSection
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    initializeDOMElements();
    initializeEventListeners();
    
    // Fallback: Direct event listener using event delegation
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'getRecommendations') {
            console.log('Fallback: Button clicked via event delegation');
            e.preventDefault();
            getRecommendations();
        }
    });
});

function initializeEventListeners() {
    console.log('Initializing event listeners...');
    console.log('getRecommendationsBtn:', getRecommendationsBtn);
    
    // Get recommendations button
    if (getRecommendationsBtn) {
        getRecommendationsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Get Recommendations button clicked'); // Debug log
            getRecommendations();
        });
        console.log('Button event listener added successfully');
    } else {
        console.error('getRecommendationsBtn is null - cannot add event listener');
    }
    
    // Activity type cards
    document.querySelectorAll('.activity-card').forEach(card => {
        card.addEventListener('click', function() {
            const activityType = this.dataset.type;
            handleActivityTypeClick(activityType);
        });
    });
    
    // Activity control buttons
    if (closeActivityBtn) closeActivityBtn.addEventListener('click', closeActivity);
    if (startActivityBtn) startActivityBtn.addEventListener('click', startActivity);
    if (pauseActivityBtn) pauseActivityBtn.addEventListener('click', pauseActivity);
    if (stopActivityBtn) stopActivityBtn.addEventListener('click', stopActivity);
    
    // Feedback stars
    document.querySelectorAll('.stars i').forEach(star => {
        star.addEventListener('click', function() {
            setRating(parseInt(this.dataset.rating));
        });
    });
    
    // Submit feedback
    submitFeedbackBtn.addEventListener('click', submitFeedback);
}

// Loading functions
function showLoading() {
    console.log('showLoading called');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    console.log('hideLoading called');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// Get recommendations from API
async function getRecommendations() {
    console.log('getRecommendations called');
    
    if (!emotionalStateSelect || !intensitySelect) {
        console.error('DOM elements not initialized yet');
        alert('Page is still loading. Please wait a moment and try again.');
        return;
    }
    
    const emotionalState = emotionalStateSelect.value;
    const intensity = intensitySelect.value;
    
    console.log('Getting recommendations for:', emotionalState, intensity); // Debug log
    
    if (!emotionalState) {
        alert('Please select your emotional state first.');
        return;
    }
    
    currentEmotionalState = emotionalState;
    showLoading();
    
    try {
        const url = `/api/recommendations/${emotionalState}?intensity=${intensity}&session_id=${currentSessionId}`;
        console.log('Requesting URL:', url); // Debug log
        
        const response = await fetch(url);
        console.log('Response status:', response.status); // Debug log
        
        const data = await response.json();
        console.log('Response data:', data); // Debug log
        
        if (response.ok) {
            displayRecommendations(data);
            showActivityTypes();
        } else {
            throw new Error(data.error || 'Failed to get recommendations');
        }
    } catch (error) {
        console.error('Error getting recommendations:', error);
        alert('Failed to get recommendations. Please try again.');
    } finally {
        hideLoading();
    }
}

// Display recommendations
function displayRecommendations(data) {
    console.log('displayRecommendations called with data:', data);
    
    if (!recommendationsContent) {
        console.error('recommendationsContent element not found');
        return;
    }
    
    const recommendations = data.recommendations;
    
    let html = `
        <div class="recommendation-summary">
            <h3>Based on your ${data.emotional_state} state (${data.intensity} intensity)</h3>
            <p>Here are personalized recommendations to help you feel better:</p>
        </div>
    `;
    
    // Display relaxation activities
    if (recommendations.relaxation_activities && recommendations.relaxation_activities.length > 0) {
        html += `
            <div class="recommendation-category">
                <h4><i class="fas fa-spa"></i> Relaxation Activities</h4>
                <div class="activity-list">
        `;
        recommendations.relaxation_activities.forEach(activity => {
            html += `
                <div class="activity-item">
                    <h5>${activity.name}</h5>
                    <p>${activity.description}</p>
                    <span class="duration">Duration: ${activity.duration} minutes</span>
                </div>
            `;
        });
        html += `</div></div>`;
    }
    
    // Display CBT techniques
    if (recommendations.cbt_techniques && recommendations.cbt_techniques.length > 0) {
        html += `
            <div class="recommendation-category">
                <h4><i class="fas fa-brain"></i> CBT Techniques</h4>
                <div class="technique-list">
        `;
        recommendations.cbt_techniques.forEach(technique => {
            html += `
                <div class="technique-item">
                    <h5>${technique.name}</h5>
                    <p>${technique.description}</p>
                </div>
            `;
        });
        html += `</div></div>`;
    }
    
    // Display mindfulness exercises
    if (recommendations.mindfulness_exercises && recommendations.mindfulness_exercises.length > 0) {
        html += `
            <div class="recommendation-category">
                <h4><i class="fas fa-leaf"></i> Mindfulness Exercises</h4>
                <div class="exercise-list">
        `;
        recommendations.mindfulness_exercises.forEach(exercise => {
            html += `
                <div class="exercise-item">
                    <h5>${exercise.name}</h5>
                    <p>${exercise.description}</p>
                    <span class="duration">Duration: ${exercise.duration} minutes</span>
                </div>
            `;
        });
        html += `</div></div>`;
    }
    
    recommendationsContent.innerHTML = html;
    recommendationsSection.style.display = 'block';
    recommendationsSection.classList.add('fade-in');
    
    console.log('Recommendations displayed successfully');
    console.log('HTML content length:', html.length);
    console.log('recommendationsSection display:', recommendationsSection.style.display);
}

// Show activity types
function showActivityTypes() {
    console.log('showActivityTypes called');
    console.log('activityTypesSection:', activityTypesSection);
    
    if (!activityTypesSection) {
        console.error('activityTypesSection element not found');
        return;
    }
    
    activityTypesSection.style.display = 'block';
    activityTypesSection.classList.add('slide-up');
}

// Handle activity type click
async function handleActivityTypeClick(activityType) {
    showLoading();
    
    try {
        let response;
        let data;
        
        switch (activityType) {
            case 'relaxation':
                response = await fetch('/api/activities/relaxation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        emotional_state: currentEmotionalState,
                        session_id: currentSessionId
                    })
                });
                data = await response.json();
                if (response.ok) {
                    displayActivity(data.activity, 'relaxation');
                }
                break;
                
            case 'mindfulness':
                response = await fetch('/api/activities/mindfulness', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        emotional_state: currentEmotionalState,
                        session_id: currentSessionId
                    })
                });
                data = await response.json();
                if (response.ok) {
                    displayActivity(data.exercise, 'mindfulness');
                }
                break;
                
            case 'cbt':
                response = await fetch('/api/cbt/techniques', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        emotional_state: currentEmotionalState
                    })
                });
                data = await response.json();
                if (response.ok) {
                    displayCBTTechniques(data.techniques);
                }
                break;
                
            case 'journaling':
                response = await fetch('/api/activities/journaling', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        emotional_state: currentEmotionalState,
                        random: true
                    })
                });
                data = await response.json();
                if (response.ok) {
                    displayJournalingPrompt(data.prompt);
                }
                break;
        }
    } catch (error) {
        console.error('Error getting activity:', error);
        alert('Failed to load activity. Please try again.');
    } finally {
        hideLoading();
    }
}

// Display activity
function displayActivity(activity, type) {
    currentActivity = activity;
    
    activityTitle.textContent = activity.name;
    
    let html = `
        <div class="activity-description">
            <p>${activity.description}</p>
            <div class="activity-duration">
                <i class="fas fa-clock"></i>
                Duration: ${activity.duration} minutes
            </div>
        </div>
        <div class="activity-steps">
            <h4>Instructions:</h4>
    `;
    
    activity.steps.forEach((step, index) => {
        html += `
            <div class="activity-step">
                <span class="activity-step-number">${index + 1}.</span>
                ${step}
            </div>
        `;
    });
    
    html += `</div>`;
    
    activityContent.innerHTML = html;
    activityDisplaySection.style.display = 'block';
    activityDisplaySection.classList.add('fade-in');
    
    // Show multimedia if available
    if (activity.multimedia) {
        showMultimedia(activity.multimedia);
    }
    
    // Reset timer
    resetTimer();
}

// Display CBT techniques
function displayCBTTechniques(techniques) {
    activityTitle.textContent = 'CBT Techniques';
    
    let html = '<div class="cbt-techniques">';
    techniques.forEach((technique, index) => {
        html += `
            <div class="technique-card">
                <h4>${technique.name}</h4>
                <p>${technique.description}</p>
                <div class="technique-steps">
                    <h5>Steps:</h5>
                    <ol>
        `;
        technique.steps.forEach(step => {
            html += `<li>${step}</li>`;
        });
        html += `
                    </ol>
                </div>
        `;
        
        // Add interactive questions if available
        if (technique.interactive_questions) {
            html += `
                <div class="interactive-section">
                    <h5>Interactive Exercise:</h5>
                    <div class="cbt-questions" id="cbt-questions-${index}">
                        <p class="current-question">${technique.interactive_questions[0]}</p>
                        <textarea placeholder="Write your answer here..." rows="3"></textarea>
                        <div class="question-navigation">
                            <button class="btn btn-secondary" onclick="previousQuestion(${index})" disabled>Previous</button>
                            <span class="question-counter">1 of ${technique.interactive_questions.length}</span>
                            <button class="btn btn-primary" onclick="nextQuestion(${index})">Next</button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        html += `</div>`;
    });
    html += '</div>';
    
    activityContent.innerHTML = html;
    activityDisplaySection.style.display = 'block';
    activityDisplaySection.classList.add('fade-in');
    
    // Initialize CBT question tracking
    initializeCBTQuestions(techniques);
}

// Display journaling prompt
function displayJournalingPrompt(prompt) {
    activityTitle.textContent = 'Journaling Exercise';
    
    let html = `
        <div class="journaling-prompt">
            <h4>Reflection Prompt:</h4>
            <div class="prompt-text">
                "${prompt}"
            </div>
            <div class="journaling-area">
                <textarea id="journalingTextarea" placeholder="Write your thoughts here..." rows="10"></textarea>
                <div class="journaling-controls">
                    <button id="saveJournal" class="btn btn-primary">Save Response</button>
                    <button id="clearJournal" class="btn btn-secondary">Clear</button>
                </div>
                <div id="journalSaved" class="saved-message" style="display: none;">
                    <i class="fas fa-check-circle"></i> Response saved!
                </div>
            </div>
        </div>
    `;
    
    activityContent.innerHTML = html;
    activityDisplaySection.style.display = 'block';
    activityDisplaySection.classList.add('fade-in');
    
    // Add event listeners for journaling controls
    document.getElementById('saveJournal').addEventListener('click', saveJournalResponse);
    document.getElementById('clearJournal').addEventListener('click', clearJournalResponse);
}

// Show multimedia
function showMultimedia(multimediaType) {
    multimediaSection.style.display = 'block';
    
    if (multimediaType.includes('breathing')) {
        document.getElementById('breathingGuide').style.display = 'block';
        document.getElementById('natureAnimation').style.display = 'none';
    } else {
        document.getElementById('natureAnimation').style.display = 'block';
        document.getElementById('breathingGuide').style.display = 'none';
    }
}

// Activity control functions
function startActivity() {
    isActivityRunning = true;
    activityStartTime = Date.now();
    
    startActivityBtn.style.display = 'none';
    pauseActivityBtn.style.display = 'inline-flex';
    stopActivityBtn.style.display = 'inline-flex';
    
    activityTimer = setInterval(updateTimer, 1000);
}

function pauseActivity() {
    isActivityRunning = false;
    clearInterval(activityTimer);
    
    pauseActivityBtn.style.display = 'none';
    startActivityBtn.style.display = 'inline-flex';
}

function stopActivity() {
    isActivityRunning = false;
    clearInterval(activityTimer);
    
    startActivityBtn.style.display = 'inline-flex';
    pauseActivityBtn.style.display = 'none';
    stopActivityBtn.style.display = 'none';
    
    resetTimer();
    showFeedback();
}

function closeActivity() {
    if (isActivityRunning) {
        if (confirm('Are you sure you want to close? Your progress will be lost.')) {
            stopActivity();
            activityDisplaySection.style.display = 'none';
            multimediaSection.style.display = 'none';
        }
    } else {
        activityDisplaySection.style.display = 'none';
        multimediaSection.style.display = 'none';
    }
}

// Timer functions
function updateTimer() {
    if (!isActivityRunning) return;
    
    const elapsed = Math.floor((Date.now() - activityStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function resetTimer() {
    timeDisplay.textContent = '00:00';
    activityStartTime = null;
}

// Feedback functions
function setRating(rating) {
    const stars = document.querySelectorAll('.stars i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function showFeedback() {
    feedbackSection.style.display = 'block';
    feedbackSection.classList.add('fade-in');
}

async function submitFeedback() {
    const rating = document.querySelectorAll('.stars i.active').length;
    const feedbackText = document.getElementById('feedbackText').value;
    
    if (rating === 0) {
        alert('Please provide a rating.');
        return;
    }
    
    try {
        const response = await fetch('/api/session/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: currentSessionId,
                activity_name: currentActivity ? currentActivity.name : 'Unknown',
                feedback: `Rating: ${rating}/5. Comments: ${feedbackText}`
            })
        });
        
        if (response.ok) {
            alert('Thank you for your feedback!');
            feedbackSection.style.display = 'none';
            activityDisplaySection.style.display = 'none';
            multimediaSection.style.display = 'none';
        } else {
            throw new Error('Failed to submit feedback');
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
        alert('Failed to submit feedback. Please try again.');
    }
}

// Global variables for CBT questions
let cbtQuestionsData = {};
let currentCBTTechnique = 0;

// Initialize CBT questions tracking
function initializeCBTQuestions(techniques) {
    cbtQuestionsData = {};
    techniques.forEach((technique, index) => {
        if (technique.interactive_questions) {
            cbtQuestionsData[index] = {
                currentQuestion: 0,
                answers: [],
                questions: technique.interactive_questions
            };
        }
    });
}

// CBT Question Navigation Functions
function nextQuestion(techniqueIndex) {
    const data = cbtQuestionsData[techniqueIndex];
    if (!data) return;
    
    // Save current answer
    const textarea = document.querySelector(`#cbt-questions-${techniqueIndex} textarea`);
    if (textarea) {
        data.answers[data.currentQuestion] = textarea.value;
    }
    
    // Move to next question
    if (data.currentQuestion < data.questions.length - 1) {
        data.currentQuestion++;
        updateCBTQuestionDisplay(techniqueIndex);
    } else {
        // Show completion message
        showCBTCompletion(techniqueIndex);
    }
}

function previousQuestion(techniqueIndex) {
    const data = cbtQuestionsData[techniqueIndex];
    if (!data || data.currentQuestion === 0) return;
    
    // Save current answer
    const textarea = document.querySelector(`#cbt-questions-${techniqueIndex} textarea`);
    if (textarea) {
        data.answers[data.currentQuestion] = textarea.value;
    }
    
    data.currentQuestion--;
    updateCBTQuestionDisplay(techniqueIndex);
}

function updateCBTQuestionDisplay(techniqueIndex) {
    const data = cbtQuestionsData[techniqueIndex];
    const questionElement = document.querySelector(`#cbt-questions-${techniqueIndex} .current-question`);
    const counterElement = document.querySelector(`#cbt-questions-${techniqueIndex} .question-counter`);
    const textarea = document.querySelector(`#cbt-questions-${techniqueIndex} textarea`);
    const prevButton = document.querySelector(`#cbt-questions-${techniqueIndex} button[onclick="previousQuestion(${techniqueIndex})"]`);
    const nextButton = document.querySelector(`#cbt-questions-${techniqueIndex} button[onclick="nextQuestion(${techniqueIndex})"]`);
    
    if (questionElement) questionElement.textContent = data.questions[data.currentQuestion];
    if (counterElement) counterElement.textContent = `${data.currentQuestion + 1} of ${data.questions.length}`;
    if (textarea) textarea.value = data.answers[data.currentQuestion] || '';
    if (prevButton) prevButton.disabled = data.currentQuestion === 0;
    if (nextButton) nextButton.textContent = data.currentQuestion === data.questions.length - 1 ? 'Complete' : 'Next';
}

function showCBTCompletion(techniqueIndex) {
    const data = cbtQuestionsData[techniqueIndex];
    const questionsDiv = document.querySelector(`#cbt-questions-${techniqueIndex}`);
    
    if (questionsDiv) {
        questionsDiv.innerHTML = `
            <div class="completion-message">
                <h5><i class="fas fa-check-circle"></i> Exercise Complete!</h5>
                <p>Great job working through the CBT technique. Your responses have been recorded.</p>
                <button class="btn btn-primary" onclick="showFeedback()">Provide Feedback</button>
            </div>
        `;
    }
}

// Journaling Functions
function saveJournalResponse() {
    const textarea = document.getElementById('journalingTextarea');
    const savedMessage = document.getElementById('journalSaved');
    
    if (textarea && textarea.value.trim()) {
        // Save to localStorage for now (in a real app, this would go to a database)
        const journalEntry = {
            prompt: document.querySelector('.prompt-text').textContent,
            response: textarea.value,
            timestamp: new Date().toISOString(),
            emotionalState: currentEmotionalState
        };
        
        let journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        journalEntries.push(journalEntry);
        localStorage.setItem('journalEntries', JSON.stringify(journalEntries));
        
        // Show success message
        savedMessage.style.display = 'block';
        setTimeout(() => {
            savedMessage.style.display = 'none';
        }, 3000);
    } else {
        alert('Please write something before saving.');
    }
}

function clearJournalResponse() {
    const textarea = document.getElementById('journalingTextarea');
    if (textarea) {
        textarea.value = '';
    }
}

// Add some CSS for the new elements
const additionalStyles = `
    .recommendation-summary {
        background: #f7fafc;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        border-left: 4px solid #667eea;
    }
    
    .recommendation-category {
        margin-bottom: 25px;
    }
    
    .recommendation-category h4 {
        color: #4a5568;
        margin-bottom: 15px;
        font-size: 1.2rem;
    }
    
    .activity-item, .technique-item, .exercise-item {
        background: white;
        padding: 15px;
        margin-bottom: 10px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }
    
    .activity-item h5, .technique-item h5, .exercise-item h5 {
        color: #2d3748;
        margin-bottom: 8px;
    }
    
    .duration {
        font-size: 0.9rem;
        color: #667eea;
        font-weight: 500;
    }
    
    .activity-description {
        background: #f7fafc;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
    }
    
    .activity-duration {
        margin-top: 10px;
        color: #667eea;
        font-weight: 500;
    }
    
    .cbt-techniques {
        display: grid;
        gap: 20px;
    }
    
    .technique-card {
        background: #f7fafc;
        padding: 20px;
        border-radius: 8px;
        border-left: 4px solid #667eea;
    }
    
    .technique-card h4 {
        color: #2d3748;
        margin-bottom: 10px;
    }
    
    .technique-steps ol {
        margin-left: 20px;
    }
    
    .technique-steps li {
        margin-bottom: 5px;
    }
    
    .journaling-prompt {
        text-align: center;
    }
    
    .prompt-text {
        background: #f7fafc;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        font-size: 1.1rem;
        font-style: italic;
        color: #4a5568;
    }
    
    .journaling-area textarea {
        width: 100%;
        padding: 15px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-family: inherit;
        font-size: 1rem;
        resize: vertical;
    }
    
    .journaling-area textarea:focus {
        outline: none;
        border-color: #667eea;
    }
    
    .journaling-controls {
        margin-top: 15px;
        display: flex;
        gap: 10px;
    }
    
    .saved-message {
        margin-top: 10px;
        color: #48bb78;
        font-weight: 500;
    }
    
    .interactive-section {
        margin-top: 20px;
        padding: 20px;
        background: #f0f8ff;
        border-radius: 8px;
        border-left: 4px solid #667eea;
    }
    
    .current-question {
        font-size: 1.1rem;
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 15px;
    }
    
    .question-navigation {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 15px;
    }
    
    .question-counter {
        font-weight: 500;
        color: #4a5568;
    }
    
    .completion-message {
        text-align: center;
        padding: 20px;
        background: #f0fff4;
        border-radius: 8px;
        border-left: 4px solid #48bb78;
    }
    
    .completion-message h5 {
        color: #48bb78;
        margin-bottom: 10px;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
