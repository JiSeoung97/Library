import ChipLoanStatus from '@/components/chips/ChipLoanStatus';
import { FIXED_COLUMN, FLEX_COLUMN } from '@/components/ui/tables/columnWidths';
import RenderTruncateText from '@/components/ui/tables/renders/RenderTruncateText';
import Table, { LEFT_ALIGN_CELL, type ITableOmitColumns } from '@/components/ui/tables/Table';
import { LOAN_STATUS_OPTIONS, MAX_EXTENSION_COUNT } from '@/consts/loan/loan';
import type { ILoan } from '@/types/loan/loan';
import { formatNumber } from '@/utils/common/number';
import { toOverdueFee } from '@/utils/loan/loan';
import type { MRT_ColumnDef } from 'material-react-table';
import { useMemo } from 'react';

/**
 * 대출 행(ILoan) 공통 컬럼 — 화면별 차이는 `initialState.columnVisibility` 로 가린다.
 * 화면 고유 동작(반납 · 연장 승인 등)은 공통 컬럼이 아니라 소비처가 행 동작(getRowActions)으로 넘긴다.
 */
export const useColumns = () =>
	useMemo<MRT_ColumnDef<ILoan>[]>(
		() => [
			// 너비는 columnWidths 한 곳에서 — 짧은 값은 고정 폭, 긴 글(도서명 · 연장 사유)만 남는 폭을 나눠 갖는다
			{ accessorKey: 'memberName', header: '회원명', ...FIXED_COLUMN.personName },
			{
				accessorKey: 'bookTitle',
				header: '도서명',
				...FLEX_COLUMN.bookTitle,
				muiTableBodyCellProps: LEFT_ALIGN_CELL,
				Cell: ({ cell }) => <RenderTruncateText value={cell.getValue<string>()} />,
			},
			{
				accessorKey: 'bookAuthor',
				header: '저자',
				...FLEX_COLUMN.person,
				muiTableBodyCellProps: LEFT_ALIGN_CELL,
				Cell: ({ cell }) => <RenderTruncateText value={cell.getValue<string>()} />,
			},
			{
				accessorKey: 'bookPublisher',
				header: '출판사',
				...FLEX_COLUMN.person,
				muiTableBodyCellProps: LEFT_ALIGN_CELL,
				Cell: ({ cell }) => <RenderTruncateText value={cell.getValue<string>()} />,
			},
			{ accessorKey: 'lotNo', header: 'Lot 번호', ...FIXED_COLUMN.code },
			{
				accessorKey: 'loanedAt',
				header: '대출일',
				...FIXED_COLUMN.date,
				filterVariant: 'date-range',
				enableColumnFilter: false,
			},
			{
				accessorKey: 'dueAt',
				header: '반납예정일',
				...FIXED_COLUMN.date,
				filterVariant: 'date-range',
				enableColumnFilter: false,
			},
			{
				// 반납 전에는 null 이라 '-' 로 보인다 (formatDate)
				accessorKey: 'returnedAt',
				header: '반납일',
				...FIXED_COLUMN.date,
				filterVariant: 'date-range',
				enableColumnFilter: false,
			},
			{
				accessorKey: 'status',
				header: '상태',
				...FIXED_COLUMN.status,
				// 정렬은 서버가 화면 기준 순서로 한다 — 내림차순 = 연체 → 대출중 → 반납완료 (loanMockRepository STATUS_SORT_ORDER)
				filterVariant: 'select',
				filterSelectOptions: LOAN_STATUS_OPTIONS,
				Cell: ({ row }) => <ChipLoanStatus loan={row.original} />,
			},
			{
				id: 'overdueFee',
				header: '연체료',
				...FIXED_COLUMN.count,
				enableColumnFilter: false,
				accessorFn: loan => toOverdueFee(loan),
				Cell: ({ cell }) => {
					const fee = cell.getValue<number>();
					return fee > 0 ? (
						<span className='font-semibold text-red-600'>{formatNumber(fee)}원</span>
					) : (
						'-'
					);
				},
			},
			{
				accessorKey: 'pendingExtensionReason',
				header: '연장 사유',
				...FLEX_COLUMN.description,
				// 긴 사유는 한 줄로 자르고 마우스를 올리면 전체 문구를 보여 준다 (행 높이 유지)
				muiTableBodyCellProps: LEFT_ALIGN_CELL,
				Cell: ({ cell }) => <RenderTruncateText value={cell.getValue<string | null>()} />,
			},
			{
				accessorKey: 'extensionCount',
				header: '연장 횟수',
				...FIXED_COLUMN.count,
				enableColumnFilter: false,
				Cell: ({ row }) => `${row.original.extensionCount} / ${MAX_EXTENSION_COUNT}`,
			},
		],
		[],
	);

type IProps = ITableOmitColumns<ILoan>;

const TableLoans = (props: IProps) => <Table<ILoan> columns={useColumns()} {...props} />;

export default TableLoans;
