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
}

export const apiService = {
  // Verificar estado de la API
  checkHealth: async (): Promise<HealthResponse> => {
    const response = await api.get('/health');
    return response.data;
  },

  // Buscar artículos por consulta
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
