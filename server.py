import json
import random
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__)

NAMES_FILE = 'names.json'
WINNER_FILE = 'winner.json'
SELECTING_FILE = 'selecting.json'

def load_names():
    try:
        with open(NAMES_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_names(names):
    with open(NAMES_FILE, 'w') as f:
        json.dump(names, f)

def load_winner():
    try:
        with open(WINNER_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return None

def save_winner(winner):
    with open(WINNER_FILE, 'w') as f:
        json.dump(winner, f)

def load_selecting():
    try:
        with open(SELECTING_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return False

def save_selecting(selecting):
    with open(SELECTING_FILE, 'w') as f:
        json.dump(selecting, f)

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
        names.append(name)
        save_names(names)
        return jsonify({'success': True, 'names': names})
    return jsonify({'success': False}), 400

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

@app.route('/api/winner', methods=['GET'])
def get_winner():
    winner = load_winner()
    selecting = load_selecting()
    return jsonify({'winner': winner, 'selecting': selecting})

@app.route('/api/winner', methods=['POST'])
def select_winner():
    names = load_names()
    if names:
        winner = random.choice(names)
        save_winner(winner)
        save_selecting(False)
        return jsonify({'success': True, 'winner': winner})
    return jsonify({'success': False}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)