import { cn } from '@/utils/common/cn';
import type { ReactNode } from 'react';

interface IProps {
	children: ReactNode;
	/** 한 행에 놓을 항목 수 (기본 2) */
	columns?: number;
	/** 라벨 칸 너비 — 모든 행이 같은 너비를 쓰도록 그리드가 정한다 */
	labelWidth?: string;
	className?: string;
}

/**
 * BoxInfo 들을 표처럼 감싼다.
 * 라벨·값 칸을 그리드 트랙으로 직접 잡아(BoxInfo 는 display:contents) 행이 달라도 라벨 폭이 어긋나지 않는다.
 */
const BoxInfoGrid = ({ children, columns = 2, labelWidth = '5.5rem', className }: IProps) => (
	<div
		className={cn('grid overflow-hidden rounded border-t border-l border-gray-200', className)}
		style={{ gridTemplateColumns: `repeat(${columns}, ${labelWidth} minmax(0, 1fr))` }}
	>
		{children}
	</div>
);

export default BoxInfoGrid;
