/*
 * 표 컬럼 너비 — 같은 종류의 컬럼은 어느 표에서나 같은 폭으로 보이게 한 곳에서 정한다.
 *
 * ■ 짧은 값(날짜 · 상태 · 번호 · 이름 · 횟수)은 고정 폭 — FIXED_COLUMN.*
 *   폭은 헤더 글자 + 정렬 아이콘이 잘리지 않는 최소값 — 컬럼이 많은 대출 / 반납 현황(10개)도 1440px 화면에서 가로 스크롤 없이 들어가게 맞췄다
 *   Table 은 layoutMode 'grid' 라 grow 가 켜진 컬럼은 남는 폭을 size 비율대로 나눠 갖는다.
 *   그러면 같은 "대출일"도 표마다 컬럼 구성에 따라 실제 폭이 달라진다 → 짧은 값은 grow 를 끄고 폭을 고정한다.
 *
 * ■ 긴 글(도서명 · 저자 · 출판사 · 이메일 · 연장 사유)은 남는 폭을 나눠 갖는다 — FLEX_COLUMN.*
 *   size 는 최소 폭이자 나눠 갖는 비율이다. 표마다 적어도 하나는 있어야 표가 화면 폭을 채운다.
 */

/** 고정 폭 컬럼 — 컬럼 정의에 펼쳐 쓴다: `{ accessorKey: 'loanedAt', header: '대출일', ...FIXED_COLUMN.date }` */
export const FIXED_COLUMN = {
	/** 날짜 YYYY-MM-DD (대출일 · 반납예정일 · 반납일) */
	date: { size: 120, grow: false },
	/** 상태 칩 (대출중 · 연체 N일 · 정상 · 연체 N건 · 대출가능) */
	status: { size: 90, grow: false },
	/** 번호 (회원번호 · Lot 번호) */
	code: { size: 110, grow: false },
	/** 사람 이름 (회원명 · 이름 · 대출자) */
	personName: { size: 100, grow: false },
	/** 짧은 수 (재고 · 연장 횟수 · 연체일수 · 연체료) */
	count: { size: 110, grow: false },
	/** 연락처 010-0000-0000 */
	phone: { size: 140, grow: false },
	/** 분류 칩 */
	category: { size: 110, grow: false },
	/** 대출 가능 여부 칩 — "대출 가능 (3/4)" 처럼 길다 */
	availability: { size: 150, grow: false },
} as const;

/** 남는 폭을 나눠 갖는 컬럼 — size 는 최소 폭이자 비율 */
export const FLEX_COLUMN = {
	/** 도서명 · 제목 */
	bookTitle: { size: 170 },
	/** 저자 · 출판사 */
	person: { size: 125 },
	/** 이메일 */
	email: { size: 200 },
	/** 연장 사유처럼 긴 설명 */
	description: { size: 200 },
} as const;
