let gameState = {
    score: 0,
    coins: 50,
    population: 10,
    happiness: 100,
    timeLeft: 0,
    difficulty: 'easy',
    goals: { easy: 50, normal: 100, hard: 200 },
    buildings: { well: 0, pump: 0, treatment: 0 },
    gameActive: false,
    crisisActive: false,
    milestoneIndex: 0 // Track which milestone we're on
};

// Sound effects object to manage audio
const sounds = {
    collect: null,
    build: null,
    button: null,
    win: null,
    crisis: null,
    milestone: null,
    
    // Initialize all sounds
    init() {
        // Create audio objects for different sounds
        // Note: You'll need to add these audio files to your project
        this.collect = new Audio('sounds/collect.mp3'); // Water collection sound
        this.build = new Audio('sounds/build.wav'); // Building construction sound
        this.button = new Audio('sounds/button.mp3'); // Button click sound
        this.win = new Audio('sounds/win.mp3'); // Victory sound
        this.crisis = new Audio('sounds/crisis.wav'); // Crisis alert sound
        this.milestone = new Audio('sounds/milestone.mp3'); // Milestone achievement sound
        
        // Set volume levels
        Object.values(this).forEach(audio => {
            if (audio && audio instanceof Audio) {
                audio.volume = 0.5; // Set to 30% volume
            }
        });
    },
    
    // Play a specific sound with error handling
    play(soundName) {
        try {
            if (this[soundName] && this[soundName] instanceof Audio) {
                this[soundName].currentTime = 0; // Reset to beginning
                this[soundName].play().catch(e => {
                    console.log(`Could not play ${soundName} sound:`, e);
                });
            }
        } catch (error) {
            console.log(`Error playing ${soundName} sound:`, error);
        }
    }
};

// Milestone system
const milestones = {
    easy: [
        { score: 10, message: "Great start! You're helping your village! 🌟" },
        { score: 25, message: "Halfway there! Keep collecting water! 💪" },
        { score: 40, message: "Almost there! Your village is thriving! 🎉" }
    ],
    normal: [
        { score: 20, message: "Good progress! The village is grateful! 🌟" },
        { score: 50, message: "Halfway there! You're making a difference! 💪" },
        { score: 75, message: "Great work! Almost at your goal! 🎯" },
        { score: 90, message: "So close! Don't give up now! 🔥" }
    ],
    hard: [
        { score: 30, message: "Impressive start! Keep up the hard work! 🌟" },
        { score: 60, message: "Quarter way there! This is challenging! 💪" },
        { score: 100, message: "Halfway point! You're doing amazing! 🎯" },
        { score: 150, message: "Three quarters done! Almost there! 🔥" },
        { score: 180, message: "Final stretch! Victory is near! 🏆" }
    ]
};

let gameTimer;
let crisisTimer;

// Initialize game
function initGame() {
    sounds.init(); // Initialize sound system
    updateDisplay();
    spawnWaterSources();
    setupEventListeners();
    resetMilestones();
}

function startGame() {
    const timerInput = document.getElementById('timerInput');
    const minutes = parseInt(timerInput.value);
    
    if (minutes < 1 || minutes > 60) {
        alert('Please enter a timer between 1 and 60 minutes');
        return;
    }
    
    // Play button sound
    sounds.play('button');
    
    gameState.timeLeft = minutes * 60;
    gameState.gameActive = true;
    
    // Hide timer setup and show game
    document.getElementById('timerSetup').style.display = 'none';
    
    startTimer();
    scheduleCrisis();
}

function setupEventListeners() {
    // Difficulty selection
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            sounds.play('button'); // Play button sound
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            gameState.difficulty = e.target.dataset.difficulty;
            resetGame();
        });
    });

    // Building construction
    document.querySelectorAll('.building').forEach(building => {
        building.addEventListener('click', (e) => {
            const buildingType = e.currentTarget.dataset.building;
            const cost = parseInt(e.currentTarget.dataset.cost);
            constructBuilding(buildingType, cost);
        });
    });
}

function spawnWaterSources() {
    const villageMap = document.getElementById('villageMap');
    villageMap.innerHTML = '';
    
    const numSources = gameState.difficulty === 'easy' ? 6 : 
                        gameState.difficulty === 'normal' ? 4 : 3;

    for (let i = 0; i < numSources; i++) {
        const waterSource = document.createElement('div');
        waterSource.className = 'water-source';
        waterSource.innerHTML = '💧';
        waterSource.addEventListener('click', collectWater);
        villageMap.appendChild(waterSource);
    }
}

function collectWater(e) {
    if (!gameState.gameActive || e.target.classList.contains('collected')) return;

    // Play collect sound
    sounds.play('collect');

    const basePoints = gameState.difficulty === 'easy' ? 5 :
                        gameState.difficulty === 'normal' ? 3 : 2;
    
    let points = basePoints;
    let coins = 2;

    // Building bonuses
    if (gameState.buildings.well > 0) {
        points += gameState.buildings.well * 2;
        coins += gameState.buildings.well;
    }
    if (gameState.buildings.pump > 0) {
        points += gameState.buildings.pump * 4;
        coins += gameState.buildings.pump * 2;
    }
    if (gameState.buildings.treatment > 0) {
        points += gameState.buildings.treatment * 6;
        coins += gameState.buildings.treatment * 3;
    }

    gameState.score += points;
    gameState.coins += coins;

    // Check for milestones BEFORE updating display
    checkMilestones();

    // Visual feedback
    e.target.classList.add('collected');
    e.target.innerHTML = '✅';
    e.target.style.transform = 'scale(1.2)';
    
    // Show floating points
    showFloatingPoints(e.target, `+${points} 💧 +${coins} 🪙`);

    updateDisplay();
    checkWinCondition();

    // Respawn after delay
    setTimeout(() => {
        if (gameState.gameActive) {
            e.target.classList.remove('collected');
            e.target.innerHTML = '💧';
            e.target.style.transform = '';
        }
    }, 3000);
}

function constructBuilding(type, cost) {
    if (!gameState.gameActive || gameState.coins < cost) return;

    // Play build sound
    sounds.play('build');

    gameState.coins -= cost;
    gameState.buildings[type]++;
    gameState.population += type === 'well' ? 5 : type === 'pump' ? 10 : 20;

    // Update building display
    const buildingEl = document.querySelector(`[data-building="${type}"]`);
    buildingEl.classList.add('built');
    buildingEl.innerHTML = `<div>✅ ${buildingEl.querySelector('div').textContent}</div><small>Built: ${gameState.buildings[type]}</small>`;

    // Unlock next building
    unlockBuildings();
    updateDisplay();
    
    showFloatingPoints(buildingEl, `${type.toUpperCase()} BUILT!`);
}

function unlockBuildings() {
    if (gameState.buildings.well > 0) {
        document.querySelector('[data-building="pump"]').classList.remove('locked');
    }
    if (gameState.buildings.pump > 0) {
        document.querySelector('[data-building="treatment"]').classList.remove('locked');
    }
}

function autoCollect() {
    if (gameState.coins < 10) return;
    
    // Play button sound
    sounds.play('button');
    
    gameState.coins -= 10;
    const sources = document.querySelectorAll('.water-source:not(.collected)');
    sources.forEach(source => {
        setTimeout(() => {
            if (!source.classList.contains('collected')) {
                source.click();
            }
        }, Math.random() * 1000);
    });
}

function scheduleCrisis() {
    if (!gameState.gameActive) return;
    
    const crisisDelay = (gameState.difficulty === 'easy' ? 45 : 
                        gameState.difficulty === 'normal' ? 30 : 20) * 1000;
    
    crisisTimer = setTimeout(triggerCrisis, crisisDelay);
}

function triggerCrisis() {
    if (!gameState.gameActive || gameState.crisisActive) return;

    // Play crisis sound
    sounds.play('crisis');

    const crises = [
        { text: "Drought Alert! Water sources are drying up!", effect: () => { gameState.score = Math.max(0, gameState.score - 20); }},
        { text: "Equipment Failure! Repair costs incoming!", effect: () => { gameState.coins = Math.max(0, gameState.coins - 15); }},
        { text: "Population Boom! More people need water!", effect: () => { gameState.population += 10; }}
    ];

    const crisis = crises[Math.floor(Math.random() * crises.length)];
    document.getElementById('crisisText').textContent = crisis.text;
    document.getElementById('crisisEvent').classList.add('active');
    gameState.crisisActive = true;

    // Auto-resolve after 5 seconds if not handled
    setTimeout(() => {
        if (gameState.crisisActive) {
            crisis.effect();
            handleCrisis();
        }
    }, 5000);
}

function handleCrisis() {
    // Play button sound when handling crisis
    sounds.play('button');
    
    document.getElementById('crisisEvent').classList.remove('active');
    gameState.crisisActive = false;
    gameState.happiness = Math.max(50, gameState.happiness - 10);
    updateDisplay();
    
    // Schedule next crisis
    if (gameState.gameActive) {
        scheduleCrisis();
    }
}

// NEW FUNCTION: Check and display milestones
function checkMilestones() {
    const currentMilestones = milestones[gameState.difficulty];
    
    // Check if we've reached any new milestones
    for (let i = gameState.milestoneIndex; i < currentMilestones.length; i++) {
        if (gameState.score >= currentMilestones[i].score) {
            // Play milestone sound
            sounds.play('milestone');
            
            // Show milestone message
            showMilestoneMessage(currentMilestones[i].message);
            
            // Update milestone index
            gameState.milestoneIndex = i + 1;
        } else {
            break; // Stop checking once we find a milestone we haven't reached
        }
    }
}

// NEW FUNCTION: Display milestone message
function showMilestoneMessage(message) {
    // Create milestone popup
    const milestonePopup = document.createElement('div');
    milestonePopup.className = 'milestone-popup';
    milestonePopup.innerHTML = `
        <div class="milestone-content">
            <h3>🎯 MILESTONE REACHED!</h3>
            <p>${message}</p>
        </div>
    `;
    
    // Add styles
    milestonePopup.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #FFD700, #FFA500);
        color: #333;
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        z-index: 2000;
        animation: slideInRight 0.5s ease-out;
        max-width: 300px;
        font-weight: 600;
        border: 3px solid #FF6B35;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .milestone-content h3 {
            margin: 0 0 10px 0;
            font-size: 1.2rem;
            text-align: center;
        }
        
        .milestone-content p {
            margin: 0;
            text-align: center;
            font-size: 1rem;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(milestonePopup);
    
    // Remove after 4 seconds
    setTimeout(() => {
        milestonePopup.style.animation = 'slideInRight 0.5s ease-out reverse';
        setTimeout(() => {
            if (milestonePopup.parentNode) {
                milestonePopup.remove();
            }
            if (style.parentNode) {
                style.remove();
            }
        }, 500);
    }, 4000);
}

// NEW FUNCTION: Reset milestone tracking
function resetMilestones() {
    gameState.milestoneIndex = 0;
}

function startTimer() {
    gameTimer = setInterval(() => {
        gameState.timeLeft--;
        updateDisplay();
        
        if (gameState.timeLeft <= 0) {
            endGame(false);
        }
    }, 1000);   
}

function checkWinCondition() {
    const goal = gameState.goals[gameState.difficulty];
    if (gameState.score >= goal) {
        endGame(true);
    }
}

function endGame(won) {
    gameState.gameActive = false;
    clearInterval(gameTimer);
    clearTimeout(crisisTimer);

    // Play win sound if player won
    if (won) {
        sounds.play('win');
    }

    const gameOverEl = document.getElementById('gameOver');
    const titleEl = document.getElementById('gameOverTitle');
    const textEl = document.getElementById('gameOverText');
    const statsEl = document.getElementById('finalStats');

    if (won) {
        titleEl.textContent = '🎉 Victory!';
        textEl.textContent = 'Congratulations! You\'ve successfully provided clean water to your village!';
        createConfetti();
    } else {
        titleEl.textContent = '⏰ Time\'s Up!';
        textEl.textContent = 'Your village still needs more water. Try again!';
    }

    statsEl.innerHTML = `
        <p><strong>Final Statistics:</strong></p>
        <p>💧 Water Collected: ${gameState.score}</p>
        <p>🪙 Coins Earned: ${gameState.coins}</p>
        <p>👥 Final Population: ${gameState.population}</p>
        <p>🏗️ Buildings Built: ${Object.values(gameState.buildings).reduce((a, b) => a + b, 0)}</p>
        <p>🎯 Milestones Reached: ${gameState.milestoneIndex}</p>
    `;

    gameOverEl.classList.add('active');
}

function createConfetti() {
    const colors = ['#FFD23F', '#0084FF', '#4CAF50', '#FF9800', '#F44336'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 3000);
        }, i * 100);
    }
}

function showFloatingPoints(element, text) {
    const floating = document.createElement('div');
    floating.textContent = text;
    floating.style.cssText = `
        position: absolute;
        top: ${element.offsetTop - 30}px;
        left: ${element.offsetLeft + element.offsetWidth / 2}px;
        transform: translateX(-50%);
        color: #0084FF;
        font-weight: bold;
        font-size: 1.2rem;
        z-index: 1000;
        pointer-events: none;
        animation: floatUp 2s ease-out forwards;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes floatUp {
            to {
                transform: translateX(-50%) translateY(-50px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    element.parentElement.appendChild(floating);
    setTimeout(() => {
        floating.remove();
        style.remove();
    }, 2000);
}

function updateDisplay() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('coins').textContent = gameState.coins;
    document.getElementById('population').textContent = gameState.population;
    document.getElementById('timer').textContent = `Time: ${gameState.timeLeft}s`;
    
    // Update happiness display
    const happinessEmoji = gameState.happiness > 80 ? '😊' : 
                            gameState.happiness > 60 ? '😐' :
                            gameState.happiness > 40 ? '😟' : '😰';
    document.getElementById('happiness').textContent = happinessEmoji;
    
    // Update progress bar
    const goal = gameState.goals[gameState.difficulty];
    const progress = Math.min(100, (gameState.score / goal) * 100);
    document.getElementById('progressBar').style.width = progress + '%';
}

function resetGame() {
    // Play button sound
    sounds.play('button');
    
    clearInterval(gameTimer);
    clearTimeout(crisisTimer);
    
    gameState = {
        score: 0,
        coins: 50,
        population: 10,
        happiness: 100,
        timeLeft: 60,
        difficulty: gameState.difficulty,
        goals: { easy: 50, normal: 100, hard: 200 },
        buildings: { well: 0, pump: 0, treatment: 0 },
        gameActive: false, // Set to false initially
        crisisActive: false,
        milestoneIndex: 0 // Reset milestone tracking
    };

    // Reset building displays
    document.querySelectorAll('.building').forEach(building => {
        building.classList.remove('built');
        const type = building.dataset.building;
        const cost = building.dataset.cost;
        building.innerHTML = `<div>${building.querySelector('div').textContent.split('✅ ').pop()}</div><small>Cost: ${cost} coins</small>`;
        
        if (type !== 'well') {
            building.classList.add('locked');
        }
    });

    document.getElementById('gameOver').classList.remove('active');
    document.getElementById('crisisEvent').classList.remove('active');
    
    // Show timer setup again
    document.getElementById('timerSetup').style.display = 'block';
    
    updateDisplay();
    spawnWaterSources();
    resetMilestones();
}

// Start the game when page loads
window.addEventListener('load', initGame);