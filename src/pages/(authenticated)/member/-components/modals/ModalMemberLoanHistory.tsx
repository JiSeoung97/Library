import TableLoans, { useColumns } from '@/components/tables/loan/TableLoans';
import Modal, { type IModalBaseProps } from '@/components/ui/modals/Modal';
import useTableState from '@/hooks/common/table/useTableState';
import services from '@/services/services';
import { toColumnVisibility } from '@/utils/common/table/toColumnVisibility';

// 공통 대출 컬럼(TableLoans) 중 한 회원의 이력을 볼 때 필요한 컬럼 — 회원명은 이미 아는 값이라 뺀다.
// 연장 횟수: 대출 중인 책을 몇 번 연장했는지(최대 2회) 관리자가 회원 상담 때 바로 확인할 수 있게 함께 보여 준다
const VISIBLE_COLUMNS = [
	'bookTitle',
	'loanedAt',
	'dueAt',
	'returnedAt',
	'status',
	'extensionCount',
];

/**
 * 회원 대출 이력 모달 (관리자) — `data` 로 회원 번호를 받아 그 회원의 대출을 모두 보여 준다.
 * 조회만 하는 모달이라 variant 는 기본값 'info'(닫기 버튼만)를 쓴다.
 */
const ModalMemberLoanHistory = ({ open, data: memberId, onClose }: IModalBaseProps<number>) => {
	const { memberService } = services;
	// 서버 페이징 · 정렬 — 기본 순서(최근 대출이 위로)는 서버가 정하고, 헤더를 누르면 그 기준으로 다시 정렬한다
	const tableState = useTableState<{ memberId: number }>({ data: { memberId } });
	const { data, isFetching } = memberService.useGetMemberLoanHistory(tableState.requestBody);
	const columns = useColumns();

	return (
		<Modal open={open} title='회원 대출 이력' size='medium' onClose={onClose}>
			<TableLoans
				title='대출 이력'
				data={data?.data ?? []}
				rowCount={data?.totalRecords ?? 0}
				isFetching={isFetching}
				tableState={tableState}
				initialState={{
					columnVisibility: toColumnVisibility(columns, VISIBLE_COLUMNS),
				}}
			/>
		</Modal>
	);
};

export default ModalMemberLoanHistory;
