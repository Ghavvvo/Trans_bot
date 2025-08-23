import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface SearchResult {
  id: number;
  contenido: string;
  similarity_score: number;
  distance: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
}

export interface Article {
  id: number;
  contenido: string;
}

export interface HealthResponse {
  status: string;
  database_ready: boolean;
  total_articles: number;
  rag_enabled?: boolean;
  llm_provider?: string;
}

// Nuevas interfaces para RAG
export interface RAGSource {
  id: number;
  contenido: string;
  similarity_score: number;
  relevance: string;
}

export interface RAGResponse {
  query: string;
  response: string;
  sources: RAGSource[];
  confidence: number;
  model_used?: string;
  articles_consulted?: number;
  error?: string;
}

export interface RAGInfo {
  service_type: string;
  llm_provider: string;
  model: string;
  embedding_model: string;
  total_articles: number;
  capabilities: string[];
}

export const apiService = {
  // Verificar estado de la API
  checkHealth: async (): Promise<HealthResponse> => {
    const response = await api.get('/health');
    return response.data;
  },

  // **NUEVO**: Chat RAG - Endpoint principal para respuestas conversacionales
  chatWithRAG: async (query: string, maxArticles: number = 5): Promise<RAGResponse> => {
    const response = await api.post('/chat', { query, max_articles: maxArticles });
    return response.data;
  },

  // **NUEVO**: Obtener información del sistema RAG
  getRAGInfo: async (): Promise<RAGInfo> => {
    const response = await api.get('/rag/info');
    return response.data;
  },

  // Buscar artículos por consulta (modo compatibilidad)
  searchArticles: async (query: string, n_results: number = 5): Promise<SearchResponse> => {
    const response = await api.post('/search', { query, n_results });
    return response.data;
  },

  // Obtener artículo específico por ID
  getArticle: async (articleId: number): Promise<Article> => {
    const response = await api.get(`/articles/${articleId}`);
    return response.data;
  },

  // Obtener estadísticas de la base de datos
  getStats: async () => {
    const response = await api.get('/stats');
    return response.data;
  }
};
