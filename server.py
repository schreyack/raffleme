# Copyright 2025 Tim Schreyack
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import random
import threading
import time
import uuid
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__)

# Load trivia questions from JSON file
with open("trivia_questions.json", "r") as f:
    QUESTIONS = json.load(f)

# Trivia questions API endpoint
@app.route('/api/questions', methods=['GET'])
def get_questions():
    return jsonify(QUESTIONS)

NAMES_FILE = 'names.json'
WINNER_FILE = 'winner.json'
SELECTING_FILE = 'selecting.json'
CHANCES_FILE = 'chances.json'
WINNERS_LIST_FILE = 'winners_list.json'
GAME_ID_FILE = 'game_id.json'

def load_names():
    try:
        with open(NAMES_FILE, 'r') as f:
            data = json.load(f)
            if isinstance(data, list):
                # Migrate old list to dict with 1 chance each
                names_dict = {name: 1 for name in data}
                save_names(names_dict)
                return names_dict
            return data
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def save_names(names_dict):
    with open(NAMES_FILE, 'w') as f:
        json.dump(names_dict, f)

def load_winner():
    try:
        with open(WINNER_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return None

def save_winner(winner):
    with open(WINNER_FILE, 'w') as f:
        json.dump(winner, f)

def load_winners_list():
    try:
        with open(WINNERS_LIST_FILE, 'r') as f:
            data = json.load(f)
            if not isinstance(data, list):
                return []
            return data
    except (FileNotFoundError, json.JSONDecodeError):
        return []

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
    return jsonify(list(load_names().keys()))

@app.route('/api/players', methods=['GET'])
def get_players():
    names = load_names()
    players = [{'name': name, 'chances': chances} for name, chances in names.items()]
    return jsonify({'players': players})

@app.route('/api/names', methods=['POST'])
def add_name():
    data = request.get_json()
    name = data.get('name', '').strip()
    if name:
        names = load_names()
        if name.lower() in [n.lower() for n in names]:
            return jsonify({'success': False, 'message': 'Name already exists. Please enter a different name.'}), 409
        names[name] = 1
        save_names(names)
        return jsonify({'success': True, 'names': list(names.keys())})
    return jsonify({'success': False, 'message': 'Name cannot be empty.'}), 400

@app.route('/api/names/<int:index>', methods=['PUT'])
def update_name(index):
    data = request.get_json()
    new_name = data.get('name', '').strip()
    if new_name:
        names_dict = load_names()
        names_list = list(names_dict.keys())
        if 0 <= index < len(names_list):
            old_name = names_list[index]
            chances = names_dict[old_name]
            del names_dict[old_name]
            names_dict[new_name] = chances
            save_names(names_dict)
            return jsonify({'success': True, 'names': list(names_dict.keys())})
    return jsonify({'success': False}), 400

@app.route('/api/names/<int:index>', methods=['DELETE'])
def delete_name(index):
    names_dict = load_names()
    names_list = list(names_dict.keys())
    if 0 <= index < len(names_list):
        name_to_delete = names_list[index]
        del names_dict[name_to_delete]
        save_names(names_dict)
        return jsonify({'success': True, 'names': list(names_dict.keys())})
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

@app.route('/api/answer', methods=['POST'])
def submit_answer():
    data = request.get_json()
    name = data.get('name')
    question_index = data.get('question_index')
    answer = data.get('answer')
    print(f"Trivia answer received: name={name}, question_index={question_index}, answer={answer}")
    if question_index is not None and answer is not None and 0 <= question_index < len(QUESTIONS):
        correct = QUESTIONS[question_index]['correct']
        print(f"Correct answer for question {question_index}: {correct}")
        if correct == answer:
            names = load_names()
            print(f"Names: {names}")
            if name in names:
                names[name] += 2
                save_names(names)
                print(f"Updated chances for {name}: {names[name]}")
                return jsonify({'success': True})
            else:
                print(f"Name {name} not in names (already won), but answer was correct")
                return jsonify({'success': True})  # Still mark as correct even if winner already removed
    return jsonify({'success': False})

@app.route('/api/user-chances', methods=['GET'])
def get_user_chances():
    name = request.args.get('name', '').strip()
    if name:
        names = load_names()
        chances = names.get(name, 0)
        return jsonify({'chances': chances})
    return jsonify({'chances': 0}), 400

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
    global_chances = load_chances()
    names_dict = load_names()
    total_user_chances = sum(names_dict.values())
    if global_chances <= 0 or total_user_chances <= 0:
        return jsonify({'success': False, 'message': 'No chances left to select a winner.'}), 400
    
    save_winner([])
    save_selecting(True)
    
    def delayed_selection():
        time.sleep(20)  # Changed to 20 seconds for trivia
        names_dict = load_names()
        total_user_chances = sum(names_dict.values())
        if names_dict and total_user_chances > 0:
            pick = random.randint(1, total_user_chances)
            cumulative = 0
            winner = None
            for name, chances in names_dict.items():
                cumulative += chances
                if pick <= cumulative:
                    winner = name
                    break
            if winner:
                del names_dict[winner]
                save_names(names_dict)
                save_winner([winner])
                # Add to winners list
                winners_list = load_winners_list()
                winners_list.append(winner)
                save_winners_list(winners_list)
                # Decrement global chances
                current_global = load_chances()
                save_chances(current_global - 1)
            else:
                save_winner([])
        else:
            save_winner([])
        save_selecting(False)
    
    threading.Thread(target=delayed_selection).start()
    return jsonify({'success': True})

@app.route('/api/new-game', methods=['POST'])
def new_game():
    # Clear all data
    save_names({})
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