from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Datos de ejemplo simples
sample_questions = [
    {
        'id': 1,
        'text': '¿Cuál es la velocidad máxima permitida en zona urbana?',
        'options': {'a': '50 km/h', 'b': '60 km/h', 'c': '40 km/h'},
        'correct_answer': 'a',
        'category': 'velocidad'
    },
    {
        'id': 2,
        'text': '¿Qué significa una luz roja en el semáforo?',
        'options': {'a': 'Precaución', 'b': 'Detenerse completamente', 'c': 'Continuar con cuidado'},
        'correct_answer': 'b',
        'category': 'semaforos'
    },
    {
        'id': 3,
        'text': '¿Cuál es la tasa de alcohol permitida para conductores principiantes?',
        'options': {'a': '0.5 g/l', 'b': '0.0 g/l', 'c': '0.3 g/l'},
        'correct_answer': 'b',
        'category': 'alcohol'
    }
]

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'})

@app.route('/api/questions', methods=['GET'])
def get_questions():
    return jsonify(sample_questions)

@app.route('/api/questions/<int:question_id>', methods=['GET'])
def get_question_by_id(question_id):
    question = next((q for q in sample_questions if q['id'] == question_id), None)
    if question:
        return jsonify(question)
    return jsonify({'error': 'Question not found'}), 404

@app.route('/', methods=['GET'])
def landing_page():
    return '''<html><head><title>TransBot Backend</title></head><body><h1>Welcome to TransBot Backend</h1><p>This is the backend server. The frontend is available at <a href="http://localhost:5173">http://localhost:5173</a>.</p></body></html>''', 200

if __name__ == '__main__':
    app.run(debug=True)

