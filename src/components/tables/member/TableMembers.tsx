import ChipMemberStatus from '@/components/chips/ChipMemberStatus';
import { FIXED_COLUMN, FLEX_COLUMN } from '@/components/ui/tables/columnWidths';
import RenderTruncateText from '@/components/ui/tables/renders/RenderTruncateText';
import Table, { type ITableOmitColumns } from '@/components/ui/tables/Table';
import { MEMBER_DISPLAY_STATUS_OPTIONS } from '@/consts/member/member';
import type { IMember } from '@/types/member/member';
import type { MRT_ColumnDef } from 'material-react-table';
import { useMemo } from 'react';

/** 회원 행(IMember) 공통 컬럼 — 화면 고유 동작은 소비처가 `actionColumn` 으로 넘긴다. */
export const useColumns = () =>
	useMemo<MRT_ColumnDef<IMember>[]>(
		() => [
			{
				accessorKey: 'memberCode',
				header: '회원번호',
				...FIXED_COLUMN.code,
			},
			{ accessorKey: 'name', header: '이름', ...FIXED_COLUMN.personName },
			{ accessorKey: 'phone', header: '연락처', ...FIXED_COLUMN.phone },
			{
				accessorKey: 'email',
				header: '이메일',
				...FLEX_COLUMN.email,
				Cell: ({ cell }) => <RenderTruncateText value={cell.getValue<string>()} />,
			},
			{
				accessorKey: 'status',
				header: '상태',
				...FIXED_COLUMN.status,
				// 연체는 파생 상태 — 필터도 Chip·검색창과 같은 정상/연체/탈퇴 기준으로 거른다
				filterVariant: 'select',
				filterSelectOptions: MEMBER_DISPLAY_STATUS_OPTIONS,
				Cell: ({ row }) => <ChipMemberStatus member={row.original} />,
			},
		],
		[],
	);

type IProps = ITableOmitColumns<IMember>;

const TableMembers = (props: IProps) => <Table<IMember> columns={useColumns()} {...props} />;

export default TableMembers;
