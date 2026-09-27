import React, { useState } from 'react';
import { StudentInfo, QuestionAnswer } from '../types';
import { QUESTIONS_DATA, TOTAL_QUESTIONS, PASSING_SCORE } from '../data/questions';
import { 
  CheckCircle2, 
  XCircle, 
  Gamepad2, 
  RotateCcw, 
  Trophy, 
  AlertCircle, 
  Database,
  Eye,
  ArrowRight
} from 'lucide-react';
import { playCorrectSound, playWrongSound } from '../utils/sound';

interface Props {
  studentInfo: StudentInfo;
  attempt: 1 | 2;
  score: number;
  answers: QuestionAnswer[];
  sheetStatus: { success: boolean; message: string };
  onGoToGame: () => void;
  onRetryQuiz: () => void;
}

const NUMBER_CIRCLES = ['①', '②', '③', '④', '⑤'];

export const FeedbackView: React.FC<Props> = ({
  studentInfo,
  attempt,
  score,
  answers,
  sheetStatus,
  onGoToGame,
  onRetryQuiz,
}) => {
  const isPassed = score >= PASSING_SCORE; // score >= 12
  const [filterMode, setFilterMode] = useState<'all' | 'wrong' | 'correct'>('all');

  const wrongCount = answers.filter((a) => !a.isCorrect).length;
  const correctCount = answers.filter((a) => a.isCorrect).length;

  const filteredAnswers = answers.filter((ans) => {
    if (filterMode === 'wrong') return !ans.isCorrect;
    if (filterMode === 'correct') return ans.isCorrect;
    return true;
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 pb-20">
      {/* Top Result Banner */}
      <div
        className={`rounded-3xl border p-6 sm:p-8 text-center shadow-lg transition-all ${
          isPassed
            ? 'border-emerald-200 bg-gradient-to-b from-emerald-50 via-teal-50/40 to-white'
            : 'border-amber-200 bg-gradient-to-b from-amber-50 via-orange-50/40 to-white'
        }`}
      >
        <div className="inline-flex items-center justify-center mb-4">
          {isPassed ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-200 animate-bounce-subtle">
              <Trophy className="h-9 w-9" />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-200">
              <AlertCircle className="h-9 w-9" />
            </div>
          )}
        </div>

        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
          {studentInfo.classRoom} {studentInfo.studentId}번 {studentInfo.name} 학생의 {attempt}차 채점 결과
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
          {isPassed ? '축하합니다! 통과 기준 달성 🎉' : '아쉬워요! 재풀이 대상입니다 ⚠️'}
        </h1>

        {/* Score display */}
        <div className="my-4 inline-flex items-baseline gap-2 rounded-2xl bg-white px-6 py-3 border border-gray-200/80 shadow-sm">
          <span className="text-sm font-bold text-gray-500">취득 점수:</span>
          <span className={`text-4xl sm:text-5xl font-black ${isPassed ? 'text-emerald-600' : 'text-amber-600'}`}>
            {score}
          </span>
          <span className="text-lg font-bold text-gray-400">/ {TOTAL_QUESTIONS}점</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 ml-2">
            정답률 {Math.round((score / TOTAL_QUESTIONS) * 100)}%
          </span>
        </div>

        {/* Status explanation */}
        <p className="max-w-xl mx-auto text-sm sm:text-base font-medium text-gray-700 leading-relaxed mb-6">
          {isPassed ? (
            <>
              총 {TOTAL_QUESTIONS}문제 중 <strong className="text-emerald-700 font-bold">{score}문제</strong>를 맞혀 통과 기준(12문제 이상)을 만족했습니다!
              <br />
              약속대로 <strong>30초 동안 펼쳐지는 흥미진진한 '무한의 계단' 미니게임</strong>을 플레이할 수 있습니다.
            </>
          ) : (
            <>
              총 {TOTAL_QUESTIONS}문제 중 <strong className="text-amber-700 font-bold">{score}문제</strong>를 맞혀 11문제 이하입니다.
              <br />
              규칙에 따라 <strong>12문제 이상 맞혀야만 게임에 도전할 수 있습니다.</strong>
              <br />
              아래 오답 피드백과 해설을 꼼꼼히 확인하고 다시 도전하세요!
            </>
          )}
        </p>

        {/* Action Button: Game or Retry */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {isPassed ? (
            <button
              type="button"
              onClick={() => {
                playCorrectSound();
                onGoToGame();
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-4 text-base font-extrabold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition"
            >
              <Gamepad2 className="w-6 h-6" />
              무한의 계단 게임 시작하기 (30초)
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                playWrongSound();
                onRetryQuiz();
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-8 py-4 text-base font-extrabold text-white shadow-lg shadow-amber-600/30 hover:bg-amber-700 active:scale-95 transition"
            >
              <RotateCcw className="w-5 h-5" />
              오답 해설 확인 후 다시 풀기 (재풀이)
            </button>
          )}
        </div>

        {/* Google Sheet Sync Notice */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-100/90 px-4 py-2 text-xs text-gray-700">
          <Database className="w-3.5 h-3.5 text-indigo-600" />
          <span>
            구글 시트 [<strong>{studentInfo.classRoom}</strong>] 탭 <strong>퀴즈점수</strong>에 <strong>{score}점</strong> 기록됨
          </span>
          <span className="text-emerald-700 font-bold ml-1">({sheetStatus.message})</span>
        </div>
      </div>

      {/* Detailed Feedback & Review Section */}
      <div className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-600" />
              15문항 정답 및 해설 피드백
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              정답 {correctCount}개 / 오답 {wrongCount}개
            </p>
          </div>

          {/* Filter tabs */}
          <div className="inline-flex rounded-xl bg-gray-100 p-1 text-xs font-semibold text-gray-600">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`rounded-lg px-3 py-1.5 transition ${
                filterMode === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'hover:text-gray-900'
              }`}
            >
              전체 문항 ({TOTAL_QUESTIONS})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('wrong')}
              className={`rounded-lg px-3 py-1.5 transition ${
                filterMode === 'wrong' ? 'bg-white text-red-600 shadow-xs' : 'hover:text-gray-900'
              }`}
            >
              틀린 문제만 ({wrongCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('correct')}
              className={`rounded-lg px-3 py-1.5 transition ${
                filterMode === 'correct' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-gray-900'
              }`}
            >
              맞힌 문제 ({correctCount})
            </button>
          </div>
        </div>

        {/* Feedback Cards */}
        <div className="space-y-5">
          {filteredAnswers.map((ans) => {
            const questionItem = QUESTIONS_DATA.find((q) => q.id === ans.questionId);
            if (!questionItem) return null;

            const selectedOptionItem = questionItem.options.find((o) => o.num === ans.selectedOption);
            const correctOptionItem = questionItem.options.find((o) => o.num === questionItem.correctAnswer);

            return (
              <div
                key={ans.questionId}
                className={`rounded-2xl border p-5 transition-all bg-white ${
                  ans.isCorrect
                    ? 'border-emerald-200 shadow-xs'
                    : 'border-red-200 shadow-sm'
                }`}
              >
                {/* Header status */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2">
                    {ans.isCorrect ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-extrabold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        문제 {questionItem.id}번 정답!
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2.5 py-1 text-xs font-extrabold text-red-800">
                        <XCircle className="w-4 h-4 text-red-600" />
                        문제 {questionItem.id}번 오답 (재확인 필요)
                      </span>
                    )}
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                      {questionItem.source}
                    </span>
                  </div>
                </div>

                {/* Question Stem */}
                <h4 className="text-base font-bold text-gray-900 leading-snug mb-3">
                  {questionItem.id}. {questionItem.question}
                </h4>

                {/* Options List with Highlight */}
                <div className="space-y-1.5 mb-4 text-xs sm:text-sm">
                  {questionItem.options.map((opt) => {
                    const isCorrectOption = opt.num === questionItem.correctAnswer;
                    const isStudentChosen = opt.num === ans.selectedOption;

                    let bgClass = 'bg-gray-50 text-gray-700 border-gray-200';
                    if (isCorrectOption) {
                      bgClass = 'bg-emerald-50 text-emerald-950 font-bold border-emerald-300 ring-1 ring-emerald-400';
                    } else if (isStudentChosen && !ans.isCorrect) {
                      bgClass = 'bg-red-50 text-red-950 font-semibold border-red-300 line-through';
                    }

                    return (
                      <div
                        key={opt.num}
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${bgClass}`}
                      >
                        <span className="font-bold shrink-0">{NUMBER_CIRCLES[opt.num - 1]}</span>
                        <span className="flex-1">{opt.text}</span>
                        {isCorrectOption && (
                          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                            정답
                          </span>
                        )}
                        {isStudentChosen && !ans.isCorrect && (
                          <span className="text-xs font-extrabold text-red-700 bg-red-100 px-2 py-0.5 rounded-md shrink-0">
                            내가 고른 오답
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Answers compare brief */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                  <div className={`p-2.5 rounded-xl border ${
                    ans.isCorrect
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}>
                    <span className="font-semibold block mb-0.5">내가 선택한 답:</span>
                    <span className="text-sm font-bold">
                      {ans.selectedOption > 0
                        ? `${NUMBER_CIRCLES[ans.selectedOption - 1]} ${selectedOptionItem?.text || ''}`
                        : '(미선택)'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl border bg-indigo-50 border-indigo-200 text-indigo-900">
                    <span className="font-semibold block mb-0.5">실제 정답:</span>
                    <span className="text-sm font-extrabold text-indigo-700">
                      {NUMBER_CIRCLES[questionItem.correctAnswer - 1]} {correctOptionItem?.text}
                    </span>
                  </div>
                </div>

                {/* Explanation note */}
                <div className="text-xs text-gray-700 bg-slate-50 p-3 rounded-xl border border-gray-200 leading-relaxed">
                  <strong className="text-indigo-800 mr-1.5 font-bold">💡 내용 해설:</strong>
                  {questionItem.explanation}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom floating button */}
        <div className="mt-8 text-center">
          {isPassed ? (
            <button
              type="button"
              onClick={onGoToGame}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition"
            >
              <Gamepad2 className="w-5 h-5" />
              무한의 계단 게임하러 가기 (30초)
            </button>
          ) : (
            <button
              type="button"
              onClick={onRetryQuiz}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-amber-700 active:scale-95 transition"
            >
              <RotateCcw className="w-4 h-4" />
              오답 복습 완료! 다시 문제 풀기 (재풀이)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
