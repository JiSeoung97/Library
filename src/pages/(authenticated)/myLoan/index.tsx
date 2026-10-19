import TableLoans, { useColumns } from '@/components/tables/loan/TableLoans';
import PageHeader from '@/components/ui/containers/PageHeader';
import useTableState from '@/hooks/common/table/useTableState';
import ModalLoanExtensionRequest from '@/pages/(authenticated)/myLoan/-components/modals/ModalLoanExtensionRequest';
import { guardRole } from '@/pages/-guards/guardRole';
import services from '@/services/services';
import type { ILoan } from '@/types/loan/loan';
import { toColumnVisibility } from '@/utils/common/table/toColumnVisibility';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import MoreTimeIcon from '@mui/icons-material/MoreTime';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

// 공통 대출 컬럼(TableLoans) 중 회원 본인에게 보여줄 컬럼 — 회원명은 본인이라 뺀다
const VISIBLE_COLUMNS = [
	'bookTitle',
	'loanedAt',
	'dueAt',
	'status',
	'overdueFee',
	'extensionCount',
];

/**
 * 내 대출 현황 (회원) — 과제 화면 7. 내 대출의 반납 예정일 · 연체 여부 · 연체료를 보고, 반납기한 연장을 신청한다.
 * 다른 목록과 같이 페이징 · 정렬은 서버가 한다(Table 에 tableState 를 넘긴다).
 */
const Component = () => {
	const { memberService } = services;
	// 역할 가드(guardRole)가 로그인 사용자를 라우트 context 로 넘긴다 — 가드를 통과했으니 반드시 있다
	const { memberId } = Route.useRouteContext().user;
	// 서버 페이징 · 정렬 — 기본 순서(최근 대출이 위로)는 서버가 정하고, 헤더를 누르면 그 기준으로 다시 정렬한다
	const tableState = useTableState<{ memberId: number }>({ data: { memberId } });
	const { data, isFetching } = memberService.useGetMemberLoanHistory(tableState.requestBody);
	// 연장 신청 모달의 대상 — 값이 있으면 모달이 열린다
	const [extensionLoan, setExtensionLoan] = useState<ILoan | null>(null);

	const columns = useColumns();

	return (
		<>
			<PageHeader title='내 대출 현황' />

			<TableLoans
				title='대출 목록'
				data={data?.data ?? []}
				rowCount={data?.totalRecords ?? 0}
				isFetching={isFetching}
				tableState={tableState}
				initialState={{ columnVisibility: toColumnVisibility(columns, VISIBLE_COLUMNS) }}
				// 행 동작 — 대출 중(연체 아님)인 건만 연장 신청. 연체 · 반납완료는 할 수 있는 일이 없어 ⋮ 도 나오지 않는다
				getRowActions={loan => {
					// 이미 접수된 연장 신청이 승인을 기다리면 다시 신청할 수 없다 — 동작 이름 대신 지금 상태를 회색으로 보여 준다
					if (loan.status === 'BORROWED' && loan.pendingExtensionReason)
						return [
							{
								label: '연장 승인 대기 중',
								Icon: HourglassTopIcon,
								disabled: true,
								onClick: () => {},
							},
						];

					if (loan.status === 'BORROWED')
						return [
							{
								label: '반납기한 연장 신청',
								Icon: MoreTimeIcon,
								onClick: () => setExtensionLoan(loan),
							},
						];

					return [];
				}}
			/>

			{extensionLoan && (
				<ModalLoanExtensionRequest
					open
					data={extensionLoan}
					onClose={() => setExtensionLoan(null)}
				/>
			)}
		</>
	);
};

export const Route = createFileRoute('/(authenticated)/myLoan/')({
	// 회원만 들어올 수 있다
	beforeLoad: guardRole('MEMBER'),
	component: Component,
});
