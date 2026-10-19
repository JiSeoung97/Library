/**
 * 관리자(사서) 계정 — 회원(IMember)과 다른 테이블에 둔다.
 *
 * 회원 테이블에 role 컬럼으로 섞어 두지 않는 이유 (1차 발표 리뷰 반영):
 * - 관리자와 회원은 서로 다른 대상이다. 회원에게만 있는 값(연락처 · 연체 건수 · 탈퇴)이 관리자에게는 의미가 없다.
 * - 한 테이블이면 회원 목록 · 아이디 중복 확인 · 회원 탈퇴 등 회원 기능마다 "관리자는 빼기" 조건이 필요하다.
 * - 가입 경로가 다르다 — 회원은 사서가 등록하고, 관리자 계정은 내부에서 발급한다(이 앱에는 관리자 등록 화면이 없다).
 */
export interface IAdmin {
	adminId: number;
	/** 화면에 보이는 관리자 번호 (예: A-0001) */
	adminCode: string;
	name: string;
	loginId: string;
	createdAt: string;
	updatedAt: string;
}
