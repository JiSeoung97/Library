import TableLoans, { useColumns } from '@/components/tables/loan/TableLoans';
import PageHeader from '@/components/ui/containers/PageHeader';
import { DATE_FORMAT } from '@/components/ui/inputs/dates/DatePickerController';
import { RECENT_LOAN_DAYS } from '@/consts/loan/loan';
import useTableState from '@/hooks/common/table/useTableState';
import CardSummary from '@/pages/(authenticated)/dashboard/-components/cards/CardSummary';
import { guardRole } from '@/pages/-guards/guardRole';
import services from '@/services/services';
import type { ILoanSearch } from '@/types/loan/loan';
import { toColumnVisibility } from '@/utils/common/table/toColumnVisibility';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { createFileRoute } from '@tanstack/react-router';
import dayjs from 'dayjs';

// 공통 대출 컬럼(TableLoans) 중 대시보드에서 보여줄 컬럼
const VISIBLE_COLUMNS = [
	'memberName',
	'bookTitle',
	'bookAuthor',
	'bookPublisher',
	'loanedAt',
	'dueAt',
	'status',
];

/**
 * 대시보드 (관리자) — 도서관 운영 현황 숫자 4개와 최근 대출 목록.
 *
 * 최근 대출 = "최근 30일(RECENT_LOAN_DAYS, 한 달) 동안 대출된 건"을 대출일 최신 순으로 페이징한다.
 * - 건수(10건)로 자르지 않는다 — 하루에 그보다 많은 대출이 생기면 나머지를 볼 방법이 없다(1차 발표 피드백).
 * - 기간으로 "최근"을 정한다 — 기준이 없으면 사실상 전체 대출 내역이 되어 이름과 맞지 않는다.
 *   그보다 오래된 기록은 대출 / 반납 현황 화면에서 기간을 정해 검색한다.
 */
const Component = () => {
	const { loanService } = services;
	// 카드 숫자 — 조건이 없는 조회도 규칙대로 body({})를 넘긴다
	const { data: summary } = loanService.useGetLoanSummary({});

	// 최근 대출 — 최근 30일(오늘 포함) 동안 대출된 건을 서버 페이징한다. 기본 순서(대출일 최신 순)는 서버가 정한다.
	// 시작일은 화면에 들어온 순간 한 번 정한다(useTableState 의 초기 조건은 state 라 다시 그려져도 바뀌지 않는다)
	const tableState = useTableState<ILoanSearch>({
		data: {
			loanedFrom: dayjs()
				.subtract(RECENT_LOAN_DAYS - 1, 'day')
				.format(DATE_FORMAT),
		},
	});
	const { data: recentLoans, isFetching } = loanService.useGetLoanList(tableState.requestBody);

	const columns = useColumns();

	return (
		<>
			<PageHeader title='대시보드' />

			{/* 현황 카드 4개 — 과제 3-4 요약(전체 도서 수 · 대출 중 권수 · 연체 건수) + 처리할 연장 신청 수.
			    숫자는 0 에서 실제 값까지 올라가는 애니메이션으로 보여 준다(CardSummary) */}
			<div className='grid grid-cols-4 gap-4'>
				<CardSummary
					label='전체 도서 수'
					value={summary?.data.totalBookCount ?? 0}
					Icon={MenuBookIcon}
					tone='blue'
				/>
				<CardSummary
					label='대출 중 권수'
					value={summary?.data.borrowedCount ?? 0}
					Icon={AutoStoriesIcon}
					tone='indigo'
				/>
				<CardSummary
					label='연체 건수'
					value={summary?.data.overdueCount ?? 0}
					Icon={WarningAmberIcon}
					tone='red'
				/>
				<CardSummary
					label='연장 승인대기'
					value={summary?.data.pendingExtensionCount ?? 0}
					Icon={EventRepeatIcon}
					tone='amber'
				/>
			</div>

			<TableLoans
				title={`최근 대출 (최근 ${RECENT_LOAN_DAYS}일)`}
				data={recentLoans?.data ?? []}
				rowCount={recentLoans?.totalRecords ?? 0}
				isFetching={isFetching}
				tableState={tableState}
				initialState={{ columnVisibility: toColumnVisibility(columns, VISIBLE_COLUMNS) }}
			/>
		</>
	);
};

export const Route = createFileRoute('/(authenticated)/dashboard/')({
	// 관리자만 들어올 수 있다
	beforeLoad: guardRole('ADMIN'),
	component: Component,
});
