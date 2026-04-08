// App State
let appState = {
    grade: 'C',
    subject: null,
    difficulty: null,
    gameMode: 'classic', // 'classic' or 'millionaire'
    timePerQuestion: 30,
    questions: [],
    currentIndex: 0,
    score: 0,
    correctCount: 0,
    wrongCount: 0,
    timer: null,
    timeLeft: 30,
    jokers: { fiftyFifty: false, audience: false },
    currentPrize: 0,
    safePrize: 0,
    prizeLadder: [100, 200, 1000, 5000, 10000, 20000, 50000, 100000, 500000, 1000000],
    safeIndices: [2, 7]
};

// UI Elements
const els = {
    screens: {
        mode: document.getElementById('mode-selection'),
        selection: document.getElementById('selection-screen'),
        difficulty: document.getElementById('difficulty-selection'),
        historySections: document.getElementById('history-sections'),
        quiz: document.getElementById('quiz-screen'),
        results: document.getElementById('results-screen'),
        multiplayer: document.getElementById('multiplayer-login-screen')
    },
    modeButtons: document.querySelectorAll('.mode-btn'),
    subjectButtons: document.querySelectorAll('.subject-btn:not(.mode-btn)'),
    sectionButtons: document.querySelectorAll('.section-btn'),
    diffButtons: document.querySelectorAll('.diff-btn'),
    quiz: {
        currentQ: document.getElementById('current-q'),
        totalQ: document.getElementById('total-q'),
        progressBar: document.getElementById('progress'),
        questionText: document.getElementById('question-text'),
        optionsContainer: document.getElementById('options-container'),
        feedback: document.getElementById('feedback-container'),
        feedbackTitle: document.getElementById('feedback-title'),
        excerpt: document.getElementById('textbook-excerpt'),
        excerptText: document.getElementById('excerpt-text'),
        nextBtn: document.getElementById('next-btn'),
        collectBtn: document.getElementById('stop-collect-btn'),
        classicJokers: document.getElementById('classic-jokers'),
        millionaireJokers: document.getElementById('millionaire-jokers'),
        prizeHeader: document.getElementById('millionaire-prize-header'),
        ladder: document.getElementById('money-ladder')
    },
    results: {
        scoreCircle: document.querySelector('.score-circle'),
        finalScore: document.getElementById('final-score'),
        scoreMessage: document.getElementById('score-message'),
        correctCount: document.getElementById('correct-count'),
        wrongCount: document.getElementById('wrong-count'),
        playerName: document.getElementById('player-name'),
        saveBtn: document.getElementById('save-score-btn'),
        saveMsg: document.getElementById('save-msg'),
        restartBtn: document.getElementById('restart-btn')
    },
    modals: {
        audience: document.getElementById('audience-modal'),
        audienceBars: document.getElementById('audience-bars'),
        closeAudience: document.getElementById('close-audience-btn')
    },
    feedback: {
        actions: document.getElementById('feedback-actions'),
        excerptBtn: document.getElementById('show-excerpt-btn'),
        videoBtn: document.getElementById('show-video-btn'),
        videoContainer: document.getElementById('video-container'),
        ytPlayer: document.getElementById('yt-player')
    }
};

// Screen Management
function switchScreen(screenId) {
    Object.values(els.screens).forEach(screen => {
        if(screen) {
            screen.classList.remove('active');
            screen.classList.add('hidden');
        }
    });
    const target = els.screens[screenId];
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }
}

// Initialization
function init() {
    // Mode Selection
    els.modeButtons.forEach(btn => {
        btn.onclick = () => {
            appState.gameMode = btn.dataset.mode;
            document.body.className = appState.gameMode === 'millionaire' ? 'millionaire-theme' : '';
            switchScreen('selection');
        };
    });

    // Subject Selection
    els.subjectButtons.forEach(btn => {
        btn.onclick = () => {
            const subject = btn.dataset.subject;
            appState.subject = subject;
            
            if (subject === 'history') {
                switchScreen('historySections');
            } else {
                const titleEl = document.getElementById('diff-subject-title');
                if (titleEl) titleEl.textContent = btn.querySelector('.text').textContent;
                
                // Millionaire mode skips manual difficulty selection
                if (appState.gameMode === 'millionaire') {
                    startQuiz();
                } else {
                    const backToSec = document.getElementById('back-to-sections');
                    const backToSub = document.getElementById('back-to-subjects');
                    if (backToSec) backToSec.classList.add('hidden');
                    if (backToSub) backToSub.classList.remove('hidden');
                    switchScreen('difficulty');
                }
            }
        };
    });

    // History Section Selection
    els.sectionButtons.forEach(btn => {
        btn.onclick = () => {
            const section = btn.dataset.section;
            appState.selectedSection = section;
            
            if (appState.gameMode === 'millionaire') {
                startQuiz();
            } else {
                const titleEl = document.getElementById('diff-subject-title');
                if (titleEl) titleEl.textContent = btn.textContent;
                switchScreen('difficulty');
            }
        };
    });

    // Difficulty Selection (Classic Mode only)
    els.diffButtons.forEach(btn => {
        btn.onclick = () => {
            appState.difficulty = btn.dataset.diff;
            if (appState.difficulty === 'easy') appState.timePerQuestion = 60;
            else if (appState.difficulty === 'medium') appState.timePerQuestion = 30;
            else appState.timePerQuestion = 15;
            startQuiz();
        };
    });

    // Jokers (Merged logic)
    const handleJoker50 = () => {
        if (appState.jokers.fiftyFifty) return;
        appState.jokers.fiftyFifty = true;
        document.getElementById('joker-50').disabled = true;
        document.getElementById('classic-joker-50').disabled = true;
        
        const q = appState.questions[appState.currentIndex];
        const buttons = Array.from(els.quiz.optionsContainer.children);
        let incorrectIndices = [];
        buttons.forEach((btn, idx) => {
            const optIdx = parseInt(btn.dataset.index);
            if (optIdx !== q.answer) incorrectIndices.push(idx);
        });
        
        incorrectIndices.sort(() => Math.random() - 0.5);
        incorrectIndices.slice(0, 2).forEach(idx => {
            buttons[idx].style.visibility = 'hidden';
            buttons[idx].disabled = true;
        });
        if (typeof SoundFX !== 'undefined') SoundFX.joker();
    };

    const handleJokerAudience = () => {
        if (appState.jokers.audience) return;
        appState.jokers.audience = true;
        document.getElementById('joker-audience').disabled = true;
        document.getElementById('classic-joker-audience').disabled = true;
        
        const q = appState.questions[appState.currentIndex];
        let stats = [0, 0, 0, 0];
        let boost = appState.difficulty === 'hard' ? 45 : 70;
        stats[q.answer] = boost;
        let remaining = 100 - boost;
        
        for (let i = 0; i < 4; i++) {
            if (i === q.answer) continue;
            let val = Math.floor(Math.random() * (remaining / 2));
            stats[i] = val;
            remaining -= val;
        }
        stats[3] += remaining;

        els.modals.audienceBars.innerHTML = '';
        ['A', 'B', 'C', 'D'].forEach((label, i) => {
            if(i >= q.options.length) return;
            const bar = document.createElement('div');
            bar.className = 'audience-bar-container';
            bar.innerHTML = `
                <div style="font-size:0.8rem; margin-bottom:5px;">${stats[i]}%</div>
                <div class="audience-bar-fill" style="height: ${stats[i]}%; background: #184cc8;"></div>
                <div class="audience-bar-label" style="margin-top: 5px;">${label}</div>
            `;
            els.modals.audienceBars.appendChild(bar);
        });
        els.modals.audience.style.display = 'flex';
        if (typeof SoundFX !== 'undefined') SoundFX.joker();
    };

    document.getElementById('joker-50').onclick = handleJoker50;
    document.getElementById('classic-joker-50').onclick = handleJoker50;
    document.getElementById('joker-audience').onclick = handleJokerAudience;
    document.getElementById('classic-joker-audience').onclick = handleJokerAudience;
    els.modals.closeAudience.onclick = () => els.modals.audience.style.display = 'none';

    // Collect Prize
    els.quiz.collectBtn.onclick = () => {
        if (confirm(`Θέλεις να σταματήσεις εδώ και να πάρεις ${appState.currentPrize}€;`)) {
            finishQuiz();
        }
    };

    // Feedback Actions
    els.feedback.excerptBtn.onclick = () => {
        els.quiz.excerpt.classList.remove('hidden');
        els.feedback.videoContainer.classList.add('hidden');
    };
    els.feedback.videoBtn.onclick = () => {
        const q = appState.questions[appState.currentIndex];
        if (q.videoId) {
            els.feedback.ytPlayer.src = `https://www.youtube.com/embed/${q.videoId}?start=${q.videoTime || 0}&autoplay=1`;
            els.feedback.videoContainer.classList.remove('hidden');
            els.quiz.excerpt.classList.add('hidden');
        }
    };

    // Next Button
    els.quiz.nextBtn.onclick = () => {
        appState.currentIndex++;
        if (appState.currentIndex < appState.questions.length) {
            renderQuestion();
        } else {
            if (appState.gameMode === 'millionaire' && appState.currentIndex === 10) {
                appState.currentPrize = appState.prizeLadder[9];
            }
            finishQuiz();
        }
    };

    // Restart & Navigation
    els.results.restartBtn.onclick = () => switchScreen('mode');
    document.getElementById('back-to-subjects').onclick = () => switchScreen('selection');
    document.getElementById('back-from-sections').onclick = () => switchScreen('selection');
    document.getElementById('back-to-sections').onclick = () => switchScreen('historySections');

    // Save Score
    els.results.saveBtn.onclick = () => {
        const name = els.results.playerName.value.trim();
        if(!name) return alert("Βάλε το όνομά σου!");
        if (typeof db !== 'undefined') {
            const scoreVal = appState.gameMode === 'millionaire' ? appState.currentPrize : Math.round(appState.score);
            db.ref(`leaderboards_panhellenic/${appState.subject}`).push({
                name: name,
                score: scoreVal,
                mode: appState.gameMode,
                timestamp: Date.now()
            }).then(() => {
                els.results.saveBtn.disabled = true;
                els.results.saveMsg.classList.remove('hidden');
            });
        }
    };
}

function startQuiz() {
    let rawQuestions = [];
    const gradeData = quizData[appState.grade] || quizData['C'];
    const subjectData = gradeData[appState.subject];
    
    if (appState.subject === 'history' && subjectData.sections) {
        if (appState.selectedSection === 'all') {
            for (let sec in subjectData.sections) rawQuestions = rawQuestions.concat(subjectData.sections[sec].questions);
        } else {
            rawQuestions = subjectData.sections[appState.selectedSection].questions;
        }
    } else {
        rawQuestions = subjectData.questions || [];
    }

    if (appState.gameMode === 'millionaire') {
        const easy = rawQuestions.filter(q => q.difficulty === 'easy').sort(() => 0.5 - Math.random());
        const med = rawQuestions.filter(q => q.difficulty === 'medium').sort(() => 0.5 - Math.random());
        const hard = rawQuestions.filter(q => q.difficulty === 'hard').sort(() => 0.5 - Math.random());
        appState.questions = [...easy.slice(0, 3), ...med.slice(0, 4), ...hard.slice(0, 3)];
        if(appState.questions.length < 10) appState.questions = rawQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);
    } else {
        appState.questions = rawQuestions
            .filter(q => !appState.difficulty || q.difficulty === appState.difficulty)
            .sort(() => 0.5 - Math.random())
            .slice(0, 10);
    }

    appState.currentIndex = 0;
    appState.score = 0;
    appState.correctCount = 0;
    appState.wrongCount = 0;
    appState.currentPrize = 0;
    appState.safePrize = 0;
    appState.jokers = { fiftyFifty: false, audience: false };
    
    // UI Setup for Mode
    if (appState.gameMode === 'millionaire') {
        els.quiz.millionaireJokers.classList.remove('hidden');
        els.quiz.classicJokers.classList.add('hidden');
        els.quiz.prizeHeader.classList.remove('hidden');
        els.quiz.ladder.classList.remove('hidden');
        renderLadder();
    } else {
        els.quiz.millionaireJokers.classList.add('hidden');
        els.quiz.classicJokers.classList.remove('hidden');
        els.quiz.prizeHeader.classList.add('hidden');
        els.quiz.ladder.classList.add('hidden');
    }

    document.getElementById('joker-50').disabled = false;
    document.getElementById('joker-audience').disabled = false;
    document.getElementById('classic-joker-50').disabled = false;
    document.getElementById('classic-joker-audience').disabled = false;

    switchScreen('quiz');
    renderQuestion();
}

function renderLadder() {
    els.quiz.ladder.innerHTML = '';
    [...appState.prizeLadder].reverse().forEach((amount, i) => {
        const actualIdx = 9 - i;
        const div = document.createElement('div');
        div.className = 'ladder-item';
        if (appState.safeIndices.includes(actualIdx)) div.dataset.safe = "true";
        div.dataset.index = actualIdx;
        div.textContent = `${actualIdx + 1}: ${amount}€`;
        els.quiz.ladder.appendChild(div);
    });
}

function renderQuestion() {
    clearInterval(appState.timer);
    appState.timeLeft = appState.timePerQuestion;
    const q = appState.questions[appState.currentIndex];

    els.quiz.currentQ.textContent = appState.currentIndex + 1;
    els.quiz.totalQ.textContent = appState.questions.length;
    els.quiz.progressBar.style.width = `${(appState.currentIndex / appState.questions.length) * 100}%`;
    els.quiz.questionText.textContent = q.question;
    els.quiz.optionsContainer.innerHTML = '';
    els.quiz.feedback.classList.add('hidden');
    els.quiz.nextBtn.classList.add('hidden');
    els.quiz.collectBtn.classList.add('hidden');

    if (appState.gameMode === 'millionaire') {
        const ladderItems = els.quiz.ladder.querySelectorAll('.ladder-item');
        ladderItems.forEach(item => {
            item.classList.remove('active');
            if (parseInt(item.dataset.index) === appState.currentIndex) item.classList.add('active');
        });
        if (appState.currentIndex > 0) els.quiz.collectBtn.classList.remove('hidden');
    }

    q.options.forEach((opt, idx) => {
        if (opt === '-') return;
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.dataset.index = idx;
        btn.innerHTML = `<span class="opt-letter">${String.fromCharCode(65 + idx)}:</span> ${opt}`;
        btn.onclick = () => checkAnswer(idx, btn);
        els.quiz.optionsContainer.appendChild(btn);
    });

    startTimer();
}

function startTimer() {
    appState.timer = setInterval(() => {
        appState.timeLeft--;
        if (appState.timeLeft <= 0) { clearInterval(appState.timer); checkAnswer(-1); }
    }, 1000);
}

function checkAnswer(idx, btn) {
    clearInterval(appState.timer);
    const q = appState.questions[appState.currentIndex];
    const buttons = Array.from(els.quiz.optionsContainer.children);
    buttons.forEach(b => b.disabled = true);

    const isCorrect = idx === q.answer;
    if (isCorrect) {
        if (btn) btn.classList.add('correct');
        appState.correctCount++;
        appState.score += (100 / appState.questions.length);
        if (appState.gameMode === 'millionaire') {
            appState.currentPrize = appState.prizeLadder[appState.currentIndex];
            if (appState.safeIndices.includes(appState.currentIndex)) appState.safePrize = appState.currentPrize;
            els.quiz.prizeHeader.textContent = `${appState.currentPrize}€`;
        }
        els.quiz.feedbackTitle.textContent = isCorrect ? '✅ Σωστή Απάντηση!' : '❌ Λάθος!';
    } else {
        if (btn) btn.classList.add('wrong');
        const correctBtn = buttons.find(b => parseInt(b.dataset.index) === q.answer);
        if (correctBtn) correctBtn.classList.add('correct');
        appState.wrongCount++;
        if (appState.gameMode === 'millionaire') {
            appState.currentPrize = appState.safePrize;
            appState.currentIndex = 11; // Force end
        }
    }

    if (q.excerpt) els.quiz.excerptText.textContent = q.excerpt;
    els.feedback.actions.style.display = (q.excerpt || q.videoId) ? 'flex' : 'none';
    els.quiz.feedback.classList.remove('hidden');
    els.quiz.nextBtn.classList.remove('hidden');
    els.quiz.collectBtn.classList.add('hidden');
}

function finishQuiz() {
    switchScreen('results');
    if (appState.gameMode === 'millionaire') {
        els.results.scoreCircle.innerHTML = `<span style="font-size:1.5rem">${appState.currentPrize}€</span>`;
    } else {
        els.results.scoreCircle.innerHTML = `<span id="final-score">${Math.round(appState.score)}</span>%`;
    }
    els.results.correctCount.textContent = appState.correctCount;
    els.results.wrongCount.textContent = appState.wrongCount;
}

window.onload = init;
