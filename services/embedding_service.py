"""
Servicio para manejar embeddings y base de datos vectorial con ChromaDB
"""

import json
import os
import chromadb
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Optional
import logging
import random

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self, model_name: str = "paraphrase-multilingual-MiniLM-L12-v2",
                 persist_directory: str = "./chroma_db"):
        """
        Inicializa el servicio de embeddings

        Args:
            model_name: Nombre del modelo de SentenceTransformer
            persist_directory: Directorio donde persistir la base de datos
        """
        self.model_name = model_name
        self.persist_directory = persist_directory
        self.model = None
        self.client = None
        self.collection = None
        self.collection_name = "articulos_ley_109"

        # Crear directorio si no existe
        os.makedirs(persist_directory, exist_ok=True)

        self._initialize_model()
        self._initialize_chroma()

    def _initialize_model(self):
        """Inicializa el modelo de SentenceTransformer"""
        try:
            logger.info(f"Cargando modelo: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            logger.info("Modelo cargado exitosamente")
        except Exception as e:
            logger.error(f"Error al cargar el modelo: {e}")
            raise

    def _initialize_chroma(self):
        """Inicializa ChromaDB"""
        try:
            logger.info("Inicializando ChromaDB")
            self.client = chromadb.PersistentClient(path=self.persist_directory)

            # Obtener o crear la colección
            try:
                self.collection = self.client.get_collection(name=self.collection_name)
                logger.info(f"Colección '{self.collection_name}' encontrada")
            except:
                self.collection = self.client.create_collection(
                    name=self.collection_name,
                    metadata={"hnsw:space": "cosine"}  # Usar distancia coseno
                )
                logger.info(f"Colección '{self.collection_name}' creada")

            # Verificar si necesita cargar artículos
            self._ensure_articles_loaded()

        except Exception as e:
            logger.error(f"Error al inicializar ChromaDB: {e}")
            raise

    def _ensure_articles_loaded(self):
        """Asegura que los artículos estén cargados en la base de datos"""
        try:
            count = self.collection.count()
            if count == 0:
                logger.info("Base de datos vacía, cargando artículos...")
                # Buscar el archivo JSON en el directorio actual o padre
                current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                json_file_path = os.path.join(current_dir, "articulos_ley_109.json")

                if os.path.exists(json_file_path):
                    self.load_and_index_articles(json_file_path)
                else:
                    logger.warning(f"No se encontró el archivo {json_file_path}")
            else:
                logger.info(f"Base de datos ya contiene {count} artículos")
        except Exception as e:
            logger.error(f"Error al verificar/cargar artículos: {e}")
            raise

    def create_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Crea embeddings para una lista de textos

        Args:
            texts: Lista de textos para convertir en embeddings

        Returns:
            Lista de embeddings
        """
        try:
            logger.info(f"Creando embeddings para {len(texts)} textos")
            embeddings = self.model.encode(texts, convert_to_tensor=False)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error al crear embeddings: {e}")
            raise

    def load_and_index_articles(self, json_file_path: str):
        """
        Carga los artículos del JSON y los indexa en ChromaDB

        Args:
            json_file_path: Ruta al archivo JSON con los artículos
        """
        try:
            # Verificar si la colección ya tiene datos
            count = self.collection.count()
            if count > 0:
                logger.info(f"La colección ya contiene {count} documentos. Saltando indexación.")
                return

            logger.info(f"Cargando artículos desde: {json_file_path}")

            with open(json_file_path, 'r', encoding='utf-8') as file:
                articles = json.load(file)

            logger.info(f"Cargados {len(articles)} artículos")

            # Extraer textos e IDs
            texts = [article['contenido'] for article in articles]
            ids = [str(article['id']) for article in articles]

            # Crear embeddings
            embeddings = self.create_embeddings(texts)

            # Preparar metadatos
            metadatas = [
                {
                    "id": article['id'],
                    "contenido": article['contenido']
                }
                for article in articles
            ]

            # Indexar en ChromaDB
            logger.info("Indexando artículos en ChromaDB...")
            self.collection.add(
                embeddings=embeddings,
                documents=texts,
                metadatas=metadatas,
                ids=ids
            )

            logger.info(f"Indexación completada. {len(articles)} artículos indexados.")

        except Exception as e:
            logger.error(f"Error al cargar e indexar artículos: {e}")
            raise

    def search_similar_articles(self, query: str, n_results: int = 5) -> Dict[str, Any]:
        """
        Busca artículos similares basados en una consulta

        Args:
            query: Texto de consulta
            n_results: Número de resultados a devolver

        Returns:
            Diccionario con los resultados de la búsqueda
        """
        try:
            logger.info(f"Buscando artículos similares para: '{query[:50]}...'")

            # Crear embedding para la consulta
            query_embedding = self.create_embeddings([query])[0]

            # Buscar en ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                include=['documents', 'metadatas', 'distances']
            )

            # Formatear resultados
            formatted_results = {
                "query": query,
                "results": []
            }

            if results['documents'] and results['documents'][0]:
                for i in range(len(results['documents'][0])):
                    formatted_results["results"].append({
                        "id": results['metadatas'][0][i]['id'],
                        "contenido": results['documents'][0][i],
                        "similarity_score": 1 - results['distances'][0][i],  # Convertir distancia a similitud
                        "distance": results['distances'][0][i]
                    })

            logger.info(f"Encontrados {len(formatted_results['results'])} resultados")
            return formatted_results

        except Exception as e:
            logger.error(f"Error en la búsqueda: {e}")
            raise

    def get_article_by_id(self, article_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene un artículo específico por su ID

        Args:
            article_id: ID del artículo

        Returns:
            Diccionario con la información del artículo o None si no se encuentra
        """
        try:
            results = self.collection.get(
                ids=[article_id],
                include=['documents', 'metadatas']
            )

            if results['documents'] and len(results['documents']) > 0:
                return {
                    "id": results['metadatas'][0]['id'],
                    "contenido": results['documents'][0]
                }

            return None

        except Exception as e:
            logger.error(f"Error al obtener artículo {article_id}: {e}")
            return None

    def get_collection_stats(self) -> Dict[str, Any]:
        """
        Obtiene estadísticas de la colección

        Returns:
            Diccionario con estadísticas
        """
        try:
            count = self.collection.count()
            return {
                "collection_name": self.collection_name,
                "total_documents": count,
                "model_name": self.model_name,
                "persist_directory": self.persist_directory
            }
        except Exception as e:
            logger.error(f"Error al obtener estadísticas: {e}")
            return {}

    def reset_collection(self):
        """Elimina todos los documentos de la colección"""
        try:
            logger.info("Reseteando colección...")
            self.client.delete_collection(name=self.collection_name)
            self.collection = self.client.create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
            logger.info("Colección reseteada exitosamente")
        except Exception as e:
            logger.error(f"Error al resetear colección: {e}")
            raise

    def get_random_articles(self, count: int = 20) -> List[Dict[str, Any]]:
        """
        Obtiene una cantidad específica de artículos aleatorios

        Args:
            count: Número de artículos aleatorios a obtener

        Returns:
            Lista de artículos aleatorios
        """
        try:
            # Obtener el total de documentos
            total_count = self.collection.count()
            
            if total_count == 0:
                return []
            
            # Obtener todos los artículos primero
            all_results = self.collection.get(
                include=['documents', 'metadatas']
            )
            
            if not all_results['documents']:
                return []
            
            # Crear lista de artículos con su información completa
            articles = []
            for i in range(len(all_results['documents'])):
                articles.append({
                    "id": all_results['metadatas'][i]['id'],
                    "contenido": all_results['documents'][i]
                })
            
            # Seleccionar aleatoriamente la cantidad solicitada
            selected_count = min(count, len(articles))
            random_articles = random.sample(articles, selected_count)
            
            logger.info(f"Seleccionados {len(random_articles)} artículos aleatorios de {total_count} disponibles")
            return random_articles
            
        except Exception as e:
            logger.error(f"Error al obtener artículos aleatorios: {e}")
            return []
