import type { MRT_ColumnDef, MRT_RowData, MRT_VisibilityState } from 'material-react-table';

const getColumnKey = <T extends MRT_RowData>(column: MRT_ColumnDef<T>) =>
	String(column.id ?? column.accessorKey);

// 마스터 컬럼 정의에서 visibleKeys 만 노출하는 columnVisibility 를 만든다.
// 같은 테이블을 화면마다 다른 컬럼 구성으로 쓸 때 initialState 에 넘긴다.
export const toColumnVisibility = <T extends MRT_RowData>(
	columns: MRT_ColumnDef<T>[],
	visibleKeys: readonly string[],
): MRT_VisibilityState => {
	const visible = new Set(visibleKeys);

	return Object.fromEntries(
		columns.map(column => [getColumnKey(column), visible.has(getColumnKey(column))]),
	);
};
