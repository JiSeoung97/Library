import { BOOK_COPY_STATUS_OPTIONS } from '@/consts/book/book';
import type { IBookCopyWithLoan } from '@/types/book/book';
import { Chip } from '@mui/material';

interface IProps {
	copy: IBookCopyWithLoan;
}

/** 낱권 상태 — 라벨·색은 필터 옵션과 공유하고, 대출 중인 낱권은 연체 여부까지 구분한다 */
const ChipBookCopyStatus = ({ copy }: IProps) => {
	if (copy.activeLoan?.isOverdue) return <Chip size='small' color='error' label='연체중' />;

	const option = BOOK_COPY_STATUS_OPTIONS.find(o => o.value === copy.status);
	return <Chip size='small' color={option?.color} label={option?.label} />;
};

export default ChipBookCopyStatus;
