import React, { useState, useEffect } from 'react';
import { Settings, X, Copy, Check, RefreshCw, Database, Send, RotateCcw } from 'lucide-react';
import { 
  getAppsScriptUrl, 
  setAppsScriptUrl, 
  resetToDefaultAppsScriptUrl, 
  DEFAULT_APPS_SCRIPT_URL, 
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  submitScoreToGoogleSheet 
} from '../config';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TeacherSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [auditLogs, setAuditLogs] = useState<Array<{
    classRoom: string;
    studentId: string;
    name: string;
    attempt?: number;
    score?: number;
    quizScore?: number;
    gameScore?: number;
    type?: string;
    timestamp: string;
  }>>([]);

  useEffect(() => {
    if (isOpen) {
      setUrl(getAppsScriptUrl());
      loadAuditLogs();
    }
  }, [isOpen]);

  const loadAuditLogs = () => {
    try {
      const logs = JSON.parse(localStorage.getItem('STUDENT_SCORE_AUDIT_LOG') || '[]');
      setAuditLogs(logs.reverse());
    } catch {
      setAuditLogs([]);
    }
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setAppsScriptUrl(url);
    setSaveMessage('✅ 배포 URL이 저장되었습니다. 이제 학생들의 점수가 구글 시트에 바로 기록됩니다.');
    setTimeout(() => setSaveMessage(''), 4000);
  };

  const handleResetDefaultUrl = () => {
    resetToDefaultAppsScriptUrl();
    setUrl(DEFAULT_APPS_SCRIPT_URL);
    setSaveMessage('🔄 기본 웹 앱 URL(공식 연결 주소)로 재설정되었습니다.');
    setTimeout(() => setSaveMessage(''), 4000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setSaveMessage('⏳ 구글 시트로 테스트 데이터 전송 중...');
    try {
      const res = await submitScoreToGoogleSheet({
        classRoom: '1-5',
        studentId: '99',
        name: '선생님연동테스트',
        quizScore: 15,
        gameScore: 50,
        type: 'game',
      });
      loadAuditLogs();
      if (res.success) {
        setSaveMessage('🎉 테스트 전송 성공! 구글 시트 1-5반 탭에 퀴즈 15점, 게임 50점이 기록되었습니다.');
      } else {
        setSaveMessage(`⚠️ ${res.message}`);
      }
    } catch (e) {
      setSaveMessage('❌ 테스트 전송 중 오류가 발생했습니다.');
    } finally {
      setIsTesting(false);
      setTimeout(() => setSaveMessage(''), 6000);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClearLogs = () => {
    if (window.confirm('로컬에 백업된 학생 점수 기록을 모두 초기화하시겠습니까?')) {
      localStorage.removeItem('STUDENT_SCORE_AUDIT_LOG');
      loadAuditLogs();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">교사용 구글 시트 연동 설정</h2>
              <p className="text-xs text-gray-500">Apps Script 웹 앱 URL 설정 및 학생 점수 백업 확인</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {/* 1. Apps Script URL 설정 */}
          <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-800">
                🔗 구글 앱스 스크립트 웹 앱 배포 URL
              </label>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                ✓ 코드에 공식 URL 탑재 완료
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              현재 코드에 박힌 공식 웹 앱 주소가 기본 활성화되어 학생들의 점수가 구글 시트에 바로 기록됩니다.
            </p>
            <form onSubmit={handleSaveUrl} className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs sm:text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-indigo-700 transition"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={handleResetDefaultUrl}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                  title="기본 URL로 재설정"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  기본값 복원
                </button>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isTesting ? '테스트 중...' : '연동 테스트'}
                </button>
              </div>
            </form>
            {saveMessage && (
              <p className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
                {saveMessage}
              </p>
            )}
          </div>

          {/* 2. Apps Script 백엔드 코드 */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-800">📋 구글 시트 연동 Apps Script 백엔드 코드</h3>
                <p className="text-xs text-gray-500">
                  구글 시트 열 구성: <strong className="text-indigo-700 font-semibold">[A: 학번] | [B: 이름] | [C: 퀴즈점수] | [D: 게임점수]</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-100 transition"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copied ? '복사 완료!' : '코드 복사하기'}
              </button>
            </div>

            <div className="rounded-lg bg-gray-900 p-3 text-xs text-gray-200 font-mono overflow-x-auto max-h-48 border border-gray-800">
              <pre>{GOOGLE_APPS_SCRIPT_TEMPLATE}</pre>
            </div>

            <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-semibold">💡 초간단 연동 방법 (3단계):</p>
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>구글 스프레드시트 메뉴 <strong>[확장 프로그램] → [Apps Script]</strong>를 엽니다.</li>
                <li>위 코드를 복사하여 붙여넣고 저장(Ctrl+S)합니다.</li>
                <li>우측 상단 <strong>[배포] → [새 배포]</strong> → 유형: <strong>[웹 앱]</strong>, 액세스 권한: <strong>[모든 사용자(Anyone)]</strong>로 배포 후 URL을 위 입력창에 등록하면 연동 완료!</li>
              </ol>
            </div>
          </div>

          {/* 3. 로컬 점수 백업 로그 */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-gray-600" />
                <h3 className="text-sm font-bold text-gray-800">실시간 학생 제출 백업 내역 ({auditLogs.length}건)</h3>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={loadAuditLogs}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100"
                  title="새로고침"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                {auditLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearLogs}
                    className="text-xs text-red-600 hover:underline"
                  >
                    기록 삭제
                  </button>
                )}
              </div>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-center py-4 text-xs text-gray-400">제출된 점수 내역이 없습니다.</p>
            ) : (
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 sticky top-0">
                    <tr>
                      <th className="p-2">제출 시간</th>
                      <th className="p-2">반</th>
                      <th className="p-2">학번</th>
                      <th className="p-2">이름</th>
                      <th className="p-2">퀴즈점수</th>
                      <th className="p-2">게임점수</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-800">
                    {auditLogs.map((log, idx) => {
                      const qDisplay = log.quizScore !== undefined ? `${log.quizScore} / 15점` : (log.type === 'quiz' ? `${log.score} / 15점` : '-');
                      const gDisplay = log.gameScore !== undefined ? `${log.gameScore}층` : (log.type === 'game' ? `${log.score}층` : '-');
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2 text-gray-500">{log.timestamp}</td>
                          <td className="p-2 font-medium">{log.classRoom}</td>
                          <td className="p-2">{log.studentId}</td>
                          <td className="p-2 font-semibold">{log.name}</td>
                          <td className="p-2">
                            <span className="font-bold text-indigo-700">
                              {qDisplay}
                            </span>
                          </td>
                          <td className="p-2">
                            <span className="font-bold text-amber-700">
                              {gDisplay}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
