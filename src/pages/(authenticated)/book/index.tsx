import TableBooks, { useColumns } from '@/components/tables/book/TableBooks';
import PageHeader from '@/components/ui/containers/PageHeader';
import useTableState from '@/hooks/common/table/useTableState';
import FormBookSearch from '@/pages/(authenticated)/-components/forms/FormBookSearch';
import ModalInfoBookCopies from '@/pages/(authenticated)/-components/modals/ModalInfoBookCopies';
import ModalCreateBook from '@/pages/(authenticated)/book/-components/modals/ModalCreateBook';
import ModalUpdateBook from '@/pages/(authenticated)/book/-components/modals/ModalUpdateBook';
import { guardRole } from '@/pages/-guards/guardRole';
import services from '@/services/services';
import type { IBook, IBookSearch } from '@/types/book/book';
import { toColumnVisibility } from '@/utils/common/table/toColumnVisibility';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

// 공통 도서 컬럼(TableBooks) 중 이 화면에서 보여줄 컬럼 — 나머지는 숨긴다
const VISIBLE_COLUMNS = ['title', 'author', 'category', 'publisher', 'qty', 'availability'];

/**
 * 도서 관리 (관리자) — 도서 검색 · 등록 · 수정 · 삭제, 행 더블클릭으로 낱권별 대출 현황.
 *
 * 화면이 하는 일은 "조립"뿐이다:
 * - 조회: useTableState(조건) → bookService.useGetBookList(조건) → TableBooks(결과)
 * - 쓰기: 모달을 열고 닫는 state 만 들고 있고, 실제 요청은 각 모달과 Service 훅이 한다
 * - 저장 · 삭제 뒤 목록 갱신 코드는 없다 — Service 의 onSuccess 가 캐시를 무효화해 자동으로 다시 조회된다
 */
const Component = () => {
	const { bookService } = services;
	// 모달 3개의 열림 상태 — 수정 · 상세는 "대상 도서"를 들고 있으면 열린 것이다
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [updateBook, setUpdateBook] = useState<IBook | null>(null);
	const [detailBook, setDetailBook] = useState<IBook | null>(null);

	// 검색 조건은 useTableState 가 들고 있다 — 검색 폼이 setData 로 바꾸면 1페이지로 돌아가며 다시 조회된다
	const tableState = useTableState<IBookSearch>();
	const { data, isFetching, refetch } = bookService.useGetBookList(tableState.requestBody);
	const { mutate: deleteBook } = bookService.useDeleteBook();

	const columns = useColumns();

	return (
		<>
			<PageHeader title='도서 관리' />

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
				// 등록 — 툴바의 + 버튼
				createLabel='도서 등록'
				onCreate={() => setIsCreateOpen(true)}
				// 행 동작 — 버튼 모양과 삭제 확인창은 공통 Table 이 그린다. 화면은 "무엇을 할지"만 넘긴다
				onUpdateRow={setUpdateBook}
				onDeleteRow={book => deleteBook({ data: { bookId: book.bookId } })}
				getDeleteConfirmMessage={book => `'${book.title}' 도서를 삭제하시겠습니까?`}
				muiTableBodyRowProps={({ row }) => ({
					hover: true,
					className: 'cursor-pointer',
					onDoubleClick: () => setDetailBook(row.original),
				})}
			/>

			<ModalCreateBook open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
			{/* 대상이 있을 때만 마운트한다 — 열 때마다 폼이 그 도서 값으로 새로 초기화된다 */}
			{updateBook && (
				<ModalUpdateBook open data={updateBook} onClose={() => setUpdateBook(null)} />
			)}
			{detailBook && (
				<ModalInfoBookCopies
					isAdmin
					open
					data={detailBook}
					onClose={() => setDetailBook(null)}
				/>
			)}
		</>
	);
};

export const Route = createFileRoute('/(authenticated)/book/')({
	// 관리자만 들어올 수 있다 — 회원이 주소를 직접 입력하면 회원 첫 화면으로 돌려보낸다
	beforeLoad: guardRole('ADMIN'),
	component: Component,
});
