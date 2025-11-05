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
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
import redis

app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="."), name="static")

# Redis connection
r = redis.Redis(host='redis', port=6379, decode_responses=True)

# Load trivia questions from JSON file
with open("trivia_questions.json", "r") as f:
    QUESTIONS = json.load(f)

# Trivia questions API endpoint
@app.get('/api/questions')
def get_questions():
    return QUESTIONS

# Data access functions using Redis
def load_names():
    names = r.hgetall('names')
    return {k: int(v) for k, v in names.items()}

def save_names(names_dict):
    if names_dict:
        r.hset('names', mapping=names_dict)
    else:
        r.delete('names')

def load_winner():
    winner = r.get('winner')
    return json.loads(winner) if winner else None

def save_winner(winner):
    r.set('winner', json.dumps(winner))

def load_winners_list():
    return r.lrange('winners_list', 0, -1)

def save_winners_list(winners_list):
    r.delete('winners_list')
    if winners_list:
        r.rpush('winners_list', *winners_list)

def load_selecting():
    return r.get('selecting') == 'true'

def save_selecting(selecting):
    r.set('selecting', 'true' if selecting else 'false')

def load_chances():
    chances = r.get('chances')
    return int(chances) if chances else 0

def save_chances(chances):
    r.set('chances', str(chances))

def load_game_id():
    game_id = r.get('game_id')
    if not game_id:
        game_id = str(uuid.uuid4())
        save_game_id(game_id)
    return game_id

def save_game_id(game_id):
    r.set('game_id', game_id)

@app.get('/')
def index():
    return FileResponse('index.html')

@app.get('/manage.html')
def manage():
    return FileResponse('manage.html')

@app.get('/dashboard.html')
def dashboard():
    return FileResponse('dashboard.html')

@app.get('/style.css')
def style():
    return FileResponse('style.css')

@app.get('/script.js')
def script():
    return FileResponse('script.js')

@app.get('/dashboard.js')
def dashboard_js():
    return FileResponse('dashboard.js')

@app.get('/manage.js')
def manage_js():
    return FileResponse('manage.js')

@app.get('/favicon.ico')
def favicon():
    return Response(status_code=204)

@app.get('/api/names')
def get_names():
    return list(load_names().keys())

@app.get('/api/players')
def get_players():
    names = load_names()
    players = [{'name': name, 'chances': chances} for name, chances in names.items()]
    return {'players': players}

@app.post('/api/names')
async def add_name(request: Request):
    data = await request.json()
    name = data.get('name', '').strip()
    if name:
        names = load_names()
        if name.lower() in [n.lower() for n in names]:
            return {'success': False, 'message': 'Name already exists. Please enter a different name.'}
        names[name] = 1
        save_names(names)
        return {'success': True, 'names': list(names.keys())}
    return {'success': False, 'message': 'Name cannot be empty.'}

@app.put('/api/names/{index}')
async def update_name(index: int, request: Request):
    data = await request.json()
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
            return {'success': True, 'names': list(names_dict.keys())}
    return {'success': False}

@app.delete('/api/names/{index}')
def delete_name(index: int):
    names_dict = load_names()
    names_list = list(names_dict.keys())
    if 0 <= index < len(names_list):
        name_to_delete = names_list[index]
        del names_dict[name_to_delete]
        save_names(names_dict)
        return {'success': True, 'names': list(names_dict.keys())}
    return {'success': False}

@app.get('/api/chances')
def get_chances():
    return {'chances': load_chances()}

@app.put('/api/chances')
async def set_chances(request: Request):
    data = await request.json()
    chances = data.get('chances', 0)
    save_chances(chances)
    return {'chances': chances}

@app.post('/api/answer')
async def submit_answer(request: Request):
    data = await request.json()
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
                return {'success': True}
            else:
                print(f"Name {name} not in names (already won), but answer was correct")
                return {'success': True}  # Still mark as correct even if winner already removed
    return {'success': False}

@app.get('/api/user-chances')
def get_user_chances(name: str = None):
    if name:
        names = load_names()
        chances = names.get(name, 0)
        return {'chances': chances}
    return {'chances': 0}

@app.get('/api/winners')
def get_winners_list():
    return {'winners': load_winners_list()}

@app.get('/api/winner')
def get_winner():
    winners = load_winner()
    selecting = load_selecting()
    return {'winners': winners, 'selecting': selecting}

@app.post('/api/select-winner')
def select_winner():
    global_chances = load_chances()
    names_dict = load_names()
    total_user_chances = sum(names_dict.values())
    if global_chances <= 0 or total_user_chances <= 0:
        return {'success': False, 'message': 'No chances left to select a winner.'}
    
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
                winners_list = load_winners_list()
                winners_list.append(winner)
                save_winners_list(winners_list)
                save_winner([winner])
                global_chances = load_chances()
                if global_chances > 0:
                    save_chances(global_chances - 1)
            save_selecting(False)
    
    threading.Thread(target=delayed_selection).start()
    return {'success': True}

@app.post('/api/trivia-round')
def trivia_round():
    # Start a trivia round without selecting a winner
    save_selecting(True)
    
    def end_trivia_round():
        time.sleep(20)  # 20 seconds for trivia round
        save_selecting(False)
    
    threading.Thread(target=end_trivia_round).start()
    return {'success': True}

@app.post('/api/new-game')
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
    return {'success': True}

@app.get('/api/game-id')
def get_game_id():
    return {'game_id': load_game_id()}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)