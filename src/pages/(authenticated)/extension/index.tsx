import TableLoans, { useColumns } from '@/components/tables/loan/TableLoans';
import PageHeader from '@/components/ui/containers/PageHeader';
import { useConfirm } from '@/contexts/ConfirmGuardProvider';
import useTableState from '@/hooks/common/table/useTableState';
import { guardRole } from '@/pages/-guards/guardRole';
import services from '@/services/services';
import type { ILoanSearch } from '@/types/loan/loan';
import { toColumnVisibility } from '@/utils/common/table/toColumnVisibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { createFileRoute } from '@tanstack/react-router';

// 공통 대출 컬럼(TableLoans) 중 연장 심사에 필요한 컬럼 — 현재 반납 예정일 · 연장 횟수 · 사유를 보고 판단한다
const VISIBLE_COLUMNS = [
	'memberName',
	'bookTitle',
	'bookAuthor',
	'bookPublisher',
	'loanedAt',
	'dueAt',
	'extensionCount',
	'pendingExtensionReason',
];

/**
 * 연장 승인 (관리자) — 회원이 신청한 반납기한 연장을 승인 · 거절한다.
 * 대출 자체는 신청 · 승인 없이 관리자가 대출 / 반납 현황(/loanStatus)에서 바로 처리한다(과제 3-3).
 * 연장만 회원이 신청하고 관리자가 판단하는 절차로 남겼다 — 사유를 보고 결정해야 하는 일이라서다.
 */
const Component = () => {
	const { loanService } = services;
	const confirm = useConfirm();

	// 연장 신청이 접수된 대출만 조회한다
	const tableState = useTableState<ILoanSearch>({
		data: { hasPendingExtension: true },
	});
	const { data, isFetching } = loanService.useGetLoanList(tableState.requestBody);
	const { mutate: approveExtension } = loanService.usePatchExtensionApprove();
	const { mutate: rejectExtension } = loanService.usePatchExtensionReject();
	const columns = useColumns();

	return (
		<>
			<PageHeader title='연장 승인' />

			<TableLoans
				title='연장 신청'
				data={data?.data ?? []}
				rowCount={data?.totalRecords ?? 0}
				isFetching={isFetching}
				tableState={tableState}
				initialState={{ columnVisibility: toColumnVisibility(columns, VISIBLE_COLUMNS) }}
				// 행 동작 — 승인 · 거절. 되돌릴 수 없어 확인창을 거친 뒤 실행한다
				getRowActions={loan => {
					const target = `${loan.memberName} 님의 '${loan.bookTitle}'`;
					const data = { loanId: loan.loanId };

					return [
						{
							label: '승인',
							Icon: CheckCircleIcon,
							onClick: async () => {
								const confirmed = await confirm({
									message: `${target} 반납기한을 연장하시겠습니까?`,
									labels: { confirm: '승인' },
								});
								if (confirmed) approveExtension({ data });
							},
						},
						{
							label: '거절',
							Icon: HighlightOffIcon,
							color: 'error',
							onClick: async () => {
								const confirmed = await confirm({
									variant: 'warning',
									message: `${target} 연장 신청을 거절하시겠습니까?`,
									labels: { confirm: '거절' },
								});
								if (confirmed) rejectExtension({ data });
							},
						},
					];
				}}
			/>
		</>
	);
};

export const Route = createFileRoute('/(authenticated)/extension/')({
	// 관리자만 들어올 수 있다
	beforeLoad: guardRole('ADMIN'),
	component: Component,
});
