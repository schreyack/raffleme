var currentChances = 0;
var currentWinners = [];
var currentNames = [];
var currentPlayers = [];
var selecting = false;
var countdownInterval = null;
var countdown = 20;

document.addEventListener('DOMContentLoaded', function() {
    // Initial chances display
    fetch('/api/chances')
        .then(res => res.json())
        .then(data => {
            currentChances = data.chances;
            updateChancesDisplay(data.chances);
        })
        .catch(err => console.error('Error:', err));

    // Initial winners list
    fetch('/api/winners')
        .then(res => res.json())
        .then(data => {
            currentWinners = data.winners || [];
            renderWinnersList(currentWinners);
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

    // Initial players list for top players
    fetch('/api/players')
        .then(res => res.json())
        .then(data => {
            currentPlayers = data.players || [];
            renderTopPlayers(currentPlayers);
        })
        .catch(err => console.error('Error:', err));

    // Poll for chances updates every 1 second
    setInterval(() => {
        fetch('/api/chances')
            .then(res => res.json())
            .then(data => {
                if (data.chances !== currentChances) {
                    currentChances = data.chances;
                    updateChancesDisplay(data.chances);
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

    // Poll for players updates every 1 second
    setInterval(() => {
        fetch('/api/players')
            .then(res => res.json())
            .then(data => {
                const newPlayers = data.players || [];
                if (JSON.stringify(newPlayers) !== JSON.stringify(currentPlayers)) {
                    currentPlayers = newPlayers;
                    renderTopPlayers(currentPlayers);
                }
            })
            .catch(err => console.error('Error:', err));
    }, 1000);

    // Poll for winner updates every 1 second
    setInterval(() => {
        fetch('/api/winner')
            .then(res => res.json())
            .then(data => {
                const newSelecting = data.selecting || false;
                if (newSelecting !== selecting) {
                    selecting = newSelecting;
                    if (selecting) {
                        startCountdown();
                    } else {
                        stopCountdown();
                    }
                }
            })
            .catch(err => console.error('Error:', err));
    }, 1000);
});

function updateChancesDisplay(chances) {
    const chancesValue = document.getElementById('chances-value');
    chancesValue.textContent = chances;
}

function updateTotalPlayersDisplay(totalPlayers) {
    const totalPlayersValue = document.getElementById('totalPlayers-value');
    totalPlayersValue.textContent = totalPlayers;
}

function renderWinnersList(winners) {
    if (!Array.isArray(winners)) winners = [];
    const winnersUl = document.getElementById('winnersList');
    winnersUl.innerHTML = '';
    winners.forEach((winner, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${winner}`;
        winnersUl.appendChild(li);
    });
}

function renderTopPlayers(players) {
    if (!Array.isArray(players)) players = [];
    const topPlayersBody = document.getElementById('topPlayersBody');
    const topPlayersTable = document.getElementById('topPlayersTable');
    topPlayersBody.innerHTML = '';
    if (players.length > 0) {
        // Sort by chances descending
        players.sort((a, b) => b.chances - a.chances);
        // Take top 5
        const top5 = players.slice(0, 5);
        top5.forEach((player, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${player.name}</td>
                <td>${player.chances}</td>
            `;
            topPlayersBody.appendChild(tr);
        });
        topPlayersTable.style.display = 'table';
    } else {
        topPlayersTable.style.display = 'none';
    }
}

function announceWinner(winnerName) {
    const announcement = document.getElementById('winner-announcement');
    const text = document.getElementById('winner-announcement-text');

    text.textContent = winnerName;
    announcement.classList.add('visible');

    setTimeout(() => {
        announcement.classList.remove('visible');
    }, 5000); // Display for 5 seconds
}

function startCountdown() {
    const countdownElement = document.getElementById('countdown-timer');
    const textElement = document.getElementById('countdown-text');

    countdown = 20;
    textElement.textContent = `Winner Selection in: ${countdown}`;
    countdownElement.classList.add('visible');

    countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            textElement.textContent = `Winner Selection in: ${countdown}`;
        } else {
            stopCountdown();
        }
    }, 1000);
}

function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    const countdownElement = document.getElementById('countdown-timer');
    countdownElement.classList.remove('visible');
}