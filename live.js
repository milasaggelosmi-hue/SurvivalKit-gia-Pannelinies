// Live Multiplayer Client System for Panhellenic
let isLiveMode = false;
let livePlayerName = "";
let liveGameRef = null;
let currentLiveQuestionIndex = -1;
let liveTimer = null;
let liveTimeLeft = 30;

document.addEventListener('DOMContentLoaded', () => {
    const btnJoinLive = document.getElementById('btn-join-live');
    const liveStatusMsg = document.getElementById('live-status-msg');
    const liveNameInput = document.getElementById('live-player-name');

    if (btnJoinLive) {
        btnJoinLive.addEventListener('click', () => {
            livePlayerName = liveNameInput.value.trim();
            if(!livePlayerName) return alert("Βάλε το όνομά σου!");
            
            liveStatusMsg.textContent = "Αναμονή για τον Καθηγητή...";
            btnJoinLive.disabled = true;
            
            if (typeof db !== 'undefined') {
                isLiveMode = true;
                liveGameRef = db.ref('liveGamePanhellenic');
                
                // Add to lobby
                db.ref(`liveGamePanhellenic/players/${livePlayerName}`).set({ score: 0 });
                
                // Listen to Host State
                liveGameRef.on('value', (snapshot) => {
                    const data = snapshot.val();
                    if(!data) return;

                    // Use the els object from app.js if possible, or direct access
                    const quizScreen = document.getElementById('quiz-screen');
                    const loginScreen = document.getElementById('multiplayer-login-screen');
                    const questionText = document.getElementById('question-text');
                    const optionsContainer = document.getElementById('options-container');

                    if(data.state === 'waiting') {
                        liveStatusMsg.textContent = "Το παιχνίδι ετοιμάζεται. Ετοιμάσου!";
                        loginScreen.classList.add('hidden');
                        loginScreen.classList.remove('active');
                        
                        quizScreen.classList.remove('hidden');
                        quizScreen.classList.add('active');
                        questionText.textContent = "Αναμονή για την επόμενη ερώτηση από τον Καθηγητή...";
                        optionsContainer.innerHTML = "";
                    }
                    
                    if(data.state === 'playing' && data.questionIndex !== currentLiveQuestionIndex) {
                        currentLiveQuestionIndex = data.questionIndex;
                        const q = data.currentQuestionData;
                        
                        // Render question
                        questionText.textContent = q.question;
                        optionsContainer.innerHTML = '';
                        q.options.forEach((opt, idx) => {
                            const btn = document.createElement('button');
                            btn.className = 'option-btn';
                            btn.innerHTML = `<span class="opt-letter">${String.fromCharCode(65 + idx)}:</span> ${opt}`;
                            btn.onclick = () => submitLiveAnswer(idx, q.correct);
                            optionsContainer.appendChild(btn);
                        });
                        
                        liveTimeLeft = 30;
                        clearInterval(liveTimer);
                        liveTimer = setInterval(() => {
                            liveTimeLeft--;
                            if(typeof SoundFX !== 'undefined' && liveTimeLeft <= 10 && liveTimeLeft > 0) SoundFX.tick();
                            if(liveTimeLeft <= 0) {
                                clearInterval(liveTimer);
                                submitLiveAnswer(-1, q.correct);
                            }
                        }, 1000);
                    }
                    
                    if(data.state === 'reveal') {
                        clearInterval(liveTimer);
                        const buttons = optionsContainer.querySelectorAll('button');
                        buttons.forEach(b => b.disabled = true);
                        if(buttons[data.currentQuestionData.correct]) {
                            buttons[data.currentQuestionData.correct].classList.add('correct');
                        }
                    }
                });
            } else {
                liveStatusMsg.textContent = "Η βάση δεδομένων (Firebase) δεν βρέθηκε.";
            }
        });
    }
});

function submitLiveAnswer(selectedIndex, correctIndex) {
    clearInterval(liveTimer);
    const optionsContainer = document.getElementById('options-container');
    const questionText = document.getElementById('question-text');
    const buttons = optionsContainer.querySelectorAll('button');
    
    buttons.forEach(b => b.disabled = true);
    
    if(selectedIndex !== -1) {
        buttons[selectedIndex].classList.add('selected');
    }
    
    let pointsEarned = 0;
    if(selectedIndex === correctIndex) {
        pointsEarned = liveTimeLeft * 10;
        if(typeof SoundFX !== 'undefined') SoundFX.correct();
    } else {
        if(typeof SoundFX !== 'undefined') SoundFX.wrong();
    }
    
    questionText.textContent = "Αναμονή για τους άλλους...";
    
    if (typeof db !== 'undefined') {
        db.ref(`liveGamePanhellenic/players/${livePlayerName}/score`).transaction(currentScore => {
            return (currentScore || 0) + pointsEarned;
        });
    }
}
