import { cn } from '@/utils/common/cn';
import { Typography } from '@mui/material';

interface IProps {
	label: string;
	className?: string;
}

/**
 * 모달 안의 구획 제목 — 왼쪽에 파란 세로 막대가 붙은 소제목 줄 (mes_FE ModalSubTitle 과 같은 모양).
 * 폼이 "기본정보 · 계정정보"처럼 여러 묶음일 때, 그리고 조회 모달에서 표 위의 제목으로 쓴다.
 */
const ModalSubTitle = ({ label, className }: IProps) => (
	<div
		className={cn(
			'flex items-center justify-start border-b border-gray-200 bg-gray-50 p-3',
			className,
		)}
	>
		<Typography className='border-l-4 border-blue-600 pl-2 text-base leading-none font-semibold whitespace-nowrap text-gray-800'>
			{label}
		</Typography>
	</div>
);

export default ModalSubTitle;
