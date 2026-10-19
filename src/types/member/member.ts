export type TMemberStatus = 'ACTIVE' | 'WITHDRAWN';

/**
 * 화면에 보이는 회원 상태 — 연체는 status 값이 아니라 overdueCount 로부터 파생된다.
 * ACTIVE(연체 없는 정상) / OVERDUE(정상 회원 중 연체 건 보유) / WITHDRAWN(탈퇴)
 */
export type TMemberDisplayStatus = TMemberStatus | 'OVERDUE';

/** 회원 목록 조회 조건 — 항목별로 모두 AND 로 걸리고, 빈 값은 조건에서 빠진다 */
export interface IMemberSearch {
	name?: string;
	/** 연락처 부분 일치 — 숫자만 비교하므로 하이픈 · 괄호 · 공백은 있어도 없어도 된다 (예: '7552411' · '755-2411') */
	phone?: string;
	status?: TMemberDisplayStatus | '';
	email?: string;
}

export interface IMember {
	memberId: number;
	memberCode: string;
	name: string;
	phone: string;
	email: string;
	loginId: string;
	status: TMemberStatus;
	joinedAt: string;
	withdrawnAt?: string | null;
	overdueCount: number;
	createdAt: string;
	updatedAt: string;
}

/** 등록·수정 요청 본문 — 비밀번호는 보내기만 하고 응답(IMember)에는 담기지 않는다 */
export interface IMemberUpsertBody extends Partial<IMember> {
	password?: string;
}
