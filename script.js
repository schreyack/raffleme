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

document.getElementById('nameForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const name = document.getElementById('name').value.trim();
    if (name) {
        fetch('/api/names', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const messageDiv = document.getElementById('message');
                messageDiv.textContent = `Hello, ${name}! Your name has been submitted. Total names: ${data.names.length}`;
                messageDiv.style.color = 'green';
                document.getElementById('name').value = '';
            } else {
                alert('Failed to submit name.');
            }
        })
        .catch(err => console.error('Error:', err));
    }
});

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