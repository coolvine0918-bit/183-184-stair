import React, { useState } from 'react';
import { StudentInfo, QuestionAnswer } from '../types';
import { QUESTIONS_DATA, TOTAL_QUESTIONS } from '../data/questions';
import { CheckCircle2, Send, AlertTriangle, RotateCcw } from 'lucide-react';
import { playStepSound, playCorrectSound } from '../utils/sound';

interface Props {
  studentInfo: StudentInfo;
  attempt: 1 | 2;
  onSubmit: (answers: QuestionAnswer[], score: number) => void;
  onResetStudent?: () => void;
}

const NUMBER_CIRCLES = ['①', '②', '③', '④', '⑤'];

export const QuizView: React.FC<Props> = ({
  studentInfo,
  attempt,
  onSubmit,
  onResetStudent,
}) => {
  const questions = QUESTIONS_DATA;

  // Selected answers: map of questionId -> selectedOption (1 to 5)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [activeQuestionId, setActiveQuestionId] = useState<number>(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [missingAlert, setMissingAlert] = useState<string | null>(null);

  // Count of answered questions
  const answeredCount = Object.keys(selectedAnswers).filter(
    (id) => selectedAnswers[Number(id)] && selectedAnswers[Number(id)] >= 1 && selectedAnswers[Number(id)] <= 5
  ).length;

  const handleSelectOption = (questionId: number, optionNum: number) => {
    playStepSound();
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionNum,
    }));
    setMissingAlert(null);
  };

  const handleClearAnswer = (questionId: number) => {
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const handleAttemptSubmit = () => {
    if (answeredCount < TOTAL_QUESTIONS) {
      const missingCount = TOTAL_QUESTIONS - answeredCount;
      setMissingAlert(
        `아직 ${missingCount}개의 문제가 풀리지 않았습니다. 15문제를 모두 풀고 제출해주세요!`
      );
      // scroll to first unanswered
      const firstUnanswered = questions.find((q) => !selectedAnswers[q.id]);
      if (firstUnanswered) {
        setActiveQuestionId(firstUnanswered.id);
        const el = document.getElementById(`question-card-${firstUnanswered.id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSubmit = () => {
    setShowConfirmModal(false);
    playCorrectSound();

    const answersList: QuestionAnswer[] = questions.map((q) => {
      const chosen = selectedAnswers[q.id] || 0;
      return {
        questionId: q.id,
        selectedOption: chosen,
        isCorrect: chosen === q.correctAnswer,
      };
    });

    const finalScore = answersList.filter((a) => a.isCorrect).length;
    onSubmit(answersList, finalScore);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 pb-28">
      {/* Top Student Banner & Progress */}
      <div className="sticky top-2 z-20 mb-6 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-md backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <span className="flex h-7 px-2.5 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">
              {studentInfo.classRoom}
            </span>
            <span className="text-sm font-bold text-gray-900">
              {studentInfo.studentId}번 {studentInfo.name}
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                attempt === 1
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {attempt === 1 ? '1차 풀이' : '2차 재도전'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onResetStudent && (
              <button
                type="button"
                onClick={onResetStudent}
                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                학생 정보 변경
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar & Jump Pills */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-1.5">
            <span>문제 풀이 완료도 ({answeredCount} / {TOTAL_QUESTIONS})</span>
            <span className="text-indigo-600 font-bold">
              {Math.round((answeredCount / TOTAL_QUESTIONS) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / TOTAL_QUESTIONS) * 100}%` }}
            />
          </div>

          {/* Quick jump pills */}
          <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-gray-50">
            {questions.map((q) => {
              const isAnswered = !!selectedAnswers[q.id];
              const isActive = activeQuestionId === q.id;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setActiveQuestionId(q.id);
                    const el = document.getElementById(`question-card-${q.id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className={`h-7 w-7 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                    isActive
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                      : isAnswered
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {q.id}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Unanswered warning */}
      {missingAlert && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs font-semibold text-amber-900 shadow-sm animate-pulse">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{missingAlert}</span>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {questions.map((q) => {
          const selected = selectedAnswers[q.id];
          const isCurrentActive = activeQuestionId === q.id;

          return (
            <div
              key={q.id}
              id={`question-card-${q.id}`}
              onClick={() => setActiveQuestionId(q.id)}
              className={`rounded-2xl border transition-all duration-200 bg-white p-5 sm:p-6 shadow-sm ${
                isCurrentActive
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900 text-xs font-extrabold text-white">
                    {q.id}
                  </span>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {q.source}
                  </span>
                </div>

                {selected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearAnswer(q.id);
                    }}
                    className="text-[11px] text-gray-400 hover:text-red-600 transition"
                  >
                    선택 취소
                  </button>
                )}
              </div>

              {/* Question Stem */}
              <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug mb-4">
                {q.id}. {q.question}
              </h3>

              {/* Options List */}
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const isSelected = selected === opt.num;
                  return (
                    <button
                      type="button"
                      key={opt.num}
                      onClick={() => handleSelectOption(q.id, opt.num)}
                      className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-gray-200 bg-gray-50/60 text-gray-800 hover:bg-gray-100/80 hover:border-gray-300'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700'
                        }`}
                      >
                        {NUMBER_CIRCLES[opt.num - 1] || opt.num}
                      </span>
                      <span className="text-sm leading-relaxed pt-0.5">
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Status Footer */}
              <div className="mt-3 flex items-center justify-between text-xs">
                {selected ? (
                  <span className="inline-flex items-center gap-1.5 text-indigo-700 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    선택한 답: {NUMBER_CIRCLES[selected - 1]}번
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">
                    * 답을 선택해주세요
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-gray-600">
            총 {TOTAL_QUESTIONS}문제 중 <strong className="text-indigo-600 text-base">{answeredCount}</strong>개 완료
            {answeredCount === TOTAL_QUESTIONS && (
              <span className="ml-2 text-emerald-600 font-bold hidden sm:inline">✨ 15문제 모두 완료! 제출 가능</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAttemptSubmit}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md transition-all ${
              answeredCount === TOTAL_QUESTIONS
                ? 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 animate-bounce-subtle'
                : 'bg-gray-400 hover:bg-gray-500'
            }`}
          >
            <Send className="w-4 h-4" />
            교사에게 제출하기
          </button>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">교사에게 제출하시겠습니까?</h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              15문제를 모두 풀었습니다. 제출 시 즉시 채점되며 점수가 구글 시트에 자동 기록됩니다.
              <br />
              <strong className="text-indigo-700 font-bold">12문제 이상 맞히면</strong> 30초 무한의 계단 게임이 해금되며, 
              <strong className="text-amber-700 font-bold"> 11문제 이하</strong>는 오답 확인 후 재풀이를 진행해야 합니다.
            </p>

            <div className="rounded-xl bg-gray-50 p-3 mb-5 border border-gray-200 text-xs space-y-1">
              <p><strong>학생:</strong> {studentInfo.classRoom} {studentInfo.studentId}번 {studentInfo.name}</p>
              <p><strong>풀이 차수:</strong> {attempt === 1 ? '1차 풀이' : '2차 재풀이'}</p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                다시 검토하기
              </button>
              <button
                type="button"
                onClick={confirmSubmit}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm"
              >
                최종 제출 및 채점 확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
