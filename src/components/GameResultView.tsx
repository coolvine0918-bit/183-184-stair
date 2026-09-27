import React from 'react';
import { GameResult, StudentInfo } from '../types';
import { Trophy, Flame, Zap, RotateCcw, Award, CheckCircle } from 'lucide-react';
import { playCorrectSound } from '../utils/sound';

interface Props {
  studentInfo: StudentInfo;
  quizScore: number;
  attempt: 1 | 2;
  gameResult: GameResult;
  onRestartAll: () => void;
  onReviewQuiz: () => void;
}

export const GameResultView: React.FC<Props> = ({
  studentInfo,
  quizScore,
  gameResult,
  onRestartAll,
  onReviewQuiz,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <div className="rounded-3xl border border-indigo-200 bg-white p-6 sm:p-8 shadow-2xl text-center">
        {/* Badge */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-400/40 mb-4 animate-bounce-subtle">
          <Trophy className="h-10 w-10" />
        </div>

        <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
          30초 무한의 계단 플레이 완료!
        </div>

        <h1 className="text-3xl font-black text-gray-900 sm:text-4xl mb-2">
          {gameResult.rankTitle}
        </h1>

        <p className="text-sm text-gray-600 mb-6">
          {studentInfo.classRoom} {studentInfo.studentId}번 <strong>{studentInfo.name}</strong> 학생이 30초 동안 높이 오른 기록입니다.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6 text-left">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 sm:p-4">
            <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1 mb-1">
              <Award className="w-3.5 h-3.5" />
              오른 계단 수
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-900">
              {gameResult.steps} <span className="text-xs font-medium">층</span>
            </div>
          </div>

          <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-3.5 sm:p-4">
            <div className="text-[11px] font-bold text-orange-800 flex items-center gap-1 mb-1">
              <Flame className="w-3.5 h-3.5" />
              최대 콤보
            </div>
            <div className="text-2xl sm:text-3xl font-black text-orange-900">
              {gameResult.maxCombo} <span className="text-xs font-medium">연속</span>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-3.5 sm:p-4">
            <div className="text-[11px] font-bold text-cyan-800 flex items-center gap-1 mb-1">
              <Zap className="w-3.5 h-3.5" />
              트랩 회피
            </div>
            <div className="text-2xl sm:text-3xl font-black text-cyan-900">
              {gameResult.obstaclesDodged} <span className="text-xs font-medium">회</span>
            </div>
          </div>
        </div>

        {/* Quiz & Game Summary Box */}
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 mb-6 text-xs text-gray-700 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-left">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              📊 구글 시트 저장: <strong>퀴즈점수 {quizScore}점(15점 만점)</strong> / <strong>게임점수 {gameResult.steps}층</strong> 자동 기록 완료
            </span>
          </div>
          <button
            type="button"
            onClick={onReviewQuiz}
            className="text-xs font-bold text-indigo-600 hover:underline shrink-0"
          >
            오답 피드백 다시보기
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => {
              playCorrectSound();
              onRestartAll();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition"
          >
            <RotateCcw className="w-4 h-4" />
            다음 학생 풀기 (처음으로)
          </button>
        </div>
      </div>
    </div>
  );
};
