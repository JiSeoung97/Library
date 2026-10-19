import { Chip } from '@mui/material';

interface IProps {
	label: string;
}

/**
 * filterVariant: 'select' 컬럼의 기본 셀 — 분류값을 Chip 으로 감싼다.
 * 상태별 색상이 필요하면 컬럼에서 Cell 을 직접 지정한다(ChipLoanStatus 등).
 */
const CellChip = ({ label }: IProps) => {
	if (!label) return null;

	return <Chip label={label} size='small' variant='outlined' />;
};

export default CellChip;
