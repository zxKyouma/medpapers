// --- DATA ---
// Sample question bank (Replace with dynamic fetching later)
// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";

import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

function setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User logged in:", user.email);
            const lastName = getLastName(user.displayName) || getLastNameFromEmail(user.email) || "User";
            const usernameDisplay = `${user.displayName}`;
            updateLoginUI(true, usernameDisplay);
        } else {
            console.log("No user logged in.");
            updateLoginUI(false);
        }
    });
}

function updateLoginUI(isLoggedIn, username = null) {
    if (!loginBtn || !userInfo) {
        console.error("loginBtn or userInfo not found:", { loginBtn, userInfo });
        return;
    }
    console.log("Login button visibility:", !isLoggedIn);
    loginBtn.classList.toggle('hidden', isLoggedIn);
    userInfo.classList.toggle('hidden', !isLoggedIn);
    userInfo.classList.toggle('flex', isLoggedIn);
    if (isLoggedIn) {
        if (username) {
            const usernameEl = document.getElementById('username');
            if (usernameEl) usernameEl.textContent = username;
            else console.error("username element not found!");
        }
        closeLoginModal();
    }
}

// Helper function to extract last name from displayName
function getLastName(displayName) {
    if (!displayName) return null;
    const nameParts = displayName.trim().split(/\s+/);
    return nameParts[nameParts.length - 1]; // Last word as last name
}

// Fallback to extract last name from email if displayName is unavailable
function getLastNameFromEmail(email) {
    if (!email) return null;
    const localPart = email.split('@')[0]; //
    const nameParts = localPart.split(/[._-]/); // Split on common separators
    return nameParts[nameParts.length - 1]; // Last part as last name
}

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCUdHThoOx9F-dOfN7FW-lgHCo9HO2NxAo",
    authDomain: "rendang-table.firebaseapp.com",
    projectId: "rendang-table",
    storageBucket: "rendang-table.firebasestorage.app",
    messagingSenderId: "1091181818182",
    appId: "1:1091181818182:web:1105c2b8f5e3b510103547",
    measurementId: "G-DR4XCTKH32"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

/**
 * Fetches questions from the 'questions' collection in Firestore.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of question objects.
 */
async function loadQuestionsFromFirebase() {
    const fetchedQuestions = []; // Temporary array for this function's scope
    const questionsCollectionRef = collection(db, "questions");
    try {
        const querySnapshot = await getDocs(questionsCollectionRef);
        querySnapshot.forEach((doc) => {
            const questionData = doc.data();
            fetchedQuestions.push({
                id: doc.id,
                subject: questionData.subject,
                question: questionData.question,
                options: questionData.options,
                correctAnswer: questionData.correctAnswer,
                difficulty: questionData.difficulty,
                avgTimeSeconds: questionData.avgTimeSeconds,
                explanation: questionData.explanation
            });
        });
        console.log("Firebase fetch successful.");
        return fetchedQuestions; // Return the array of questions
    } catch (error) {
        console.error("Error loading questions from Firebase:", error);
        return []; // Return empty array on error
    }
}


let questions = [];


async function initializeAndUseQuestions() {
    console.log("Attempting to load questions...");


    const loadedQuestions = await loadQuestionsFromFirebase();

    questions = loadedQuestions;

    console.log(`Successfully populated 'questions' variable with ${questions.length} items.`);


    if (questions.length > 0) {
        // --- Start using the 'questions' array ---
        console.log("First question loaded:", questions[0]);

        console.log(`Loaded ${questions.length} questions successfully! Check the console.`);
    } else {
        // Handle the case where no questions were loaded
        console.log("No questions were loaded from Firebase.");
        alert("Failed to load questions from the database.");
    }
}


initializeAndUseQuestions();


/*const questions = [
    {
        id: 1,
        subject: "Pharmacology",
        question: "A 48-year-old woman with a history of migraine headaches is prescribed sumatriptan. Which of the following receptors is the primary target of this medication?",
        options: ["GABA receptors", "Dopamine D2 receptors", "5-HT1B/1D receptors", "Muscarinic acetylcholine receptors", "Beta-adrenergic receptors"],
        correctAnswer: "C", // Corresponds to 5-HT1B/1D receptors
        difficulty: "medium",
        avgTimeSeconds: 45,
        explanation: "Sumatriptan is a serotonin (5-HT) receptor agonist, specifically targeting the 5-HT1B and 5-HT1D subtypes, which causes vasoconstriction of cranial blood vessels."
    },
    {
        id: 2,
        subject: "Pathology",
        question: "A biopsy of a lymph node shows non-caseating granulomas. This finding is most characteristic of which condition?",
        options: ["Tuberculosis", "Sarcoidosis", "Lymphoma", "Fungal infection", "Metastatic carcinoma"],
        correctAnswer: "B",
        difficulty: "medium",
        avgTimeSeconds: 50,
        explanation: "Non-caseating granulomas are a hallmark feature of sarcoidosis, although they can occasionally be seen in other conditions."
    },
    {
        id: 3,
        subject: "Anatomy",
        question: "Which cranial nerve is responsible for innervating the muscles of mastication?",
        options: ["Facial Nerve (CN VII)", "Trigeminal Nerve (CN V)", "Glossopharyngeal Nerve (CN IX)", "Vagus Nerve (CN X)", "Hypoglossal Nerve (CN XII)"],
        correctAnswer: "B",
        difficulty: "easy",
        avgTimeSeconds: 30,
        explanation: "The mandibular division (V3) of the Trigeminal Nerve (CN V) innervates the muscles of mastication (temporalis, masseter, medial and lateral pterygoids)."
    }
];
*/

let currentQuestionIndex = 0;
let userAnswers = {}; // Store user answers, e.g., { questionId: { selected: 'A', correct: true/false } }
let sessionStats = { correct: 0, incorrect: 0, total: 0 };
let currentFilters = { subject: 'all', difficulty: 'all' }; // Store current filters

// --- DOM Elements ---
// (Get references to elements needed for interaction)
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content > div');
const userMenuBtn = document.getElementById('userMenuBtn');
const userDropdown = document.getElementById('userDropdown');
const subjectFilterBtn = document.getElementById('subjectFilterBtn');
const subjectDropdown = document.getElementById('subjectDropdown');
const difficultyFilterBtn = document.getElementById('difficultyFilterBtn');
const difficultyDropdown = document.getElementById('difficultyDropdown');
const questionTextEl = document.getElementById('questionText');
const answerOptionsContainer = document.getElementById('answerOptions');
const feedbackAreaEl = document.getElementById('feedbackArea');
const feedbackTextEl = document.getElementById('feedbackText');
const nextButton = document.getElementById('nextButton');
const prevButton = document.getElementById('prevButton');
const flagButton = document.getElementById('flagButton');
// ... Add references for other elements like chart canvases, stat displays, modal elements, etc.
const weeklyChartCanvas = document.getElementById('weeklyActivityChart');
const subjectsChartCanvas = document.getElementById('subjectsChart');
const progressChartCanvas = document.getElementById('progressChart');
const loginModal = document.getElementById('loginModal');
const closeLoginModalBtn = document.getElementById('closeLoginModal');
const loginBtn = document.getElementById('loginBtn'); // Button to open modal
const userInfo = document.getElementById('userInfo'); // Div showing user info
const logoutBtn = document.getElementById('logoutBtn');
const loginForm = document.getElementById('loginForm');
const googleLoginBtn = document.getElementById('googleLoginBtn');
// --- Functions ---

/**
 * Initializes the application: loads data, sets up event listeners, renders initial view.
 */
async function initializeRendangApp() {
    await initializeAndUseQuestions();
    setupEventListeners();
    filterAndLoadQuestion(currentQuestionIndex);
    initializeCharts();
    populateSubjectStatsTable(); // Add this
    updateDashboardStats();
    updateLoginUI(false);
}
async function handleAddQuestion(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const questionData = {
        subject: formData.get('subject'),
        question: formData.get('question'),
        options: formData.get('options').split(',').map(opt => opt.trim()),
        correctAnswer: formData.get('correctAnswer').toUpperCase(),
        difficulty: formData.get('difficulty'),
        avgTimeSeconds: parseInt(formData.get('avgTimeSeconds'), 10),
        explanation: formData.get('explanation')
    };

    try {
        await addDoc(collection(db, "questions"), questionData);
        alert("Question added successfully!");
        form.reset(); // Clear form
        // Optionally, reload questions
        questions = await loadQuestionsFromFirebase();
        filterAndLoadQuestion(currentQuestionIndex);
    } catch (error) {
        console.error("Error adding question:", error);
        alert("Failed to add question.");
    }
}
function handleImportQuestions(files) {
    if (!files || files.length === 0) {
        alert("Please select a file to import.");
        return;
    }
    const file = files[0];
    console.log(`Importing file: ${file.name}`);
    alert("Import feature coming soon! Implement file parsing logic for CSV/JSON.");
    /*
    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        // Parse CSV or JSON and add to Firestore
        console.log("File content:", content);
    };
    reader.readAsText(file);
    */
}
/**
 * Sets up all necessary event listeners.
 */
function setupEventListeners() {
    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-button'); // Fresh query
    tabButtons.forEach(button => {
        if (button.id !== 'loginBtn') {
            button.addEventListener('click', handleTabClick);
        }
    });

    loginBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log("Login button clicked!");
        openLoginModal();
    });
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            try {
                const result = await signInWithPopup(auth, googleProvider);
                console.log("Google login success:", result.user.email);
                closeLoginModal();
            } catch (error) {
                console.error("Google login failed:", error);
                alert(`Google login failed: ${error.message}`);
            }
        });
    } else {
        console.error("googleLoginBtn not found!");
    }



    // User menu dropdown
    userMenuBtn?.addEventListener('click', toggleUserDropdown);
    document.addEventListener('click', closeDropdownsOnClickOutside); // Close dropdowns if clicking outside

    // Filter dropdowns
    subjectFilterBtn?.addEventListener('click', () => toggleDropdown(subjectDropdown));
    difficultyFilterBtn?.addEventListener('click', () => toggleDropdown(difficultyDropdown));
    // Add listeners for filter options inside dropdowns (event delegation might be good here)
     subjectDropdown?.addEventListener('click', handleSubjectFilterSelection);
     difficultyDropdown?.addEventListener('click', handleDifficultyFilterSelection);


    // MCQ navigation
    nextButton?.addEventListener('click', () => changeQuestion(1));
    prevButton?.addEventListener('click', () => changeQuestion(-1));
    // Import Button
    const importBtn = document.getElementById('importBtn');
    const fileInput = document.getElementById('fileInput');
    importBtn?.addEventListener('click', () => handleImportQuestions(fileInput.files));
    // Answer selection (using event delegation on the container)
    answerOptionsContainer?.addEventListener('click', handleAnswerSelection);
    const addQuestionForm = document.getElementById('addQuestionForm');
    addQuestionForm?.addEventListener('submit', handleAddQuestion);
    // Difficulty rating
     document.querySelectorAll('.difficulty-btn').forEach(btn => {
         btn.addEventListener('click', handleDifficultyRating);
     });

     // Flagging
     flagButton?.addEventListener('click', handleFlagQuestion);

     // Modal open/close
    loginBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log("Login button clicked!");
        openLoginModal();
    });
     closeLoginModalBtn?.addEventListener('click', closeLoginModal);
     loginModal?.addEventListener('click', (e) => { // Close if clicking overlay
         if (e.target === loginModal) closeLoginModal();
     });
     document.querySelectorAll('.tab-button').forEach(tab => {
        tab.addEventListener('click', handleTabClick);
    });
     setupAuthListener();

     // Logout
     logoutBtn?.addEventListener('click', handleLogout);
     


    // ... Add listeners for other interactive elements (quick action buttons, manage section forms, etc.)
}

/**
 * Handles clicks on tab buttons to switch views.
 * @param {Event} event - The click event object.
 */
function handleTabClick(event) {
    const clickedTab = event.currentTarget;
    const targetContentId = clickedTab.getAttribute('aria-controls');
    if (!targetContentId) return; // Skip if no content ID (e.g., loginBtn)

    console.log(`Switching to tab: ${clickedTab.textContent.trim()}`);
    tabButtons.forEach(button => button.classList.remove('active', 'font-semibold'));
    tabButtons.forEach(button => button.setAttribute('aria-selected', 'false'));
    tabContents.forEach(content => content.classList.remove('active'));


    clickedTab.classList.add('active', 'font-semibold');
    clickedTab.setAttribute('aria-selected', 'true');
    const targetContent = document.getElementById(targetContentId);
    if (targetContent) {
        targetContent.classList.add('active');
        console.log(`Activated content: ${targetContentId}`);
        if (targetContentId === 'revisionsContent') {
            filterAndLoadQuestion(0, true); // Load revision questions
        } else if (targetContentId === 'practiceContent') {
            filterAndLoadQuestion(0, false); // Load practice questions
        }
    } else {
        console.error(`Content panel with ID ${targetContentId} not found.`);
    }
}


/**
 * Toggles the visibility of the user dropdown menu.
 */
function toggleUserDropdown() {
     const isExpanded = userMenuBtn.getAttribute('aria-expanded') === 'true';
     userMenuBtn.setAttribute('aria-expanded', !isExpanded);
     userDropdown.classList.toggle('hidden');
}

/**
 * Generic function to toggle a dropdown's visibility.
 * @param {HTMLElement} dropdownElement - The dropdown element to toggle.
 */
function toggleDropdown(dropdownElement) {
    if (!dropdownElement) return;
    const associatedButton = document.querySelector(`[aria-controls="${dropdownElement.id}"]`);
    const isExpanded = associatedButton?.getAttribute('aria-expanded') === 'true';
    
    // Close other dropdowns first (optional, improves UX)
    closeAllFilterDropdowns(dropdownElement); 
    
    dropdownElement.classList.toggle('hidden');
    if (associatedButton) {
        associatedButton.setAttribute('aria-expanded', String(!isExpanded));
    }
}



/**
 * Closes dropdown menus if a click occurs outside of them.
 * @param {Event} event - The click event object.
 */
function closeDropdownsOnClickOutside(event) {
    if (!userMenuBtn?.contains(event.target) && !userDropdown?.contains(event.target)) {
        userMenuBtn?.setAttribute('aria-expanded', 'false');
        userDropdown?.classList.add('hidden');
    }
     if (!subjectFilterBtn?.contains(event.target) && !subjectDropdown?.contains(event.target)) {
         subjectFilterBtn?.setAttribute('aria-expanded', 'false');
         subjectDropdown?.classList.add('hidden');
     }
     if (!difficultyFilterBtn?.contains(event.target) && !difficultyDropdown?.contains(event.target)) {
         difficultyFilterBtn?.setAttribute('aria-expanded', 'false');
         difficultyDropdown?.classList.add('hidden');
     }
    // Add similar logic for other dropdowns if needed
}

/** Helper to close all filter dropdowns except the one passed */
function closeAllFilterDropdowns(exceptDropdown = null) {
    [subjectDropdown, difficultyDropdown].forEach(dd => {
        if (dd && dd !== exceptDropdown && !dd.classList.contains('hidden')) {
            toggleDropdown(dd); // Reuse toggle to handle button aria state
        }
    });
}

/**
 * Handles selection of a subject filter.
 * @param {Event} event - The click event.
 */
function handleSubjectFilterSelection(event) {
    const target = event.target.closest('.subject-badge');
    if (!target) return;

    const subject = target.dataset.subject;
    currentFilters.subject = subject;

    // Update button text
    document.getElementById('currentSubject').textContent = target.textContent;
    
    // Update active state visually
    subjectDropdown.querySelectorAll('.subject-badge').forEach(badge => badge.classList.remove('active'));
    target.classList.add('active');

    // Update ARIA checked state
    subjectDropdown.querySelectorAll('.subject-badge').forEach(badge => badge.setAttribute('aria-checked', 'false'));
    target.setAttribute('aria-checked', 'true');


    // Close dropdown
    toggleDropdown(subjectDropdown);

    // Reload questions based on new filter
    filterAndLoadQuestion(0); // Start from the first matching question
}

/**
 * Handles selection of a difficulty filter.
 * @param {Event} event - The click event.
 */
function handleDifficultyFilterSelection(event) {
     const target = event.target.closest('.difficulty-filter');
     if (!target) return;

     const difficulty = target.dataset.difficulty;
     currentFilters.difficulty = difficulty;

     // Update button text
     document.getElementById('currentDifficulty').textContent = target.textContent.trim().replace(/<i.*><\/i>/, '').trim(); // Get text excluding icon

     // Update active state visually
     difficultyDropdown.querySelectorAll('.difficulty-filter').forEach(btn => btn.classList.remove('active'));
     target.classList.add('active');

     // Update ARIA checked state
     difficultyDropdown.querySelectorAll('.difficulty-filter').forEach(btn => btn.setAttribute('aria-checked', 'false'));
     target.setAttribute('aria-checked', 'true');

     toggleDropdown(difficultyDropdown); // Close dropdown
     filterAndLoadQuestion(0); // Reload questions
}


/**
 * Filters questions based on currentFilters and loads the question at the specified index.
 * @param {number} index - The index within the filtered list to load.
 */
function filterAndLoadQuestion(index, revisionMode = false) {
    let filteredQuestions = questions.filter(q => 
        (currentFilters.subject === 'all' || q.subject.toLowerCase() === currentFilters.subject) &&
        (currentFilters.difficulty === 'all' || q.difficulty === currentFilters.difficulty) &&
        (!revisionMode || q.revisionDue) // Only include questions due for revision
    );

    if (filteredQuestions.length === 0) {
        displayNoQuestionsMessage();
        return;
    }

    currentQuestionIndex = Math.max(0, Math.min(index, filteredQuestions.length - 1));
    const question = filteredQuestions[currentQuestionIndex];
    displayQuestion(question, currentQuestionIndex, filteredQuestions.length);
    updateNavigationButtons(currentQuestionIndex, filteredQuestions.length);
}

/**
 * Displays a message when no questions match the current filters.
 */
 function displayNoQuestionsMessage() {
     if (!questionTextEl || !answerOptionsContainer) return;
     questionTextEl.textContent = "No questions match the current filters.";
     answerOptionsContainer.innerHTML = ""; 
     feedbackAreaEl?.classList.add('hidden');
     document.getElementById('questionSubject').textContent = '-';
     document.getElementById('questionNumber').textContent = '0';
     document.getElementById('totalQuestions').textContent = '0';
     document.getElementById('avgTime').textContent = 'N/A';
     // Disable nav buttons
     nextButton.disabled = true;
     prevButton.disabled = true;
 }


/**
 * Displays a single question and its options.
 * @param {object} question - The question object.
 * @param {number} currentIndex - The current index in the filtered list.
 * @param {number} totalFiltered - The total number of filtered questions.
 */
function displayQuestion(question, currentIndex, totalFiltered) {
    if (!question || !questionTextEl || !answerOptionsContainer) {
        console.error("Missing question data or DOM elements.");
        return;
    }
    questionTextEl.textContent = question.question;
    answerOptionsContainer.innerHTML = ''; // Clear previous options

    // Update header info
    document.getElementById('questionSubject').textContent = question.subject || 'General';
    document.getElementById('questionNumber').textContent = currentIndex + 1;
    document.getElementById('totalQuestions').textContent = totalFiltered;
    document.getElementById('avgTime').textContent = question.avgTimeSeconds ? `${question.avgTimeSeconds} seconds` : 'N/A';

    // Create and append answer options
    question.options.forEach((option, index) => {
        const optionLetter = String.fromCharCode(65 + index); // A, B, C...
        const optionDiv = document.createElement('div');
        optionDiv.className = 'answer-option p-3 rounded-lg'; // Base classes
        optionDiv.dataset.option = optionLetter; // Store option letter
        optionDiv.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span class="font-medium text-gray-700">${optionLetter}</span>
                </div>
                <div>
                    <p>${option}</p> 
                </div>
            </div>
        `;
        answerOptionsContainer.appendChild(optionDiv);
    });

    // Reset feedback area and styles
    feedbackAreaEl?.classList.add('hidden');
    answerOptionsContainer.querySelectorAll('.answer-option').forEach(el => {
        el.classList.remove('correct', 'incorrect', 'selected');
        el.style.cursor = 'pointer'; // Ensure options are clickable
    });

     // Reset difficulty buttons based on question difficulty (optional)
     document.querySelectorAll('.difficulty-btn').forEach(btn => {
         btn.classList.remove('active');
         if(btn.dataset.difficulty === question.difficulty) {
             btn.classList.add('active');
         }
     });

     // Update flag button state if needed (requires storing flagged status)
     // flagButton.classList.toggle('active', isQuestionFlagged(question.id)); 

     // Check if this question was previously answered and show the answer/feedback
     const previousAnswer = userAnswers[question.id];
     if (previousAnswer) {
         showFeedback(previousAnswer.selected, question.correctAnswer === previousAnswer.selected, question);
         highlightSelectedOption(previousAnswer.selected);
     }
}

/**
 * Handles the selection of an answer option.
 * @param {Event} event - The click event object.
 */
function handleAnswerSelection(event) {
    const selectedOptionEl = event.target.closest('.answer-option');
    if (!selectedOptionEl || selectedOptionEl.classList.contains('correct') || selectedOptionEl.classList.contains('incorrect')) {
        return; // Ignore clicks if not on an option or if already answered
    }

    const selectedAnswer = selectedOptionEl.dataset.option;
    const currentFilteredQuestion = getCurrentFilteredQuestion();
    if (!currentFilteredQuestion) return;

    const isCorrect = selectedAnswer === currentFilteredQuestion.correctAnswer;

    // Store the answer
     userAnswers[currentFilteredQuestion.id] = { selected: selectedAnswer, correct: isCorrect };

    // Show feedback
    showFeedback(selectedAnswer, isCorrect, currentFilteredQuestion);
    highlightSelectedOption(selectedAnswer); // Highlight selection
    updateSessionStats(isCorrect); // Update session stats
}

/**
 * Applies visual styles to the selected answer option and disables further clicks.
 * @param {string} selectedOptionLetter - The letter of the selected option (e.g., 'A').
 */
function highlightSelectedOption(selectedOptionLetter) {
     answerOptionsContainer?.querySelectorAll('.answer-option').forEach(el => {
         el.classList.remove('selected'); // Remove from others
         el.style.cursor = 'default'; // Disable cursor change on hover for all
         if (el.dataset.option === selectedOptionLetter) {
             el.classList.add('selected'); // Add to the selected one
         }
     });
}


/**
 * Shows feedback (correct/incorrect) to the user.
 * @param {string} selectedOption - The option letter selected by the user (e.g., 'A').
 * @param {boolean} isCorrect - Whether the selected answer was correct.
 * @param {object} question - The question object containing the explanation.
 */
function showFeedback(selectedOption, isCorrect, question) {
    if (!feedbackAreaEl || !feedbackTextEl) return;

    feedbackAreaEl.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800');
    feedbackAreaEl.classList.add('feedback-animation'); // Add fade-in animation class

    if (isCorrect) {
        feedbackTextEl.innerHTML = `<strong class="font-semibold">Correct!</strong> ${question.explanation || ''}`;
        feedbackAreaEl.classList.add('bg-green-100', 'text-green-800');
    } else {
        feedbackTextEl.innerHTML = `<strong class="font-semibold">Incorrect.</strong> The correct answer was ${question.correctAnswer}.<br>${question.explanation || ''}`;
        feedbackAreaEl.classList.add('bg-red-100', 'text-red-800');
    }

    // Visually mark options
    answerOptionsContainer.querySelectorAll('.answer-option').forEach(el => {
        const optionLetter = el.dataset.option;
        if (optionLetter === question.correctAnswer) {
            el.classList.add('correct');
        } else if (optionLetter === selectedOption) { // Mark the incorrect selection
            el.classList.add('incorrect');
        }
        // Disable further clicks after feedback is shown
        el.style.cursor = 'default';
    });
}

/**
 * Updates the current session statistics.
 * @param {boolean} wasCorrect - Whether the last answered question was correct.
 */
 function updateSessionStats(wasCorrect) {
     sessionStats.total++;
     if (wasCorrect) {
         sessionStats.correct++;
     } else {
         sessionStats.incorrect++;
     }
     const accuracy = sessionStats.total === 0 ? 0 : Math.round((sessionStats.correct / sessionStats.total) * 100);

     // Update DOM elements
     document.getElementById('sessionQuestions').textContent = sessionStats.total;
     document.getElementById('sessionCorrect').textContent = sessionStats.correct;
     document.getElementById('sessionIncorrect').textContent = sessionStats.incorrect;
     document.getElementById('sessionAccuracy').textContent = `${accuracy}%`;
 }


/**
 * Changes to the next or previous question.
 * @param {number} direction - 1 for next, -1 for previous.
 */
function changeQuestion(direction) {
    filterAndLoadQuestion(currentQuestionIndex + direction);
}

/**
 * Updates the state (enabled/disabled) of navigation buttons.
 * @param {number} currentIndex - The current index in the filtered list.
 * @param {number} totalFiltered - The total number of filtered questions.
 */
function updateNavigationButtons(currentIndex, totalFiltered) {
    if (!prevButton || !nextButton) return;
    prevButton.disabled = currentIndex <= 0;
    nextButton.disabled = currentIndex >= totalFiltered - 1;
     
    // Add visual styling for disabled state if needed
    prevButton.classList.toggle('opacity-50', prevButton.disabled);
    prevButton.classList.toggle('cursor-not-allowed', prevButton.disabled);
    nextButton.classList.toggle('opacity-50', nextButton.disabled);
    nextButton.classList.toggle('cursor-not-allowed', nextButton.disabled);
}

/** Handles rating the difficulty of the current question */
function handleDifficultyRating(event) {
    const button = event.currentTarget;
    const difficulty = button.dataset.difficulty;
    const currentQ = getCurrentFilteredQuestion();
    if(!currentQ) return;

    // Remove active class from all difficulty buttons in this group
    button.parentElement.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
    // Add active class to the clicked one
    button.classList.add('active');

    console.log(`Rated question ${currentQ.id} as ${difficulty}`);
    // TODO: Send this rating to a backend or store locally
}

/** Handles flagging/unflagging the current question */
function handleFlagQuestion(event) {
     const button = event.currentTarget;
     const currentQ = getCurrentFilteredQuestion();
     if (!currentQ) return;

     const isFlagged = button.classList.toggle('active'); // Toggle visual state
     button.classList.toggle('bg-yellow-200', isFlagged); // Example active style
     button.classList.toggle('bg-yellow-100', !isFlagged);
     button.innerHTML = isFlagged 
         ? '<i class="fas fa-flag mr-2"></i> Flagged' 
         : '<i class="fas fa-flag mr-2"></i> Flag';

     console.log(`Question ${currentQ.id} ${isFlagged ? 'flagged' : 'unflagged'}`);
     // TODO: Store flagged status (e.g., in localStorage or backend)
}

/** Opens the login modal */
function openLoginModal() {
     if (loginModal) {
        console.log("Opening login modal...");
        loginModal.classList.remove('hidden');
        loginModal.classList.add('flex'); // Use flex to center
        loginModal.classList.add('active'); // Trigger animation
     }
}

/** Closes the login modal */
function closeLoginModal() {
     if (loginModal) {
        loginModal.classList.remove('active'); // Allow animation out
        // Wait for animation before hiding completely
        setTimeout(() => {
            loginModal.classList.add('hidden');
            loginModal.classList.remove('flex');
        }, 300); // Match CSS transition duration
     }
}

/** Simulates user logout */
function handleLogout() {
     console.log("Logging out...");
     // Clear user session/token (e.g., from localStorage)
     updateLoginUI(false); // Update UI to logged-out state
     // Optionally, redirect to a logged-out page or refresh
}


/**
 * Gets the currently displayed question object from the filtered list.
 * @returns {object|null} The question object or null if not found.
 */
function getCurrentFilteredQuestion() {
     const filteredQuestions = questions.filter(q => 
         (currentFilters.subject === 'all' || q.subject.toLowerCase() === currentFilters.subject) &&
         (currentFilters.difficulty === 'all' || q.difficulty === currentFilters.difficulty)
     );
     return filteredQuestions[currentQuestionIndex] || null;
}

/**
 * Initializes all charts with placeholder data.
 */
// Define subjectStats globally or fetch dynamically later

let subjectStats = [
    { subject: "Pharmacology", attempted: 100, correct: 95, accuracy: 95 },      // High performer
    { subject: "Pathology", attempted: 90, correct: 54, accuracy: 60 },          // Lower range
    { subject: "Anatomy", attempted: 80, correct: 80, accuracy: 100 },           // Peak
    { subject: "Physiology", attempted: 70, correct: 66, accuracy: 94 },         // Near peak
    { subject: "Biochemistry", attempted: 60, correct: 51, accuracy: 85 },       // Mid-high
    { subject: "Histology", attempted: 50, correct: 28, accuracy: 56 },          // Lower range
    { subject: "Microbiology", attempted: 85, correct: 81, accuracy: 95 },       // High performer
    { subject: "Immunology", attempted: 45, correct: 41, accuracy: 91 },         // Mid-high
    { subject: "Genetics", attempted: 40, correct: 24, accuracy: 60 },           // Lower range
    { subject: "Embryology", attempted: 35, correct: 30, accuracy: 86 },         // Mid-high
    { subject: "Internal Medicine", attempted: 120, correct: 120, accuracy: 100 }, // Peak
    { subject: "Surgery", attempted: 110, correct: 77, accuracy: 70 },           // Mid-low
    { subject: "Pediatrics", attempted: 95, correct: 95, accuracy: 100 },        // Peak
    { subject: "OB/GYN", attempted: 80, correct: 60, accuracy: 75 },             // Mid-range
    { subject: "Psychiatry", attempted: 70, correct: 67, accuracy: 96 },         // High performer
    { subject: "Neurology", attempted: 65, correct: 36, accuracy: 55 },          // Lowest
    { subject: "Cardiology", attempted: 90, correct: 86, accuracy: 96 },         // High performer
    { subject: "Emergency Medicine", attempted: 100, correct: 73, accuracy: 73 }, // Mid-range
    { subject: "Dermatology", attempted: 55, correct: 50, accuracy: 91 },        // Mid-high
    { subject: "Radiology", attempted: 60, correct: 58, accuracy: 97 }           // High performer
];

function initializeCharts() {
    console.log("Initializing charts...");
    try {
        initWeeklyActivityChart();
        initSubjectsChart();
        initProgressChart();
    } catch (error) {
        console.error("Chart initialization failed:", error);
    }
}
function initSubjectsChart() {
    if (!subjectsChartCanvas) {
        console.error("Subjects chart canvas not found!");
        return;
    }
    console.log("Initializing subjects chart with red colors");
    const ctx = subjectsChartCanvas.getContext('2d');
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: subjectStats.map(stat => stat.subject),
            datasets: [{
                label: 'Accuracy by Subject (%)',
                data: subjectStats.map(stat => stat.accuracy),
                backgroundColor: 'rgba(229, 62, 62, 0.2)',
                borderColor: 'rgba(229, 62, 62, 1)',
                pointBackgroundColor: 'rgba(229, 62, 62, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(229, 62, 62, 1)',
                borderWidth: 2,
                pointRadius: 4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { display: true, color: 'rgba(0, 0, 0, 0.1)' },
                    grid: { color: 'rgba(0, 0, 0, 0.1)' },
                    pointLabels: { font: { size: 14 } },
                    ticks: {
                        beginAtZero: true,
                        min: 0,
                        max: 100,
                        stepSize: 20
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            },
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${context.raw}%`
                    }
                }
            }
        }
    });
}


function populateSubjectStatsTable() {
    const tableBody = document.getElementById('subjectStatsTable');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    subjectStats.forEach(stat => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${stat.subject}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${stat.attempted}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${stat.correct}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${stat.accuracy}%</td>
        `;
        tableBody.appendChild(row);
    });

    const tableHead = tableBody.closest('table').querySelector('thead');
    if (tableHead && !tableHead.innerHTML) {
        tableHead.innerHTML = `
            <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempted</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correct</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
            </tr>
        `;
    }
}

/** Chart configuration helper */
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false }
    },
    scales: {
        y: { beginAtZero: true }
    }
};

/** Initializes the Weekly Activity Chart */
function initWeeklyActivityChart() {
    if (!weeklyChartCanvas) return;
    const ctx = weeklyChartCanvas.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Questions Answered',
                data: [5, 8, 12, 6, 10, 7, 9], // Placeholder data
                backgroundColor: 'rgba(56, 178, 172, 0.6)', // Teal color with transparency
                borderColor: 'rgba(44, 122, 123, 1)',
                borderWidth: 1
            }]
        },
        options: chartOptions
    });
}

/** Initializes the Progress Over Time Chart */
function initProgressChart() {
     if (!progressChartCanvas) return;
     const ctx = progressChartCanvas.getContext('2d');
     new Chart(ctx, {
         type: 'line',
         data: {
             labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], // Placeholder months
             datasets: [{
                 label: 'Overall Accuracy (%)',
                 data: [65, 68, 72, 70, 75, 78], // Placeholder accuracy data
                 borderColor: 'rgba(44, 122, 123, 1)',
                 backgroundColor: 'rgba(44, 122, 123, 0.1)',
                 fill: true,
                 tension: 0.1
             }]
         },
         options: { ...chartOptions, plugins: {legend: {display: true}}}
     });
}

/** Updates dashboard stats with placeholder data */
function updateDashboardStats() {
    // Replace with actual data fetching/calculation
    document.getElementById('overallPercentage').textContent = '75%';
    document.getElementById('totalAttempted').textContent = '240 questions';
    document.getElementById('totalCorrect').textContent = '180';
    document.getElementById('totalIncorrect').textContent = '60';
    document.querySelector('.progress-bar').style.width = '75%'; 
    // Update other dashboard cards similarly
    document.getElementById('questionsToday').textContent = '15';
    // Stats tab placeholders
     document.getElementById('statsTotalQuestions').textContent = '420';
     document.getElementById('statsAccuracy').textContent = '75%';
     document.getElementById('studyStreak').textContent = '12';
     document.getElementById('avgQuestionTime').textContent = '32s';
}


// --- Initialization ---
// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => initializeRendangApp());