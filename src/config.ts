/**
 * Google Apps Script Web App Configuration
 * 
 * 선생님께서 Apps Script 배포 후 발급받은 웹 앱 URL을 
 * 아래 DEFAULT_APPS_SCRIPT_URL에 넣거나,
 * 앱 우측 상단 ⚙️ 설정 버튼을 눌러 직접 입력하시면 즉시 연동됩니다.
 */
export const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzUdUPIj9rz9AxkPBKnBZlirLVqlUOT8rAsozBdtH5sXqzp9xh4X5GVkvPSejS2PA/exec';

const STORAGE_KEY_URL = 'APPS_SCRIPT_DEPLOY_URL';
const STORAGE_KEY_SCORES = 'STUDENT_SCORE_AUDIT_LOG';

export function getAppsScriptUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_APPS_SCRIPT_URL;
  const stored = localStorage.getItem(STORAGE_KEY_URL);
  if (stored && stored.trim().startsWith('https://script.google.com/')) {
    // If the stored URL is empty or the previous demo placeholder, update to the user's official URL
    if (stored.includes('AKfycbzNvXfHOFOZO9y72wCH14t4dzrzEb301aWc891YrLWIq7pweEKAcMcSGvYRHvJPErM6Nw')) {
      localStorage.setItem(STORAGE_KEY_URL, DEFAULT_APPS_SCRIPT_URL);
      return DEFAULT_APPS_SCRIPT_URL;
    }
    return stored.trim();
  }
  return DEFAULT_APPS_SCRIPT_URL;
}

export function resetToDefaultAppsScriptUrl(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_URL, DEFAULT_APPS_SCRIPT_URL);
}

export function setAppsScriptUrl(url: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
}

export interface ScorePayload {
  classRoom: string;      // 시트 탭 이름 (예: '1-5', '1-6', '1-7', '1-8')
  studentId: string;      // 학번 (예: '15' 또는 '10515')
  name: string;           // 이름
  type?: 'quiz' | 'game'; // 'quiz' or 'game'
  attempt?: 1 | 2;        // 1 or 2
  score?: number;         // 호환용 점수
  quizScore?: number;     // 퀴즈점수 (0 ~ 15)
  gameScore?: number;     // 게임점수 (오른 계단 수/층수)
  timestamp?: string;
}

/**
 * 학생 점수를 구글 시트(Apps Script Web App)로 전송하는 함수
 */
export async function submitScoreToGoogleSheet(payload: ScorePayload): Promise<{ success: boolean; message: string }> {
  const url = getAppsScriptUrl();

  // 1. 로컬 백업 저장 (네트워크 오류나 연결 지연 시에도 점수 유실 방지)
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY_SCORES) || '[]';
    const logs = JSON.parse(existingStr);
    logs.push({
      ...payload,
      timestamp: new Date().toLocaleString('ko-KR')
    });
    localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(logs));
  } catch (e) {
    console.error('Local backup failed', e);
  }

  // URL이 설정되지 않은 경우 안내
  if (!url) {
    return {
      success: false,
      message: 'Apps Script 배포 URL이 설정되지 않았습니다. (로컬 백업 완료)'
    };
  }

  try {
    const qScore = payload.quizScore !== undefined ? payload.quizScore : (payload.type === 'quiz' ? payload.score : undefined);
    const gScore = payload.gameScore !== undefined ? payload.gameScore : (payload.type === 'game' ? payload.score : undefined);
    const resolvedAttempt = payload.attempt || (payload.type === 'game' ? 2 : 1);
    const resolvedScore = payload.score ?? (payload.type === 'game' ? gScore : qScore) ?? 0;

    // URLSearchParams 생성: 구버전 Apps Script 및 신버전 모두와 100% 호환되도록 양방향 파라미터 전송
    const targetUrl = new URL(url);
    targetUrl.searchParams.set('classRoom', payload.classRoom);
    targetUrl.searchParams.set('studentId', payload.studentId);
    targetUrl.searchParams.set('name', payload.name);
    targetUrl.searchParams.set('type', payload.type || (gScore !== undefined ? 'game' : 'quiz'));
    targetUrl.searchParams.set('attempt', String(resolvedAttempt));
    targetUrl.searchParams.set('score', String(resolvedScore));
    if (qScore !== undefined) targetUrl.searchParams.set('quizScore', String(qScore));
    if (gScore !== undefined) targetUrl.searchParams.set('gameScore', String(gScore));
    targetUrl.searchParams.set('timestamp', new Date().toISOString());

    const formBody = new URLSearchParams();
    formBody.append('classRoom', payload.classRoom);
    formBody.append('studentId', payload.studentId);
    formBody.append('name', payload.name);
    formBody.append('type', payload.type || (gScore !== undefined ? 'game' : 'quiz'));
    formBody.append('attempt', String(resolvedAttempt));
    formBody.append('score', String(resolvedScore));
    if (qScore !== undefined) formBody.append('quizScore', String(qScore));
    if (gScore !== undefined) formBody.append('gameScore', String(gScore));
    formBody.append('timestamp', new Date().toISOString());

    // Apps Script 웹 앱은 CORS 리다이렉션을 발생시키므로 mode: 'no-cors'로 안전하게 전송
    await fetch(targetUrl.toString(), {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formBody.toString()
    });

    return {
      success: true,
      message: '구글 스프레드시트에 점수가 성공적으로 기록되었습니다.'
    };
  } catch (error) {
    console.error('Failed to submit to Google Sheet:', error);
    return {
      success: false,
      message: '시트 전송 중 오류가 발생했습니다. (로컬 백업 완료)'
    };
  }
}

/**
 * 퀴즈 점수 전송 도우미 함수 (학번, 이름, 퀴즈점수)
 */
export async function submitQuizScoreToGoogleSheet(params: {
  classRoom: string;
  studentId: string;
  name: string;
  quizScore: number;
  attempt?: 1 | 2;
}): Promise<{ success: boolean; message: string }> {
  return submitScoreToGoogleSheet({
    classRoom: params.classRoom,
    studentId: params.studentId,
    name: params.name,
    type: 'quiz',
    attempt: params.attempt || 1,
    score: params.quizScore,
    quizScore: params.quizScore,
  });
}

/**
 * 게임 점수 전송 도우미 함수 (학번, 이름, 게임점수)
 */
export async function submitGameScoreToGoogleSheet(params: {
  classRoom: string;
  studentId: string;
  name: string;
  gameScore: number;
  quizScore?: number;
}): Promise<{ success: boolean; message: string }> {
  return submitScoreToGoogleSheet({
    classRoom: params.classRoom,
    studentId: params.studentId,
    name: params.name,
    type: 'game',
    score: params.gameScore,
    gameScore: params.gameScore,
    quizScore: params.quizScore,
  });
}

/**
 * 선생님 구글 시트 전용 구글 앱스 스크립트 코드
 * 열 구성: [A: 학번] | [B: 이름] | [C: 퀴즈점수] | [D: 게임점수]
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * [중학교 사회: 선거와 민주 정치 (p.183~184) & 무한의 계단]
 * 학생 점수 자동 기록 구글 앱스 스크립트 (Apps Script)
 * 
 * 구글 시트 열 구성:
 * [A열: 학번] | [B열: 이름] | [C열: 퀴즈점수] | [D열: 게임점수]
 * 
 * 설정 방법:
 * 1. 학생 성적을 기록할 구글 스프레드시트를 엽니다.
 * 2. 상단 메뉴 [확장 프로그램] -> [Apps Script]를 클릭합니다.
 * 3. 기존 코드를 모두 지우고 이 코드를 붙여넣은 뒤 저장(Ctrl+S)합니다.
 * 4. 우측 상단 [배포] -> [새 배포] 클릭
 *    - 톱니바퀴 아이콘 -> [웹 앱] 선택
 *    - 설명: 선거 퀴즈 및 게임 점수 수집
 *    - 다음 사용자 권한으로 실행: '나(내 계정)'
 *    - 액세스 권한이 있는 사용자: '모든 사용자(Anyone)' 선택 (★중요!)
 * 5. 배포 완료 후 나타나는 [웹 앱 URL]을 복사하여 앱 우측 상단 ⚙️ 설정에 붙여넣습니다.
 */

function doPost(e) {
  try {
    var params;
    if (e.postData && e.postData.type === "application/x-www-form-urlencoded") {
      params = e.parameter;
    } else if (e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (err) {
        params = e.parameter;
      }
    } else {
      params = e.parameter;
    }

    var classRoom = (params.classRoom || "1-5").trim();
    var studentId = String(params.studentId || "").trim();
    var name = String(params.name || "").trim();
    var type = String(params.type || "").trim();

    // 퀴즈 점수 및 게임 점수 추출
    var quizScore = null;
    var gameScore = null;

    if (params.quizScore !== undefined && params.quizScore !== "") {
      quizScore = parseInt(params.quizScore, 10);
    } else if (type === "quiz" && params.score !== undefined && params.score !== "") {
      quizScore = parseInt(params.score, 10);
    }

    if (params.gameScore !== undefined && params.gameScore !== "") {
      gameScore = parseInt(params.gameScore, 10);
    } else if (type === "game" && params.score !== undefined && params.score !== "") {
      gameScore = parseInt(params.score, 10);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(classRoom);

    // 해당 반 시트 탭이 없으면 새로 생성 [학번, 이름, 퀴즈점수, 게임점수]
    if (!sheet) {
      sheet = ss.insertSheet(classRoom);
      sheet.appendRow(["학번", "이름", "퀴즈점수", "게임점수"]);
      sheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#e0e7ff");
    } else {
      var h1 = String(sheet.getRange(1, 1).getValue()).trim();
      var h3 = String(sheet.getRange(1, 3).getValue()).trim();
      if (!h1 || h3.indexOf("풀이") !== -1) {
        sheet.getRange(1, 1, 1, 4).setValues([["학번", "이름", "퀴즈점수", "게임점수"]]);
        sheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#e0e7ff");
      }
    }

    var data = sheet.getDataRange().getValues();
    var rowIndex = -1;

    // 기존 학번 또는 이름과 일치하는 행 탐색
    for (var i = 1; i < data.length; i++) {
      var rowStudentId = String(data[i][0]).trim();
      var rowName = String(data[i][1]).trim();
      if (rowStudentId === studentId && (rowName === name || !rowName)) {
        rowIndex = i + 1; // 1-based index
        break;
      }
    }

    if (rowIndex === -1) {
      // 신규 학생: 행 추가
      var qVal = (quizScore !== null) ? quizScore : "";
      var gVal = (gameScore !== null) ? gameScore : "";
      sheet.appendRow([studentId, name, qVal, gVal]);
    } else {
      // 기존 학생: 해당 열 업데이트
      if (name) {
        sheet.getRange(rowIndex, 2).setValue(name);
      }
      if (quizScore !== null) {
        // C열(3번째 열): 퀴즈점수
        sheet.getRange(rowIndex, 3).setValue(quizScore);
      }
      if (gameScore !== null) {
        // D열(4번째 열): 게임점수
        sheet.getRange(rowIndex, 4).setValue(gameScore);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "기록 완료" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("선거와 민주 정치 퀴즈 & 무한의 계단 스코어 서버 정상 작동 중입니다.");
}
`;
