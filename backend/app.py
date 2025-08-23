
from flask import Flask, jsonify, request
    """Endpoint para verificar que el servidor está funcionando"""
    service = initialize_embedding_service()
    if service:
        stats = service.get_collection_stats()
        return jsonify({
            'status': 'ok',
            'database_ready': True,
            'total_articles': stats.get('total_documents', 0)
        })
    return jsonify({
        'status': 'ok',
        'database_ready': False,
        'total_articles': 0
    })
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
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
