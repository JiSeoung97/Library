import { cn } from '@/utils/common/cn';
import { Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface IProps {
	title: string;
	/** 문자열·숫자 대신 Chip 등을 넣을 때는 children 을 쓴다 */
	data?: string | number | null;
	children?: ReactNode;
	/** 값이 길어 행의 남은 칸을 모두 쓰는 항목 (ISBN·비고 등) */
	fullWidth?: boolean;
}

/**
 * 라벨 + 값 한 칸 — BoxInfoGrid 안에서 표 형태로 늘어놓는다.
 * 라벨·값 칸 너비는 부모 그리드가 잡으므로 display:contents 로 트랙에 직접 얹는다.
 *
 * mes_FE BoxInfo.tsx(isInline 모드) 축소 이식 — 공통코드·사용자 Chip·타입별 포맷은 제외하고,
 * 포맷이 필요한 값은 호출부에서 가공해 넘긴다.
 */
const BoxInfo = ({ title, data, children, fullWidth }: IProps) => (
	<div className='contents'>
		<Typography
			variant='body2'
			color='text.secondary'
			className={cn(
				'flex items-center border-r border-b border-gray-200 bg-gray-50 px-3 py-2 font-bold whitespace-nowrap',
				// 라벨을 행 첫 칸에 고정해야 값 칸이 남은 폭을 모두 차지할 수 있다
				{ 'col-start-1': fullWidth },
			)}
		>
			{title}
		</Typography>
		<div
			className={cn(
				'flex min-h-10 items-center gap-2 border-r border-b border-gray-200 px-3 py-2',
				{
					'col-[2/-1]': fullWidth,
				},
			)}
		>
			{children ?? (
				<Typography
					variant='body2'
					className='truncate'
					title={data ? String(data) : undefined}
				>
					{data || '-'}
				</Typography>
			)}
		</div>
	</div>
);

export default BoxInfo;
