import React, { useState } from 'react';
import { StudentInfo } from '../types';
import { BookOpen, Trophy, ArrowRight, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { playCorrectSound } from '../utils/sound';

interface Props {
  onStart: (info: StudentInfo) => void;
  savedInfo?: StudentInfo | null;
}

const CLASS_OPTIONS = ['1-5', '1-6', '1-7', '1-8'];

export const StudentInfoScreen: React.FC<Props> = ({ onStart, savedInfo }) => {
  const [classRoom, setClassRoom] = useState(savedInfo?.classRoom || '1-5');
  const [customClass, setCustomClass] = useState('');
  const [isCustomClass, setIsCustomClass] = useState(false);
  const [studentId, setStudentId] = useState(savedInfo?.studentId || '');
  const [name, setName] = useState(savedInfo?.name || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalClass = isCustomClass ? customClass.trim() : classRoom.trim();
    if (!finalClass) {
      setError('학급(반)을 선택하거나 입력해주세요.');
      return;
    }
    if (!studentId.trim()) {
      setError('학번(번호)을 입력해주세요.');
      return;
    }
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    setError('');
    playCorrectSound();
    onStart({
      classRoom: finalClass,
      studentId: studentId.trim(),
      name: name.trim()
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-semibold mb-3">
          <BookOpen className="w-4 h-4" />
          중학교 사회 p.183~184 단원 평가
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
          선거와 민주 정치 퀴즈 & 무한의 계단
        </h1>
        <p className="mt-2 text-sm text-gray-600 max-w-lg mx-auto">
          교과서 183~184쪽 선거의 의미, 기능, 절차, 4대 원칙에 관한 15문항 객관식 퀴즈를 풀고, 12문제 이상 맞혀 30초 무한의 계단에 도전하세요!
        </p>
      </div>

      {/* Rules Card */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-blue-50/50 to-purple-50/60 p-5 mb-8 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          통과 기준 및 게임 도전 규칙
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2.5 rounded-xl bg-white p-3.5 border border-indigo-100 shadow-2xs">
            <div className="rounded-full bg-emerald-100 p-1 text-emerald-600 mt-0.5">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-emerald-800 text-sm">12문제 이상 정답 (통과)</span>
              <p className="text-gray-600 mt-1">
                30초 <strong>'무한의 계단'</strong> 미니게임 플레이가 해금됩니다!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl bg-white p-3.5 border border-indigo-100 shadow-2xs">
            <div className="rounded-full bg-amber-100 p-1 text-amber-600 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-amber-800 text-sm">11문제 이하 (재풀이 대상)</span>
              <p className="text-gray-600 mt-1">
                오답 피드백과 교과서 해설을 확인한 뒤 12문제 이상 맞힐 때까지 재도전해야 합니다.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl bg-white p-3.5 border border-indigo-100 shadow-2xs sm:col-span-2">
            <div className="rounded-full bg-blue-100 p-1 text-blue-600 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-gray-900 text-sm">구글 시트 실시간 자동 기록</span>
              <p className="text-gray-600 mt-1">
                학생의 <strong>학번, 이름, 퀴즈점수, 게임점수</strong>가 담당 교사의 구글 스프레드시트에 앱스스크립트로 즉시 저장됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Input Form Card */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-md">
        <h2 className="text-base font-bold text-gray-900 mb-5">학생 정보 입력</h2>

        <div className="space-y-5">
          {/* 반 선택 */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              학급 (반 선택)
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {CLASS_OPTIONS.map((cls) => (
                <button
                  type="button"
                  key={cls}
                  onClick={() => {
                    setClassRoom(cls);
                    setIsCustomClass(false);
                  }}
                  className={`py-2.5 rounded-xl text-sm font-bold border transition ${
                    !isCustomClass && classRoom === cls
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
            {isCustomClass ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="예: 1-1 또는 1반"
                  value={customClass}
                  onChange={(e) => setCustomClass(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsCustomClass(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCustomClass(true)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                + 목록에 없는 다른 반 직접 입력하기
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 학번 */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                학번 (번호)
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="예: 15"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>

            {/* 이름 */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                이름
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 홍길동"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 px-6 text-sm font-bold text-white shadow-md hover:bg-indigo-700 active:scale-[0.99] transition"
          >
            15문제 풀기 시작하기
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
