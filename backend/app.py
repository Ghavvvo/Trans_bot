from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import asyncio
from services.embedding_service import EmbeddingService
from services.rag_service import RAGService

app = Flask(__name__)
CORS(app)

# Inicializar servicios
embedding_service = None
rag_service = None

# API Key de Mistral (en producción debería estar en variables de entorno)
MISTRAL_API_KEY = "ctr92dfHdD64aPdOzliVL2tXuViR1ITJ"

def initialize_services():
    """Inicializa los servicios de embeddings y RAG"""
    global embedding_service, rag_service

    if embedding_service is None:
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            chroma_db_dir = os.path.join(current_dir, "chroma_db")

            embedding_service = EmbeddingService(
                model_name="paraphrase-multilingual-MiniLM-L12-v2",
                persist_directory=chroma_db_dir
            )
            print("✅ Servicio de embeddings inicializado")

            # Inicializar RAG Service
            rag_service = RAGService(MISTRAL_API_KEY, embedding_service)
            print("✅ Servicio RAG con Mistral AI inicializado")

        except Exception as e:
            print(f"❌ Error al inicializar servicios: {e}")
            embedding_service = None
            rag_service = None

    return embedding_service, rag_service

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint para verificar que el servidor está funcionando"""
    embedding_svc, rag_svc = initialize_services()

    if embedding_svc and rag_svc:
        stats = embedding_svc.get_collection_stats()
        return jsonify({
            'status': 'ok',
            'database_ready': True,
            'total_articles': stats.get('total_documents', 0),
            'rag_enabled': True,
            'llm_provider': 'Mistral AI'
        })

    return jsonify({
        'status': 'ok',
        'database_ready': False,
        'total_articles': 0,
        'rag_enabled': False
    })

@app.route('/api/chat', methods=['POST'])
def chat_with_rag():
    """Endpoint principal para chat RAG - genera respuestas conversacionales"""
    try:
        embedding_svc, rag_svc = initialize_services()
        if not rag_svc:
            return jsonify({'error': 'Servicio RAG no disponible'}), 500

        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({'error': 'Se requiere el campo "query"'}), 400

        query = data['query']
        max_articles = data.get('max_articles', 5)

        if not query.strip():
            return jsonify({'error': 'La consulta no puede estar vacía'}), 400

        # Usar asyncio para la llamada asíncrona
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(rag_svc.generate_response(query, max_articles))
            return jsonify(result)
        finally:
            loop.close()

    except Exception as e:
        return jsonify({'error': f'Error en el chat RAG: {str(e)}'}), 500

@app.route('/api/search', methods=['POST'])
def search_articles():
    """Busca artículos similares (modo original para compatibilidad)"""
    try:
        embedding_svc, rag_svc = initialize_services()
        if not embedding_svc:
            return jsonify({'error': 'Servicio de embeddings no disponible'}), 500

        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({'error': 'Se requiere el campo "query"'}), 400

        query = data['query']
        n_results = data.get('n_results', 5)

        if not query.strip():
            return jsonify({'error': 'La consulta no puede estar vacía'}), 400

        results = embedding_svc.search_similar_articles(query, n_results)
        return jsonify(results)

    except Exception as e:
        return jsonify({'error': f'Error en la búsqueda: {str(e)}'}), 500

@app.route('/api/articles/<int:article_id>', methods=['GET'])
def get_article(article_id):
    """Obtiene un artículo específico por su ID"""
    try:
        embedding_svc, rag_svc = initialize_services()
        if not embedding_svc:
            return jsonify({'error': 'Servicio de embeddings no disponible'}), 500

        article = embedding_svc.get_article_by_id(str(article_id))
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
        embedding_svc, rag_svc = initialize_services()
        if not embedding_svc:
            return jsonify({'error': 'Servicio de embeddings no disponible'}), 500

        stats = embedding_svc.get_collection_stats()
        return jsonify(stats)

    except Exception as e:
        return jsonify({'error': f'Error al obtener estadísticas: {str(e)}'}), 500

@app.route('/api/rag/info', methods=['GET'])
def get_rag_info():
    """Obtiene información sobre las capacidades del sistema RAG"""
    try:
        embedding_svc, rag_svc = initialize_services()
        if not rag_svc:
            return jsonify({'error': 'Servicio RAG no disponible'}), 500

        info = rag_svc.get_service_info()
        return jsonify(info)

    except Exception as e:
        return jsonify({'error': f'Error al obtener información RAG: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
