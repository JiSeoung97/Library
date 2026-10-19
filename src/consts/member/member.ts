import type { IStatusOption } from '@/types/common/option';
import type { TMemberDisplayStatus, TMemberStatus } from '@/types/member/member';

export const MEMBER_STATUS_OPTIONS: IStatusOption<TMemberStatus>[] = [
	{ value: 'ACTIVE', label: '정상', color: 'success' },
	{ value: 'WITHDRAWN', label: '탈퇴', color: 'default' },
];

/** 검색 조건용 — 테이블 Chip 과 같은 기준(연체는 파생 상태)으로 고른다 */
export const MEMBER_DISPLAY_STATUS_OPTIONS: { value: TMemberDisplayStatus; label: string }[] = [
	{ value: 'ACTIVE', label: '정상' },
	{ value: 'OVERDUE', label: '연체' },
	{ value: 'WITHDRAWN', label: '탈퇴' },
];
