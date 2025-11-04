function renderNameList(names) {
    document.getElementById('totalNames').textContent = `Total names: ${names.length}`;
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

function updateWinnerDisplay(data) {
    const winner = data.winner;
    const selecting = data.selecting;
    const winnerDiv = document.getElementById('winner');
    const spinnerDiv = document.getElementById('spinner');
    if (selecting) {
        winnerDiv.style.display = 'none';
        spinnerDiv.style.display = 'block';
    } else if (winner) {
        winnerDiv.textContent = `Winner: ${winner}`;
        winnerDiv.style.display = 'block';
        spinnerDiv.style.display = 'none';
    } else {
        winnerDiv.style.display = 'none';
        spinnerDiv.style.display = 'none';
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
    // Clear the winner on the server
    fetch('/api/winner', { method: 'DELETE' })
        .then(() => {
            // After 5 seconds, select winner
            setTimeout(() => {
                fetch('/api/winner', { method: 'POST' })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            renderNameList(data.names);
                        } else {
                            alert('No names to select from.');
                        }
                    })
                    .catch(err => console.error('Error:', err));
            }, 5000);
        })
        .catch(err => console.error('Error clearing winner:', err));
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
    .then(names => renderNameList(names))
    .catch(err => console.error('Error:', err));

// Poll for names updates every 1 second
setInterval(() => {
    fetch('/api/names')
        .then(res => res.json())
        .then(names => renderNameList(names))
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