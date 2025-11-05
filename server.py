import json
import random
import threading
import time
import uuid
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__)

NAMES_FILE = 'names.json'
WINNER_FILE = 'winner.json'
SELECTING_FILE = 'selecting.json'
CHANCES_FILE = 'chances.json'
WINNERS_LIST_FILE = 'winners_list.json'
GAME_ID_FILE = 'game_id.json'

def load_names():
    try:
        with open(NAMES_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def save_names(names):
    with open(NAMES_FILE, 'w') as f:
        json.dump(names, f)

def load_winner():
    try:
        with open(WINNER_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return None

def save_winner(winner):
    with open(WINNER_FILE, 'w') as f:
        json.dump(winner, f)

def load_selecting():
    try:
        with open(SELECTING_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return False

def save_selecting(selecting):
    with open(SELECTING_FILE, 'w') as f:
        json.dump(selecting, f)

def load_chances():
    try:
        with open(CHANCES_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return 0

def save_chances(chances):
    with open(CHANCES_FILE, 'w') as f:
        json.dump(chances, f)

def load_winners_list():
    try:
        with open(WINNERS_LIST_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def save_winners_list(winners_list):
    with open(WINNERS_LIST_FILE, 'w') as f:
        json.dump(winners_list, f)

def load_game_id():
    try:
        with open(GAME_ID_FILE, 'r') as f:
            data = json.load(f)
            return data.get('game_id', str(uuid.uuid4()))
    except (FileNotFoundError, json.JSONDecodeError):
        game_id = str(uuid.uuid4())
        save_game_id(game_id)
        return game_id

def save_game_id(game_id):
    with open(GAME_ID_FILE, 'w') as f:
        json.dump({'game_id': game_id}, f)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/manage.html')
def manage():
    return send_from_directory('.', 'manage.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

@app.route('/api/names', methods=['GET'])
def get_names():
    return jsonify(load_names())

@app.route('/api/names', methods=['POST'])
def add_name():
    data = request.get_json()
    name = data.get('name', '').strip()
    if name:
        names = load_names()
        if name.lower() in [n.lower() for n in names]:
            return jsonify({'success': False, 'message': 'Name already exists. Please enter a different name.'}), 409
        names.append(name)
        save_names(names)
        return jsonify({'success': True, 'names': names})
    return jsonify({'success': False, 'message': 'Name cannot be empty.'}), 400

@app.route('/api/names/<int:index>', methods=['PUT'])
def update_name(index):
    data = request.get_json()
    new_name = data.get('name', '').strip()
    if new_name:
        names = load_names()
        if 0 <= index < len(names):
            names[index] = new_name
            save_names(names)
            return jsonify({'success': True, 'names': names})
    return jsonify({'success': False}), 400

@app.route('/api/names/<int:index>', methods=['DELETE'])
def delete_name(index):
    names = load_names()
    if 0 <= index < len(names):
        names.pop(index)
        save_names(names)
        return jsonify({'success': True, 'names': names})
    return jsonify({'success': False}), 404

@app.route('/api/chances', methods=['GET'])
def get_chances():
    return jsonify({'chances': load_chances()})

@app.route('/api/chances', methods=['PUT'])
def set_chances():
    data = request.get_json()
    chances = data.get('chances', 0)
    save_chances(chances)
    return jsonify({'chances': chances})

@app.route('/api/winners', methods=['GET'])
def get_winners_list():
    return jsonify({'winners': load_winners_list()})

@app.route('/api/winner', methods=['GET'])
def get_winner():
    winners = load_winner()
    selecting = load_selecting()
    return jsonify({'winners': winners, 'selecting': selecting})

@app.route('/api/select-winner', methods=['POST'])
def select_winner():
    chances = load_chances()
    if chances <= 0:
        return jsonify({'success': False, 'message': 'No chances left to select a winner.'}), 400
    
    save_winner([])
    save_selecting(True)
    
    def delayed_selection():
        time.sleep(5)
        names = load_names()
        if names:
            winner = random.choice(names)
            save_winner([winner])
            # Add to winners list
            winners_list = load_winners_list()
            winners_list.append(winner)
            save_winners_list(winners_list)
            # Decrement chances
            current_chances = load_chances()
            save_chances(current_chances - 1)
        else:
            save_winner([])
        save_selecting(False)
    
    threading.Thread(target=delayed_selection).start()
    return jsonify({'success': True})

@app.route('/api/new-game', methods=['POST'])
def new_game():
    # Clear all data
    save_names([])
    save_winners_list([])
    save_chances(5)
    save_winner([])
    save_selecting(False)
    # Generate new game_id for new game
    new_game_id = str(uuid.uuid4())
    save_game_id(new_game_id)
    return jsonify({'success': True})

@app.route('/api/game-id', methods=['GET'])
def get_game_id():
    return jsonify({'game_id': load_game_id()})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)