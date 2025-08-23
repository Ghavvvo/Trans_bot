import React, { useState, useEffect } from 'react';
import { apiService, type SearchResponse, type HealthResponse } from '../services/api';

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    // Verificar el estado de la base de datos al cargar
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const healthData = await apiService.checkHealth();
      setHealth(healthData);
    } catch (err) {
      console.error('Error checking health:', err);
      setError('No se pudo conectar con el servidor');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const searchResults = await apiService.searchArticles(query, 5);
      setResults(searchResults);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al realizar la búsqueda');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ?
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark> :
        part
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Consultor de la Ley 109 - Código de Seguridad Vial
          </h1>
          <p className="text-lg text-gray-600">
            Realiza consultas sobre la legislación de tránsito cubana
          </p>
        </div>

        {/* Estado de la base de datos */}
        {health && (
          <div className={`mb-6 p-4 rounded-lg ${
            health.database_ready ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'
          } border`}>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                health.database_ready ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className={`font-medium ${
                health.database_ready ? 'text-green-800' : 'text-red-800'
              }`}>
                {health.database_ready
                  ? `Base de datos lista (${health.total_articles} artículos)`
                  : 'Base de datos no disponible'
                }
              </span>
            </div>
          </div>
        )}

        {/* Formulario de búsqueda */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escribe tu consulta sobre la Ley 109 (ej: velocidad máxima, semáforos, infracciones...)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading || !health?.database_ready}
            />
            <button
              type="submit"
              disabled={loading || !query.trim() || !health?.database_ready}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Resultados */}
        {results && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Resultados para: "{results.query}"
              </h2>
              <span className="text-sm text-gray-500">
                {results.results.length} artículos encontrados
              </span>
            </div>

            {results.results.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No se encontraron artículos relacionados con tu consulta.</p>
                <p className="text-sm mt-2">Intenta con otros términos o frases más generales.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.results.map((result, index) => (
                  <div key={result.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Artículo {result.id}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {Math.round(result.similarity_score * 100)}% relevancia
                        </span>
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {highlightText(result.contenido, query)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ejemplos de consultas */}
        {!results && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ejemplos de consultas que puedes hacer:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "¿Cuál es la velocidad máxima permitida?",
                "Regulaciones sobre semáforos",
                "Infracciones de tránsito",
                "Licencia de conducción",
                "Estacionamiento prohibido",
                "Señales de tránsito",
                "Alcohol y conducción",
                "Vehículos de emergencia"
              ].map((example, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(example)}
                  className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors"
                  disabled={!health?.database_ready}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
