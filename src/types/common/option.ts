import type { ChipProps } from '@mui/material';

/** 상태 코드 한 개의 표시 정보 — 테이블 필터 옵션과 상태 Chip 이 같은 라벨·색을 쓰도록 한 곳에 둔다 */
export interface IStatusOption<T extends string> {
	value: T;
	label: string;
	color: ChipProps['color'];
}
