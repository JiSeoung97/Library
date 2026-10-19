import useCountUp from '@/hooks/common/useCountUp';
import { cn } from '@/utils/common/cn';
import { Typography } from '@mui/material';
import type { ElementType } from 'react';

// 지표 성격별 강조 색 — 아이콘 배경·아이콘 색 한 쌍
const TONE_CLASSES = {
	blue: 'bg-blue-50 text-blue-600',
	indigo: 'bg-indigo-50 text-indigo-600',
	red: 'bg-red-50 text-red-600',
	amber: 'bg-amber-50 text-amber-600',
	violet: 'bg-violet-50 text-violet-600',
} as const;

interface IProps {
	label: string;
	value: number;
	Icon: ElementType;
	tone: keyof typeof TONE_CLASSES;
}

/** 대시보드 상단 현황 숫자 카드 */
const CardSummary = ({ label, value, Icon, tone }: IProps) => {
	const displayValue = useCountUp(value);

	return (
		<section className='flex flex-row items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4'>
			<div
				className={cn(
					'flex size-11 shrink-0 items-center justify-center rounded-xl',
					TONE_CLASSES[tone],
				)}
			>
				<Icon />
			</div>
			<div className='min-w-0'>
				<Typography className='truncate text-sm text-gray-500'>{label}</Typography>
				{/* tabular-nums: 숫자가 올라가는 동안 자릿수 폭이 흔들리지 않게 고정폭 숫자를 쓴다 */}
				<Typography className='text-2xl font-bold text-gray-900 tabular-nums'>
					{displayValue.toLocaleString()}
				</Typography>
			</div>
		</section>
	);
};

export default CardSummary;
