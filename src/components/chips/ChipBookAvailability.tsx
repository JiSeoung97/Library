import { Chip } from '@mui/material';

interface IProps {
	availableQty: number;
	totalQty: number;
}

/** 재고로부터 대출 가능 여부를 표시 — 남은 권수는 라벨로 알리고 Chip 모양은 통일한다 */
const ChipBookAvailability = ({ availableQty, totalQty }: IProps) => {
	const available = availableQty > 0;

	return (
		<Chip
			size='small'
			variant='filled'
			label={
				available ? `대출 가능 (${availableQty}/${totalQty})` : `대출 불가 (0/${totalQty})`
			}
			color={available ? 'success' : 'default'}
		/>
	);
};

export default ChipBookAvailability;
