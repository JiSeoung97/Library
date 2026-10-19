import TableBooks, { useColumns } from '@/components/tables/book/TableBooks';
import PageHeader from '@/components/ui/containers/PageHeader';
import useTableState from '@/hooks/common/table/useTableState';
import FormBookSearch from '@/pages/(authenticated)/-components/forms/FormBookSearch';
import ModalInfoBookCopies from '@/pages/(authenticated)/-components/modals/ModalInfoBookCopies';
import { guardRole } from '@/pages/-guards/guardRole';
import services from '@/services/services';
import type { IBook, IBookSearch } from '@/types/book/book';
import { toColumnVisibility } from '@/utils/common/table/toColumnVisibility';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

// 공통 도서 컬럼(TableBooks) 중 회원에게 보여줄 컬럼 — 관리자용 '권수'는 뺀다
const VISIBLE_COLUMNS = ['title', 'author', 'category', 'publisher', 'availability'];

/**
 * 도서 검색 (회원) — 과제 화면 6. 도서를 찾아 대출 가능 여부를 본다. 행 더블클릭으로 낱권별 반납 예정일을 본다.
 * 대출은 회원이 신청하지 않고 도서관 창구에서 사서가 처리한다(과제 3-3) — 그래서 이 화면에는 행 동작이 없다.
 *
 * 조회 흐름: useTableState(조건) → bookService.useGetBookList(조건) → TableBooks(결과)
 */
const Component = () => {
	const { bookService } = services;
	const [detailBook, setDetailBook] = useState<IBook | null>(null);

	// 검색 조건은 useTableState 가 들고 있다 — 검색 폼이 setData 로 바꾸면 1페이지로 돌아가며 다시 조회된다
	const tableState = useTableState<IBookSearch>();
	const { data, isFetching, refetch } = bookService.useGetBookList(tableState.requestBody);

	const columns = useColumns();

	return (
		<>
			<PageHeader title='도서 검색' />

			<FormBookSearch
				onSearch={tableState.setData}
				onRefetch={refetch}
				isSearching={isFetching}
				onResetTable={tableState.resetTableView}
			/>

			<TableBooks
				title='도서 목록'
				data={data?.data ?? []}
				rowCount={data?.totalRecords ?? 0}
				isFetching={isFetching}
				tableState={tableState}
				initialState={{ columnVisibility: toColumnVisibility(columns, VISIBLE_COLUMNS) }}
				muiTableBodyRowProps={({ row }) => ({
					hover: true,
					className: 'cursor-pointer',
					onDoubleClick: () => setDetailBook(row.original),
				})}
			/>

			{detailBook && (
				<ModalInfoBookCopies
					isAdmin={false}
					open
					data={detailBook}
					onClose={() => setDetailBook(null)}
				/>
			)}
		</>
	);
};

export const Route = createFileRoute('/(authenticated)/bookSearch/')({
	// 회원만 들어올 수 있다
	beforeLoad: guardRole('MEMBER'),
	component: Component,
});
