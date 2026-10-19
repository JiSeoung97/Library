import ChipBookAvailability from '@/components/chips/ChipBookAvailability';
import { FIXED_COLUMN, FLEX_COLUMN } from '@/components/ui/tables/columnWidths';
import RenderTruncateText from '@/components/ui/tables/renders/RenderTruncateText';
import Table, { LEFT_ALIGN_CELL, type ITableOmitColumns } from '@/components/ui/tables/Table';
import { AVAILABILITY_OPTIONS, CATEGORIES } from '@/consts/book/book';
import type { IBook } from '@/types/book/book';
import type { MRT_ColumnDef } from 'material-react-table';
import { useMemo } from 'react';

/**
 * 도서 행(IBook) 공통 컬럼 — 화면별 차이는 `initialState.columnVisibility` 로 가린다.
 * 화면 고유 동작(수정 · 삭제)은 소비처가 행 동작(onUpdateRow · onDeleteRow)으로 넘긴다.
 */
export const useColumns = () =>
	useMemo<MRT_ColumnDef<IBook>[]>(
		() => [
			{
				accessorKey: 'title',
				header: '도서명',
				...FLEX_COLUMN.bookTitle,
				muiTableBodyCellProps: LEFT_ALIGN_CELL,
				Cell: ({ cell }) => <RenderTruncateText value={cell.getValue<string>()} />,
			},
			{
				accessorKey: 'author',
				header: '저자',
				...FLEX_COLUMN.person,
				muiTableBodyCellProps: LEFT_ALIGN_CELL,
				Cell: ({ cell }) => <RenderTruncateText value={cell.getValue<string>()} />,
			},
			{
				accessorKey: 'category',
				header: '분류',
				...FIXED_COLUMN.category,
				filterVariant: 'select',
				filterSelectOptions: CATEGORIES,
			},
			{
				accessorKey: 'publisher',
				header: '출판사',
				...FLEX_COLUMN.person,
				muiTableBodyCellProps: LEFT_ALIGN_CELL,
				Cell: ({ cell }) => <RenderTruncateText value={cell.getValue<string>()} />,
			},
			{
				id: 'qty',
				header: '재고',
				...FIXED_COLUMN.count,
				enableColumnFilter: false,
				accessorFn: book => `${book.availableQty} / ${book.totalQty}`,
			},
			{
				// 실제 필드가 아니라 재고로부터 파생되는 값 — 서버도 같은 기준으로 필터링한다
				accessorKey: 'availability',
				header: '대출 가능 여부',
				...FIXED_COLUMN.availability,
				filterVariant: 'select',
				filterSelectOptions: AVAILABILITY_OPTIONS,
				accessorFn: book => (book.availableQty > 0 ? 'AVAILABLE' : 'UNAVAILABLE'),
				Cell: ({ row }) => (
					<ChipBookAvailability
						availableQty={row.original.availableQty}
						totalQty={row.original.totalQty}
					/>
				),
			},
		],
		[],
	);

type IProps = ITableOmitColumns<IBook>;

const TableBooks = (props: IProps) => <Table<IBook> columns={useColumns()} {...props} />;

export default TableBooks;
