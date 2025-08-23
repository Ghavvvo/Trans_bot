"""
Servicio RAG (Retrieval-Augmented Generation) usando Mistral AI
"""

import os
from typing import Dict, Any, List
import logging
from mistralai import Mistral
from .embedding_service import EmbeddingService

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self, mistral_api_key: str, embedding_service: EmbeddingService):
        """
        Inicializa el servicio RAG con Mistral AI

        Args:
            mistral_api_key: API key de Mistral AI
            embedding_service: Servicio de embeddings ya inicializado
        """
        self.mistral_client = Mistral(api_key=mistral_api_key)
        self.embedding_service = embedding_service
        self.model = "mistral-small-latest"  # Modelo eficiente y rápido
        
        logger.info("RAG Service inicializado con Mistral AI")

    def _create_system_prompt(self) -> str:
        """Crea el prompt del sistema para instruir al LLM"""
        return """Eres un asistente especializado en la Ley 109 - Código de Seguridad Vial de Cuba. 

Tu función es ayudar a los usuarios respondiendo preguntas sobre esta legislación de tránsito de manera clara, precisa y útil.

INSTRUCCIONES IMPORTANTES:
1. Responde ÚNICAMENTE basándote en los artículos proporcionados como contexto
2. Si la información no está en los artículos proporcionados, indícalo claramente
3. Cita siempre los números de artículos relevantes en tu respuesta
4. Sé claro, conciso y directo
5. Usa un lenguaje profesional pero accesible
6. Estructura tu respuesta de manera organizada
7. Si hay múltiples artículos relevantes, organiza la información lógicamente

FORMATO DE RESPUESTA:
- Comienza con una respuesta directa a la pregunta
- Incluye los detalles específicos de los artículos
- Menciona los números de artículos consultados
- Si es necesario, proporciona contexto adicional

Recuerda: Tu objetivo es ser un consultor legal confiable y preciso para temas de tránsito en Cuba."""

    def _create_user_prompt(self, query: str, articles: List[Dict[str, Any]]) -> str:
        """
        Crea el prompt del usuario con la consulta y el contexto de artículos

        Args:
            query: Pregunta del usuario
            articles: Lista de artículos relevantes encontrados

        Returns:
            Prompt formateado para el usuario
        """
        context = "\n\n".join([
            f"**Artículo {article['id']}:**\n{article['contenido']}"
            for article in articles
        ])

        return f"""CONTEXTO (Artículos de la Ley 109):
{context}

PREGUNTA DEL USUARIO:
{query}

Por favor, responde basándote únicamente en los artículos proporcionados arriba."""

    async def generate_response(self, query: str, max_articles: int = 5) -> Dict[str, Any]:
        """
        Genera una respuesta RAG completa para la consulta del usuario

        Args:
            query: Pregunta del usuario
            max_articles: Número máximo de artículos a recuperar

        Returns:
            Diccionario con la respuesta generada y metadatos
        """
        try:
            logger.info(f"Generando respuesta RAG para: '{query[:50]}...'")

            # 1. RETRIEVAL: Buscar artículos relevantes
            search_results = self.embedding_service.search_similar_articles(
                query, max_articles
            )

            if not search_results["results"]:
                return {
                    "query": query,
                    "response": "Lo siento, no encontré información relevante en la Ley 109 para responder tu consulta. Intenta reformular tu pregunta o usar términos más específicos.",
                    "sources": [],
                    "confidence": 0.0
                }

            # 2. GENERATION: Generar respuesta con Mistral
            system_prompt = self._create_system_prompt()
            user_prompt = self._create_user_prompt(query, search_results["results"])

            # Llamada a Mistral AI
            response = self.mistral_client.chat.complete(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,  # Respuestas más deterministas para temas legales
                max_tokens=1000
            )

            generated_text = response.choices[0].message.content

            # 3. Preparar respuesta con metadatos
            sources = []
            for article in search_results["results"]:
                sources.append({
                    "id": article["id"],
                    "contenido": article["contenido"],
                    "similarity_score": article["similarity_score"],
                    "relevance": "Alta" if article["similarity_score"] > 0.7 else 
                               "Media" if article["similarity_score"] > 0.5 else "Baja"
                })

            # Calcular confianza promedio
            avg_confidence = sum(s["similarity_score"] for s in sources) / len(sources) if sources else 0

            result = {
                "query": query,
                "response": generated_text,
                "sources": sources,
                "confidence": avg_confidence,
                "model_used": self.model,
                "articles_consulted": len(sources)
            }

            logger.info(f"Respuesta RAG generada exitosamente. Artículos consultados: {len(sources)}")
            return result

        except Exception as e:
            logger.error(f"Error en generación RAG: {e}")
            return {
                "query": query,
                "response": f"Lo siento, ocurrió un error al procesar tu consulta: {str(e)}",
                "sources": [],
                "confidence": 0.0,
                "error": str(e)
            }

    def get_service_info(self) -> Dict[str, Any]:
        """Obtiene información sobre el servicio RAG"""
        embedding_stats = self.embedding_service.get_collection_stats()
        
        return {
            "service_type": "RAG (Retrieval-Augmented Generation)",
            "llm_provider": "Mistral AI",
            "model": self.model,
            "embedding_model": embedding_stats.get("model_name", "N/A"),
            "total_articles": embedding_stats.get("total_documents", 0),
            "capabilities": [
                "Búsqueda semántica",
                "Generación de respuestas conversacionales",
                "Citas de artículos específicos",
                "Respuestas contextualizadas"
            ]
        }
