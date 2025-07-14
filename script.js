// --- 1. GLOBAL STATE AND REFERENCES ---
let currentDate = new Date();
let doughnutChart = null;
let barChart = null;
let editingState = { isEditing: false, dateKey: null, meal: null, index: -1 };
let dbEditingState = { isEditing: false, id: null };
let mealEditingState = { isEditing: false, id: null };
let currentDbSort = 'name-asc';
let selectedFoodForMeal = null; // Holds food data for meal builder

let allData = {
    foodDatabase: [],
    meals: [],
    history: {},
    userGoals: { calories: 2000, protein: 120 }
};

// --- REFERENCES TO HTML ELEMENTS ---
const navTracker = document.getElementById('nav-tracker');
const navMeals = document.getElementById('nav-meals');
const navDatabase = document.getElementById('nav-database');
const navReports = document.getElementById('nav-reports');
const trackerPage = document.getElementById('tracker-page');
const mealsPage = document.getElementById('meals-page');
const databasePage = document.getElementById('database-page');
const reportsPage = document.getElementById('reports-page');

// Tracker Page
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
const dateDisplayBtn = document.getElementById('date-display-btn');

// Meals Page
const createMealForm = document.getElementById('create-meal-form');
const mealNameInput = document.getElementById('meal-name-input');
const mealBuilderList = document.getElementById('meal-builder-list');
const mealFoodNameInput = document.getElementById('meal-food-name-input');
const mealAutocompleteResults = document.getElementById('meal-autocomplete-results');
const mealFoodServingsInput = document.getElementById('meal-food-servings-input');
const addFoodToBuilderBtn = document.getElementById('add-food-to-builder-btn');
const saveMealBtn = document.getElementById('save-meal-btn');
const savedMealsList = document.getElementById('saved-meals-list');

// Database Page
const addToDbForm = document.getElementById('add-to-db-form');
const dbFoodNameInput = document.getElementById('db-food-name');
const dbCaloriesInput = document.getElementById('db-calories');
const dbProteinInput = document.getElementById('db-protein');
const dbSubmitBtn = document.getElementById('db-submit-btn');
const dbFoodListDiv = document.getElementById('db-food-list');
const dbSortSelect = document.getElementById('db-sort-select');

// Actions & Modals
const actionsMenuBtn = document.getElementById('actions-menu-btn');
const actionsDropdown = document.getElementById('actions-dropdown');
const exportDataBtn = document.getElementById('export-data-btn');
const importDataBtn = document.getElementById('import-data-btn');
const fileLoaderInput = document.getElementById('file-loader');
const editGoalsBtn = document.getElementById('edit-goals-btn');
// Modals
const allModals = document.querySelectorAll('.modal');
const settingsModal = document.getElementById('settings-modal');
const settingsForm = document.getElementById('settings-form');
const goalCaloriesInput = document.getElementById('goal-calories');
const goalProteinInput = document.getElementById('goal-protein');
const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
const addMealToDayModal = document.getElementById('add-meal-to-day-modal');
const addMealToDayForm = document.getElementById('add-meal-to-day-form');
const addMealModalTitle = document.getElementById('add-meal-modal-title');
const addMealModalIdInput = document.getElementById('add-meal-modal-id');
const addMealToDaySelect = document.getElementById('add-meal-to-day-select');
const cancelAddMealBtn = document.getElementById('cancel-add-meal-btn');

// Reports Page
const caloriesDoughnutChartCanvas = document.getElementById('calories-doughnut-chart');
const dailyBarChartCanvas = document.getElementById('daily-bar-chart');


// --- 2. CORE LOGIC & HELPER FUNCTIONS ---
function getCssVariable(variable) {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

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
    renderCurrentPage();
}

function resetForm() {
    addFoodForm.reset();
    submitEntryBtn.textContent = 'Add to Day';
    editingState = { isEditing: false, dateKey: null, meal: null, index: -1 };
    validateTrackerForm();
}

function resetDbForm() {
    addToDbForm.reset();
    dbSubmitBtn.textContent = 'Save to Database';
    dbEditingState = { isEditing: false, id: null };
    validateDbForm();
}

function resetMealForm() {
    createMealForm.reset();
    mealBuilderList.innerHTML = '';
    selectedFoodForMeal = null;
    mealEditingState = { isEditing: false, id: null };
    validateMealForm();
}

function validateTrackerForm() {
    const name = foodNameInput.value.trim();
    const calories = caloriesInput.value;
    const protein = proteinInput.value;
    const meal = mealSelect.value;
    submitEntryBtn.disabled = !(name && calories && protein && meal);
}

function validateDbForm() {
    const name = dbFoodNameInput.value.trim();
    const calories = dbCaloriesInput.value;
    const protein = dbProteinInput.value;
    dbSubmitBtn.disabled = !(name && calories && protein);
}

function validateMealForm() {
    const name = mealNameInput.value.trim();
    const hasItems = mealBuilderList.children.length > 0;
    saveMealBtn.disabled = !(name && hasItems);
}

// --- 3. RENDERING FUNCTIONS ---
function renderCurrentPage() {
    const activePageId = document.querySelector('.page.active').id;
    switch (activePageId) {
        case 'tracker-page':
            renderDateControls();
            renderDailyEntries();
            break;
        case 'meals-page':
            renderSavedMeals();
            break;
        case 'database-page':
            renderFoodDatabase();
            break;
        case 'reports-page':
            renderReportsPage();
            break;
    }
}

function renderDateControls() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    const isToday = (currentDate.getTime() === today.getTime());

    dateDisplayBtn.disabled = isToday;
    nextDayBtn.disabled = currentDate >= today;

    if (isToday) {
        dateDisplayBtn.textContent = 'Today';
    } else {
        dateDisplayBtn.textContent = currentDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }
}

function renderDailyEntries() {
    const currentDayData = getCurrentDayData();
    const entriesByMeal = currentDayData.entries;
    const goals = currentDayData.goals;
    
    dailyFoodListDiv.innerHTML = '';
    
    let grandTotalCalories = 0;
    let grandTotalProtein = 0;
    let hasEntries = false;
    let listContainer = document.createElement('div');

    for (const meal in entriesByMeal) {
        const mealEntries = entriesByMeal[meal];
        if (mealEntries.length > 0) {
            hasEntries = true;
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
            listContainer.appendChild(mealHeader);

            mealEntries.forEach((entry, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'food-item';
                itemDiv.innerHTML = `
                    <div>
                        <span class="food-item-name">${entry.name}</span>
                        <small class="food-item-stats">${entry.calories.toFixed(0)} kcal / ${entry.protein.toFixed(1)}g protein</small>
                    </div>
                    <div class="item-actions">
                        <button class="item-action-btn edit-btn" data-meal="${meal}" data-index="${index}">Edit</button>
                        <button class="item-action-btn delete-btn" data-meal="${meal}" data-index="${index}">Delete</button>
                    </div>
                `;
                listContainer.appendChild(itemDiv);
            });
        }
    }

    if (hasEntries) {
        listContainer.className = 'card';
        dailyFoodListDiv.appendChild(listContainer);
    }

    const caloriePercent = Math.min((grandTotalCalories / (goals.calories || 1)) * 100, 100);
    const proteinPercent = Math.min((grandTotalProtein / (goals.protein || 1)) * 100, 100);
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
            <div>
                <span class="food-item-name">${food.name}</span>
                <small class="food-item-stats">${food.calories} kcal / ${food.protein}g protein</small>
            </div>
            <div class="item-actions">
                <button class="item-action-btn edit-btn" data-id="${food.id}">Edit</button>
                <button class="item-action-btn delete-btn" data-id="${food.id}">Delete</button>
            </div>
        `;
        dbFoodListDiv.appendChild(itemDiv);
    });
}

function renderSavedMeals() {
    savedMealsList.innerHTML = '';
    if (allData.meals.length === 0) {
        savedMealsList.innerHTML = `<div class="db-food-item" style="justify-content: center; color: var(--color-text-tertiary);">You haven't created any meals yet.</div>`;
        return;
    }
    allData.meals.forEach(meal => {
        const totalCalories = meal.foods.reduce((sum, food) => sum + (food.calories * food.servings), 0);
        const totalProtein = meal.foods.reduce((sum, food) => sum + (food.protein * food.servings), 0);

        const mealDiv = document.createElement('div');
        mealDiv.className = 'db-food-item';
        mealDiv.innerHTML = `
            <div>
                <span class="food-item-name">${meal.name}</span>
                <small class="food-item-stats">${meal.foods.length} items • ${totalCalories.toFixed(0)} kcal • ${totalProtein.toFixed(1)}g protein</small>
            </div>
            <div class="item-actions">
                <button class="item-action-btn add-meal-to-day-btn" data-id="${meal.id}">Add to Day</button>
                <button class="item-action-btn delete-btn" data-id="${meal.id}">Delete</button>
            </div>
        `;
        savedMealsList.appendChild(mealDiv);
    });
}

function renderReportsPage() {
    if (doughnutChart) doughnutChart.destroy();
    if (barChart) barChart.destroy();

    const primaryColor = getCssVariable('--color-primary');
    const accentColor = getCssVariable('--color-accent');
    const surfaceColor = getCssVariable('--color-surface');
    const textColor = getCssVariable('--color-text-secondary');
    
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
                { label: 'Calories', data: dailyCalorieData, backgroundColor: accentColor, borderRadius: 4 },
                { label: 'Protein (g)', data: dailyProteinData, backgroundColor: primaryColor, borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { 
                y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }, 
                x: { ticks: { color: textColor }, grid: { display: false } } 
            },
            plugins: { legend: { labels: { color: textColor, font: { size: 14 } } } }
        }
    });

    const totalCaloriesConsumed = dailyCalorieData.reduce((sum, val) => sum + val, 0);
    const weeklyGoal = allData.userGoals.calories * 7;
    const caloriesRemaining = Math.max(0, weeklyGoal - totalCaloriesConsumed);

    doughnutChart = new Chart(caloriesDoughnutChartCanvas, {
        type: 'doughnut',
        data: {
            labels: ['Calories Consumed', 'Weekly Goal Remaining'],
            datasets: [{
                data: [totalCaloriesConsumed, caloriesRemaining],
                backgroundColor: [accentColor, surfaceColor],
                borderColor: getCssVariable('--color-background'),
                borderWidth: 4, hoverOffset: 8
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            cutout: '70%',
            plugins: { legend: { position: 'bottom', labels: { color: textColor, font: { size: 14 }, padding: 20 } } }
        }
    });
}


// --- 4. EVENT HANDLER FUNCTIONS ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(pageId).classList.add('active');
    document.getElementById(`nav-${pageId.split('-')[0]}`).classList.add('active');

    renderCurrentPage();
}

function handleAddOrUpdateDailyEntry(event) {
    event.preventDefault();
    const name = foodNameInput.value.trim();
    const calories = parseFloat(caloriesInput.value);
    const protein = parseFloat(proteinInput.value);
    const servings = parseFloat(servingsInput.value) || 1;
    const meal = mealSelect.value;

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
    
    saveDataToLocalStorage();
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
        saveDataToLocalStorage();
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
        
        validateTrackerForm();
        foodNameInput.focus();
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

    saveDataToLocalStorage();
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
        saveDataToLocalStorage();
        renderFoodDatabase();
    } else if (target.classList.contains('edit-btn')) {
        dbFoodNameInput.value = food.name;
        dbCaloriesInput.value = food.calories;
        dbProteinInput.value = food.protein;
        
        dbSubmitBtn.textContent = 'Update Food';
        dbEditingState = { isEditing: true, id: food.id };
        
        validateDbForm();
        dbFoodNameInput.focus();
    }
}

function handleAutocomplete(inputElement, resultsElement) {
    const query = inputElement.value.toLowerCase();
    resultsElement.innerHTML = '';
    if (query.length < 1) {
        resultsElement.style.display = 'none';
        return;
    }
    const results = allData.foodDatabase.filter(food => food.name.toLowerCase().includes(query));
    if (results.length > 0) {
        resultsElement.style.display = 'block';
        results.forEach(food => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'autocomplete-item';
            itemDiv.innerHTML = `<span>${food.name}</span><span class="stats">${food.calories} kcal / ${food.protein}g</span>`;
            itemDiv.onclick = () => {
                if (inputElement === foodNameInput) {
                    foodNameInput.value = food.name;
                    caloriesInput.value = food.calories;
                    proteinInput.value = food.protein;
                    servingsInput.focus();
                    validateTrackerForm();
                } else if (inputElement === mealFoodNameInput) {
                    mealFoodNameInput.value = food.name;
                    selectedFoodForMeal = food; // Store the selected food object
                    mealFoodServingsInput.focus();
                }
                resultsElement.innerHTML = '';
                resultsElement.style.display = 'none';
            };
            resultsElement.appendChild(itemDiv);
        });
    } else {
        resultsElement.style.display = 'none';
    }
}

// --- MODAL HANDLERS ---
function openModal(modalElement) {
    modalElement.classList.remove('hidden');
}

function closeModal(modalElement) {
    modalElement.classList.add('hidden');
}

function handleSaveSettings(event) {
    event.preventDefault();
    const newCalorieGoal = parseFloat(goalCaloriesInput.value);
    const newProteinGoal = parseFloat(goalProteinInput.value);

    if (!isNaN(newCalorieGoal)) allData.userGoals.calories = newCalorieGoal;
    if (!isNaN(newProteinGoal)) allData.userGoals.protein = newProteinGoal;

    const currentDayData = getCurrentDayData();
    currentDayData.goals = { ...allData.userGoals };

    saveDataToLocalStorage();
    closeModal(settingsModal);
    renderCurrentPage();
}

// --- MEAL PAGE HANDLERS ---
function handleAddFoodToBuilder() {
    const servings = parseFloat(mealFoodServingsInput.value);
    if (!selectedFoodForMeal || isNaN(servings) || servings <= 0) {
        alert("Please select a valid food from the list and enter a valid serving amount.");
        return;
    }

    const existingItem = mealBuilderList.querySelector(`[data-id="${selectedFoodForMeal.id}"]`);
    if (existingItem) {
        alert("This food is already in the meal.");
        return;
    }

    const foodItemDiv = document.createElement('div');
    foodItemDiv.className = 'meal-builder-item';
    foodItemDiv.dataset.id = selectedFoodForMeal.id;
    foodItemDiv.dataset.servings = servings;
    foodItemDiv.innerHTML = `
        <div>
            <span>${selectedFoodForMeal.name}</span>
            <span class="servings-text">(${servings} servings)</span>
        </div>
        <button type="button" class="delete-from-meal-builder-btn" aria-label="Remove item">×</button>
    `;
    mealBuilderList.appendChild(foodItemDiv);

    selectedFoodForMeal = null;
    mealFoodNameInput.value = '';
    mealFoodServingsInput.value = '1';
    validateMealForm();
}

function handleMealBuilderListClick(event) {
    if (event.target.classList.contains('delete-from-meal-builder-btn')) {
        event.target.closest('.meal-builder-item').remove();
        validateMealForm();
    }
}

function handleSaveMeal(event) {
    event.preventDefault();
    const name = mealNameInput.value.trim();
    if (!name) return;

    const foodsInBuilder = Array.from(mealBuilderList.querySelectorAll('.meal-builder-item')).map(item => {
        const foodId = parseInt(item.dataset.id);
        const servings = parseFloat(item.dataset.servings);
        const foodData = allData.foodDatabase.find(f => f.id === foodId);
        return { ...foodData, servings };
    });

    if (foodsInBuilder.length > 0) {
        const newMeal = { id: Date.now(), name, foods: foodsInBuilder };
        allData.meals.push(newMeal);
        saveDataToLocalStorage();
        renderSavedMeals();
        resetMealForm();
    }
}

function handleSavedMealsListClick(event) {
    const target = event.target.closest('.item-action-btn');
    if (!target) return;

    const mealId = parseInt(target.dataset.id);

    if (target.classList.contains('delete-btn')) {
        if (confirm("Are you sure you want to delete this meal?")) {
            allData.meals = allData.meals.filter(m => m.id !== mealId);
            saveDataToLocalStorage();
            renderSavedMeals();
        }
    } else if (target.classList.contains('add-meal-to-day-btn')) {
        const mealToAdd = allData.meals.find(m => m.id === mealId);
        if (mealToAdd) {
            addMealModalIdInput.value = mealId;
            addMealModalTitle.textContent = `Add "${mealToAdd.name}" to...`;
            openModal(addMealToDayModal);
        }
    }
}

function handleConfirmAddMealToDay(event) {
    event.preventDefault();
    const mealId = parseInt(addMealModalIdInput.value);
    const mealType = addMealToDaySelect.value;
    const mealToAdd = allData.meals.find(m => m.id === mealId);

    if (mealToAdd && mealType) {
        const currentDayData = getCurrentDayData();
        mealToAdd.foods.forEach(food => {
            const newEntry = {
                name: `${food.name} (${food.servings} servings)`,
                baseName: food.name,
                calories: food.calories * food.servings,
                protein: food.protein * food.servings,
                servings: food.servings
            };
            currentDayData.entries[mealType].push(newEntry);
        });
        saveDataToLocalStorage();
        closeModal(addMealToDayModal);
        showPage('tracker-page');
    }
}


// --- 5. DATA PERSISTENCE & IMPORT/EXPORT ---
function saveDataToLocalStorage() {
    try {
        localStorage.setItem('foodTrackerData', JSON.stringify(allData));
    } catch (error) {
        console.error("Could not save data to localStorage", error);
        alert("Could not save data. Your browser's storage might be full.");
    }
}

function loadDataFromLocalStorage() {
    const savedData = localStorage.getItem('foodTrackerData');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            if (parsedData.foodDatabase && parsedData.history && parsedData.userGoals) {
                allData = parsedData;
                if (!allData.meals) allData.meals = [];
            } else {
                throw new Error("Invalid data structure in localStorage.");
            }
        } catch (error) {
            console.error("Could not parse data from localStorage", error);
        }
    }
}

function exportDataToFile() {
    const dataAsString = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataAsString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `food-tracker-backup-${getFormattedDate(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function importDataFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (!importedData.history || !importedData.foodDatabase || !importedData.userGoals) {
                throw new Error("Invalid data file format.");
            }
            if (confirm("This will overwrite all current data. Are you sure you want to proceed?")) {
                allData = importedData;
                currentDate = new Date();
                saveDataToLocalStorage();
                resetForm();
                resetDbForm();
                resetMealForm();
                renderCurrentPage();
                alert("Data imported successfully!");
            }
        } catch (error) {
            alert('Error reading or parsing file. Please make sure you selected a valid backup file.');
            console.error(error);
        } finally {
            fileLoaderInput.value = "";
        }
    };
    reader.readAsText(file);
}

// --- 6. EVENT LISTENERS ---
// Page Navigation
navTracker.addEventListener('click', () => showPage('tracker-page'));
navMeals.addEventListener('click', () => showPage('meals-page'));
navDatabase.addEventListener('click', () => showPage('database-page'));
navReports.addEventListener('click', () => showPage('reports-page'));

// Tracker Page
addFoodForm.addEventListener('submit', handleAddOrUpdateDailyEntry);
foodNameInput.addEventListener('input', () => handleAutocomplete(foodNameInput, autocompleteResults));
dailyFoodListDiv.addEventListener('click', handleDailyListClick);

// Database Page
addToDbForm.addEventListener('submit', handleAddOrUpdateDbEntry);
dbFoodListDiv.addEventListener('click', handleDatabaseListClick);
dbSortSelect.addEventListener('change', (event) => {
    currentDbSort = event.target.value;
    renderFoodDatabase();
});

// Meals Page
createMealForm.addEventListener('submit', handleSaveMeal);
mealNameInput.addEventListener('input', validateMealForm);
mealFoodNameInput.addEventListener('input', () => handleAutocomplete(mealFoodNameInput, mealAutocompleteResults));
addFoodToBuilderBtn.addEventListener('click', handleAddFoodToBuilder);
mealBuilderList.addEventListener('click', handleMealBuilderListClick);
savedMealsList.addEventListener('click', handleSavedMealsListClick);

// Date Navigation
prevDayBtn.addEventListener('click', () => changeDate(-1));
nextDayBtn.addEventListener('click', () => changeDate(1));
dateDisplayBtn.addEventListener('click', () => {
    if (dateDisplayBtn.disabled) return;
    currentDate = new Date();
    renderCurrentPage();
});

// Modals and Actions
editGoalsBtn.addEventListener('click', () => openModal(settingsModal));
cancelSettingsBtn.addEventListener('click', () => closeModal(settingsModal));
settingsForm.addEventListener('submit', handleSaveSettings);
addMealToDayForm.addEventListener('submit', handleConfirmAddMealToDay);
cancelAddMealBtn.addEventListener('click', () => closeModal(addMealToDayModal));

actionsMenuBtn.addEventListener('click', () => actionsDropdown.classList.toggle('hidden'));
exportDataBtn.addEventListener('click', () => { exportDataToFile(); actionsDropdown.classList.add('hidden'); });
importDataBtn.addEventListener('click', () => { fileLoaderInput.click(); actionsDropdown.classList.add('hidden'); });
fileLoaderInput.addEventListener('change', importDataFromFile);

document.addEventListener('click', (event) => {
    if (!event.target.closest('#actions-menu-container')) actionsDropdown.classList.add('hidden');
    if (!event.target.closest('.autocomplete-container')) {
        autocompleteResults.style.display = 'none';
        mealAutocompleteResults.style.display = 'none';
    }
    if (event.target.classList.contains('modal-overlay')) {
        allModals.forEach(closeModal);
    }
});

addFoodForm.addEventListener('input', validateTrackerForm);
addFoodForm.addEventListener('change', validateTrackerForm);
addToDbForm.addEventListener('input', validateDbForm);

// --- 7. INITIALIZE APP ---
function initializeApp() {
    loadDataFromLocalStorage();
    showPage('tracker-page');
    validateTrackerForm();
    validateDbForm();
    validateMealForm();
}

initializeApp();