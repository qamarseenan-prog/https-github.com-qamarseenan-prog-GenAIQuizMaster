import React, { useState, useEffect, useRef } from 'react';
import { generateQuizQuestions } from './services/geminiService';
import { QuizQuestion, GameState, UserAnswer } from './types';
import { Button } from './components/Button';
import { ProgressBar } from './components/ProgressBar';
import { LucideBrain, LucideRefreshCw, LucideCheckCircle, LucideXCircle, LucideTrophy, LucideLoader2, LucideChevronRight } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.INTRO);
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  const startQuiz = async () => {
    setGameState(GameState.LOADING);
    setErrorMsg(null);
    try {
      const generatedQuestions = await generateQuizQuestions(topic);
      if (!generatedQuestions || generatedQuestions.length === 0) {
        throw new Error("No questions generated.");
      }
      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
      setGameState(GameState.PLAYING);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to generate questions. Please try again.");
      setGameState(GameState.ERROR);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (isAnswerRevealed) return;
    setSelectedOption(option);
  };

  const handleConfirmAnswer = () => {
    if (!selectedOption || isAnswerRevealed) return;
    
    setIsAnswerRevealed(true);
    const currentQ = questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQ.answer;

    setUserAnswers(prev => [
      ...prev,
      {
        questionId: currentQ.id,
        selectedOption,
        isCorrect
      }
    ]);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
    } else {
      setGameState(GameState.RESULTS);
    }
  };

  const calculateScore = () => {
    return userAnswers.filter(a => a.isCorrect).length;
  };

  const resetGame = () => {
    setGameState(GameState.INTRO);
    setTopic('');
    setQuestions([]);
    setUserAnswers([]);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerRevealed(false);
  };

  // Intro Screen
  if (gameState === GameState.INTRO) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel w-full max-w-lg p-8 rounded-3xl shadow-2xl text-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <LucideBrain className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold mb-3 text-slate-800 tracking-tight">Quiz Master</h1>
          <p className="text-slate-500 mb-8 text-lg">
            Challenge yourself with AI-generated trivia. Enter any topic below!
          </p>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="e.g., Quantum Physics, 90s Pop Music, World History"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-lg bg-white/50"
                onKeyDown={(e) => e.key === 'Enter' && startQuiz()}
              />
            </div>
            
            <Button onClick={startQuiz} fullWidth size="lg">
              Start Quiz
            </Button>
            
            <div className="text-sm text-slate-400 pt-4">
              Powered by Google Gemini 2.5 Flash
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading Screen
  if (gameState === GameState.LOADING) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-white">
        <LucideLoader2 className="w-16 h-16 animate-spin mb-6 text-white/80" />
        <h2 className="text-2xl font-semibold mb-2">Generating your quiz...</h2>
        <p className="text-white/70">Crafting questions about "{topic || 'General Knowledge'}"</p>
      </div>
    );
  }

  // Error Screen
  if (gameState === GameState.ERROR) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel w-full max-w-md p-8 rounded-2xl shadow-xl text-center">
          <LucideXCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Oops! Something went wrong.</h2>
          <p className="text-slate-600 mb-6">{errorMsg}</p>
          <Button onClick={resetGame} variant="secondary">Try Again</Button>
        </div>
      </div>
    );
  }

  // Results Screen
  if (gameState === GameState.RESULTS) {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4 py-12">
        <div className="glass-panel w-full max-w-2xl p-8 rounded-3xl shadow-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-yellow-100 rounded-full mb-6 relative">
              <LucideTrophy className="w-12 h-12 text-yellow-600" />
              <div className="absolute -bottom-2 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                {percentage}%
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Quiz Complete!</h2>
            <p className="text-slate-500 text-lg">
              You scored <span className="font-bold text-indigo-600">{score}</span> out of <span className="font-bold">{questions.length}</span>
            </p>
          </div>

          <div className="space-y-4 mb-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            {questions.map((q, idx) => {
              const userAnswer = userAnswers.find(a => a.questionId === q.id);
              const isCorrect = userAnswer?.isCorrect;
              
              return (
                <div key={q.id} className={`p-5 rounded-xl border-l-4 ${isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {isCorrect ? (
                        <LucideCheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <LucideXCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 text-sm mb-1">
                        <span className="opacity-50 mr-2">#{idx + 1}</span>
                        {q.question}
                      </p>
                      <p className="text-sm text-slate-600">
                        Correct: <span className="font-medium">{q.answer}</span>
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-red-500 mt-1">
                          You chose: <span className="font-medium">{userAnswer?.selectedOption}</span>
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-2 italic border-t border-slate-200 pt-2">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4">
            <Button onClick={resetGame} fullWidth variant="primary">
              <span className="flex items-center justify-center gap-2">
                <LucideRefreshCw className="w-4 h-4" /> Play Again
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Playing Screen
  const currentQ = questions[currentQuestionIndex];
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-2xl p-6 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden transition-all">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Question {currentQuestionIndex + 1} / {questions.length}
          </span>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wide">
            {topic || "General"}
          </span>
        </div>

        <ProgressBar current={currentQuestionIndex + 1} total={questions.length} />

        {/* Question */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">
            {currentQ.question}
          </h2>
        </div>

        {/* Options */}
        <div className="grid gap-3 mb-8">
          {currentQ.options.map((option, idx) => {
            let stateClass = "border-slate-200 hover:border-indigo-400 hover:bg-slate-50"; // Default
            
            if (isAnswerRevealed) {
              if (option === currentQ.answer) {
                stateClass = "border-green-500 bg-green-50 text-green-700"; // Correct answer (always show)
              } else if (option === selectedOption && option !== currentQ.answer) {
                stateClass = "border-red-500 bg-red-50 text-red-700"; // User wrong selection
              } else {
                stateClass = "border-slate-100 opacity-50"; // Other irrelevants
              }
            } else if (selectedOption === option) {
              stateClass = "border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200"; // Selected but not confirmed
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(option)}
                disabled={isAnswerRevealed}
                className={`w-full p-4 md:p-5 text-left rounded-xl border-2 font-medium text-lg transition-all duration-200 flex items-center justify-between group ${stateClass}`}
              >
                <span>{option}</span>
                {isAnswerRevealed && option === currentQ.answer && (
                  <LucideCheckCircle className="w-6 h-6 text-green-600" />
                )}
                {isAnswerRevealed && option === selectedOption && option !== currentQ.answer && (
                  <LucideXCircle className="w-6 h-6 text-red-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          {!isAnswerRevealed ? (
            <Button 
              onClick={handleConfirmAnswer} 
              disabled={!selectedOption}
              className="w-full md:w-auto min-w-[140px]"
            >
              Submit Answer
            </Button>
          ) : (
            <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="mb-4 p-4 bg-indigo-50 rounded-xl text-sm text-indigo-900 border border-indigo-100 flex gap-3 items-start">
                  <LucideBrain className="w-5 h-5 flex-shrink-0 mt-0.5 text-indigo-600" />
                  <div>
                    <span className="font-bold block mb-1">Explanation:</span>
                    {currentQ.explanation}
                  </div>
               </div>
               <div className="flex justify-end">
                <Button onClick={handleNextQuestion} className="w-full md:w-auto min-w-[140px] flex items-center justify-center gap-2 group">
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
                  <LucideChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
