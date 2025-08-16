from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import os
from services.embedding_service import EmbeddingService

app = Flask(__name__)
CORS(app)

# Inicializar el servicio de embeddings
embedding_service = None

def initialize_embedding_service():
    """Inicializa el servicio de embeddings de forma lazy"""
    global embedding_service
    if embedding_service is None:
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            chroma_db_dir = os.path.join(current_dir, "chroma_db")

            embedding_service = EmbeddingService(
                model_name="paraphrase-multilingual-MiniLM-L12-v2",
                persist_directory=chroma_db_dir
            )
            print("✅ Servicio de embeddings inicializado")
        except Exception as e:
            print(f"❌ Error al inicializar embeddings: {e}")
            embedding_service = None

    return embedding_service

# Datos de ejemplo simples (mantenemos para compatibilidad)
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

# Nuevas rutas para el servicio de embeddings

@app.route('/api/search', methods=['POST'])
def search_articles():
    """Busca artículos similares basado en una consulta"""
    try:
        service = initialize_embedding_service()
        if not service:
            return jsonify({'error': 'Servicio de embeddings no disponible'}), 500

        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({'error': 'Se requiere el campo "query"'}), 400

        query = data['query']
        n_results = data.get('n_results', 5)

        if not query.strip():
            return jsonify({'error': 'La consulta no puede estar vacía'}), 400

        results = service.search_similar_articles(query, n_results)
        return jsonify(results)

    except Exception as e:
        return jsonify({'error': f'Error en la búsqueda: {str(e)}'}), 500

@app.route('/api/articles/<int:article_id>', methods=['GET'])
def get_article(article_id):
    """Obtiene un artículo específico por su ID"""
    try:
        service = initialize_embedding_service()
        if not service:
            return jsonify({'error': 'Servicio de embeddings no disponible'}), 500

        article = service.get_article_by_id(str(article_id))
        if article:
            return jsonify(article)
        else:
            return jsonify({'error': 'Artículo no encontrado'}), 404

    except Exception as e:
        return jsonify({'error': f'Error al obtener artículo: {str(e)}'}), 500

@app.route('/api/stats', methods=['GET'])
def get_database_stats():
    """Obtiene estadísticas de la base de datos"""
    try:
        service = initialize_embedding_service()
        if not service:
            return jsonify({'error': 'Servicio de embeddings no disponible'}), 500

        stats = service.get_collection_stats()
        return jsonify(stats)

    except Exception as e:
        return jsonify({'error': f'Error al obtener estadísticas: {str(e)}'}), 500

@app.route('/api/similar/<int:article_id>', methods=['GET'])
def get_similar_articles(article_id):
    """Encuentra artículos similares a uno específico"""
    try:
        service = initialize_embedding_service()
        if not service:
            return jsonify({'error': 'Servicio de embeddings no disponible'}), 500

        # Primero obtener el artículo base
        article = service.get_article_by_id(str(article_id))
        if not article:
            return jsonify({'error': 'Artículo no encontrado'}), 404

        # Buscar artículos similares usando el contenido del artículo
        n_results = request.args.get('n_results', 6, type=int)  # +1 para excluir el mismo artículo
        results = service.search_similar_articles(article['contenido'], n_results)

        # Filtrar el artículo original de los resultados
        filtered_results = {
            'query_article': article,
            'similar_articles': [
                r for r in results['results']
                if r['id'] != article_id
            ][:n_results-1]  # Limitar a n_results-1
        }

        return jsonify(filtered_results)

    except Exception as e:
        return jsonify({'error': f'Error al buscar artículos similares: {str(e)}'}), 500

@app.route('/', methods=['GET'])
def landing_page():
    return '''
