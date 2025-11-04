var countdownInterval = null;
var countdown = 5;
var lastWinner = null;

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

let currentChances = 0;

document.getElementById('nameForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const name = document.getElementById('name').value.trim();
    if (name) {
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
                messageDiv.textContent = `Hello, ${name}! Your name has been submitted. Total names: ${data.names.length}`;
                messageDiv.style.color = 'green';
                document.getElementById('name').value = '';
            }
        })
        .catch(err => {
            const messageDiv = document.getElementById('message');
            messageDiv.textContent = err.message || 'Failed to submit name.';
            messageDiv.style.color = 'red';
            console.error('Error:', err);
        });
    }
});

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
            }
        })
        .catch(err => console.error('Error:', err));
}, 1000);