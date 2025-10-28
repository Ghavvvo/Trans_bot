#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para inicializar la base de datos vectorial con los artículos de la Ley 109
"""

import os
import sys
from services.embedding_service import EmbeddingService

def main():
    """Función principal para inicializar la base de datos"""

    # Rutas de archivos
    current_dir = os.path.dirname(os.path.abspath(__file__))
    json_file = os.path.join(current_dir, "articulos_ley_109.json")
    chroma_db_dir = os.path.join(current_dir, "chroma_db")

    print("🚀 Inicializando base de datos vectorial...")
    print(f"📂 Archivo JSON: {json_file}")
    print(f"🗄️  Base de datos: {chroma_db_dir}")

    # Verificar que existe el archivo JSON
    if not os.path.exists(json_file):
        print(f"❌ Error: No se encontró el archivo {json_file}")
        print("   Ejecuta primero extract_articles.py para generar el JSON")
        sys.exit(1)

    try:
        # Inicializar el servicio de embeddings
        print("\n🔧 Inicializando servicio de embeddings...")
        embedding_service = EmbeddingService(
            model_name="paraphrase-multilingual-MiniLM-L12-v2",
            persist_directory=chroma_db_dir
        )

        # Cargar y indexar artículos
        print("\n📖 Cargando e indexando artículos...")
        embedding_service.load_and_index_articles(json_file)

        # Mostrar estadísticas
        print("\n📊 Estadísticas de la base de datos:")
        stats = embedding_service.get_collection_stats()
        for key, value in stats.items():
            print(f"   {key}: {value}")

        # Hacer una búsqueda de prueba
        print("\n🔍 Realizando búsqueda de prueba...")
        test_query = "velocidad máxima permitida"
        results = embedding_service.search_similar_articles(test_query, n_results=3)

        print(f"\n🎯 Resultados para '{test_query}':")
        for i, result in enumerate(results['results'], 1):
            print(f"\n   {i}. Artículo {result['id']} (Similitud: {result['similarity_score']:.3f})")
            content_preview = result['contenido'][:150] + "..." if len(result['contenido']) > 150 else result['contenido']
            print(f"      {content_preview}")

        print("\n✅ Base de datos inicializada exitosamente!")
        print("   Ya puedes usar el servicio de búsqueda semántica.")

    except Exception as e:
        print(f"\n❌ Error durante la inicialización: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
