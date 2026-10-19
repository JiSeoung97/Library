import TableLoans, { useColumns } from '@/components/tables/loan/TableLoans';
import BoxCard from '@/components/ui/containers/BoxCard';
import BoxInfo from '@/components/ui/containers/BoxInfo';
import BoxInfoGrid from '@/components/ui/containers/BoxInfoGrid';
import PageHeader from '@/components/ui/containers/PageHeader';
import useTableState from '@/hooks/common/table/useTableState';
import ModalUpdateMyInfo from '@/pages/(authenticated)/myInfo/-components/modals/ModalUpdateMyInfo';
import { guardRole } from '@/pages/-guards/guardRole';
import services from '@/services/services';
import { formatDate } from '@/utils/common/date';
import { toColumnVisibility } from '@/utils/common/table/toColumnVisibility';
import EditIcon from '@mui/icons-material/Edit';
import { Button } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

// 공통 대출 컬럼(TableLoans) 중 내 대출 이력에 보여 줄 컬럼 — 회원 대출 이력 모달(관리자)과 같은 구성이라 연장 횟수도 함께 본다
const VISIBLE_COLUMNS = [
	'bookTitle',
	'loanedAt',
	'dueAt',
	'returnedAt',
	'status',
	'extensionCount',
];

const Component = () => {
	const { memberService } = services;
	// 역할 가드(guardRole)가 로그인 사용자를 라우트 context 로 넘긴다 — 가드를 통과했으니 반드시 있다
	const { memberId } = Route.useRouteContext().user;
	const { data } = memberService.useGetMember({ data: { memberId } });
	// 서버 페이징 · 정렬 — 기본 순서(최근 대출이 위로)는 서버가 정하고, 헤더를 누르면 그 기준으로 다시 정렬한다
	const tableState = useTableState<{ memberId: number }>({ data: { memberId } });
	const { data: loanHistory, isFetching } = memberService.useGetMemberLoanHistory(
		tableState.requestBody,
	);
	const [isEditOpen, setIsEditOpen] = useState(false);

	const member = data?.data;
	const columns = useColumns();

	return (
		<>
			<PageHeader
				title='내 정보'
				actions={
					<Button
						variant='contained'
						disableElevation
						startIcon={<EditIcon />}
						onClick={() => setIsEditOpen(true)}
					>
						정보 수정
					</Button>
				}
			/>

			<BoxCard title='기본 정보'>
				<BoxInfoGrid>
					<BoxInfo title='이름' data={member?.name} />
					<BoxInfo title='회원번호' data={member?.memberCode} />
					<BoxInfo title='연락처' data={member?.phone} />
					<BoxInfo title='이메일' data={member?.email} />
					<BoxInfo title='가입일' data={formatDate(member?.joinedAt)} />
					<BoxInfo title='연체' data={member ? `${member.overdueCount}건` : undefined} />
				</BoxInfoGrid>
			</BoxCard>

			<TableLoans
				title='대출 이력'
				data={loanHistory?.data ?? []}
				rowCount={loanHistory?.totalRecords ?? 0}
				isFetching={isFetching}
				tableState={tableState}
				initialState={{ columnVisibility: toColumnVisibility(columns, VISIBLE_COLUMNS) }}
			/>

			{isEditOpen && member && (
				<ModalUpdateMyInfo open data={member} onClose={() => setIsEditOpen(false)} />
			)}
		</>
	);
};

export const Route = createFileRoute('/(authenticated)/myInfo/')({
	beforeLoad: guardRole('MEMBER'),
	component: Component,
});
