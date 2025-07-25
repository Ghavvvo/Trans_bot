import React, { useState, useEffect } from 'react';
import { questionService } from '../services/api';
import { Question, AnswerCheck } from '../types';

const Practice: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answerResult, setAnswerResult] = useState<AnswerCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    loadCategories();
    loadNewQuestion();
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const cats = await questionService.getCategories();
      setCategories(['all', ...cats]);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadNewQuestion = async () => {
    setLoading(true);
    setSelectedAnswer('');
    setAnswerResult(null);

    try {
      const questions = await questionService.getQuestions(selectedCategory, 1);
      if (questions.length > 0) {
        setCurrentQuestion(questions[0]);
      }
    } catch (error) {
      console.error('Error loading question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!currentQuestion || !selectedAnswer) return;

    setLoading(true);
    try {
      const result = await questionService.checkAnswer(currentQuestion.id, selectedAnswer);
      setAnswerResult(result);

      setScore(prev => ({
        correct: prev.correct + (result.correct ? 1 : 0),
        total: prev.total + 1
      }));
    } catch (error) {
      console.error('Error checking answer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    loadNewQuestion();
  };

  if (!currentQuestion && !loading) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No hay preguntas disponibles</h2>
          <p className="text-gray-600">Asegúrate de que el servidor esté ejecutándose.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Modo Práctica</h1>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field max-w-xs"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'Todas las categorías' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Score */}
          <div className="card bg-primary-50 border-primary-200 p-4">
            <div className="text-center">
              <div className="text-lg font-bold text-primary-700">
                {score.correct}/{score.total}
              </div>
              <div className="text-sm text-primary-600">
                {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}% Correctas
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Card */}
      {loading ? (
        <div className="card text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pregunta...</p>
        </div>
      ) : currentQuestion && (
        <div className="card mb-6">
          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <span className="inline-block bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {currentQuestion.category}
              </span>
              <span className="inline-block bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {currentQuestion.difficulty}
              </span>
            </div>

            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {currentQuestion.text}
            </h2>

            {currentQuestion.image_url && (
              <div className="mb-6">
                <img
                  src={currentQuestion.image_url}
                  alt="Imagen de la pregunta"
                  className="max-w-full h-auto rounded-lg border border-gray-200"
                />
              </div>
            )}
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
                  answerResult
                    ? answerResult.correct_answer === key
                      ? 'border-success-500 bg-success-50'
                      : selectedAnswer === key && !answerResult.correct
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
                  disabled={!!answerResult}
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

          {/* Answer Result */}
          {answerResult && (
            <div className={`p-4 rounded-lg mb-6 ${
              answerResult.correct ? 'bg-success-50 border border-success-200' : 'bg-danger-50 border border-danger-200'
            }`}>
              <div className="flex items-center mb-2">
                {answerResult.correct ? (
                  <svg className="w-5 h-5 text-success-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-danger-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className={`font-medium ${answerResult.correct ? 'text-success-800' : 'text-danger-800'}`}>
                  {answerResult.correct ? '¡Correcto!' : 'Incorrecto'}
                </span>
              </div>
              <p className={`text-sm ${answerResult.correct ? 'text-success-700' : 'text-danger-700'}`}>
                {answerResult.explanation}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            {!answerResult ? (
              <button
                onClick={handleAnswerSubmit}
                disabled={!selectedAnswer || loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verificando...' : 'Verificar Respuesta'}
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
      )}
    </div>
  );
};

export default Practice;
