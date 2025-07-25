import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { Question } from '../types';

const LandingPage: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [stats, setStats] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState<boolean>(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    checkApiConnection();
    loadStats();
    loadQuestions();
  }, []);

  const checkApiConnection = async () => {
    try {
      await apiService.checkHealth();
      setApiStatus('connected');
    } catch (error) {
      setApiStatus('error');
    }
  };

  const loadStats = async () => {
    try {
      const data = await apiService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadQuestions = async () => {
    try {
      const data = await apiService.getQuestions();
      setQuestions(data);
      if (data.length > 0) {
        setCurrentQuestion(data[0]);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const handleAnswerSubmit = () => {
    if (!currentQuestion || !selectedAnswer) return;

    const isCorrect = currentQuestion.correct_answer === selectedAnswer;
    setShowResult(true);

    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));
  };

  const handleNextQuestion = () => {
    const currentIndex = questions.findIndex(q => q.id === currentQuestion?.id);
    const nextIndex = (currentIndex + 1) % questions.length;
    setCurrentQuestion(questions[nextIndex]);
    setSelectedAnswer('');
    setShowResult(false);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-2xl font-bold text-gray-800">TransBot</span>
            </div>

            {/* API Status */}
            <div>
              {apiStatus === 'loading' && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                  <span className="text-sm">Conectando...</span>
                </div>
              )}
              {apiStatus === 'connected' && (
                <div className="flex items-center space-x-2 text-success-600">
                  <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                  <span className="text-sm">Conectado</span>
                </div>
              )}
              {apiStatus === 'error' && (
                <div className="flex items-center space-x-2 text-danger-600">
                  <div className="w-2 h-2 bg-danger-500 rounded-full"></div>
                  <span className="text-sm">Sin conexión</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Bienvenido a <span className="text-primary-600">TransBot</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Tu asistente inteligente para preparar el examen teórico de tránsito.
            Practica con preguntas reales y mejora tu conocimiento vial.
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="card text-center">
              <div className="text-3xl font-bold text-primary-600">{stats.total_questions}</div>
              <div className="text-gray-600">Preguntas Disponibles</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-success-600">{score.correct}/{score.total}</div>
              <div className="text-gray-600">Tu Puntuación</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-gray-600">
                {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
              </div>
              <div className="text-gray-600">Precisión</div>
            </div>
          </div>
        )}

        {/* Question Section */}
        {currentQuestion && (
          <div className="max-w-4xl mx-auto">
            <div className="card mb-6">
              <div className="mb-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-block bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {currentQuestion.category}
                  </span>
                  <span className="inline-block bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Pregunta {currentQuestion.id}
                  </span>
                </div>

                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {currentQuestion.text}
                </h2>
              </div>

              {/* Answer Options */}
              <div className="space-y-3 mb-6">
                {Object.entries(currentQuestion.options).map(([key, value]) => (
                  <label
                    key={key}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedAnswer === key
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${
                      showResult
                        ? currentQuestion.correct_answer === key
                          ? 'border-success-500 bg-success-50'
                          : selectedAnswer === key && currentQuestion.correct_answer !== key
                          ? 'border-danger-500 bg-danger-50'
                          : 'border-gray-200 bg-gray-50'
                        : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={key}
                      checked={selectedAnswer === key}
                      onChange={(e) => setSelectedAnswer(e.target.value)}
                      disabled={showResult}
                      className="mr-3"
                    />
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700 mr-3">
                        {key.toUpperCase()})
                      </span>
                      <span className="text-gray-800">{value}</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Result */}
              {showResult && (
                <div className={`p-4 rounded-lg mb-6 ${
                  currentQuestion.correct_answer === selectedAnswer 
                    ? 'bg-success-50 border border-success-200' 
                    : 'bg-danger-50 border border-danger-200'
                }`}>
                  <div className="flex items-center mb-2">
                    {currentQuestion.correct_answer === selectedAnswer ? (
                      <svg className="w-5 h-5 text-success-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-danger-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={`font-medium ${
                      currentQuestion.correct_answer === selectedAnswer ? 'text-success-800' : 'text-danger-800'
                    }`}>
                      {currentQuestion.correct_answer === selectedAnswer ? '¡Correcto!' : 'Incorrecto'}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    currentQuestion.correct_answer === selectedAnswer ? 'text-success-700' : 'text-danger-700'
                  }`}>
                    La respuesta correcta es {currentQuestion.correct_answer.toUpperCase()})
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between">
                {!showResult ? (
                  <button
                    onClick={handleAnswerSubmit}
                    disabled={!selectedAnswer}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Verificar Respuesta
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="btn-primary"
                  >
                    Siguiente Pregunta
                  </button>
                )}

                <button
                  onClick={() => setScore({ correct: 0, total: 0 })}
                  className="btn-secondary"
                >
                  Reiniciar Puntuación
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Características</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Preguntas Reales</h4>
              <p className="text-gray-600 text-sm">Practica con preguntas similares al examen oficial</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Retroalimentación Inmediata</h4>
              <p className="text-gray-600 text-sm">Aprende de tus errores al instante</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Fácil de Usar</h4>
              <p className="text-gray-600 text-sm">Interfaz simple e intuitiva</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold">TransBot</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2025 TransBot - Aplicación para preparación de exámenes de tránsito
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
