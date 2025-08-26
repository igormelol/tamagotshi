document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const petMoodEl = document.getElementById('pet-mood');
    const moodImageEl = document.getElementById('mood-image');
    const petImageEl = document.getElementById('pet-image');
    const petImgEl = document.getElementById('pet-img');
    const petNameEl = document.getElementById('pet-name');

    const statusHungerEl = document.getElementById('status-hunger');
    const statusHappinessEl = document.getElementById('status-happiness');
    const statusEnergyEl = document.getElementById('status-energy');
    const statusCleanlinessEl = document.getElementById('status-cleanliness');
    const statusAgeEl = document.getElementById('status-age');
    const statusHealthEl = document.getElementById('status-health');

    const actionFeedBtn = document.getElementById('action-feed');
    const actionPlayBtn = document.getElementById('action-play');
    const actionSleepBtn = document.getElementById('action-sleep');
    const actionCleanBtn = document.getElementById('action-clean');

    const saveGameBtn = document.getElementById('save-game-btn');
    const loadGameBtn = document.getElementById('load-game-btn');
    const resetGameBtn = document.getElementById('reset-game-btn');

    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');
    const closeMessageBtn = document.getElementById('close-message-btn');

    // --- Configurações do Jogo ---
    const GAME_INTERVAL_MS = 1000;
    const AGE_INTERVAL_SECONDS = 10;
    const MAX_STAT = 100;
    const MIN_STAT = 0;
    const LOW_STAT_THRESHOLD = 30;

    // --- Definições do Pet (Evolução e Aparência) ---
    const PET_STAGES = [
        { name: 'Ovo', image: 'images/egg.png', minAge: 0, maxAge: 1 },
        { name: 'Bebê', image: 'images/baby.png', minAge: 1, maxAge: 5 },
        { name: 'Criança', image: 'images/child.png', minAge: 5, maxAge: 15 },
        { name: 'Adolescente', image: 'images/teen.png', minAge: 15, maxAge: 30 },
        { name: 'Adulto', image: 'images/adult.png', minAge: 30, maxAge: Infinity }
    ];

    // --- Definições dos Humores ---
    const MOOD_IMAGES = {
        dead: 'images/dead.png',
        sleeping: 'images/sleeping.png',
        sick: 'images/sick.png',
        veryHappy: 'images/very-happy.png',
        happy: 'images/happy.png',
        neutral: 'images/neutral.png',
        sad: 'images/sad.png',
        verySad: 'images/very-sad.png'
    };

    // --- Estado do Tamagotchi ---
    let tamagotchi = {
        name: 'Ovo',
        hunger: MAX_STAT,
        happiness: MAX_STAT,
        energy: MAX_STAT,
        cleanliness: MAX_STAT,
        health: MAX_STAT,
        ageDays: 0,
        lastUpdateTime: Date.now(),
        isSleeping: false,
        isSick: false,
        isAlive: true
    };

    let gameIntervalId = null;
    let ageCounter = 0;

    // --- Funções Auxiliares ---

    function showMessage(message) {
        messageText.textContent = message;
        messageBox.style.display = 'flex';
    }

    function hideMessage() {
        messageBox.style.display = 'none';
    }

    function updateDisplay() {
        petNameEl.textContent = tamagotchi.name;
        petImgEl.src = getPetImage();
        moodImageEl.src = getPetMoodImage();

        statusHungerEl.textContent = `${tamagotchi.hunger}%`;
        statusHappinessEl.textContent = `${tamagotchi.happiness}%`;
        statusEnergyEl.textContent = `${tamagotchi.energy}%`;
        statusCleanlinessEl.textContent = `${tamagotchi.cleanliness}%`;
        statusAgeEl.textContent = `${tamagotchi.ageDays} dias`;
        statusHealthEl.textContent = `${tamagotchi.health}%`;

        statusHungerEl.classList.toggle('low', tamagotchi.hunger < LOW_STAT_THRESHOLD);
        statusHappinessEl.classList.toggle('low', tamagotchi.happiness < LOW_STAT_THRESHOLD);
        statusEnergyEl.classList.toggle('low', tamagotchi.energy < LOW_STAT_THRESHOLD);
        statusCleanlinessEl.classList.toggle('low', tamagotchi.cleanliness < LOW_STAT_THRESHOLD);
        statusHealthEl.classList.toggle('low', tamagotchi.health < LOW_STAT_THRESHOLD);

        actionSleepBtn.disabled = tamagotchi.isSleeping;
        actionFeedBtn.disabled = !tamagotchi.isAlive || tamagotchi.isSleeping;
        actionPlayBtn.disabled = !tamagotchi.isAlive || tamagotchi.isSleeping;
        actionCleanBtn.disabled = !tamagotchi.isAlive || tamagotchi.isSleeping;
    }

    function getPetImage() {
        if (!tamagotchi.isAlive) return 'images/dead.png';
        if (tamagotchi.isSleeping) return 'images/sleeping.png';
        
        for (const stage of PET_STAGES) {
            if (tamagotchi.ageDays >= stage.minAge && tamagotchi.ageDays < stage.maxAge) {
                return stage.image;
            }
        }
        return PET_STAGES[0].image;
    }

    function getPetMoodImage() {
        if (!tamagotchi.isAlive) return MOOD_IMAGES.dead;
        if (tamagotchi.isSleeping) return MOOD_IMAGES.sleeping;
        if (tamagotchi.isSick) return MOOD_IMAGES.sick;

        const avgHappiness = (tamagotchi.hunger + tamagotchi.happiness + tamagotchi.energy + tamagotchi.cleanliness) / 4;

        if (avgHappiness > 80) return MOOD_IMAGES.veryHappy;
        if (avgHappiness > 60) return MOOD_IMAGES.happy;
        if (avgHappiness > 40) return MOOD_IMAGES.neutral;
        if (avgHappiness > 20) return MOOD_IMAGES.sad;
        return MOOD_IMAGES.verySad;
    }

    function clampStat(stat) {
        return Math.max(MIN_STAT, Math.min(MAX_STAT, stat));
    }

    function performAction(actionType) {
        if (!tamagotchi.isAlive) {
            showMessage('Seu Tamagotchi não está mais vivo.');
            return;
        }
        if (tamagotchi.isSleeping) {
            showMessage('Seu Tamagotchi está dormindo.');
            return;
        }

        switch (actionType) {
            case 'feed':
                if (tamagotchi.hunger === MAX_STAT) {
                    showMessage('Seu Tamagotchi não está com fome.');
                    return;
                }
                tamagotchi.hunger = clampStat(tamagotchi.hunger + 20);
                tamagotchi.happiness = clampStat(tamagotchi.happiness + 5);
                showMessage('Você alimentou seu Tamagotchi!');
                break;
            case 'play':
                if (tamagotchi.happiness === MAX_STAT) {
                    showMessage('Seu Tamagotchi já está muito feliz.');
                    return;
                }
                tamagotchi.happiness = clampStat(tamagotchi.happiness + 25);
                tamagotchi.energy = clampStat(tamagotchi.energy - 10);
                showMessage('Você brincou com seu Tamagotchi!');
                break;
            case 'sleep':
                if (tamagotchi.energy === MAX_STAT) {
                    showMessage('Seu Tamagotchi não está com sono.');
                    return;
                }
                tamagotchi.isSleeping = true;
                petImageEl.style.transform = 'scale(0.8)';
                showMessage('Seu Tamagotchi foi dormir.');
                break;
            case 'clean':
                if (tamagotchi.cleanliness === MAX_STAT) {
                    showMessage('Seu Tamagotchi já está limpo.');
                    return;
                }
                tamagotchi.cleanliness = MAX_STAT;
                tamagotchi.happiness = clampStat(tamagotchi.happiness + 10);
                showMessage('Você limpou seu Tamagotchi!');
                break;
        }
        updateDisplay();
        saveGame();
    }

    function gameLoop() {
        if (!tamagotchi.isAlive) {
            clearInterval(gameIntervalId);
            gameIntervalId = null;
            return;
        }

        ageCounter++;
        if (ageCounter >= AGE_INTERVAL_SECONDS) {
            tamagotchi.ageDays++;
            ageCounter = 0;
            const currentStage = PET_STAGES.find(stage => tamagotchi.ageDays >= stage.minAge && tamagotchi.ageDays < stage.maxAge);
            if (currentStage && tamagotchi.name !== currentStage.name) {
                tamagotchi.name = currentStage.name;
                showMessage(`Seu Tamagotchi evoluiu para a fase ${currentStage.name}!`);
            }
        }

        if (!tamagotchi.isSleeping) {
            tamagotchi.hunger = clampStat(tamagotchi.hunger - 2);
            tamagotchi.happiness = clampStat(tamagotchi.happiness - 1);
            tamagotchi.energy = clampStat(tamagotchi.energy - 1);
            tamagotchi.cleanliness = clampStat(tamagotchi.cleanliness - 0.5);
        } else {
            tamagotchi.energy = clampStat(tamagotchi.energy + 5);
            tamagotchi.happiness = clampStat(tamagotchi.happiness + 2);
            tamagotchi.health = clampStat(tamagotchi.health + 1);

            if (tamagotchi.energy >= MAX_STAT) {
                tamagotchi.isSleeping = false;
                petImageEl.style.transform = 'scale(1)';
                showMessage('Seu Tamagotchi acordou!');
            }
        }

        let healthPenalty = 0;
        if (tamagotchi.hunger < LOW_STAT_THRESHOLD) healthPenalty += 5;
        if (tamagotchi.happiness < LOW_STAT_THRESHOLD) healthPenalty += 3;
        if (tamagotchi.energy < LOW_STAT_THRESHOLD) healthPenalty += 2;
        if (tamagotchi.cleanliness < LOW_STAT_THRESHOLD) healthPenalty += 4;

        tamagotchi.health = clampStat(tamagotchi.health - healthPenalty);

        if (!tamagotchi.isSick && tamagotchi.health < LOW_STAT_THRESHOLD && Math.random() < 0.05) {
            tamagotchi.isSick = true;
            showMessage('Seu Tamagotchi ficou doente! Cuide bem dele.');
        } else if (tamagotchi.isSick && tamagotchi.health >= LOW_STAT_THRESHOLD + 20) {
            tamagotchi.isSick = false;
            showMessage('Seu Tamagotchi se recuperou da doença!');
        }

        if (tamagotchi.health <= MIN_STAT) {
            tamagotchi.isAlive = false;
            showMessage('Seu Tamagotchi faleceu... 😢');
            clearInterval(gameIntervalId);
            gameIntervalId = null;
            updateDisplay();
            saveGame();
            return;
        }

        updateDisplay();
        saveGame();
    }

    function saveGame() {
        localStorage.setItem('tamagotchiSave', JSON.stringify(tamagotchi));
    }

    function loadGame() {
        const savedState = localStorage.getItem('tamagotchiSave');
        if (savedState) {
            const loadedTamagotchi = JSON.parse(savedState);
            Object.assign(tamagotchi, loadedTamagotchi);
            tamagotchi.lastUpdateTime = Date.now();

            if (tamagotchi.isSleeping) {
                petImageEl.style.transform = 'scale(0.8)';
            } else {
                petImageEl.style.transform = 'scale(1)';
            }

            showMessage('Jogo carregado com sucesso!');
            updateDisplay();
            startGameLoop();
        } else {
            showMessage('Nenhum jogo salvo encontrado.');
        }
    }

    function resetGame() {
        if (confirm('Tem certeza que deseja reiniciar o jogo? Todo o progresso será perdido!')) {
            clearInterval(gameIntervalId);
            gameIntervalId = null;
            tamagotchi = {
                name: 'Ovo',
                hunger: MAX_STAT,
                happiness: MAX_STAT,
                energy: MAX_STAT,
                cleanliness: MAX_STAT,
                health: MAX_STAT,
                ageDays: 0,
                lastUpdateTime: Date.now(),
                isSleeping: false,
                isSick: false,
                isAlive: true
            };
            ageCounter = 0;
            localStorage.removeItem('tamagotchiSave');
            petImageEl.style.transform = 'scale(1)';
            showMessage('Jogo reiniciado!');
            updateDisplay();
            startGameLoop();
        }
    }

    function startGameLoop() {
        if (gameIntervalId) {
            clearInterval(gameIntervalId);
        }
        gameIntervalId = setInterval(gameLoop, GAME_INTERVAL_MS);
    }

    // --- Event Listeners ---
    actionFeedBtn.addEventListener('click', () => performAction('feed'));
    actionPlayBtn.addEventListener('click', () => performAction('play'));
    actionSleepBtn.addEventListener('click', () => performAction('sleep'));
    actionCleanBtn.addEventListener('click', () => performAction('clean'));

    saveGameBtn.addEventListener('click', saveGame);
    loadGameBtn.addEventListener('click', loadGame);
    resetGameBtn.addEventListener('click', resetGame);

    closeMessageBtn.addEventListener('click', hideMessage);
    messageBox.addEventListener('click', (e) => {
        if (e.target === messageBox) {
            hideMessage();
        }
    });

    // --- Inicialização ---
    loadGame();
    if (!gameIntervalId) {
        updateDisplay();
        startGameLoop();
    }
});