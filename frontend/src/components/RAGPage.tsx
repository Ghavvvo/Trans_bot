import React, { useState, useEffect } from 'react';
import { apiService, type RAGResponse, type HealthResponse, type RAGSource } from '../services/api';

const RAGPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [ragResponse, setRagResponse] = useState<RAGResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [showSources, setShowSources] = useState(false);

  useEffect(() => {
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

  const handleRAGChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setShowSources(false);

    try {
      const response = await apiService.chatWithRAG(query, 5);
      setRagResponse(response);
      
      if (response.error) {
        setError(response.error);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar la consulta');
      setRagResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-green-600 bg-green-100';
    if (confidence >= 0.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRelevanceColor = (relevance: string) => {
    switch (relevance.toLowerCase()) {
      case 'alta': return 'bg-green-100 text-green-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'baja': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header con información del sistema */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white p-3 rounded-full shadow-lg mr-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Asistente Legal RAG
              </h1>
              <p className="text-lg text-gray-600">
                Consulta inteligente sobre la Ley 109 - Código de Seguridad Vial
              </p>
            </div>
          </div>

          {/* Estado del sistema */}
          {health && (
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              health.rag_enabled 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                health.rag_enabled ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              {health.rag_enabled 
                ? `RAG con ${health.llm_provider} • ${health.total_articles} artículos`
                : 'Sistema en modo básico'
              }
            </div>
          )}
        </div>

        {/* Formulario de consulta */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <form onSubmit={handleRAGChat} className="space-y-4">
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                Haz tu consulta sobre la Ley 109
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ejemplo: ¿Cuáles son las sanciones por exceso de velocidad? ¿Qué dice sobre el uso del cinturón de seguridad?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={loading || !health?.rag_enabled}
              />
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {query.length}/500 caracteres
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim() || !health?.rag_enabled}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analizando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Consultar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error en la consulta</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Respuesta RAG */}
        {ragResponse && !error && (
          <div className="space-y-6">
            {/* Respuesta principal */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Respuesta del Asistente</h2>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(ragResponse.confidence)}`}>
                    {Math.round(ragResponse.confidence * 100)}% confianza
                  </div>
                </div>
                <p className="text-blue-100 mt-2">"{ragResponse.query}"</p>
              </div>
              
              <div className="p-6">
                <div className="prose max-w-none">
                  <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {ragResponse.response}
                  </div>
                </div>
                
                {/* Metadatos */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {ragResponse.articles_consulted} artículos consultados
                    </span>
                    {ragResponse.model_used && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                        </svg>
                        {ragResponse.model_used}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Fuentes consultadas - Vista minimalista */}
            {ragResponse.sources && ragResponse.sources.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Artículos Consultados ({ragResponse.sources.length})
                    </h3>
                    <button
                      onClick={() => setShowSources(!showSources)}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
                    >
                      {showSources ? 'Ocultar' : 'Ver detalles'}
                      <svg className={`w-4 h-4 ml-1 transition-transform ${showSources ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Vista compacta de artículos */}
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {ragResponse.sources.map((source: RAGSource, index) => (
                      <div key={source.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">Art. {source.id}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRelevanceColor(source.relevance)}`}>
                            {source.relevance}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {Math.round(source.similarity_score * 100)}% similitud
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Vista expandida de artículos */}
                  {showSources && (
                    <div className="mt-6 space-y-4">
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-medium text-gray-900 mb-4">Contenido completo de los artículos:</h4>
                        {ragResponse.sources.map((source: RAGSource, index) => (
                          <div key={source.id} className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-semibold text-gray-900">Artículo {source.id}</h5>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRelevanceColor(source.relevance)}`}>
                                  {source.relevance} relevancia
                                </span>
                                <span className="text-xs text-gray-500">
                                  {Math.round(source.similarity_score * 100)}%
                                </span>
                              </div>
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {source.contenido}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ejemplos de consultas */}
        {!ragResponse && !loading && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              💡 Ejemplos de preguntas que puedes hacer:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "¿Cuál es la velocidad máxima permitida en zona urbana?",
                "¿Qué sanciones hay por conducir bajo efectos del alcohol?",
                "¿Qué dice sobre el uso obligatorio del cinturón de seguridad?",
                "¿Cuáles son las normas para estacionar vehículos?",
                "¿Qué infracciones pueden llevar a la suspensión de licencia?",
                "¿Cómo deben comportarse los conductores ante semáforos?",
                "¿Qué regulaciones existen para vehículos de emergencia?",
                "¿Cuáles son los requisitos para obtener licencia de conducir?"
              ].map((example, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(example)}
                  className="text-left p-3 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 rounded-lg text-gray-700 transition-colors border border-gray-200 text-sm"
                  disabled={!health?.rag_enabled}
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

export default RAGPage;
