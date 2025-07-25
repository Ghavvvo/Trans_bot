import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { healthService, statsService } from '../services/api';

const Home: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    checkApiConnection();
    loadStats();
  }, []);

  const checkApiConnection = async () => {
    try {
      await healthService.checkHealth();
      setApiStatus('connected');
    } catch (error) {
      setApiStatus('error');
    }
  };

  const loadStats = async () => {
    try {
      const data = await statsService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Bienvenido a <span className="text-primary-600">TransBot</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Tu asistente inteligente para preparar el examen teórico de tránsito.
          Practica con preguntas reales y mejora tu conocimiento vial.
        </p>

        {/* API Status */}
        <div className="mb-8">
          {apiStatus === 'loading' && (
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
              <span>Conectando con el servidor...</span>
            </div>
          )}
          {apiStatus === 'connected' && (
            <div className="flex items-center justify-center space-x-2 text-success-600">
              <div className="w-2 h-2 bg-success-500 rounded-full"></div>
              <span>Servidor conectado</span>
            </div>
          )}
          {apiStatus === 'error' && (
            <div className="flex items-center justify-center space-x-2 text-danger-600">
              <div className="w-2 h-2 bg-danger-500 rounded-full"></div>
              <span>Error de conexión con el servidor</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="card hover:shadow-xl transition-shadow duration-300">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Modo Práctica</h3>
            <p className="text-gray-600 mb-6">
              Practica con preguntas individuales, recibe retroalimentación inmediata
              y aprende de tus errores.
            </p>
            <Link to="/practice" className="btn-primary inline-block">
              Comenzar Práctica
            </Link>
          </div>
        </div>

        <div className="card hover:shadow-xl transition-shadow duration-300">
          <div className="text-center">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Examen Simulado</h3>
            <p className="text-gray-600 mb-6">
              Toma un examen completo como el real. Pon a prueba tus conocimientos
              en condiciones similares al examen oficial.
            </p>
            <Link to="/test" className="btn-primary inline-block">
              Tomar Examen
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="card">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Estadísticas del Sistema</h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-600">{stats.total_questions}</div>
              <div className="text-gray-600">Preguntas Disponibles</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-success-600">{stats.recent_results?.length || 0}</div>
              <div className="text-gray-600">Exámenes Recientes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-600">5</div>
              <div className="text-gray-600">Categorías</div>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="mt-12">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Características</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Preguntas Actualizadas</h4>
            <p className="text-gray-600 text-sm">Base de datos actualizada con las últimas regulaciones de tránsito</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Seguimiento de Progreso</h4>
            <p className="text-gray-600 text-sm">Monitorea tu avance y mejora continua en diferentes categorías</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Responsive Design</h4>
            <p className="text-gray-600 text-sm">Estudia desde cualquier dispositivo, en cualquier momento</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
