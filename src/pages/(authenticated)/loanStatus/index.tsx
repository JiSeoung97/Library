import TableLoans, { useColumns } from '@/components/tables/loan/TableLoans';
import PageHeader from '@/components/ui/containers/PageHeader';
import TabsToggle from '@/components/ui/tabs/TabsToggle';
import { ACTIVE_LOAN_STATUSES, LOAN_STATUS_OPTIONS } from '@/consts/loan/loan';
import { useConfirm } from '@/contexts/ConfirmGuardProvider';
import useTableState from '@/hooks/common/table/useTableState';
import FormLoanSearch from '@/pages/(authenticated)/loanStatus/-components/forms/FormLoanSearch';
import ModalCreateLoan from '@/pages/(authenticated)/loanStatus/-components/modals/ModalCreateLoan';
import { guardRole } from '@/pages/-guards/guardRole';
import type { ISchemaSearchLoan } from '@/schemas/web/loan/loan';
import services from '@/services/services';
import type { ILoan, ILoanSearch, TLoanStatus } from '@/types/loan/loan';
import { cn } from '@/utils/common/cn';
import { toColumnVisibility } from '@/utils/common/table/toColumnVisibility';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

// 공통 대출 컬럼(TableLoans) 중 현황 파악 · 반납 처리에 필요한 컬럼
const VISIBLE_COLUMNS = [
	'memberName',
	'bookTitle',
	'bookAuthor',
	'bookPublisher',
	'loanedAt',
	'dueAt',
	'status',
	'overdueFee',
	'extensionCount',
];

// 상태 탭 — 맨 앞의 '전체'만 여기서 붙이고, 나머지는 상태 옵션(칩 · 컬럼 필터와 같은 목록)을 그대로 쓴다
const STATUS_TABS: { label: string; value: TLoanStatus | 'ALL' }[] = [
	{ label: '전체', value: 'ALL' },
	...LOAN_STATUS_OPTIONS.map(({ value, label }) => ({ value, label })),
];

/**
 * 대출 / 반납 / 현황 (관리자) — 과제 화면 5. 대출 처리 · 반납 처리 · 전체 현황 조회를 한 화면에서 한다.
 * - 대출: 표 오른쪽 위 + 버튼 → 회원 선택 → 도서 선택 → 대출 (ModalCreateLoan)
 * - 반납: 대출중 · 연체 행의 ⋮ → 반납
 * - 현황: 대출일 · 반납예정일 기간 · 회원명 · 도서명 검색 + 상태 탭(대출중 / 연체 / 반납완료)
 * 회원의 반납기한 연장 신청은 /extension 에서 승인 · 거절한다.
 */
const Component = () => {
	const { loanService } = services;
	const confirm = useConfirm();

	// 검색 조건은 useTableState 가 들고 있다. 검색 폼과 상태 탭이 각자 자기 조건만 바꾸고(prev 를 펼쳐 나머지는 유지),
	// 두 조건은 AND 로 함께 걸린다. setData 가 1페이지로 되돌리며 다시 조회한다.
	const tableState = useTableState<ILoanSearch>();
	// 상태 탭의 현재 값 — 조건에 status 가 없으면 '전체'
	const status: TLoanStatus | 'ALL' = tableState.data?.status ?? 'ALL';

	const { data, isFetching, refetch } = loanService.useGetLoanList(tableState.requestBody);
	const { mutate: returnLoan } = loanService.usePatchLoanReturn();
	const columns = useColumns();
	// 대출 처리 모달 — 열 때마다 빈 폼으로 시작하도록 열려 있을 때만 마운트한다
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	const handleSearch = (values: ISchemaSearchLoan) =>
		tableState.setData(prev => ({ ...prev, ...values }));

	const handleChangeStatus = (value: TLoanStatus | 'ALL') =>
		tableState.setData(prev => ({ ...prev, status: value === 'ALL' ? undefined : value }));

	// 초기화 — 헤더 필터 · 정렬에 더해 상태 탭도 '전체'로 되돌린다(상태 탭도 목록을 거르는 선택형 조건이라서).
	// 이어서 검색 폼이 기본 조건으로 handleSearch 를 부르므로, 검색어 · 기간도 함께 비워진다
	const handleResetTable = () => {
		tableState.resetTableView();
		tableState.setData(prev => ({ ...prev, status: undefined }));
	};

	// 반납은 되돌릴 수 없어 확인창을 거친다.
	// 연장 신청이 승인 대기 중이면 반납과 함께 취소된다는 것을 미리 알려 준다(서버가 반납 때 함께 취소한다)
	const handleReturn = async (loan: ILoan) => {
		const confirmed = await confirm({
			message: loan.pendingExtensionReason
				? `${loan.memberName} 님의 '${loan.bookTitle}' 반납을 처리하시겠습니까?\n승인 대기 중인 연장 신청은 함께 취소됩니다.`
				: `${loan.memberName} 님의 '${loan.bookTitle}' 반납을 처리하시겠습니까?`,
			labels: { confirm: '반납' },
		});
		if (confirmed) returnLoan({ data: { loanId: loan.loanId } });
	};

	return (
		<>
			<PageHeader title='대출 / 반납 현황' />

			<FormLoanSearch
				onSearch={handleSearch}
				onRefetch={refetch}
				isSearching={isFetching}
				onResetTable={handleResetTable}
			/>

			<TableLoans
				title='대출 현황'
				toolbarActions={
					<TabsToggle
						value={status}
						options={STATUS_TABS}
						onChange={handleChangeStatus}
					/>
				}
				data={data?.data ?? []}
				rowCount={data?.totalRecords ?? 0}
				isFetching={isFetching}
				tableState={tableState}
				initialState={{ columnVisibility: toColumnVisibility(columns, VISIBLE_COLUMNS) }}
				// 표 오른쪽 위 + 버튼 — 대출 처리
				onCreate={() => setIsCreateOpen(true)}
				createLabel='대출'
				// 행 동작 — 반납. 아직 반납하지 않은 건(대출중 · 연체)에만 있고, 반납완료 행은 ⋮ 도 나오지 않는다
				getRowActions={loan =>
					ACTIVE_LOAN_STATUSES.includes(loan.status)
						? [
								{
									label: '반납',
									Icon: AssignmentReturnIcon,
									onClick: () => void handleReturn(loan),
								},
							]
						: []
				}
				// 연체 건은 행 배경을 붉게 칠해 먼저 눈에 띄게 한다
				muiTableBodyRowProps={({ row }) => ({
					className: cn({ 'bg-red-50': row.original.status === 'OVERDUE' }),
				})}
			/>

			{isCreateOpen && <ModalCreateLoan open onClose={() => setIsCreateOpen(false)} />}
		</>
	);
};

export const Route = createFileRoute('/(authenticated)/loanStatus/')({
	// 관리자만 들어올 수 있다
	beforeLoad: guardRole('ADMIN'),
	component: Component,
});
