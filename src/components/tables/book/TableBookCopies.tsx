import ChipBookCopyStatus from '@/components/chips/ChipBookCopyStatus';
import { FIXED_COLUMN } from '@/components/ui/tables/columnWidths';
import Table, { type ITableOmitColumns } from '@/components/ui/tables/Table';
import { BOOK_COPY_STATUS_OPTIONS } from '@/consts/book/book';
import type { IBookCopyWithLoan } from '@/types/book/book';
import type { MRT_ColumnDef } from 'material-react-table';
import { useMemo } from 'react';

// 모달 안 표는 짧은 컬럼뿐이라 폭을 고정하면 오른쪽이 빈다 → 폭 값(columnWidths)만 같게 쓰고 남는 폭은 나눠 갖게 둔다
export const useColumns = () =>
	useMemo<MRT_ColumnDef<IBookCopyWithLoan>[]>(
		() => [
			{ accessorKey: 'lotNo', header: 'Lot 번호', size: FIXED_COLUMN.code.size },
			{
				accessorKey: 'status',
				header: '상태',
				size: FIXED_COLUMN.status.size,
				filterVariant: 'select',
				filterSelectOptions: BOOK_COPY_STATUS_OPTIONS,
				Cell: ({ row }) => <ChipBookCopyStatus copy={row.original} />,
			},
			{
				id: 'memberName',
				header: '대출자',
				size: FIXED_COLUMN.personName.size,
				accessorFn: copy => copy.activeLoan?.memberName ?? '-',
			},
			{
				id: 'loanedAt',
				header: '대출일',
				size: FIXED_COLUMN.date.size,
				filterVariant: 'date-range',
				// 기간 · 범위 필터는 서버 필터 규약(값 하나)에 맞지 않아 끈다 — 대출 표의 날짜 컬럼과 같은 이유
				enableColumnFilter: false,
				accessorFn: copy => copy.activeLoan?.loanedAt ?? null,
			},
			{
				id: 'dueAt',
				header: '반납예정일',
				size: FIXED_COLUMN.date.size,
				filterVariant: 'date-range',
				// 기간 · 범위 필터는 서버 필터 규약(값 하나)에 맞지 않아 끈다 — 대출 표의 날짜 컬럼과 같은 이유
				enableColumnFilter: false,
				accessorFn: copy => copy.activeLoan?.dueAt ?? null,
			},
			{
				id: 'overdueDays',
				header: '연체일수',
				size: FIXED_COLUMN.count.size,
				filterVariant: 'range',
				// 기간 · 범위 필터는 서버 필터 규약(값 하나)에 맞지 않아 끈다 — 대출 표의 날짜 컬럼과 같은 이유
				enableColumnFilter: false,
				accessorFn: copy => (copy.activeLoan?.isOverdue ? copy.activeLoan.overdueDays : 0),
				Cell: ({ row }) =>
					row.original.activeLoan?.isOverdue
						? `${row.original.activeLoan.overdueDays}일`
						: '-',
			},
		],
		[],
	);

type IProps = ITableOmitColumns<IBookCopyWithLoan>;

const TableBookCopies = (props: IProps) => (
	<Table<IBookCopyWithLoan> columns={useColumns()} {...props} />
);

export default TableBookCopies;
