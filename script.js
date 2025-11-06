// Copyright 2025 Tim Schreyack
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var countdownInterval = null;
var countdown = 20;
var lastWinner = null;
var currentChances = 0;
var currentWinners = [];
var currentNames = [];
var currentServerGameId = null;
var triviaCooldown = false;

// Fetch trivia questions from backend
let QUESTIONS = [];
fetch('/api/questions')
    .then(response => response.json())
    .then(data => {
        QUESTIONS = data;
        // If you have a trivia initialization function, call it here
        if (typeof initTrivia === 'function') {
            initTrivia();
        }
    });
window.testFunction = function() {
    alert('Test function called!');
    console.log('Test function executed');
};

function updateWinnerDisplay(data) {
    const winners = data.winners || [];
    const selecting = data.selecting;
    const winnerDiv = document.getElementById('winner');
    if (selecting) {
        // Check if user should see trivia before starting countdown
        const userName = localStorage.getItem('userName');
        const enteredGameId = localStorage.getItem('raffleEnteredGameId');
        const shouldShowTrivia = userName && enteredGameId === currentServerGameId;
        
        if (!countdownInterval) {
            countdown = 20;
            if (shouldShowTrivia) {
                showTrivia();
            }
            countdownInterval = setInterval(() => {
                countdown--;
                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    countdownInterval = null;
                    if (shouldShowTrivia) {
                        hideTrivia();
                    }
                }
                updateWinnerDisplay({winners: [], selecting: true});
            }, 1000);
        }
        
        if (shouldShowTrivia) {
            winnerDiv.innerHTML = `Time Remaining: <span class="countdown-number">${countdown}</span> seconds`;
            winnerDiv.classList.add('countdown-active');
            winnerDiv.style.display = 'block';
        } else {
            winnerDiv.style.display = 'none';
        }
    } else {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            hideTrivia();
        }
        winnerDiv.classList.remove('countdown-active');
        winnerDiv.style.display = 'none';
    }
}

function updateChancesDisplay(chances) {
    const chancesValue = document.getElementById('chances-value');
    const chancesRow = chancesValue.closest('tr');
    chancesValue.textContent = chances;
    chancesRow.style.display = chances > 0 ? 'table-row' : 'none';
}

function updateTotalPlayersDisplay(totalPlayers) {
    const totalPlayersValue = document.getElementById('totalPlayers-value');
    const totalPlayersRow = totalPlayersValue.closest('tr');
    totalPlayersValue.textContent = totalPlayers;
    totalPlayersRow.style.display = totalPlayers > 0 ? 'table-row' : 'none';
}

function updateUserChancesDisplay(chances) {
    const userChancesValue = document.getElementById('userChances-value');
    const userChancesRow = userChancesValue.closest('tr');
    userChancesValue.textContent = chances;
    userChancesRow.style.display = chances > 0 ? 'table-row' : 'none';
}

function renderWinnersList(winners) {
    if (!Array.isArray(winners)) winners = [];
    const winnersUl = document.getElementById('winnersUl');
    winnersUl.innerHTML = '';
    winners.forEach((winner, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${winner}`;
        winnersUl.appendChild(li);
    });
}

function checkRaffleComplete(chances) {
    if (chances === 0 && currentWinners.length > 0) {
        // Hide form and show winners
        document.getElementById('nameForm').style.display = 'none';
        document.getElementById('winner').style.display = 'none';
        document.getElementById('chances').style.display = 'none';
        document.getElementById('spinner').style.display = 'none';
        document.getElementById('message').style.display = 'none';
        document.getElementById('winnersList').style.display = 'block';
    } else {
        // Show form only if not already entered for this game and chances > 0
        const enteredGameId = localStorage.getItem('raffleEnteredGameId');
        if (enteredGameId !== currentServerGameId && chances > 0) {
            document.getElementById('nameForm').style.display = 'block';
        }
        document.getElementById('winnersList').style.display = 'none';
    }
}

function submitName() {
    const name = document.getElementById('name').value.trim();
    if (name) {
        // Check if already entered for this game
        const enteredGameId = localStorage.getItem('raffleEnteredGameId');
        if (enteredGameId === currentServerGameId) {
            const messageDiv = document.getElementById('message');
            messageDiv.textContent = 'You have already entered the raffle!';
            messageDiv.style.color = '#2196F3';
            return;
        }

        fetch('/api/names', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => { throw err; });
            }
            return res.json();
        })
        .then(data => {
            if (data.success) {
                const messageDiv = document.getElementById('message');
                messageDiv.textContent = `Hello, ${name}! Your name has been submitted.`;
                messageDiv.style.color = 'green';
                document.getElementById('name').value = '';
                // Hide the form after successful entry
                document.getElementById('nameForm').style.display = 'none';
                // Update total players immediately
                updateTotalPlayersDisplay(data.names.length);
                // Mark as entered for this game
                localStorage.setItem('raffleEnteredGameId', currentServerGameId);
                localStorage.setItem('userName', name);
                // Fetch and display user chances
                fetch(`/api/user-chances?name=${encodeURIComponent(name)}`)
                    .then(res => res.json())
                    .then(data => updateUserChancesDisplay(data.chances))
                    .catch(err => console.error('Error fetching user chances:', err));
            }
        })
        .catch(err => {
            const messageDiv = document.getElementById('message');
            messageDiv.textContent = err.message || 'Failed to submit name.';
            messageDiv.style.color = 'red';
            console.error('Error:', err);
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initial game_id fetch
    fetch('/api/game-id')
        .then(res => res.json())
        .then(data => {
            currentServerGameId = data.game_id;
            // ... rest of your logic
        })
        .catch(err => console.error('Error fetching game ID:', err));

    // Initial winner display
    fetch('/api/winner')
        .then(res => res.json())
        .then(data => updateWinnerDisplay(data))
        .catch(err => console.error('Error:', err));

    // Initial chances display
    fetch('/api/chances')
        .then(res => res.json())
        .then(data => {
            currentChances = data.chances;
            updateChancesDisplay(data.chances);
            checkRaffleComplete(data.chances);
        })
        .catch(err => console.error('Error:', err));

    // Initial winners list
    fetch('/api/winners')
        .then(res => res.json())
        .then(data => {
            currentWinners = data.winners;
            renderWinnersList(data.winners);
        })
        .catch(err => console.error('Error:', err));

    // Initial names list for total players
    fetch('/api/names')
        .then(res => res.json())
        .then(data => {
            currentNames = data;
            updateTotalPlayersDisplay(data.length);
        })
        .catch(err => console.error('Error:', err));

    // Poll for winner updates every 1 second
    setInterval(() => {
        fetch('/api/winner')
            .then(res => res.json())
            .then(data => updateWinnerDisplay(data))
            .catch(err => console.error('Error:', err));
    }, 1000);

    // Poll for chances updates every 1 second
    setInterval(() => {
        fetch('/api/chances')
            .then(res => res.json())
            .then(data => {
                if (data.chances !== currentChances) {
                    currentChances = data.chances;
                    updateChancesDisplay(data.chances);
                    checkRaffleComplete(data.chances);
                }
            })
            .catch(err => console.error('Error:', err));
    }, 1000);

    // Poll for winners list updates every 1 second
    setInterval(() => {
        fetch('/api/winners')
            .then(res => res.json())
            .then(data => {
                const newWinners = data.winners || [];
                if (JSON.stringify(newWinners) !== JSON.stringify(currentWinners)) {
                    // Announce the newest winner
                    if (newWinners.length > currentWinners.length) {
                        const newWinnerName = newWinners[newWinners.length - 1];
                        announceWinner(newWinnerName);
                    }
                    currentWinners = newWinners;
                    renderWinnersList(currentWinners);
                }
            })
            .catch(err => console.error('Error:', err));
    }, 1000);

    // Poll for names updates every 1 second
    setInterval(() => {
        fetch('/api/names')
            .then(res => res.json())
            .then(data => {
                if (JSON.stringify(data) !== JSON.stringify(currentNames)) {
                    currentNames = data;
                    updateTotalPlayersDisplay(data.length);
                }
            })
            .catch(err => console.error('Error:', err));
    }, 1000);

    // Poll for game ID changes every 1 second
    setInterval(() => {
        fetch('/api/game-id')
            .then(res => res.json())
            .then(data => {
                if (currentServerGameId && data.game_id !== currentServerGameId) {
                    // Game ID changed - clear localStorage for new game
                    localStorage.removeItem('raffleEnteredGameId');
                    localStorage.removeItem('userName');
                    localStorage.removeItem('currentQuestion');
                    // Clear the form input
                    document.getElementById('name').value = '';
                    // Update current game ID
                    currentServerGameId = data.game_id;
                    // Force UI update and check raffle status
                    updateWinnerDisplay({winners: [], selecting: false});
                    checkRaffleComplete(currentChances);
                } else if (!currentServerGameId) {
                    currentServerGameId = data.game_id;
                }
            })
            .catch(err => console.error('Error:', err));
    }, 1000);
});

function showTrivia() {
    if (triviaCooldown) return;
    const userName = localStorage.getItem('userName');
    fetch(`/api/player-question?player=${encodeURIComponent(userName)}`)
    .then(res => res.json())
    .then(data => {
        if (data.question) {
            localStorage.setItem('currentQuestion', data.index);
            const q = data.question;
            document.getElementById('triviaQuestion').textContent = q.question;
            
            // Clear any previously selected radio button
            const selectedRadio = document.querySelector('input[name="answer"]:checked');
            if (selectedRadio) {
                selectedRadio.checked = false;
            }
            
            for (let i = 0; i < q.options.length; i++) {
                document.getElementById('option' + i).textContent = q.options[i];
                document.getElementById('option' + i).previousElementSibling.style.display = 'inline';
            }
            for (let i = q.options.length; i < 4; i++) {
                document.getElementById('option' + i).previousElementSibling.style.display = 'none';
                document.getElementById('option' + i).style.display = 'none';
            }
            document.getElementById('trivia').style.display = 'block';
            triviaCooldown = true;
        } else {
            // No questions left for this player
            hideTrivia();
        }
    })
    .catch(err => {
        console.error('Error fetching player question:', err);
        hideTrivia();
    });
}

function hideTrivia() {
    document.getElementById('trivia').style.display = 'none';
    // Prevent showing new trivia for 5 seconds after hiding
    setTimeout(() => {
        triviaCooldown = false;
    }, 5000);
}

function submitTrivia() {
    const userName = localStorage.getItem('userName');
    const questionIndex = localStorage.getItem('currentQuestion');
    const selected = document.querySelector('input[name="answer"]:checked');
    if (!selected) return;
    const answer = parseInt(selected.value);
    console.log('Submitting trivia:', {userName, questionIndex: parseInt(questionIndex), answer});
    fetch('/api/answer', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: userName, question_index: parseInt(questionIndex), answer: answer})
    })
    .then(res => res.json())
    .then(data => {
        console.log('Trivia response:', data);
        if (data.success) {
            showTriviaPopup(true, 'Correct!', '🎉 You got 2 extra chances!');
            // Update user chances display
            fetch(`/api/user-chances?name=${encodeURIComponent(userName)}`)
                .then(res => res.json())
                .then(chancesData => updateUserChancesDisplay(chancesData.chances))
                .catch(err => console.error('Error fetching user chances:', err));
        } else {
            showTriviaPopup(false, 'Wrong Answer', 'Better luck next time!');
        }
        hideTrivia();
    });
}

function showTriviaPopup(isCorrect, title, message) {
    const popup = document.getElementById('triviaPopup');
    const popupContent = popup.querySelector('.popup-content');
    const icon = document.getElementById('popupIcon');
    const titleEl = document.getElementById('popupTitle');
    const messageEl = document.getElementById('popupMessage');
    
    // Reset classes
    popupContent.classList.remove('correct', 'wrong');
    
    if (isCorrect) {
        popupContent.classList.add('correct');
        icon.textContent = '🎉';
    } else {
        popupContent.classList.add('wrong');
        icon.textContent = '😞';
    }
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    popup.style.display = 'flex';
}

function closeTriviaPopup() {
    const popup = document.getElementById('triviaPopup');
    popup.style.display = 'none';
}

// Poll for names updates every 1 second
setInterval(() => {
    fetch('/api/names')
        .then(res => res.json())
        .then(data => {
            if (JSON.stringify(data) !== JSON.stringify(currentNames)) {
                currentNames = data;
                updateTotalPlayersDisplay(data.length);
            }
        })
        .catch(err => console.error('Error:', err));
}, 1000);

function announceWinner(winnerName) {
    const announcement = document.getElementById('winner-announcement');
    const text = document.getElementById('winner-announcement-text');

    text.textContent = winnerName;
    announcement.classList.add('visible');

    setTimeout(() => {
        announcement.classList.remove('visible');
    }, 5000); // Display for 5 seconds
}