# RaffleMe

A web-based raffle application with management dashboard and public display.

## Features

- User entry form
- Management interface for selecting winners
- Real-time public dashboard with stats, winners, and top players
- QR code for easy access
- Dramatic winner announcements
- Countdown timer during winner selection

## Quick Start with Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/schreyack/raffleme.git
   cd raffleme
   ```

2. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - User entry: http://localhost:8000
   - Management: http://localhost:8000/manage.html
   - Public dashboard: http://localhost:8000/dashboard.html

## Manual Setup (Alternative)

1. Install Python 3.9+ and pip

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the application:
   ```bash
   python server.py
   ```

4. Access as above.

## Production Deployment

For production, use the Docker setup. The app runs on port 8000.

Data is stored in JSON files in the application directory. For persistent storage in Docker, modify docker-compose.yml to add volumes for the JSON files.

## API Endpoints

- `GET /api/names` - Get list of participants
- `POST /api/names` - Add a participant
- `GET /api/winners` - Get list of winners
- `GET /api/chances` - Get remaining prizes
- `GET /api/players` - Get players with chances
- `GET /api/winner` - Get winner selection status
- And more for management

## Technologies

- Backend: Flask (Python)
- Frontend: HTML, CSS, JavaScript
- Container: Docker