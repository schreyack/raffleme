var countdownInterval = null;
var countdown = 5;
var lastWinner = null;
var currentChances = 0;
var currentWinners = [];
var currentNames = [];
var currentServerGameId = null;

// Test if the function is defined
window.testFunction = function() {
    alert('Test function called!');
    console.log('Test function executed');
};

function updateWinnerDisplay(data) {
    const winners = data.winners || [];
    const selecting = data.selecting;
    const winnerDiv = document.getElementById('winner');
    if (selecting) {
        if (!countdownInterval) {
            countdown = 5;
            countdownInterval = setInterval(() => {
                countdown--;
                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    countdownInterval = null;
                }
                updateWinnerDisplay({winners: [], selecting: true});
            }, 1000);
        }
        winnerDiv.innerHTML = `Selecting Winner In:<br><span class="countdown-number">${countdown}</span>`;
        winnerDiv.style.display = 'block';
    } else {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        winnerDiv.style.display = 'none';
    }
}

function updateChancesDisplay(chances) {
    const chancesDiv = document.getElementById('chances');
    chancesDiv.textContent = `Chances left to win: ${chances}`;
    chancesDiv.style.display = chances > 0 ? 'block' : 'none';
}

function updateTotalPlayersDisplay(totalPlayers) {
    const totalPlayersDiv = document.getElementById('totalPlayers');
    totalPlayersDiv.textContent = `Total players: ${totalPlayers}`;
    totalPlayersDiv.style.display = 'block';
}

function renderWinnersList(winners) {
    const winnersUl = document.getElementById('winnersUl');
    winnersUl.innerHTML = '';
    winners.forEach((winner, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${winner}`;
        winnersUl.appendChild(li);
    });
}

function checkRaffleComplete(chances) {
    if (chances === 0) {
        // Hide form and show winners
        document.getElementById('nameForm').style.display = 'none';
        document.getElementById('winner').style.display = 'none';
        document.getElementById('chances').style.display = 'none';
        document.getElementById('spinner').style.display = 'none';
        document.getElementById('message').style.display = 'none';
        document.getElementById('winnersList').style.display = 'block';
    } else {
        // Show form only if not already entered for this game
        const enteredGameId = localStorage.getItem('raffleEnteredGameId');
        if (enteredGameId !== currentServerGameId) {
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

// Initial game_id fetch
fetch('/api/game-id')
    .then(res => res.json())
    .then(data => {
        currentServerGameId = data.game_id;
        // Check if already entered
        const enteredGameId = localStorage.getItem('raffleEnteredGameId');
        if (enteredGameId === currentServerGameId) {
            const messageDiv = document.getElementById('message');
            messageDiv.textContent = 'You have already entered the raffle!';
            messageDiv.style.color = '#2196F3';
            document.getElementById('nameForm').style.display = 'none';
        }
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

// Poll for winners list updates every 1 second
setInterval(() => {
    fetch('/api/winners')
        .then(res => res.json())
        .then(data => {
            if (JSON.stringify(data.winners) !== JSON.stringify(currentWinners)) {
                currentWinners = data.winners;
                renderWinnersList(data.winners);
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