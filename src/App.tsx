/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppScreen, StudentInfo, QuestionAnswer, GameResult } from './types';
import { StudentInfoScreen } from './components/StudentInfoScreen';
import { QuizView } from './components/QuizView';
import { FeedbackView } from './components/FeedbackView';
import { InfiniteStairsGame } from './components/InfiniteStairsGame';
import { GameResultView } from './components/GameResultView';
import { TeacherSettingsModal } from './components/TeacherSettingsModal';
import { submitQuizScoreToGoogleSheet, submitGameScoreToGoogleSheet } from './config';
import { Settings, GraduationCap } from 'lucide-react';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('student_info');
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  
  // Attempt tracking: 1 = first attempt, 2 = second attempt
  const [attempt, setAttempt] = useState<1 | 2>(1);
  const [, setAttempt1Score] = useState<number | null>(null);
  const [, setAttempt2Score] = useState<number | null>(null);

  // Current answers & score
  const [currentAnswers, setCurrentAnswers] = useState<QuestionAnswer[]>([]);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [sheetStatus, setSheetStatus] = useState<{ success: boolean; message: string }>({
    success: true,
    message: '준비 완료',
  });

  // Game result
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  // Teacher settings modal
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState<boolean>(false);

  // Start Quiz with Student Info
  const handleStartQuiz = (info: StudentInfo) => {
    setStudentInfo(info);
    setAttempt(1);
    setAttempt1Score(null);
    setAttempt2Score(null);
    setCurrentAnswers([]);
    setCurrentScore(0);
    setScreen('quiz');
  };

  // Submit Quiz (Attempt 1 or 2)
  const handleSubmitQuiz = async (answers: QuestionAnswer[], score: number) => {
    setCurrentAnswers(answers);
    setCurrentScore(score);

    if (attempt === 1) {
      setAttempt1Score(score);
    } else {
      setAttempt2Score(score);
    }

    // Submit quiz score to Google Sheet immediately via Apps Script
    if (studentInfo) {
      setSheetStatus({ success: true, message: '구글 시트로 퀴즈점수 전송 중...' });
      const res = await submitQuizScoreToGoogleSheet({
        classRoom: studentInfo.classRoom,
        studentId: studentInfo.studentId,
        name: studentInfo.name,
        quizScore: score,
        attempt: attempt,
      });
      setSheetStatus(res);
    }

    setScreen('feedback');
  };

  // 11 questions or fewer: retry quiz (Attempt 2)
  const handleRetryQuiz = () => {
    setAttempt(2);
    setCurrentAnswers([]);
    setScreen('quiz');
  };

  // 12 questions or more: start game
  const handleGoToGame = () => {
    setScreen('game');
  };

  // Game over (after 30 seconds)
  const handleGameOver = async (result: GameResult) => {
    setGameResult(result);
    setScreen('game_result');

    // Automatically submit game score to Google Sheet (학번, 이름, 퀴즈점수, 게임점수)
    if (studentInfo) {
      await submitGameScoreToGoogleSheet({
        classRoom: studentInfo.classRoom,
        studentId: studentInfo.studentId,
        name: studentInfo.name,
        gameScore: result.steps,
        quizScore: currentScore,
      });
    }
  };

  // Reset to initial screen for next student
  const handleRestartAll = () => {
    setScreen('student_info');
    setStudentInfo(null);
    setAttempt(1);
    setAttempt1Score(null);
    setAttempt2Score(null);
    setCurrentAnswers([]);
    setGameResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-gray-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Universal Top Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-gray-900 tracking-tight">
                선거와 민주 정치 (p.183~184)
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                15문항 퀴즈 & 무한의 계단
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {studentInfo && screen !== 'student_info' && (
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-xl">
                <span className="text-indigo-600 font-bold">{studentInfo.classRoom}</span>
                <span>{studentInfo.studentId}번</span>
                <span className="font-bold text-gray-900">{studentInfo.name}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsTeacherModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 hover:text-indigo-600 transition"
              title="교사용 구글 시트 연동 설정"
            >
              <Settings className="w-3.5 h-3.5 text-gray-500" />
              <span>교사용 설정</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-6">
        {screen === 'student_info' && (
          <StudentInfoScreen onStart={handleStartQuiz} savedInfo={studentInfo} />
        )}

        {screen === 'quiz' && studentInfo && (
          <QuizView
            studentInfo={studentInfo}
            attempt={attempt}
            onSubmit={handleSubmitQuiz}
            onResetStudent={() => setScreen('student_info')}
          />
        )}

        {screen === 'feedback' && studentInfo && (
          <FeedbackView
            studentInfo={studentInfo}
            attempt={attempt}
            score={currentScore}
            answers={currentAnswers}
            sheetStatus={sheetStatus}
            onGoToGame={handleGoToGame}
            onRetryQuiz={handleRetryQuiz}
          />
        )}

        {screen === 'game' && studentInfo && (
          <div className="w-full max-w-4xl mx-auto py-1 sm:py-3 flex-1 flex flex-col justify-center">
            <InfiniteStairsGame
              onGameOver={handleGameOver}
              studentName={studentInfo.name}
            />
          </div>
        )}

        {screen === 'game_result' && studentInfo && gameResult && (
          <GameResultView
            studentInfo={studentInfo}
            quizScore={currentScore}
            attempt={attempt}
            gameResult={gameResult}
            onRestartAll={handleRestartAll}
            onReviewQuiz={() => setScreen('feedback')}
          />
        )}
      </main>

      {/* Teacher Settings Modal */}
      <TeacherSettingsModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
      />
    </div>
  );
}
