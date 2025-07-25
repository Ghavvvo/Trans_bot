import axios from 'axios';
import type { Question } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Verificar estado de la API
  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Obtener preguntas
  getQuestions: async (): Promise<Question[]> => {
    const response = await api.get('/questions');
    return response.data;
  },

  // Obtener estadísticas
  getStats: async () => {
    const response = await api.get('/stats');
    return response.data;
  }
};

