document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const petMoodEl = document.getElementById('pet-mood');
    const petImageEl = document.getElementById('pet-image');
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
    const GAME_INTERVAL_MS = 1000; // Intervalo do loop do jogo em milissegundos (1 segundo)
    const AGE_INTERVAL_SECONDS = 10; // A cada 10 segundos, a idade do pet aumenta em 1 dia (para simulação rápida)
    const MAX_STAT = 100; // Valor máximo para todas as estatísticas
    const MIN_STAT = 0; // Valor mínimo para todas as estatísticas
    const LOW_STAT_THRESHOLD = 30; // Limite para considerar uma estatística "baixa"

    // --- Definições do Pet (Evolução e Aparência) ---
    const PET_STAGES = [
        { name: 'Ovo', emoji: '🥚', minAge: 0, maxAge: 1 },
        { name: 'Bebê', emoji: '🐣', minAge: 1, maxAge: 5 },
        { name: 'Criança', emoji: '🐥', minAge: 5, maxAge: 15 },
        { name: 'Adolescente', emoji: '🐤', minAge: 15, maxAge: 30 },
        { name: 'Adulto', emoji: '🐔', minAge: 30, maxAge: Infinity }
    ];

    // --- Estado do Tamagotchi ---
    let tamagotchi = {
        name: 'Ovo',
        hunger: MAX_STAT,
        happiness: MAX_STAT,
        energy: MAX_STAT,
        cleanliness: MAX_STAT,
        health: MAX_STAT,
        ageDays: 0, // Idade em dias do jogo
        lastUpdateTime: Date.now(), // Para calcular o tempo offline
        isSleeping: false,
        isSick: false,
        isAlive: true
    };

    let gameIntervalId = null; // Para controlar o loop do jogo
    let ageCounter = 0; // Contador para o aumento da idade

    // --- Funções Auxiliares ---

    /**
     * Exibe uma caixa de mensagem modal.
     * @param {string} message - A mensagem a ser exibida.
     */
    function showMessage(message) {
        messageText.textContent = message;
        messageBox.style.display = 'flex';
    }

    /**
     * Oculta a caixa de mensagem modal.
     */
    function hideMessage() {
        messageBox.style.display = 'none';
    }

    /**
     * Atualiza o display das estatísticas do Tamagotchi na UI.
     */
    function updateDisplay() {
        petNameEl.textContent = tamagotchi.name;
        petImageEl.textContent = getPetEmoji();
        petMoodEl.textContent = getPetMoodEmoji();

        statusHungerEl.textContent = `${tamagotchi.hunger}%`;
        statusHappinessEl.textContent = `${tamagotchi.happiness}%`;
        statusEnergyEl.textContent = `${tamagotchi.energy}%`;
        statusCleanlinessEl.textContent = `${tamagotchi.cleanliness}%`;
        statusAgeEl.textContent = `${tamagotchi.ageDays} dias`;
        statusHealthEl.textContent = `${tamagotchi.health}%`;

        // Adiciona/remove classe 'low' para estatísticas baixas
        statusHungerEl.classList.toggle('low', tamagotchi.hunger < LOW_STAT_THRESHOLD);
        statusHappinessEl.classList.toggle('low', tamagotchi.happiness < LOW_STAT_THRESHOLD);
        statusEnergyEl.classList.toggle('low', tamagotchi.energy < LOW_STAT_THRESHOLD);
        statusCleanlinessEl.classList.toggle('low', tamagotchi.cleanliness < LOW_STAT_THRESHOLD);
        statusHealthEl.classList.toggle('low', tamagotchi.health < LOW_STAT_THRESHOLD);

        // Atualiza o estado dos botões de ação
        actionSleepBtn.disabled = tamagotchi.isSleeping;
        actionFeedBtn.disabled = !tamagotchi.isAlive || tamagotchi.isSleeping;
        actionPlayBtn.disabled = !tamagotchi.isAlive || tamagotchi.isSleeping;
        actionCleanBtn.disabled = !tamagotchi.isAlive || tamagotchi.isSleeping;
    }

    /**
     * Retorna o emoji da imagem do pet com base na idade.
     */
    function getPetEmoji() {
        if (!tamagotchi.isAlive) return '👻'; // Fantasma se estiver morto
        if (tamagotchi.isSleeping) return '😴'; // Zzz se estiver dormindo
        
        for (const stage of PET_STAGES) {
            if (tamagotchi.ageDays >= stage.minAge && tamagotchi.ageDays < stage.maxAge) {
                return stage.emoji;
            }
        }
        return PET_STAGES[0].emoji; // Fallback para ovo
    }

    /**
     * Retorna o emoji do humor do pet com base nas estatísticas.
     */
    function getPetMoodEmoji() {
        if (!tamagotchi.isAlive) return '💀';
        if (tamagotchi.isSleeping) return '💤';
        if (tamagotchi.isSick) return '🤢';

        const avgHappiness = (tamagotchi.hunger + tamagotchi.happiness + tamagotchi.energy + tamagotchi.cleanliness) / 4;

        if (avgHappiness > 80) return '🤩';
        if (avgHappiness > 60) return '😊';
        if (avgHappiness > 40) return '😐';
        if (avgHappiness > 20) return '😟';
        return '😭';
    }

    /**
     * Garante que uma estatística esteja dentro dos limites MIN_STAT e MAX_STAT.
     * @param {number} stat - O valor da estatística.
     * @returns {number} O valor da estatística ajustado.
     */
    function clampStat(stat) {
        return Math.max(MIN_STAT, Math.min(MAX_STAT, stat));
    }

    /**
     * Aplica os efeitos de uma ação nas estatísticas do Tamagotchi.
     * @param {string} actionType - O tipo de ação (e.g., 'feed').
     */
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
                tamagotchi.energy = clampStat(tamagotchi.energy - 10); // Brincar gasta energia
                showMessage('Você brincou com seu Tamagotchi!');
                break;
            case 'sleep':
                if (tamagotchi.energy === MAX_STAT) {
                    showMessage('Seu Tamagotchi não está com sono.');
                    return;
                }
                tamagotchi.isSleeping = true;
                petImageEl.style.transform = 'scale(0.8)'; // Visual cue for sleeping
                showMessage('Seu Tamagotchi foi dormir.');
                // O Tamagotchi acordará automaticamente no gameLoop
                break;
            case 'clean':
                if (tamagotchi.cleanliness === MAX_STAT) {
                    showMessage('Seu Tamagotchi já está limpo.');
                    return;
                }
                tamagotchi.cleanliness = MAX_STAT; // Limpeza total
                tamagotchi.happiness = clampStat(tamagotchi.happiness + 10);
                showMessage('Você limpou seu Tamagotchi!');
                break;
        }
        updateDisplay();
        saveGame(); // Salva o jogo após cada ação
    }

    /**
     * Lógica principal do jogo, executada a cada intervalo.
     */
    function gameLoop() {
        if (!tamagotchi.isAlive) {
            clearInterval(gameIntervalId);
            gameIntervalId = null;
            return;
        }

        // Aumenta a idade do pet
        ageCounter++;
        if (ageCounter >= AGE_INTERVAL_SECONDS) {
            tamagotchi.ageDays++;
            ageCounter = 0;
            // Verifica evolução
            const currentStage = PET_STAGES.find(stage => tamagotchi.ageDays >= stage.minAge && tamagotchi.ageDays < stage.maxAge);
            if (currentStage && tamagotchi.name !== currentStage.name) {
                tamagotchi.name = currentStage.name;
                showMessage(`Seu Tamagotchi evoluiu para a fase ${currentStage.name}!`);
            }
        }

        // Decaimento das estatísticas (se não estiver dormindo)
        if (!tamagotchi.isSleeping) {
            tamagotchi.hunger = clampStat(tamagotchi.hunger - 2); // Fica com fome
            tamagotchi.happiness = clampStat(tamagotchi.happiness - 1); // Fica menos feliz
            tamagotchi.energy = clampStat(tamagotchi.energy - 1); // Gasta energia
            tamagotchi.cleanliness = clampStat(tamagotchi.cleanliness - 0.5); // Fica sujo
        } else {
            // Recupera energia e um pouco de saúde/felicidade enquanto dorme
            tamagotchi.energy = clampStat(tamagotchi.energy + 5);
            tamagotchi.happiness = clampStat(tamagotchi.happiness + 2);
            tamagotchi.health = clampStat(tamagotchi.health + 1);

            // Acorda quando a energia estiver alta
            if (tamagotchi.energy >= MAX_STAT) {
                tamagotchi.isSleeping = false;
                petImageEl.style.transform = 'scale(1)'; // Volta ao tamanho normal
                showMessage('Seu Tamagotchi acordou!');
            }
        }

        // Lógica de saúde
        let healthPenalty = 0;
        if (tamagotchi.hunger < LOW_STAT_THRESHOLD) healthPenalty += 5;
        if (tamagotchi.happiness < LOW_STAT_THRESHOLD) healthPenalty += 3;
        if (tamagotchi.energy < LOW_STAT_THRESHOLD) healthPenalty += 2;
        if (tamagotchi.cleanliness < LOW_STAT_THRESHOLD) healthPenalty += 4;

        tamagotchi.health = clampStat(tamagotchi.health - healthPenalty);

        // Evento de doença (aleatório, se a saúde estiver baixa)
        if (!tamagotchi.isSick && tamagotchi.health < LOW_STAT_THRESHOLD && Math.random() < 0.05) {
            tamagotchi.isSick = true;
            showMessage('Seu Tamagotchi ficou doente! Cuide bem dele.');
        } else if (tamagotchi.isSick && tamagotchi.health >= LOW_STAT_THRESHOLD + 20) {
            // Cura se a saúde melhorar
            tamagotchi.isSick = false;
            showMessage('Seu Tamagotchi se recuperou da doença!');
        }

        // Morte do Tamagotchi
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
        saveGame(); // Salva o jogo a cada loop
    }

    // --- Save/Load/Reset Game ---

    /**
     * Salva o estado atual do jogo no localStorage.
     */
    function saveGame() {
        localStorage.setItem('tamagotchiSave', JSON.stringify(tamagotchi));
    }

    /**
     * Carrega o estado do jogo do localStorage.
     */
    function loadGame() {
        const savedState = localStorage.getItem('tamagotchiSave');
        if (savedState) {
            const loadedTamagotchi = JSON.parse(savedState);
            // Copia as propriedades para o objeto tamagotchi atual
            Object.assign(tamagotchi, loadedTamagotchi);
            
            // Ajusta lastUpdateTime para o tempo atual se o jogo foi carregado de um save antigo
            // Isso evita que o pet "morra" instantaneamente se o save for muito antigo
            tamagotchi.lastUpdateTime = Date.now(); 

            // Se o pet estava dormindo no save, ajusta a UI
            if (tamagotchi.isSleeping) {
                petImageEl.style.transform = 'scale(0.8)';
            } else {
                petImageEl.style.transform = 'scale(1)';
            }

            showMessage('Jogo carregado com sucesso!');
            updateDisplay();
            startGameLoop(); // Reinicia o loop do jogo
        } else {
            showMessage('Nenhum jogo salvo encontrado.');
        }
    }

    /**
     * Reinicia o jogo para o estado inicial.
     */
    function resetGame() {
        if (confirm('Tem certeza que deseja reiniciar o jogo? Todo o progresso será perdido!')) {
            clearInterval(gameIntervalId); // Para o loop atual
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
            localStorage.removeItem('tamagotchiSave'); // Limpa o save
            petImageEl.style.transform = 'scale(1)'; // Garante que a imagem volte ao normal
            showMessage('Jogo reiniciado!');
            updateDisplay();
            startGameLoop(); // Inicia um novo loop
        }
    }

    /**
     * Inicia o loop principal do jogo.
     */
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
    // Tenta carregar um jogo salvo ou inicia um novo
    loadGame(); // Tenta carregar ao iniciar
    if (!gameIntervalId) { // Se não carregou um jogo (e, portanto, não iniciou o loop), inicia um novo
        updateDisplay(); // Atualiza o display com o estado inicial
        startGameLoop();
    }
});
