import { LOAN_STATUS_OPTIONS } from '@/consts/loan/loan';
import type { ILoan } from '@/types/loan/loan';
import { Chip } from '@mui/material';

interface IProps {
	loan: ILoan;
}

/**
 * 대출 상태 — 라벨·색은 필터 옵션(LOAN_STATUS_OPTIONS)과 공유한다. 연체는 일수를 덧붙인다.
 * 연장 신청 여부는 상태가 아니라 따로 처리할 일이라 칩에 섞지 않는다 — 연장 신청이 걸린 대출도 "대출중"으로 보인다.
 * (칩을 바꿔 보여 주면 "대출중" 탭으로 거른 목록에 다른 상태가 섞인 것처럼 보인다.
 *  연장 신청은 관리자는 연장 승인 화면, 회원은 내 대출 현황의 ⋮ 메뉴("연장 승인 대기 중")에서 확인한다)
 */
const ChipLoanStatus = ({ loan }: IProps) => {
	if (loan.status === 'OVERDUE')
		return <Chip size='small' color='error' label={`연체 ${loan.overdueDays}일`} />;

	const option = LOAN_STATUS_OPTIONS.find(o => o.value === loan.status);
	return <Chip size='small' color={option?.color} label={option?.label} />;
};

export default ChipLoanStatus;
