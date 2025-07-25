import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionService, testService } from '../services/api';
import { Test, Question } from '../types';

const TestPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [testStarted, setTestStarted] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (testStarted && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (testStarted && timeRemaining === 0) {
      handleSubmitTest();
    }
  }, [timeRemaining, testStarted]);

  const loadCategories = async () => {
    try {
      const cats = await questionService.getCategories();
      setCategories(['all', ...cats]);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const startTest = async () => {
    setLoading(true);
    try {
      const test = await testService.generateTest(selectedCategory, numQuestions, 'exam');
      setCurrentTest(test);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTimeRemaining(numQuestions * 60); // 1 minuto por pregunta
      setTestStarted(true);
    } catch (error) {
      console.error('Error generating test:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId.toString()]: answer
    }));
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleSubmitTest = async () => {
    if (!currentTest) return;

    setLoading(true);
    try {
      const result = await testService.submitTest(answers, 'exam', selectedCategory);
      navigate('/results', { state: { result, test: currentTest, answers } });
    } catch (error) {
      console.error('Error submitting test:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!testStarted) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Examen Simulado</h1>

        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Configuración del Examen</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'Todas las categorías' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de preguntas:
              </label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="input-field"
              >
                <option value={10}>10 preguntas</option>
                <option value={20}>20 preguntas</option>
                <option value={30}>30 preguntas</option>
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Instrucciones del Examen:</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Tienes {numQuestions} minutos para completar el examen (1 minuto por pregunta)</li>
              <li>• Una vez iniciado, no podrás pausar el tiempo</li>
              <li>• Puedes navegar entre preguntas libremente</li>
              <li>• Necesitas 80% o más para aprobar</li>
              <li>• Revisa todas tus respuestas antes de enviar</li>
            </ul>
          </div>

          <button
            onClick={startTest}
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generando examen...' : 'Iniciar Examen'}
          </button>
        </div>
      </div>
    );
  }

  if (!currentTest || loading) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="card">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Procesando...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = currentTest.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / currentTest.questions.length) * 100;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with timer and progress */}
      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Examen Simulado</h1>
          <div className={`text-xl font-bold ${timeRemaining < 300 ? 'text-danger-600' : 'text-primary-600'}`}>
            ⏱ {formatTime(timeRemaining)}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Pregunta {currentQuestionIndex + 1} de {currentTest.questions.length}</span>
            <span>{Math.round(progress)}% completado</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Question Navigator */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Navegación</h3>
            <div className="grid grid-cols-5 lg:grid-cols-3 gap-2">
              {currentTest.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    index === currentQuestionIndex
                      ? 'bg-primary-500 text-white'
                      : answers[currentTest.questions[index].id.toString()]
                      ? 'bg-success-100 text-success-700 border border-success-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <div className="mt-4 text-sm">
              <div className="flex items-center mb-2">
                <div className="w-4 h-4 bg-success-100 border border-success-300 rounded mr-2"></div>
                <span className="text-gray-600">Respondida</span>
              </div>
              <div className="flex items-center mb-2">
                <div className="w-4 h-4 bg-primary-500 rounded mr-2"></div>
                <span className="text-gray-600">Actual</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-2"></div>
                <span className="text-gray-600">Sin responder</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Question */}
        <div className="lg:col-span-3">
          <div className="card">
            <div className="mb-6">
              <div className="flex justify-between items-start mb-4">
                <span className="inline-block bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {currentQuestion.category}
                </span>
                <span className="inline-block bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Pregunta {currentQuestionIndex + 1}
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
                    answers[currentQuestion.id.toString()] === key
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={key}
                    checked={answers[currentQuestion.id.toString()] === key}
                    onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
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

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                onClick={() => goToQuestion(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>

              {currentQuestionIndex === currentTest.questions.length - 1 ? (
                <button
                  onClick={handleSubmitTest}
                  className="btn-primary bg-success-500 hover:bg-success-600"
                >
                  Finalizar Examen
                </button>
              ) : (
                <button
                  onClick={() => goToQuestion(Math.min(currentTest.questions.length - 1, currentQuestionIndex + 1))}
                  className="btn-primary"
                >
                  Siguiente →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
