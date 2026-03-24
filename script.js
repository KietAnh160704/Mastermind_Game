let currentGameRows = 7;
let currentHolesPerRow = 4;

// 16 colors for up to 200+ levels (1 new color every 20 levels)
const ALL_COLORS = [
    { name: 'Red', hex: '#ef4444' },    // Base 1
    { name: 'Green', hex: '#22c55e' },  // Base 2
    { name: 'Blue', hex: '#3b82f6' },   // Base 3
    { name: 'Yellow', hex: '#eab308' }, // Base 4
    { name: 'Purple', hex: '#a855f7' }, // Base 5
    { name: 'Orange', hex: '#f97316' }, // Base 6
    { name: 'Pink', hex: '#ec4899' },   // Lv 21
    { name: 'Cyan', hex: '#06b6d4' },   // Lv 41
    { name: 'Lime', hex: '#84cc16' },   // Lv 61
    { name: 'Teal', hex: '#14b8a6' },   // Lv 81
    { name: 'Indigo', hex: '#6366f1' }, // Lv 101
    { name: 'Rose', hex: '#f43f5e' },   // Lv 121
    { name: 'Amber', hex: '#f59e0b' },  // Lv 141
    { name: 'Emerald', hex: '#10b981' }, // Lv 161
    { name: 'Violet', hex: '#8b5cf6' }, // Lv 181
    { name: 'Fuchsia', hex: '#d946ef' }  // Lv 201
];

let currentLevel = parseInt(localStorage.getItem('mastermind_level')) || 1;
let activeColors = [];

let secretCode = [];
let currentAttempt = 0;
let currentGuess = [];
let gameActive = true;

let timerInterval;
let timeElapsed = 0;


const boardEl = document.getElementById('board');
const paletteEl = document.getElementById('palette');
const btnDelete = document.getElementById('btn-delete');
const btnSubmit = document.getElementById('btn-submit');
const modalOverlay = document.getElementById('overlay');
const resultModal = document.getElementById('result-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const secretCodeDisplay = document.getElementById('secret-code-display');
const btnRestart = document.getElementById('btn-restart');
const levelInput = document.getElementById('level-input');
const timerDisplay = document.getElementById('timer-display');


function initGame() {

    let extraDifficulty = currentLevel >= 81 ? Math.floor((currentLevel - 81) / 50) + 1 : 0;
    currentGameRows = 7 + extraDifficulty;
    currentHolesPerRow = 4 + extraDifficulty;


    let colorCount = 6 + Math.floor((currentLevel - 1) / 20);

    if (colorCount < currentHolesPerRow) colorCount = currentHolesPerRow;
    if (colorCount > 12) colorCount = 12; // Tối đa 12 màu
    activeColors = ALL_COLORS.slice(0, colorCount);

    if (levelInput) levelInput.value = currentLevel;

    const holesDisplay = document.getElementById('holes-display');
    const rowsDisplay = document.getElementById('rows-display');
    if (holesDisplay) holesDisplay.textContent = currentHolesPerRow;
    if (rowsDisplay) rowsDisplay.textContent = currentGameRows;


    secretCode = [];
    let availableColors = [...activeColors];
    for (let i = 0; i < currentHolesPerRow; i++) {
        const randomIndex = Math.floor(Math.random() * availableColors.length);
        secretCode.push(availableColors[randomIndex].hex);
        availableColors.splice(randomIndex, 1);
    }


    console.log(`Level ${currentLevel} Secret Code:`, secretCode);

    currentAttempt = 0;
    currentGuess = [];
    gameActive = true;


    boardEl.innerHTML = '';
    paletteEl.innerHTML = '';

    createBoard();
    createPalette();
    updateActiveRow();

    // Start stopwatch timer
    clearInterval(timerInterval);
    timeElapsed = 0;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(timerInterval);
            return;
        }
        timeElapsed++;
        updateTimerDisplay();
    }, 1000);
    
    // Hide modal if open
    modalOverlay.classList.remove('visible');
    resultModal.classList.remove('visible');
    setTimeout(() => {
        modalOverlay.classList.remove('show');
        resultModal.classList.remove('show');
    }, 300);
}


function createBoard() {
    for (let i = 0; i < currentGameRows; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'row';
        rowDiv.id = `row-${i}`;

        // Attempt number
        const numberDiv = document.createElement('div');
        numberDiv.className = 'attempt-number';
        numberDiv.textContent = i + 1;
        rowDiv.appendChild(numberDiv);

        // Guesses
        const guessesDiv = document.createElement('div');
        guessesDiv.className = 'guesses';
        for (let j = 0; j < currentHolesPerRow; j++) {
            const holeDiv = document.createElement('div');
            holeDiv.className = 'hole';
            holeDiv.id = `guess-${i}-${j}`;
            guessesDiv.appendChild(holeDiv);
        }
        rowDiv.appendChild(guessesDiv);

        // Feedback pins
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'feedback-container';
        for (let j = 0; j < currentHolesPerRow; j++) {
            const pinDiv = document.createElement('div');
            pinDiv.className = 'pin';
            pinDiv.id = `pin-${i}-${j}`;
            feedbackDiv.appendChild(pinDiv);
        }
        rowDiv.appendChild(feedbackDiv);

        boardEl.appendChild(rowDiv);
    }
}

// Convert seconds to MM:SS and update UI
function updateTimerDisplay() {
    if (!timerDisplay) return;
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Create Palette UI
function createPalette() {
    activeColors.forEach(color => {
        const btn = document.createElement('button');
        btn.className = 'color-btn';
        btn.style.backgroundColor = color.hex;
        btn.title = color.name;
        btn.dataset.hex = color.hex;
        btn.addEventListener('click', () => selectColor(color.hex));
        paletteEl.appendChild(btn);
    });
}

// Update Active Row Styling
function updateActiveRow() {
    document.querySelectorAll('.row').forEach((row, index) => {
        if (index === currentAttempt) {
            row.classList.add('active');
        } else {
            row.classList.remove('active');
        }
    });
}

// User selects a color
function selectColor(colorHex) {
    if (!gameActive) return;
    if (currentGuess.length < currentHolesPerRow && !currentGuess.includes(colorHex)) {
        currentGuess.push(colorHex);
        updateGuessUI();
    }
}

// User deletes last color
function deleteColor() {
    if (!gameActive) return;
    if (currentGuess.length > 0) {
        currentGuess.pop();
        updateGuessUI();
    }
}

// Update the current row's guess colors
function updateGuessUI() {
    const currentRow = document.getElementById(`row-${currentAttempt}`);

    for (let i = 0; i < currentHolesPerRow; i++) {
        const hole = document.getElementById(`guess-${currentAttempt}-${i}`);
        if (i < currentGuess.length) {
            hole.style.backgroundColor = currentGuess[i];
            hole.classList.add('filled');
        } else {
            hole.style.backgroundColor = '';
            hole.classList.remove('filled');
        }
    }

    // Update palette visual state
    document.querySelectorAll('.color-btn').forEach(btn => {
        if (currentGuess.includes(btn.dataset.hex)) {
            btn.classList.add('disabled-color');
            btn.style.opacity = '0.3';
            btn.style.cursor = 'not-allowed';
        } else {
            btn.classList.remove('disabled-color');
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
    });
}

// Evaluate Truth
function submitGuess() {
    if (!gameActive) return;

    // Ensure all target colors are selected
    if (currentGuess.length < currentHolesPerRow) {
        const currentRow = document.getElementById(`row-${currentAttempt}`);
        currentRow.classList.remove('shake');
        void currentRow.offsetWidth; // trigger reflow
        currentRow.classList.add('shake');
        return;
    }

    // Logic: calculate exact and partial matches
    let exactMatches = 0;   // Correct color & position -> Green pin
    let partialMatches = 0; // Correct color, wrong position -> Yellow pin

    let secretCopy = [...secretCode];
    let guessCopy = [...currentGuess];

    // 1. Check exact matches
    for (let i = 0; i < currentHolesPerRow; i++) {
        if (guessCopy[i] === secretCopy[i]) {
            exactMatches++;
            guessCopy[i] = null; // Mark as resolved
            secretCopy[i] = null;
        }
    }

    // 2. Check partial matches
    for (let i = 0; i < currentHolesPerRow; i++) {
        if (guessCopy[i] !== null) {
            const foundIndex = secretCopy.indexOf(guessCopy[i]);
            if (foundIndex !== -1) {
                partialMatches++;
                secretCopy[foundIndex] = null; // Consume the match
            }
        }
    }

    // Update feedback UI
    updateFeedbackUI(exactMatches, partialMatches);

    // Check Win/Loss conditions
    if (exactMatches === currentHolesPerRow) {
        endGame(true);
    } else if (currentAttempt === currentGameRows - 1) {
        endGame(false);
    } else {
        // Next turn
        currentAttempt++;
        currentGuess = [];
        updateActiveRow();
    }
}

function updateFeedbackUI(exact, partial) {
    let pinIndex = 0;

    // Add Green pins for exact matches
    for (let i = 0; i < exact; i++) {
        const pin = document.getElementById(`pin-${currentAttempt}-${pinIndex}`);
        pin.classList.add('green');
        pinIndex++;
    }

    // Add Yellow pins for partial matches
    for (let i = 0; i < partial; i++) {
        const pin = document.getElementById(`pin-${currentAttempt}-${pinIndex}`);
        pin.classList.add('yellow');
        pinIndex++;
    }
}

function endGame(isWin) {
    gameActive = false;
    clearInterval(timerInterval);
    
    // Customize modal
    if (isWin) {
        modalTitle.textContent = "Bạn đã thắng! 🎉";
        modalTitle.className = "win";
        const timeStr = timerDisplay ? timerDisplay.textContent : "";
        if (currentLevel >= 200) {
            modalMessage.textContent = `Tuyệt đỉnh! Bạn đã phá đảo toàn bộ 200 cấp độ của trò chơi, với Cấp cuối trong ${timeStr}.`;
            btnRestart.textContent = "Hoàn thành - Chơi lại từ đầu";
            btnRestart.onclick = () => {
                currentLevel = 1;
                localStorage.setItem('mastermind_level', currentLevel);
                initGame();
            };
        } else {
            modalMessage.textContent = `Thành tích: bạn đã giải mã Cấp độ ${currentLevel} trong ${timeStr}.`;
            btnRestart.textContent = "Chơi Tiếp Level Kế";
            btnRestart.onclick = () => {
                currentLevel++;
                localStorage.setItem('mastermind_level', currentLevel);
                initGame();
            };
        }
    } else {
        modalTitle.textContent = "Bạn đã thua! 😢";
        modalTitle.className = "lose";
        modalMessage.textContent = "Đừng buồn, hãy chơi lại cấp độ này nhé!";
        btnRestart.textContent = "Chơi Lại Level Này";
        btnRestart.onclick = () => {
            initGame();
        };
    }

    // Show secret code
    secretCodeDisplay.innerHTML = '';
    secretCode.forEach(colorHex => {
        const colorHole = document.createElement('div');
        colorHole.className = 'secret-hole';
        colorHole.style.backgroundColor = colorHex;
        secretCodeDisplay.appendChild(colorHole);
    });

    // Show modal
    modalOverlay.classList.add('show');
    resultModal.classList.add('show');

    // Trigger animations
    setTimeout(() => {
        modalOverlay.classList.add('visible');
        resultModal.classList.add('visible');
    }, 10);
}

// Event Listeners
btnDelete.addEventListener('click', deleteColor);
btnSubmit.addEventListener('click', submitGuess);

if (levelInput) {
    levelInput.addEventListener('change', (e) => {
        let newLevel = parseInt(e.target.value);
        if (!isNaN(newLevel) && newLevel >= 1 && newLevel <= 200) {
            currentLevel = newLevel;
            localStorage.setItem('mastermind_level', currentLevel);
            initGame();
        } else {
            levelInput.value = currentLevel;
            alert("Trò chơi hiện chỉ có 200 mức độ, hãy nhập số từ 1 đến 200!");
        }
    });
}

// Add keyboard support
document.addEventListener('keydown', (e) => {
    if (!gameActive) {
        if (e.key === 'Enter' && resultModal.classList.contains('show')) {
            btnRestart.click();
        }
        return;
    }

    if (e.key === 'Backspace') {
        deleteColor();
    } else if (e.key === 'Enter') {
        submitGuess();
    }
});

// Start the game on initial load
initGame();
