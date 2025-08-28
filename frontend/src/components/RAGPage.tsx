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
    if (confidence >= 0.7) return 'bg-green-50 text-green-700 border-green-200';
    if (confidence >= 0.5) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getRelevanceColor = (relevance: string) => {
    switch (relevance.toLowerCase()) {
      case 'alta': return 'bg-green-50 text-green-700 border-green-200';
      case 'media': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'baja': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-6 shadow-sm">
            <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
            Asistente Legal RAG
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Consulta inteligente sobre la Ley 109 - Código de Seguridad Vial
          </p>

          {/* Estado del sistema */}
          {health && (
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mt-6 border ${
              health.rag_enabled 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                health.rag_enabled ? 'bg-green-500' : 'bg-amber-500'
              }`}></div>
              {health.rag_enabled 
                ? `RAG con ${health.llm_provider} • ${health.total_articles} artículos`
                : 'Sistema en modo básico'
              }
            </div>
          )}
        </div>

        {/* Formulario de consulta */}
        <div className="card p-8 mb-8 animate-slide-up shadow-sm border">
          <form onSubmit={handleRAGChat} className="space-y-6">
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-foreground mb-3">
                Realiza tu consulta sobre la Ley 109
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ejemplo: ¿Cuáles son las sanciones por exceso de velocidad? ¿Qué dice sobre el uso del cinturón de seguridad?"
                className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent resize-none text-sm transition-all duration-200 placeholder:text-muted-foreground"
                rows={4}
                disabled={loading || !health?.rag_enabled}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-muted-foreground">
                  {query.length}/500 caracteres
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !query.trim() || !health?.rag_enabled}
                className="btn-primary px-6 py-3 font-medium"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analizando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="card p-4 mb-6 bg-red-50 border-red-200 animate-slide-up">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
          <div className="space-y-6 animate-slide-up">
            {/* Respuesta principal */}
            <div className="card overflow-hidden shadow-sm border">
              <div className="bg-primary p-6 text-primary-foreground">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold">Respuesta del Asistente</h2>
                  <div className={`px-3 py-1.5 rounded-full text-xs font-medium border ${getConfidenceColor(ragResponse.confidence)}`}>
                    {Math.round(ragResponse.confidence * 100)}% confianza
                  </div>
                </div>
                <p className="text-primary-foreground/80 text-sm">"{ragResponse.query}"</p>
              </div>
              
              <div className="p-6">
                <div className="prose max-w-none text-foreground leading-relaxed">
                  <div className="whitespace-pre-wrap text-sm">
                    {ragResponse.response}
                  </div>
                </div>
                
                {/* Metadatos */}
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {ragResponse.articles_consulted} artículos consultados
                    </span>
                    {ragResponse.model_used && (
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                        </svg>
                        {ragResponse.model_used}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Fuentes consultadas */}
            {ragResponse.sources && ragResponse.sources.length > 0 && (
              <div className="card shadow-sm border">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">
                      Artículos Consultados ({ragResponse.sources.length})
                    </h3>
                    <button
                      onClick={() => setShowSources(!showSources)}
                      className="btn-ghost text-xs"
                    >
                      {showSources ? 'Ocultar detalles' : 'Ver detalles'}
                      <svg className={`w-3 h-3 ml-1 transition-transform ${showSources ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {/* Vista compacta */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {ragResponse.sources.map((source: RAGSource, index) => (
                      <div key={source.id} className="bg-muted rounded-lg p-3 border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm text-foreground">Art. {source.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRelevanceColor(source.relevance)}`}>
                            {source.relevance}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(source.similarity_score * 100)}% similitud
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Vista expandida */}
                  {showSources && (
                    <div className="mt-6 space-y-4">
                      <div className="border-t border-border pt-4">
                        <h4 className="font-medium text-foreground mb-4 text-sm">Contenido completo de los artículos:</h4>
                        {ragResponse.sources.map((source: RAGSource, index) => (
                          <div key={source.id} className="bg-muted rounded-lg p-4 mb-4 border border-border">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-semibold text-foreground text-sm">Artículo {source.id}</h5>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRelevanceColor(source.relevance)}`}>
                                  {source.relevance} relevancia
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(source.similarity_score * 100)}%
                                </span>
                              </div>
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">
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
          <div className="card p-6 shadow-sm border animate-slide-up">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Ejemplos de preguntas que puedes hacer:
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
                  className="text-left p-3 bg-muted hover:bg-accent rounded-lg text-muted-foreground hover:text-accent-foreground transition-all duration-200 border border-border text-sm"
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
