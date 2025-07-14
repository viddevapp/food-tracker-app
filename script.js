// --- 1. GLOBAL STATE AND REFERENCES ---
let currentDate = new Date();
let doughnutChart = null;
let barChart = null;
let editingState = { isEditing: false, dateKey: null, meal: null, index: -1 };
let dbEditingState = { isEditing: false, id: null };
let currentDbSort = 'name-asc';

let allData = {
    foodDatabase: [],
    history: {},
    userGoals: { calories: 2000, protein: 120 }
};

// --- REFERENCES TO HTML ELEMENTS ---
const navTracker = document.getElementById('nav-tracker');
const navDatabase = document.getElementById('nav-database');
const navReports = document.getElementById('nav-reports');
const trackerPage = document.getElementById('tracker-page');
const databasePage = document.getElementById('database-page');
const reportsPage = document.getElementById('reports-page');

const addFoodForm = document.getElementById('add-food-form');
const foodNameInput = document.getElementById('food-name');
const caloriesInput = document.getElementById('calories');
const proteinInput = document.getElementById('protein');
const servingsInput = document.getElementById('servings');
const mealSelect = document.getElementById('meal-select');
const submitEntryBtn = document.getElementById('submit-entry-btn');
const autocompleteResults = document.getElementById('autocomplete-results');
const dailyFoodListDiv = document.getElementById('daily-food-list');

const totalCaloriesText = document.getElementById('total-calories-text');
const totalProteinText = document.getElementById('total-protein-text');
const caloriesProgressBar = document.getElementById('calories-progress-bar');
const proteinProgressBar = document.getElementById('protein-progress-bar');

const prevDayBtn = document.getElementById('prev-day-btn');
const nextDayBtn = document.getElementById('next-day-btn');
const todayBtn = document.getElementById('today-btn');
const currentDateDisplay = document.getElementById('current-date-display');

const addToDbForm = document.getElementById('add-to-db-form');
const dbFoodNameInput = document.getElementById('db-food-name');
const dbCaloriesInput = document.getElementById('db-calories');
const dbProteinInput = document.getElementById('db-protein');
const dbSubmitBtn = document.getElementById('db-submit-btn');
const dbFoodListDiv = document.getElementById('db-food-list');
const dbSortSelect = document.getElementById('db-sort-select');

const actionsMenuBtn = document.getElementById('actions-menu-btn');
const actionsDropdown = document.getElementById('actions-dropdown');
const saveDataBtn = document.getElementById('save-data-btn');
const loadDataBtn = document.getElementById('load-data-btn');
const fileLoaderInput = document.getElementById('file-loader');

const editGoalsBtn = document.getElementById('edit-goals-btn');
const settingsModal = document.getElementById('settings-modal');
const settingsForm = document.getElementById('settings-form');
const goalCaloriesInput = document.getElementById('goal-calories');
const goalProteinInput = document.getElementById('goal-protein');
const cancelSettingsBtn = document.getElementById('cancel-settings-btn');

const caloriesDoughnutChartCanvas = document.getElementById('calories-doughnut-chart');
const dailyBarChartCanvas = document.getElementById('daily-bar-chart');


// --- 2. CORE LOGIC & HELPER FUNCTIONS ---
function getFormattedDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getCurrentDayData() {
    const dateKey = getFormattedDate(currentDate);
    if (!allData.history[dateKey]) {
        allData.history[dateKey] = {
            entries: { breakfast: [], lunch: [], dinner: [], snack: [] },
            goals: { ...allData.userGoals }
        };
    }
    return allData.history[dateKey];
}

function changeDate(daysToAdd) {
    currentDate.setDate(currentDate.getDate() + daysToAdd);
    renderAll();
}

function resetForm() {
    addFoodForm.reset();
    submitEntryBtn.textContent = 'Add to Day';
    editingState = { isEditing: false, dateKey: null, meal: null, index: -1 };
    // ** NEW: Validate the form to disable the button after reset **
    validateTrackerForm();
}

function resetDbForm() {
    addToDbForm.reset();
    dbSubmitBtn.textContent = 'Save to Database';
    dbEditingState = { isEditing: false, id: null };
    // ** NEW: Validate the form to disable the button after reset **
    validateDbForm();
}

// ** NEW: Function to validate the main tracker form **
function validateTrackerForm() {
    const name = foodNameInput.value.trim();
    const calories = caloriesInput.value;
    const protein = proteinInput.value;
    const meal = mealSelect.value;

    if (name && calories && protein && meal) {
        submitEntryBtn.disabled = false;
    } else {
        submitEntryBtn.disabled = true;
    }
}

// ** NEW: Function to validate the database form **
function validateDbForm() {
    const name = dbFoodNameInput.value.trim();
    const calories = dbCaloriesInput.value;
    const protein = dbProteinInput.value;

    if (name && calories && protein) {
        dbSubmitBtn.disabled = false;
    } else {
        dbSubmitBtn.disabled = true;
    }
}

// --- 3. RENDERING FUNCTIONS ---
function renderAll() {
    const activePageId = document.querySelector('.nav-btn.active').id;
    if (activePageId === 'nav-tracker') {
        renderDateControls();
        renderDailyEntries();
    } else if (activePageId === 'nav-reports') {
        renderReportsPage();
    }
    // Always render the database in the background so it's ready
    renderFoodDatabase();
}

function renderDateControls() {
    const today = new Date();
    const isToday = getFormattedDate(currentDate) === getFormattedDate(today);
    currentDateDisplay.textContent = isToday ? 'Today' : currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    nextDayBtn.disabled = isToday;
    todayBtn.style.display = isToday ? 'none' : 'block';
}

function renderDailyEntries() {
    const currentDayData = getCurrentDayData();
    const entriesByMeal = currentDayData.entries;
    const goals = currentDayData.goals;
    
    dailyFoodListDiv.innerHTML = '';
    let grandTotalCalories = 0;
    let grandTotalProtein = 0;

    for (const meal in entriesByMeal) {
        const mealEntries = entriesByMeal[meal];
        if (mealEntries.length > 0) {
            const mealCalories = mealEntries.reduce((sum, entry) => sum + entry.calories, 0);
            const mealProtein = mealEntries.reduce((sum, entry) => sum + entry.protein, 0);
            grandTotalCalories += mealCalories;
            grandTotalProtein += mealProtein;

            const mealHeader = document.createElement('h3');
            mealHeader.className = 'meal-header';
            mealHeader.innerHTML = `
                <span>${meal.charAt(0).toUpperCase() + meal.slice(1)}</span>
                <span class="meal-subtotal">${mealCalories.toFixed(0)} kcal / ${mealProtein.toFixed(1)}g</span>
            `;
            dailyFoodListDiv.appendChild(mealHeader);

            mealEntries.forEach((entry, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'food-item';
                itemDiv.innerHTML = `
                    <div>
                        <span>${entry.name}</span><br>
                        <small style="color: #aaa;">${entry.calories.toFixed(0)} kcal / ${entry.protein.toFixed(1)}g protein</small>
                    </div>
                    <div class="item-actions">
                        <button class="item-action-btn edit-btn" data-meal="${meal}" data-index="${index}">Edit</button>
                        <button class="item-action-btn delete-btn" data-meal="${meal}" data-index="${index}">Delete</button>
                    </div>
                `;
                dailyFoodListDiv.appendChild(itemDiv);
            });
        }
    }

    const caloriePercent = Math.min((grandTotalCalories / goals.calories) * 100, 100);
    const proteinPercent = Math.min((grandTotalProtein / goals.protein) * 100, 100);
    totalCaloriesText.textContent = `${grandTotalCalories.toFixed(0)} / ${goals.calories} kcal`;
    totalProteinText.textContent = `${grandTotalProtein.toFixed(1)} / ${goals.protein} g`;
    caloriesProgressBar.style.width = `${caloriePercent}%`;
    proteinProgressBar.style.width = `${proteinPercent}%`;
}

function renderFoodDatabase() {
    const sortedDb = [...allData.foodDatabase];
    switch(currentDbSort) {
        case 'calories-desc': sortedDb.sort((a, b) => b.calories - a.calories); break;
        case 'protein-desc': sortedDb.sort((a, b) => b.protein - a.protein); break;
        default: sortedDb.sort((a, b) => a.name.localeCompare(b.name)); break;
    }

    dbFoodListDiv.innerHTML = '';
    sortedDb.forEach(food => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'db-food-item';
        itemDiv.innerHTML = `
            <span>${food.name} (${food.calories} kcal / ${food.protein}g)</span>
            <div class="item-actions">
                <button class="item-action-btn edit-btn" data-id="${food.id}">Edit</button>
                <button class="item-action-btn delete-btn" data-id="${food.id}">Delete</button>
            </div>
        `;
        dbFoodListDiv.appendChild(itemDiv);
    });
}

function renderReportsPage() {
    if (doughnutChart) doughnutChart.destroy();
    if (barChart) barChart.destroy();
    
    const labels = [];
    const dailyCalorieData = [];
    const dailyProteinData = [];
    
    const tempDate = new Date();

    for (let i = 0; i < 7; i++) {
        const dateKey = getFormattedDate(tempDate);
        labels.unshift(tempDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        let dailyCalories = 0;
        let dailyProtein = 0;
        if (allData.history[dateKey]) {
            for (const meal in allData.history[dateKey].entries) {
                allData.history[dateKey].entries[meal].forEach(entry => {
                    dailyCalories += entry.calories;
                    dailyProtein += entry.protein;
                });
            }
        }
        dailyCalorieData.unshift(dailyCalories);
        dailyProteinData.unshift(dailyProtein);
        tempDate.setDate(tempDate.getDate() - 1);
    }
    
    barChart = new Chart(dailyBarChartCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Calories',
                    data: dailyCalorieData,
                    backgroundColor: '#4CAF50',
                },
                {
                    label: 'Protein (g)',
                    data: dailyProteinData,
                    backgroundColor: '#2980b9',
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { color: '#ccc' } }, x: { ticks: { color: '#ccc' } } },
            plugins: { legend: { labels: { color: '#ccc' } } }
        }
    });

    const totalCaloriesConsumed = dailyCalorieData.reduce((sum, val) => sum + val, 0);
    const weeklyGoal = allData.userGoals.calories * 7;
    const caloriesRemaining = Math.max(0, weeklyGoal - totalCaloriesConsumed);

    doughnutChart = new Chart(caloriesDoughnutChartCanvas, {
        type: 'doughnut',
        data: {
            labels: ['Consumed', 'Remaining'],
            datasets: [{
                label: 'Calories', data: [totalCaloriesConsumed, caloriesRemaining],
                backgroundColor: ['#4CAF50', '#444'], borderColor: '#1e1e1e', borderWidth: 2
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#ccc' } } }
        }
    });
}

// --- 4. EVENT HANDLER FUNCTIONS ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(pageId).classList.add('active');
    document.getElementById(`nav-${pageId.split('-')[0]}`).classList.add('active');

    renderAll();
}

function handleAddOrUpdateDailyEntry(event) {
    event.preventDefault();
    const name = foodNameInput.value.trim();
    const calories = parseFloat(caloriesInput.value);
    const protein = parseFloat(proteinInput.value);
    const servings = parseFloat(servingsInput.value) || 1;
    const meal = mealSelect.value;

    // The button validation already prevents this, but it's good practice to keep server-side style validation.
    if (!meal || !name || isNaN(calories) || isNaN(protein)) return;

    const newEntry = {
        name: `${name} (${servings} servings)`,
        baseName: name, calories: calories * servings, protein: protein * servings, servings: servings
    };

    const currentDayData = getCurrentDayData();

    if (editingState.isEditing) {
        const originalMeal = editingState.meal;
        const newMeal = meal;
        if (originalMeal !== newMeal) {
            currentDayData.entries[originalMeal].splice(editingState.index, 1);
            currentDayData.entries[newMeal].push(newEntry);
        } else {
            currentDayData.entries[originalMeal][editingState.index] = newEntry;
        }
    } else {
        currentDayData.entries[meal].push(newEntry);
        const foodExists = allData.foodDatabase.some(food => food.name.toLowerCase() === name.toLowerCase());
        if (!foodExists) {
            allData.foodDatabase.push({ id: Date.now(), name, calories, protein });
            renderFoodDatabase();
        }
    }
    
    renderDailyEntries();
    resetForm();
}

function handleDailyListClick(event) {
    const target = event.target.closest('.item-action-btn');
    if (!target) return;

    const meal = target.dataset.meal;
    const index = parseInt(target.dataset.index);
    const currentDayData = getCurrentDayData();
    const entry = currentDayData.entries[meal][index];

    if (target.classList.contains('delete-btn')) {
        currentDayData.entries[meal].splice(index, 1);
        renderDailyEntries();
    } else if (target.classList.contains('edit-btn')) {
        const baseFood = allData.foodDatabase.find(f => f.name === entry.baseName) || {calories: entry.calories / entry.servings, protein: entry.protein / entry.servings};
        foodNameInput.value = entry.baseName;
        caloriesInput.value = baseFood.calories;
        proteinInput.value = baseFood.protein;
        servingsInput.value = entry.servings;
        mealSelect.value = meal;
        
        submitEntryBtn.textContent = 'Update Entry';
        editingState = { isEditing: true, dateKey: getFormattedDate(currentDate), meal, index };
        
        // ** NEW: Validate the form when populating it for an edit **
        validateTrackerForm();
    }
}

function handleAddOrUpdateDbEntry(event) {
    event.preventDefault();
    const name = dbFoodNameInput.value.trim();
    const calories = parseFloat(dbCaloriesInput.value);
    const protein = parseFloat(dbProteinInput.value);

    if (!name || isNaN(calories) || isNaN(protein)) return;
    
    if (dbEditingState.isEditing) {
        const foodToUpdate = allData.foodDatabase.find(food => food.id === dbEditingState.id);
        if (foodToUpdate) {
            foodToUpdate.name = name;
            foodToUpdate.calories = calories;
            foodToUpdate.protein = protein;
        }
    } else {
        allData.foodDatabase.push({ id: Date.now(), name, calories, protein });
    }

    renderFoodDatabase();
    resetDbForm();
}

function handleDatabaseListClick(event) {
    const target = event.target.closest('.item-action-btn');
    if (!target) return;
    
    const foodId = parseInt(target.dataset.id);
    const food = allData.foodDatabase.find(f => f.id === foodId);

    if (target.classList.contains('delete-btn')) {
        allData.foodDatabase = allData.foodDatabase.filter(f => f.id !== foodId);
        if (dbEditingState.isEditing && dbEditingState.id === foodId) {
            resetDbForm();
        }
        renderFoodDatabase();
    } else if (target.classList.contains('edit-btn')) {
        dbFoodNameInput.value = food.name;
        dbCaloriesInput.value = food.calories;
        dbProteinInput.value = food.protein;
        
        dbSubmitBtn.textContent = 'Update Food';
        dbEditingState = { isEditing: true, id: food.id };
        
        databasePage.querySelector('main').scrollTop = 0;

        // ** NEW: Validate the form when populating it for an edit **
        validateDbForm();
    }
}

function handleAutocomplete() {
    const query = foodNameInput.value.toLowerCase();
    autocompleteResults.innerHTML = '';
    if (query.length < 1) {
        autocompleteResults.style.display = 'none';
        return;
    }
    const results = allData.foodDatabase.filter(food => food.name.toLowerCase().includes(query));
    if (results.length > 0) {
        autocompleteResults.style.display = 'block';
        results.forEach(food => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'autocomplete-item';
            itemDiv.innerHTML = `<span>${food.name}</span><span class="stats">${food.calories} kcal / ${food.protein}g</span>`;
            itemDiv.onclick = () => {
                foodNameInput.value = food.name;
                caloriesInput.value = food.calories;
                proteinInput.value = food.protein;
                autocompleteResults.innerHTML = '';
                autocompleteResults.style.display = 'none';
                // ** NEW: Validate form after autocompleting **
                validateTrackerForm();
            };
            autocompleteResults.appendChild(itemDiv);
        });
    } else {
        autocompleteResults.style.display = 'none';
    }
}

function handleSaveSettings(event) {
    event.preventDefault();
    const newCalorieGoal = parseFloat(goalCaloriesInput.value);
    const newProteinGoal = parseFloat(goalProteinInput.value);

    if (!isNaN(newCalorieGoal)) allData.userGoals.calories = newCalorieGoal;
    if (!isNaN(newProteinGoal)) allData.userGoals.protein = newProteinGoal;

    const currentDayData = getCurrentDayData();
    currentDayData.goals = { ...allData.userGoals };

    closeSettingsModal();
    renderAll();
}

function openSettingsModal() {
    goalCaloriesInput.value = allData.userGoals.calories;
    goalProteinInput.value = allData.userGoals.protein;
    settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
    settingsModal.classList.add('hidden');
}

// --- 5. SAVE/LOAD LOGIC ---
function saveDataToFile() {
    const dataAsString = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataAsString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-food-data.json';
    link.click();
}

function loadDataFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            allData = JSON.parse(e.target.result);
            if (!allData.history || !allData.foodDatabase || !allData.userGoals) {
                throw new Error("Invalid data file format.");
            }
            currentDate = new Date();
            resetForm();
            resetDbForm();
            renderAll();
        } catch (error) {
            alert('Error reading or parsing file. Please make sure you selected the correct data file.');
            console.error(error);
        }
    };
    reader.readAsText(file);
}

// --- 6. EVENT LISTENERS ---
navTracker.addEventListener('click', () => showPage('tracker-page'));
navDatabase.addEventListener('click', () => showPage('database-page'));
navReports.addEventListener('click', () => showPage('reports-page'));

addFoodForm.addEventListener('submit', handleAddOrUpdateDailyEntry);
foodNameInput.addEventListener('input', handleAutocomplete);
dailyFoodListDiv.addEventListener('click', handleDailyListClick);
addToDbForm.addEventListener('submit', handleAddOrUpdateDbEntry);
dbFoodListDiv.addEventListener('click', handleDatabaseListClick);

dbSortSelect.addEventListener('change', (event) => {
    currentDbSort = event.target.value;
    renderFoodDatabase();
});

prevDayBtn.addEventListener('click', () => changeDate(-1));
nextDayBtn.addEventListener('click', () => changeDate(1));
todayBtn.addEventListener('click', () => { currentDate = new Date(); renderAll(); });

editGoalsBtn.addEventListener('click', openSettingsModal);
cancelSettingsBtn.addEventListener('click', closeSettingsModal);
settingsForm.addEventListener('submit', handleSaveSettings);

actionsMenuBtn.addEventListener('click', () => actionsDropdown.classList.toggle('hidden'));
saveDataBtn.addEventListener('click', () => { saveDataToFile(); actionsDropdown.classList.add('hidden'); });
loadDataBtn.addEventListener('click', () => { fileLoaderInput.click(); actionsDropdown.classList.add('hidden'); });
fileLoaderInput.addEventListener('change', loadDataFromFile);

document.addEventListener('click', (event) => {
    if (!event.target.closest('#actions-menu-container')) actionsDropdown.classList.add('hidden');
    if (!event.target.closest('.autocomplete-container')) autocompleteResults.innerHTML = '';
    if (!event.target.closest('.modal-content') && !event.target.closest('#edit-goals-btn')) closeSettingsModal();
});

// ** NEW: Event listeners for real-time form validation **
addFoodForm.addEventListener('input', validateTrackerForm);
addFoodForm.addEventListener('change', validateTrackerForm); // For the <select> element
addToDbForm.addEventListener('input', validateDbForm);


// --- 7. INITIALIZE APP ---
function initializeApp() {
    showPage('tracker-page');
    // ** NEW: Run validation on load to set initial button states **
    validateTrackerForm();
    validateDbForm();
}

initializeApp();