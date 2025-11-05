function updateChancesDisplay(chances) {
    const chancesDiv = document.getElementById('chances');
    chancesDiv.textContent = `Chances left to win: ${chances}`;
    chancesDiv.style.display = chances > 0 ? 'block' : 'none';
}

function renderNameList(names) {
    document.getElementById('totalNames').textContent = `Total Players: ${names.length}`;
    const nameList = document.getElementById('nameList');
    nameList.innerHTML = '';
    names.forEach((name, index) => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.className = 'name-text';
        span.textContent = name;
        li.appendChild(span);

        const editBtn = document.createElement('button');
        editBtn.className = 'btn-small btn-edit';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => editName(name, index));
        li.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-small btn-delete';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteName(index));
        li.appendChild(deleteBtn);

        nameList.appendChild(li);
    });
}

let currentNames = [];
let currentChances = 0;
let currentWinners = [];

function renderWinnersList(winners) {
    const winnersUl = document.getElementById('winnersUl');
    winnersUl.innerHTML = '';
    winners.forEach((winner, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${winner}`;
        winnersUl.appendChild(li);
    });
}

var countdownInterval = null;
var countdown = 5;

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

function editName(name, index) {
    const li = document.getElementById('nameList').children[index];
    const nameText = li.querySelector('.name-text');
    const currentName = nameText.textContent;
    li.innerHTML = `
        <input type="text" class="edit-input" value="${currentName}">
        <button class="btn-small btn-save" onclick="saveEdit(${index})">Save</button>
        <button class="btn-small btn-cancel" onclick="cancelEdit()">Cancel</button>
    `;
}

function saveEdit(index) {
    const li = document.getElementById('nameList').children[index];
    const input = li.querySelector('.edit-input');
    const newName = input.value.trim();
    if (newName) {
        fetch(`/api/names/${index}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderNameList(data.names);
            }
        })
        .catch(err => console.error('Error:', err));
    }
}

function cancelEdit() {
    fetch('/api/names')
        .then(res => res.json())
        .then(names => renderNameList(names))
        .catch(err => console.error('Error:', err));
}

function deleteName(index) {
    fetch(`/api/names/${index}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderNameList(data.names);
            }
        })
        .catch(err => console.error('Error:', err));
}

document.getElementById('selectWinner').addEventListener('click', function() {
    const button = document.getElementById('selectWinner');
    
    // Disable button during selection
    button.disabled = true;
    button.textContent = 'Selecting...';
    
    fetch('/api/select-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Re-enable button after a short delay
                setTimeout(() => {
                    button.disabled = false;
                    button.textContent = '🎲 Select Winner';
                }, 2000);
            } else {
                alert(data.message || 'Cannot select winner.');
                button.disabled = false;
                button.textContent = '🎲 Select Winner';
            }
        })
        .catch(err => {
            console.error('Error:', err);
            button.disabled = false;
            button.textContent = '🎲 Select Winner';
        });
});

document.getElementById('addNameBtn').addEventListener('click', function() {
    const newNameInput = document.getElementById('newName');
    const newName = newNameInput.value.trim();
    if (newName) {
        fetch('/api/names', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => { throw err; });
            }
            return res.json();
        })
        .then(data => {
            if (data.success) {
                renderNameList(data.names);
                newNameInput.value = '';
            }
        })
        .catch(err => {
            alert(err.message || 'Failed to add name.');
            console.error('Error:', err);
        });
    }
});

// Initial render of names
fetch('/api/names')
    .then(res => res.json())
    .then(names => {
        currentNames = names;
        renderNameList(names);
    })
    .catch(err => console.error('Error:', err));

// Poll for names updates every 1 second
setInterval(() => {
    fetch('/api/names')
        .then(res => res.json())
        .then(names => {
            if (JSON.stringify(names) !== JSON.stringify(currentNames)) {
                currentNames = names;
                renderNameList(names);
            }
        })
        .catch(err => console.error('Error:', err));
}, 1000);

// Initial winner display
fetch('/api/winner')
    .then(res => res.json())
    .then(data => updateWinnerDisplay(data))
    .catch(err => console.error('Error:', err));

// Poll for winner updates every 1 second
setInterval(() => {
    fetch('/api/winner')
        .then(res => res.json())
        .then(data => updateWinnerDisplay(data))
        .catch(err => console.error('Error:', err));
}, 1000);

// Initial chances
fetch('/api/chances')
    .then(res => res.json())
    .then(data => {
        currentChances = data.chances;
        document.getElementById('chancesLeft').value = data.chances;
        updateChancesDisplay(data.chances);
    })
    .catch(err => console.error('Error:', err));

// Poll for chances updates every 1 second
setInterval(() => {
    fetch('/api/chances')
        .then(res => res.json())
        .then(data => {
            if (data.chances !== currentChances) {
                currentChances = data.chances;
                document.getElementById('chancesLeft').value = data.chances;
                updateChancesDisplay(data.chances);
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

// Update chances when input changes
document.getElementById('chancesLeft').addEventListener('change', function() {
    const newChances = parseInt(this.value) || 0;
    fetch('/api/chances', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chances: newChances })
    })
    .then(res => res.json())
    .then(data => {
        updateChancesDisplay(data.chances);
    })
    .catch(err => console.error('Error:', err));
});

// New Game button
document.getElementById('newGameBtn').addEventListener('click', function() {
    if (confirm('Are you sure you want to start a new game? This will clear all names and winners.')) {
        fetch('/api/new-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('New game started! All data has been cleared.');
                document.getElementById('chancesLeft').value = 5;
                // The polling will update the UI automatically
            }
        })
        .catch(err => console.error('Error:', err));
    }
});