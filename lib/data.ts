export type TaskType = 'direct' | 'ai' | 'outsource' | 'gov';

export const TOTAL_BUDGET = 500000; // ₩500,000

export function getTaskTypeBadge(type: TaskType): { label: string; color: string } {
  switch (type) {
    case 'direct':   return { label: '🟢 직접', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
    case 'ai':       return { label: '🔵 AI',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
    case 'outsource':return { label: '🟣 외주', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' };
    case 'gov':      return { label: '🟠 정부', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' };
  }
}

export interface TaskItem {
  id: string;
  type: TaskType;
  title: string;
  duration: string;
  firstAction?: string;
}

export interface Week {
  week: number;
  label: string;
  dateRange: string;
  title: string;
  importance: number; // 1~3
  phase: 1 | 2 | 3 | 4 | 5;
  tasks: TaskItem[];
}

export const PHASE_LABELS: Record<number, string> = {
  1: '🔬 Phase 1 · PoC',
  2: '🔧 Phase 2 · 하드웨어 완성',
  3: '📱 Phase 3 · 앱 MVP + 실사용 테스트',
  4: '🚀 Phase 4 · 와디즈 펀딩',
  5: '📦 Phase 5 · 양산 + 배송',
};

// D-Day 기준: 와디즈 오픈 2027-04-07
export const PROJECT_START = new Date('2026-04-07');
export const WADIZ_OPEN    = new Date('2027-04-07');
export const PROJECT_END   = new Date('2027-08-31');

export const ENCOURAGEMENTS = [
  "카카오 파스타도 처음엔 '이게 왜 필요해?'였습니다",
  '최악의 경우 잃는 돈 50만원. 최선의 경우 정부지원 8,000만원',
  '작동하는 데모가 있으면 협력자가 먼저 찾아옵니다',
  '1년 뒤 프로토타입+앱+특허를 가진 창업자입니다',
  '내가 쓰려고 만든 것이 세계에서 가장 강력한 제품',
  '웰트도 삼성 직원 혼자 시작했습니다',
  '지방간 수치가 떨어지면 그게 최고의 사업계획서',
  '진짜 고객은 지방간 카페에 있습니다',
  '오늘 30분이면 됩니다. 딱 30분만',
  '실사용 데이터 1개월이 PPT 100장보다 강력합니다',
];

// ─── 현재 주차 계산 ─────────────────────────────────────────────────────────
// dateRange 예: "4/7~4/13", "12/22~12/28", "1/5~1/11"
// 연도는 week 번호 + phase 로 추정
function getWeekYear(w: Week): number {
  if (w.phase >= 3) return 2027;
  if (w.phase === 2 && w.week >= 27) return 2026;
  if (w.week >= 27) return 2027;
  return 2026;
}

export function getCurrentWeekIndex(weeks: Week[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < weeks.length; i++) {
    const w = weeks[i];
    const [startStr] = w.dateRange.split('~');
    const parts = startStr.trim().split('/');
    if (parts.length < 2) continue;

    const month = parseInt(parts[0], 10) - 1;
    const day   = parseInt(parts[1], 10);
    const year  = getWeekYear(w);

    const weekStart = new Date(year, month, day);
    let weekEnd: Date;

    if (i + 1 < weeks.length) {
      const nextW = weeks[i + 1];
      const [ns] = nextW.dateRange.split('~');
      const np = ns.trim().split('/');
      weekEnd = new Date(getWeekYear(nextW), parseInt(np[0], 10) - 1, parseInt(np[1], 10));
    } else {
      weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
    }

    if (today >= weekStart && today < weekEnd) return i;
  }

  if (today < new Date('2026-04-07')) return 0;
  return weeks.length - 1;
}

export const MILESTONES = [
  { week: 3,  title: 'PoC 완성' },
  { week: 4,  title: '앱 데모' },
  { week: 10, title: 'PCB 발주' },
  { week: 14, title: 'PCB 테스트' },
  { week: 18, title: '착용 테스트 1차' },
  { week: 26, title: '🎉 하드웨어 완성!' },
  { week: 32, title: 'BLE 앱 연동' },
  { week: 38, title: '앱 MVP 완성' },
  { week: 42, title: '실사용 테스트 완료' },
  { week: 46, title: '특허 출원' },
  { week: 53, title: '🚀 와디즈 오픈!' },
  { week: 58, title: '📦 배송 완료' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 58주 전체 데이터
// ═══════════════════════════════════════════════════════════════════════════════
export const WEEKS: Week[] = [

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 1 · PoC (2026.4)
  // ──────────────────────────────────────────────────────────────────────────
  {
    week: 1, label: 'W1', dateRange: '4/7~4/13', title: '부품 주문', importance: 1, phase: 1,
    tasks: [
      { id: 'w1t1', type: 'direct', title: 'ESP32+ADS1115+브레드보드+점퍼+저항 주문', duration: '30분',
        firstAction: 'mechasolution.com → ESP32-S3 검색 → 장바구니' },
      { id: 'w1t2', type: 'direct', title: 'AliExpress 전도성 고무코드 주문', duration: '15분',
        firstAction: 'aliexpress.com → conductive rubber cord 3mm' },
      { id: 'w1t3', type: 'ai',     title: 'Arduino IDE + ESP32 보드매니저 + ADS1X15 설치', duration: '30분',
        firstAction: 'arduino.cc → Software → Download' },
    ],
  },
  {
    week: 2, label: 'W2', dateRange: '4/14~4/20', title: '브레드보드 조립', importance: 2, phase: 1,
    tasks: [
      { id: 'w2t1', type: 'direct', title: 'ESP32 브레드보드 꽂기 + USB 연결', duration: '15분' },
      { id: 'w2t2', type: 'direct', title: 'ADS1115 I2C 연결 (빨간=3V3, 검정=GND, 노란=SDA→21, 파란=SCL→22)', duration: '30분' },
      { id: 'w2t3', type: 'direct', title: '4.7kΩ 풀업 저항 2개 연결', duration: '15분' },
      { id: 'w2t4', type: 'ai',     title: 'I2C Scanner → 0x48 확인', duration: '15분' },
    ],
  },
  {
    week: 3, label: 'W3', dateRange: '4/21~4/27', title: '센서 + PoC 완성', importance: 2, phase: 1,
    tasks: [
      { id: 'w3t1', type: 'direct', title: 'Wheatstone Bridge 조립', duration: '1시간' },
      { id: 'w3t2', type: 'ai',     title: 'PoC 펌웨어 업로드', duration: '15분' },
      { id: 'w3t3', type: 'direct', title: '캘리브레이션 + 줄자 비교', duration: '30분' },
      { id: 'w3t4', type: 'direct', title: 'PoC 동작 영상 촬영', duration: '15분',
        firstAction: '스마트폰 세로 거치 → 30초 측정 영상' },
    ],
  },
  {
    week: 4, label: 'W4', dateRange: '4/28~5/4', title: '앱 데모', importance: 1, phase: 1,
    tasks: [
      { id: 'w4t1', type: 'ai', title: 'Lovable 앱 프로토타입', duration: '2시간',
        firstAction: 'lovable.dev 접속 → 새 프로젝트' },
      { id: 'w4t2', type: 'ai', title: '앱 Publish → URL 확보', duration: '15분' },
      { id: 'w4t3', type: 'ai', title: '나노바나나2 이미지 4장', duration: '1시간' },
      { id: 'w4t4', type: 'ai', title: 'Flow 쇼츠 4클립', duration: '1시간' },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 2 · 하드웨어 완성 (2026.5~10)
  // ──────────────────────────────────────────────────────────────────────────
  {
    week: 5, label: 'W5', dateRange: '5/5~5/11', title: '정부지원 탐색', importance: 1, phase: 2,
    tasks: [
      { id: 'w5t1', type: 'gov', title: 'bizinfo.go.kr 지원사업 검색', duration: '30분',
        firstAction: 'bizinfo.go.kr → 지원사업 → "스마트헬스케어"' },
      { id: 'w5t2', type: 'gov', title: '부산창조경제혁신센터 전화', duration: '15분',
        firstAction: '051-749-9100' },
      { id: 'w5t3', type: 'gov', title: '김해의생명산업진흥원 전화', duration: '15분',
        firstAction: '055-723-5200' },
    ],
  },
  {
    week: 6, label: 'W6', dateRange: '5/12~5/18', title: '전문가 미팅', importance: 2, phase: 2,
    tasks: [
      { id: 'w6t1', type: 'direct', title: '제안서 출력 + PoC 영상 전송', duration: '15분' },
      { id: 'w6t2', type: 'direct', title: '전문가 미팅 진행', duration: '2시간' },
      { id: 'w6t3', type: 'direct', title: '협력 합의 또는 피드백 정리', duration: '30분' },
    ],
  },
  {
    week: 7, label: 'W7', dateRange: '5/19~5/25', title: 'PCB 설계 시작', importance: 3, phase: 2,
    tasks: [
      { id: 'w7t1', type: 'direct', title: 'KiCad 설치 + 기본 튜토리얼', duration: '30분',
        firstAction: 'kicad.org → Download' },
      { id: 'w7t2', type: 'ai',     title: '회로도 수정 (브레드보드 → 정식 회로)', duration: '2시간' },
      { id: 'w7t3', type: 'direct', title: '부품 라이브러리 추가', duration: '1시간' },
    ],
  },
  {
    week: 8, label: 'W8', dateRange: '5/26~6/1', title: 'PCB 아트웍', importance: 3, phase: 2,
    tasks: [
      { id: 'w8t1', type: 'direct',    title: '레이아웃 시작 (부품 배치)', duration: '2시간' },
      { id: 'w8t2', type: 'direct',    title: '배선 + DRC 검사', duration: '2시간' },
      { id: 'w8t3', type: 'outsource', title: '아트웍 외주 검토 (PCBWay Designer)', duration: '30분' },
    ],
  },
  {
    week: 9, label: 'W9', dateRange: '6/2~6/8', title: 'Gerber 완성', importance: 3, phase: 2,
    tasks: [
      { id: 'w9t1', type: 'direct', title: 'Gerber 파일 생성', duration: '30분' },
      { id: 'w9t2', type: 'ai',     title: 'Gerber 뷰어 검토 (gerbv)', duration: '30분' },
      { id: 'w9t3', type: 'gov',    title: '정부지원 사업계획서 초안', duration: '2시간' },
    ],
  },
  {
    week: 10, label: 'W10', dateRange: '6/9~6/15', title: 'PCB 발주', importance: 2, phase: 2,
    tasks: [
      { id: 'w10t1', type: 'outsource', title: 'PCB 5장 발주 (JLCPCB)', duration: '1시간',
        firstAction: 'jlcpcb.com → Quote Now → Gerber 업로드' },
      { id: 'w10t2', type: 'direct',   title: 'SMD 부품 구매', duration: '30분' },
      { id: 'w10t3', type: 'gov',      title: '정부지원 신청서 제출', duration: '반나절' },
    ],
  },
  {
    week: 11, label: 'W11', dateRange: '6/16~6/22', title: 'SMT 실장', importance: 3, phase: 2,
    tasks: [
      { id: 'w11t1', type: 'direct',   title: '메이커스페이스 예약 + 실장 준비', duration: '1시간' },
      { id: 'w11t2', type: 'direct',   title: 'SMT 실장 (리플로우 또는 수동)', duration: '반나절' },
      { id: 'w11t3', type: 'gov',      title: 'IP 바우처 신청', duration: '1시간' },
    ],
  },
  {
    week: 12, label: 'W12', dateRange: '6/23~6/29', title: 'PCB 1차 테스트', importance: 2, phase: 2,
    tasks: [
      { id: 'w12t1', type: 'direct', title: '펌웨어 업로드 → cm 값 확인', duration: '1시간' },
      { id: 'w12t2', type: 'direct', title: 'BLE → nRF Connect 확인', duration: '30분' },
      { id: 'w12t3', type: 'direct', title: '불량 원인 분석 + 수정', duration: '1시간' },
    ],
  },
  {
    week: 13, label: 'W13', dateRange: '7/1~7/6', title: '배터리 + 충전 회로', importance: 2, phase: 2,
    tasks: [
      { id: 'w13t1', type: 'direct', title: 'LiPo 배터리 선정 + 구매', duration: '30분' },
      { id: 'w13t2', type: 'direct', title: 'TP4056 충전 모듈 연결 테스트', duration: '1시간' },
      { id: 'w13t3', type: 'ai',     title: '저전력 펌웨어 최적화', duration: '2시간' },
    ],
  },
  {
    week: 14, label: 'W14', dateRange: '7/7~7/13', title: '밴드 제작', importance: 2, phase: 2,
    tasks: [
      { id: 'w14t1', type: 'direct', title: '탄성밴드 + 자석 + 실리콘 재료 구매', duration: '30분' },
      { id: 'w14t2', type: 'direct', title: '밴드 봉제 + 센서 고정', duration: '반나절' },
      { id: 'w14t3', type: 'direct', title: '착용감 테스트 + 수정', duration: '1시간' },
    ],
  },
  {
    week: 15, label: 'W15', dateRange: '7/14~7/20', title: '케이스 설계 + 3D 프린팅', importance: 2, phase: 2,
    tasks: [
      { id: 'w15t1', type: 'ai',       title: 'Tinkercad 케이스 설계', duration: '2시간',
        firstAction: 'tinkercad.com → 새 디자인' },
      { id: 'w15t2', type: 'outsource', title: '3D 프린팅 출력', duration: '반나절' },
      { id: 'w15t3', type: 'direct',   title: '케이스 피팅 + 수정', duration: '1시간' },
    ],
  },
  {
    week: 16, label: 'W16', dateRange: '7/21~7/27', title: '통합 조립 v1', importance: 2, phase: 2,
    tasks: [
      { id: 'w16t1', type: 'direct', title: 'PCB + 배터리 → 케이스 → 밴드 조립', duration: '반나절' },
      { id: 'w16t2', type: 'direct', title: '전체 기능 테스트 (센서+BLE+배터리)', duration: '1시간' },
      { id: 'w16t3', type: 'ai',     title: '빌드인퍼블릭 블로그 1편', duration: '1시간' },
    ],
  },
  {
    week: 17, label: 'W17', dateRange: '7/28~8/3', title: '착용 테스트 1차', importance: 2, phase: 2,
    tasks: [
      { id: 'w17t1', type: 'direct', title: '매일 8시간 착용 + 데이터 기록', duration: '매일 10분' },
      { id: 'w17t2', type: 'direct', title: '착용 불편 부위 기록', duration: '10분' },
      { id: 'w17t3', type: 'ai',     title: '측정 정확도 검증 (줄자 비교)', duration: '30분' },
    ],
  },
  {
    week: 18, label: 'W18', dateRange: '8/4~8/10', title: '하드웨어 개선', importance: 2, phase: 2,
    tasks: [
      { id: 'w18t1', type: 'direct', title: '착용 피드백 반영 → 밴드 수정', duration: '반나절' },
      { id: 'w18t2', type: 'ai',     title: '펌웨어 버그 수정', duration: '1시간' },
      { id: 'w18t3', type: 'direct', title: '배터리 수명 측정 + 최적화', duration: '1시간' },
    ],
  },
  {
    week: 19, label: 'W19', dateRange: '8/11~8/17', title: 'PCB v2 설계', importance: 3, phase: 2,
    tasks: [
      { id: 'w19t1', type: 'direct',   title: 'v1 피드백 반영 회로 수정', duration: '2시간' },
      { id: 'w19t2', type: 'direct',   title: 'PCB v2 아트웍 + Gerber', duration: '반나절' },
      { id: 'w19t3', type: 'outsource', title: 'PCB v2 발주 (10장)', duration: '1시간' },
    ],
  },
  {
    week: 20, label: 'W20', dateRange: '8/18~8/24', title: 'PCB v2 SMT + 테스트', importance: 3, phase: 2,
    tasks: [
      { id: 'w20t1', type: 'direct', title: 'PCB v2 SMT 실장', duration: '반나절' },
      { id: 'w20t2', type: 'direct', title: 'v2 기능 검증', duration: '1시간' },
      { id: 'w20t3', type: 'direct', title: '착용 테스트 2차', duration: '매일 10분' },
    ],
  },
  {
    week: 21, label: 'W21', dateRange: '8/25~8/31', title: '통합 테스트 2차', importance: 2, phase: 2,
    tasks: [
      { id: 'w21t1', type: 'direct', title: '2주 연속 착용 데이터 수집', duration: '매일 10분' },
      { id: 'w21t2', type: 'ai',     title: '데이터 분석 + 정확도 보고서', duration: '1시간' },
      { id: 'w21t3', type: 'ai',     title: '빌드인퍼블릭 블로그 2편', duration: '1시간' },
    ],
  },
  {
    week: 22, label: 'W22', dateRange: '9/1~9/7', title: '협력사 탐색', importance: 1, phase: 2,
    tasks: [
      { id: 'w22t1', type: 'direct', title: '양산 EMS 업체 조사 (3곳)', duration: '1시간' },
      { id: 'w22t2', type: 'direct', title: '견적 요청 이메일 발송', duration: '30분' },
      { id: 'w22t3', type: 'gov',    title: '지역 스타트업 지원사업 신청', duration: '1시간' },
    ],
  },
  {
    week: 23, label: 'W23', dateRange: '9/8~9/14', title: '케이스 v2 개선', importance: 2, phase: 2,
    tasks: [
      { id: 'w23t1', type: 'ai',       title: '케이스 디자인 개선', duration: '2시간' },
      { id: 'w23t2', type: 'outsource', title: '케이스 v2 3D 프린팅', duration: '반나절' },
      { id: 'w23t3', type: 'direct',   title: '최종 착용감 확인', duration: '30분' },
    ],
  },
  {
    week: 24, label: 'W24', dateRange: '9/15~9/21', title: '제품 사진 + 영상', importance: 2, phase: 2,
    tasks: [
      { id: 'w24t1', type: 'direct', title: '착용 시연 영상 촬영 (30초)', duration: '1시간' },
      { id: 'w24t2', type: 'direct', title: '제품 사진 촬영 (5컷)', duration: '1시간' },
      { id: 'w24t3', type: 'ai',     title: '영상 편집 (CapCut)', duration: '1시간' },
    ],
  },
  {
    week: 25, label: 'W25', dateRange: '9/22~9/28', title: '체험단 5대 조립', importance: 2, phase: 2,
    tasks: [
      { id: 'w25t1', type: 'direct', title: '최종 5대 조립', duration: '반나절' },
      { id: 'w25t2', type: 'direct', title: '5대 전수 검사', duration: '1시간' },
      { id: 'w25t3', type: 'direct', title: '체험단 모집 공고 (SNS)', duration: '30분' },
    ],
  },
  {
    week: 26, label: 'W26', dateRange: '9/29~10/5', title: '🎉 하드웨어 완성!', importance: 3, phase: 2,
    tasks: [
      { id: 'w26t1', type: 'direct', title: '체험단 5명 선발 + 발송', duration: '반나절' },
      { id: 'w26t2', type: 'ai',     title: '빌드인퍼블릭 블로그 3편 (하드웨어 완성 후기)', duration: '1시간' },
      { id: 'w26t3', type: 'direct', title: 'Phase 2 회고 + Phase 3 앱 개발 계획', duration: '1시간' },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 3 · 앱 MVP + 실사용 테스트 (2026.11 ~ 2027.3)
  // ──────────────────────────────────────────────────────────────────────────
  {
    week: 27, label: 'W27', dateRange: '10/6~10/19', title: '앱 개발 환경 세팅', importance: 2, phase: 3,
    tasks: [
      { id: 'w27t1', type: 'ai',     title: 'Flutter 설치 + VS Code 세팅', duration: '1시간',
        firstAction: 'flutter.dev → Install' },
      { id: 'w27t2', type: 'ai',     title: '앱 구조 설계 (화면 4개 + 데이터 흐름)', duration: '1시간' },
      { id: 'w27t3', type: 'direct', title: '체험단 초기 피드백 수집', duration: '30분' },
    ],
  },
  {
    week: 28, label: 'W28', dateRange: '10/20~11/2', title: 'BLE 연동', importance: 3, phase: 3,
    tasks: [
      { id: 'w28t1', type: 'ai', title: 'flutter_blue_plus 패키지 설치', duration: '30분' },
      { id: 'w28t2', type: 'ai', title: 'ESP32 BLE GATT 서버 코드 작성', duration: '2시간' },
      { id: 'w28t3', type: 'ai', title: '앱 ↔ ESP32 데이터 수신 테스트', duration: '1시간' },
    ],
  },
  {
    week: 29, label: 'W29', dateRange: '11/3~11/16', title: '앱 메인 화면', importance: 2, phase: 3,
    tasks: [
      { id: 'w29t1', type: 'ai', title: '실시간 허리 수치 표시 화면', duration: '2시간' },
      { id: 'w29t2', type: 'ai', title: '자세 불량 시 진동 알림 기능', duration: '1시간' },
      { id: 'w29t3', type: 'ai', title: 'UI 디자인 개선 (피그마 → Flutter)', duration: '1시간' },
    ],
  },
  {
    week: 30, label: 'W30', dateRange: '11/17~11/30', title: '데이터 저장 + 그래프', importance: 2, phase: 3,
    tasks: [
      { id: 'w30t1', type: 'ai',     title: '로컬 DB (SQLite/Hive) 연동', duration: '2시간' },
      { id: 'w30t2', type: 'ai',     title: '일간/주간 그래프 화면', duration: '2시간' },
      { id: 'w30t3', type: 'direct', title: '앱 + 하드웨어 통합 테스트', duration: '1시간' },
    ],
  },
  {
    week: 31, label: 'W31', dateRange: '12/1~12/14', title: '알림 시스템', importance: 2, phase: 3,
    tasks: [
      { id: 'w31t1', type: 'ai', title: '패턴 인터럽트 알림 (10분 이상 불량 자세)', duration: '1시간' },
      { id: 'w31t2', type: 'ai', title: '일일 리포트 푸시 알림', duration: '1시간' },
      { id: 'w31t3', type: 'ai', title: '설정 화면 (민감도 조정)', duration: '1시간' },
    ],
  },
  {
    week: 32, label: 'W32', dateRange: '12/15~12/28', title: 'BLE 앱 완성', importance: 3, phase: 3,
    tasks: [
      { id: 'w32t1', type: 'ai',     title: '4화면 완성 (홈/그래프/알림/설정)', duration: '반나절' },
      { id: 'w32t2', type: 'direct', title: '앱 베타 테스트 (가족/지인 5명)', duration: '1시간' },
      { id: 'w32t3', type: 'ai',     title: 'TestFlight / Play Console 배포', duration: '1시간' },
    ],
  },
  {
    week: 33, label: 'W33', dateRange: '12/29~1/11', title: '실사용 테스트 시작', importance: 2, phase: 3,
    tasks: [
      { id: 'w33t1', type: 'direct', title: '본인 매일 착용 + 앱 데이터 수집', duration: '매일 10분' },
      { id: 'w33t2', type: 'direct', title: '주간 데이터 리뷰 + 이상치 분석', duration: '30분' },
      { id: 'w33t3', type: 'ai',     title: '빌드인퍼블릭 블로그 4편', duration: '1시간' },
    ],
  },
  {
    week: 34, label: 'W34', dateRange: '1/12~1/25', title: '앱 개선 1차', importance: 2, phase: 3,
    tasks: [
      { id: 'w34t1', type: 'ai',     title: '실사용 피드백 반영 개선', duration: '2시간' },
      { id: 'w34t2', type: 'ai',     title: '배터리 소모 최적화', duration: '1시간' },
      { id: 'w34t3', type: 'direct', title: '체험단 2차 피드백 수집', duration: '30분' },
    ],
  },
  {
    week: 35, label: 'W35', dateRange: '1/26~2/8', title: '데이터 축적 + 분석', importance: 1, phase: 3,
    tasks: [
      { id: 'w35t1', type: 'direct', title: '3개월 착용 데이터 통계 분석', duration: '1시간' },
      { id: 'w35t2', type: 'ai',     title: '지방간 수치 vs 착용 데이터 상관관계', duration: '30분' },
      { id: 'w35t3', type: 'ai',     title: '효과 사례 케이스 스터디 초안', duration: '1시간' },
    ],
  },
  {
    week: 36, label: 'W36', dateRange: '2/9~2/22', title: '앱 개선 2차', importance: 2, phase: 3,
    tasks: [
      { id: 'w36t1', type: 'ai',     title: 'UX 개선 (온보딩 화면 추가)', duration: '2시간' },
      { id: 'w36t2', type: 'ai',     title: '데이터 내보내기 기능 (CSV)', duration: '1시간' },
      { id: 'w36t3', type: 'direct', title: '앱스토어 스크린샷 준비', duration: '1시간' },
    ],
  },
  {
    week: 37, label: 'W37', dateRange: '2/23~3/8', title: '체험단 최종 피드백', importance: 2, phase: 3,
    tasks: [
      { id: 'w37t1', type: 'direct', title: '최종 체험단 인터뷰 + 사용 후기 수집', duration: '2시간' },
      { id: 'w37t2', type: 'ai',     title: '효과 사례 카드 4장 제작', duration: '1시간' },
      { id: 'w37t3', type: 'direct', title: '와디즈 준비 킥오프 + 리워드 설계', duration: '1시간' },
    ],
  },
  {
    week: 38, label: 'W38', dateRange: '3/9~3/22', title: '앱 MVP 완성 + 특허 준비', importance: 3, phase: 3,
    tasks: [
      { id: 'w38t1', type: 'ai',       title: '앱 v1.0 최종 빌드', duration: '반나절' },
      { id: 'w38t2', type: 'ai',       title: '특허 명세서 초안 작성', duration: '1시간' },
      { id: 'w38t3', type: 'outsource', title: '변리사 상담 (무료 상담)', duration: '1시간' },
    ],
  },
  {
    week: 39, label: 'W39', dateRange: '3/23~4/5', title: '특허 출원', importance: 3, phase: 3,
    tasks: [
      { id: 'w39t1', type: 'outsource', title: '발명특허 + 디자인특허 출원 접수', duration: '반나절' },
      { id: 'w39t2', type: 'outsource', title: '상표 출원 (WaistSense)', duration: '1시간' },
      { id: 'w39t3', type: 'direct',   title: '와디즈 메이커 등록',  duration: '1시간',
        firstAction: 'wadiz.kr → 메이커 센터 → 등록' },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 4 · 와디즈 펀딩 (2027.4~5)
  // ──────────────────────────────────────────────────────────────────────────
  {
    week: 40, label: 'W40', dateRange: '4/6~4/19', title: '상세페이지 + 대표영상', importance: 3, phase: 4,
    tasks: [
      { id: 'w40t1', type: 'ai',     title: '상세페이지 카피라이팅 + 디자인 (Canva)', duration: '반나절' },
      { id: 'w40t2', type: 'direct', title: '작동 시연 영상 촬영 + 편집 (2분)', duration: '반나절' },
      { id: 'w40t3', type: 'ai',     title: '실사용 데이터 인포그래픽 4장', duration: '1시간' },
    ],
  },
  {
    week: 41, label: 'W41', dateRange: '4/20~5/3', title: '사전 마케팅', importance: 2, phase: 4,
    tasks: [
      { id: 'w41t1', type: 'direct', title: '인스타그램 예고 포스팅 (3개)', duration: '1시간' },
      { id: 'w41t2', type: 'direct', title: '지방간/뱃살 카페 홍보', duration: '1시간' },
      { id: 'w41t3', type: 'ai',     title: '인플루언서 리스트업 + DM 발송', duration: '1시간' },
    ],
  },
  {
    week: 42, label: 'W42', dateRange: '5/4~5/17', title: '알림 신청 목표 100명', importance: 2, phase: 4,
    tasks: [
      { id: 'w42t1', type: 'direct', title: '와디즈 알림 신청 100명 목표', duration: '매일 30분' },
      { id: 'w42t2', type: 'direct', title: '지인 네트워크 공유 요청', duration: '30분' },
      { id: 'w42t3', type: 'ai',     title: '블로그 와디즈 오픈 예고편', duration: '1시간' },
    ],
  },
  {
    week: 43, label: 'W43', dateRange: '5/18~5/31', title: '와디즈 오픈 준비 완료', importance: 3, phase: 4,
    tasks: [
      { id: 'w43t1', type: 'direct', title: '와디즈 프로젝트 최종 검수', duration: '2시간' },
      { id: 'w43t2', type: 'direct', title: '인플루언서 리뷰 영상 업로드', duration: '반나절' },
      { id: 'w43t3', type: 'direct', title: '오픈 당일 SNS 일정 예약', duration: '1시간' },
    ],
  },
  {
    week: 44, label: 'W44', dateRange: '6/1~6/14', title: '🚀 와디즈 오픈!', importance: 3, phase: 4,
    tasks: [
      { id: 'w44t1', type: 'direct', title: '와디즈 크라우드펀딩 오픈 + SNS 전면 홍보', duration: '하루종일' },
      { id: 'w44t2', type: 'direct', title: '실시간 후원자 댓글 응대', duration: '매일 30분' },
      { id: 'w44t3', type: 'direct', title: '펀딩 현황 SNS 업데이트', duration: '매일 15분' },
    ],
  },
  {
    week: 45, label: 'W45', dateRange: '6/15~6/30', title: '펀딩 기간 운영', importance: 2, phase: 4,
    tasks: [
      { id: 'w45t1', type: 'direct', title: '후원자 Q&A 대응 + 업데이트 포스팅', duration: '매일 30분' },
      { id: 'w45t2', type: 'direct', title: '목표 200% 달성 독려 마케팅', duration: '주 2회 1시간' },
      { id: 'w45t3', type: 'outsource', title: '양산 업체 최종 계약', duration: '반나절' },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 5 · 양산 + 배송 (2027.6~8)
  // ──────────────────────────────────────────────────────────────────────────
  {
    week: 46, label: 'W46', dateRange: '7/1~7/20', title: '양산 발주', importance: 3, phase: 5,
    tasks: [
      { id: 'w46t1', type: 'outsource', title: 'EMS 업체 양산 발주 (펀딩 수량 + 20%)', duration: '반나절' },
      { id: 'w46t2', type: 'direct',   title: '생산 일정 + 품질 관리 계획', duration: '1시간' },
      { id: 'w46t3', type: 'direct',   title: '패키징 디자인 확정 + 발주', duration: '1시간' },
    ],
  },
  {
    week: 47, label: 'W47', dateRange: '7/21~8/10', title: '생산 관리', importance: 2, phase: 5,
    tasks: [
      { id: 'w47t1', type: 'direct', title: '생산 현장 방문 + 샘플 검수', duration: '반나절' },
      { id: 'w47t2', type: 'direct', title: '후원자 업데이트 (생산 현황 사진)', duration: '30분' },
      { id: 'w47t3', type: 'ai',     title: '배송 준비 (운송장 자동화)', duration: '1시간' },
    ],
  },
  {
    week: 48, label: 'W48', dateRange: '8/11~8/31', title: '📦 출고 + 배송 완료', importance: 3, phase: 5,
    tasks: [
      { id: 'w48t1', type: 'direct', title: '완제품 입고 + 전수 검사', duration: '하루종일' },
      { id: 'w48t2', type: 'direct', title: '포장 + 발송', duration: '하루종일' },
      { id: 'w48t3', type: 'direct', title: '배송 완료 알림 + 후기 요청', duration: '30분' },
    ],
  },
];

// 현재 week 번호 반환 (1-based)  — WEEKS 정의 이후에 위치해야 함
export function getCurrentWeek(): number {
  const idx = getCurrentWeekIndex(WEEKS);
  return WEEKS[idx]?.week ?? 1;
}
