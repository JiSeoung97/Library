import TableMembers from '@/components/tables/member/TableMembers';
import PageHeader from '@/components/ui/containers/PageHeader';
import useTableState from '@/hooks/common/table/useTableState';
import FormMemberSearch from '@/pages/(authenticated)/member/-components/forms/FormMemberSearch';
import ModalCreateMember from '@/pages/(authenticated)/member/-components/modals/ModalCreateMember';
import ModalMemberLoanHistory from '@/pages/(authenticated)/member/-components/modals/ModalMemberLoanHistory';
import ModalUpdateMember from '@/pages/(authenticated)/member/-components/modals/ModalUpdateMember';
import { guardRole } from '@/pages/-guards/guardRole';
import services from '@/services/services';
import type { IMember, IMemberSearch } from '@/types/member/member';
import HistoryIcon from '@mui/icons-material/History';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

/**
 * 회원 관리 (관리자) — 회원 검색 · 등록 · 수정 · 탈퇴, 회원별 대출 이력.
 *
 * - 조회: useTableState(조건) → memberService.useGetMemberList(조건) → TableMembers(결과)
 * - 쓰기: 모달을 열고 닫는 state 만 들고 있고, 실제 요청은 각 모달과 Service 훅이 한다
 */
const Component = () => {
	const { memberService } = services;
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [updateMember, setUpdateMember] = useState<IMember | null>(null);
	const [historyMemberId, setHistoryMemberId] = useState<number | null>(null);

	// 검색 조건은 useTableState 가 들고 있다 — 검색 폼이 setData 로 바꾸면 1페이지로 돌아가며 다시 조회된다
	// 기본 순서(상태 내림차순: 연체 → 탈퇴 → 정상, 그다음 회원번호 오름차순)는 서버가 정한다 — 헤더에는 사용자가 직접 누른 정렬만 보인다
	const tableState = useTableState<IMemberSearch>();
	const { data, isFetching, refetch } = memberService.useGetMemberList(tableState.requestBody);
	const { mutate: deleteMember } = memberService.useDeleteMember();

	return (
		<>
			<PageHeader title='회원 관리' />

			<FormMemberSearch
				onSearch={tableState.setData}
				onRefetch={refetch}
				isSearching={isFetching}
				onResetTable={tableState.resetTableView}
			/>

			<TableMembers
				title='회원 목록'
				data={data?.data ?? []}
				rowCount={data?.totalRecords ?? 0}
				isFetching={isFetching}
				tableState={tableState}
				// 등록 — 툴바의 + 버튼
				createLabel='회원 등록'
				onCreate={() => setIsCreateOpen(true)}
				// 행 동작 — 수정 · 탈퇴는 공통 항목을 쓰고, 이 화면에만 있는 '대출 이력'은 따로 넘긴다
				getRowActions={member => [
					{
						label: '대출 이력',
						Icon: HistoryIcon,
						onClick: () => setHistoryMemberId(member.memberId),
					},
				]}
				onUpdateRow={setUpdateMember}
				// 회원은 지우지 않고 탈퇴 처리한다 — 버튼 이름과 확인창 문구만 바꾼다
				labels={{ delete: '탈퇴' }}
				onDeleteRow={member => deleteMember({ data: { memberId: member.memberId } })}
				isDeleteRowDisabled={member => member.status === 'WITHDRAWN'}
				getDeleteConfirmMessage={member => `${member.name} 회원을 탈퇴 처리하시겠습니까?`}
			/>

			<ModalCreateMember open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
			{/* 대상이 있을 때만 마운트한다 — 열 때마다 폼이 그 회원 값으로 새로 초기화된다 */}
			{updateMember && (
				<ModalUpdateMember open data={updateMember} onClose={() => setUpdateMember(null)} />
			)}
			{historyMemberId !== null && (
				<ModalMemberLoanHistory
					open
					data={historyMemberId}
					onClose={() => setHistoryMemberId(null)}
				/>
			)}
		</>
	);
};

export const Route = createFileRoute('/(authenticated)/member/')({
	// 관리자만 들어올 수 있다
	beforeLoad: guardRole('ADMIN'),
	component: Component,
});
