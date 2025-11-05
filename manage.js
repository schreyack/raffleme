function updateChancesDisplay(chances) {
    const chancesValue = document.getElementById('chances-value');
    const chancesRow = chancesValue.closest('tr');
    chancesValue.textContent = chances;
    chancesRow.style.display = chances > 0 ? 'table-row' : 'none';
}

function renderNameList(names) {
    const totalPlayersValue = document.getElementById('totalPlayers-value');
    const totalPlayersRow = totalPlayersValue.closest('tr');
    totalPlayersValue.textContent = names.length;
    totalPlayersRow.style.display = names.length > 0 ? 'table-row' : 'none';
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

let currentWinners = [];

function renderWinnersList(winners) {
    if (!Array.isArray(winners)) winners = [];
    const winnersTable = document.getElementById('winnersTable');
    winnersTable.innerHTML = '';
    winners.forEach((winner, index) => {
        const tr = document.createElement('tr');
        const tdLabel = document.createElement('td');
        const tdName = document.createElement('td');
        
        tdLabel.textContent = 'Winner ' + (index + 1) + ':';
        tdName.textContent = winner;
        
        tr.appendChild(tdLabel);
        tr.appendChild(tdName);
        winnersTable.appendChild(tr);
    });
}
var countdownInterval = null;
var countdown = 20;

function updateWinnerDisplay(data) {
    const winners = data.winners || [];
    const selecting = data.selecting;
    const winnerDiv = document.getElementById('winner');
    if (selecting) {
        if (!countdownInterval) {
            countdown = 20;
            countdownInterval = setInterval(() => {
                countdown--;
                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    countdownInterval = null;
                }
                updateWinnerDisplay({winners: [], selecting: true});
            }, 1000);
        }
        winnerDiv.innerHTML = `Time Remaining: <span class="countdown-number">${countdown}</span> seconds`;
        winnerDiv.style.display = 'block';
        winnerDiv.classList.add('countdown-active');
        
        // Disable both buttons during countdown
        document.getElementById('selectWinner').disabled = true;
        document.getElementById('triviaButton').disabled = true;
    } else {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        winnerDiv.style.display = 'none';
        winnerDiv.classList.remove('countdown-active');
        
        // Re-enable both buttons when countdown ends
        document.getElementById('selectWinner').disabled = false;
        document.getElementById('triviaButton').disabled = false;
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

document.addEventListener('DOMContentLoaded', function() {
    // Initial render of names
    fetch('/api/names')
        .then(res => res.json())
        .then(names => {
            currentNames = names;
            renderNameList(names);
        })
        .catch(err => console.error('Error:', err));

    // Initial winner display
    fetch('/api/winner')
        .then(res => res.json())
        .then(data => updateWinnerDisplay(data))
        .catch(err => console.error('Error:', err));

    // Initial chances
    fetch('/api/chances')
        .then(res => res.json())
        .then(data => {
            currentChances = data.chances;
            document.getElementById('chancesLeft').value = data.chances;
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

    // Select winner button
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

    // Trivia question button
    document.getElementById('triviaButton').addEventListener('click', function() {
        const button = document.getElementById('triviaButton');
        
        // Disable button during trivia round
        button.disabled = true;
        button.textContent = 'Trivia Active...';
        
        fetch('/api/trivia-round', {
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
                        button.textContent = '❓ Trivia Question';
                    }, 2000);
                } else {
                    alert(data.message || 'Cannot start trivia round.');
                    button.disabled = false;
                    button.textContent = '❓ Trivia Question';
                }
            })
            .catch(err => {
                console.error('Error:', err);
                button.disabled = false;
                button.textContent = '❓ Trivia Question';
            });
    });

    // Add name button
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

    // Configuration panel toggle
    document.getElementById('configBtn').addEventListener('click', function() {
        const configPanel = document.getElementById('configPanel');
        configPanel.style.display = configPanel.style.display === 'none' ? 'block' : 'none';
    });
});

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
                document.getElementById('chancesLeft').value = data.chanses;
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
                currentWinners = newWinners;
                renderWinnersList(currentWinners);
            }
        })
        .catch(err => console.error('Error:', err));
}, 1000);
