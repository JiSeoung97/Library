import RenderRowCustomActions, {
	type IRowActionProps,
} from '@/components/ui/tables/renders/RenderRowCustomActions';
import useTableCore from '@/hooks/common/table/useTableCore';
import type { ITableViewState } from '@/hooks/common/table/useTableState';
import { cn } from '@/utils/common/cn';
import AddIcon from '@mui/icons-material/Add';
import { Chip, IconButton, Tooltip, Typography } from '@mui/material';
import {
	MaterialReactTable,
	MRT_ToggleFiltersButton,
	useMaterialReactTable,
	type MRT_ColumnDef,
	type MRT_RowData,
	type MRT_TableOptions,
} from 'material-react-table';
import { MRT_Localization_KO } from 'material-react-table/locales/ko';
import type { ReactNode } from 'react';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

// 헤더 칸 공통 모양 — pt · pb 를 직접 준다(MRT 는 "작업" 같은 표시용 컬럼의 헤더에 다른 여백을 줘서 글자 높이가 어긋난다)
const HEAD_CELL_CLASS =
	'border-r border-b border-gray-200 bg-gray-50 pt-1 pb-1.5 text-[0.8rem] font-semibold text-gray-600 last:border-r-0';
// 본문 칸 공통 모양 — 컬럼 사이 세로선(mes_FE 격자 스타일), 마지막 컬럼은 카드 테두리가 있어 뺀다
const BODY_CELL_CLASS = 'border-r border-gray-100 text-[0.85rem] last:border-r-0';

// 페이지 이동 버튼 이름 (MUI Pagination 의 type 별 — 숫자 버튼(page)은 아래에서 따로 만든다)
const PAGE_BUTTON_LABELS = {
	first: '첫 페이지로 이동',
	previous: '이전 페이지로 이동',
	next: '다음 페이지로 이동',
	last: '마지막 페이지로 이동',
	'start-ellipsis': '앞 페이지 생략',
	'end-ellipsis': '뒤 페이지 생략',
} as const;

/**
 * 왼쪽 정렬할 본문 칸 — 표의 기본은 가운데 정렬이고, 길이가 제각각인 긴 글(도서명 · 저자 · 출판사)만 왼쪽에 맞춘다.
 * 가운데 정렬하면 줄마다 글 시작 위치가 달라져 훑어 읽기 어렵다. 컬럼 정의에서 `muiTableBodyCellProps: LEFT_ALIGN_CELL` 로 쓴다
 */
export const LEFT_ALIGN_CELL = { align: 'left' } as const;

// "작업" 칸 폭(px) — ⋮ 버튼 하나만 들어가므로 동작 수와 상관없이 모든 표가 같은 폭을 쓴다
const ROW_ACTION_COLUMN_SIZE = 64;

interface IServerSideProps<T extends MRT_RowData> {
	/** 넘기면 서버사이드(페이징 · 정렬 · 필터를 서버가 처리) — 생략하면 받은 data 안에서 클라이언트가 처리한다 */
	tableState: ITableViewState;
	/** 조건에 맞는 전체 건수 (응답의 totalRecords) — 페이지 수 계산에 쓴다 */
	rowCount: number;
	data: T[];
}

interface IClientSideProps<T extends MRT_RowData> {
	tableState?: undefined;
	rowCount?: undefined;
	data: T[];
}

export type ITableProps<T extends MRT_RowData> = Omit<
	MRT_TableOptions<T>,
	'columns' | 'data' | 'renderRowActions'
> &
	IRowActionProps<T> & {
		columns: MRT_ColumnDef<T>[];
		/** 조회 중 여부(useQuery 의 isFetching) — 첫 로딩은 스켈레톤, 재조회는 상단 진행 바로 표시한다 */
		isFetching?: boolean;
		/** 툴바 왼쪽에 놓는 표 제목 — 옆에 전체 건수가 붙는다 */
		title?: string;
		/** 제목 오른쪽에 붙는 화면별 도구 (상태 탭 등) */
		toolbarActions?: ReactNode;
		/** 넘기면 툴바 오른쪽(필터 표시 버튼 옆)에 등록(+) 버튼이 생긴다 (mes_FE onCreate 동일) */
		onCreate?: () => void;
		/** 등록 버튼 툴팁 — 기본값 '등록' */
		createLabel?: string;
	} & (IServerSideProps<T> | IClientSideProps<T>);

/**
 * `columns` 를 뺀 ITableProps — dumb 테이블(`components/tables/**`)의 props 타입.
 * ITableProps 가 서버/클라이언트 판별 유니온이라 Omit 을 그대로 쓰면 유니온이 뭉개지므로
 * 분배 조건부 타입으로 각 멤버에 Omit 을 적용한다.
 */
export type ITableOmitColumns<T extends MRT_RowData> =
	ITableProps<T> extends infer P ? (P extends unknown ? Omit<P, 'columns'> : never) : never;

/**
 * material-react-table 공통 래퍼 — 모든 목록 화면이 이 컴포넌트 하나로 표를 그린다.
 * mes_FE Table.tsx 를 축소 이식했다 (그리드 개인화 저장 · 엑셀/PDF 내보내기 · 차트 모드 등은 이 프로젝트 규모에서 제외).
 *
 * 화면이 넘기는 것과 여기서 정해 주는 것:
 * - 화면: 데이터 · 보여줄 컬럼 · 행으로 할 수 있는 일(onUpdateRow · onDeleteRow · getRowActions) · 등록(onCreate)
 * - 여기: 툴바(제목 · 건수 · 등록 버튼) · "작업" 칸(⋮ 메뉴) · 로딩 표시 · 헤더/셀 스타일 · 페이지네이션
 * → 화면마다 표 모양이 달라지지 않는다.
 */
const Table = <T extends MRT_RowData>({
	columns,
	data,
	rowCount,
	isFetching = false,
	tableState,
	initialState,
	title,
	toolbarActions,
	onCreate,
	createLabel = '등록',
	onUpdateRow,
	onDeleteRow,
	isDeleteRowDisabled,
	getDeleteConfirmMessage,
	labels,
	getRowActions,
	...props
}: ITableProps<T>) => {
	const isServerSide = !!tableState;
	// filterVariant 에 맞는 셀 표시(날짜 형식 · 숫자 쉼표 · 칩)와 정렬을 컬럼에 채워 넣는다
	const { resolvedColumns } = useTableCore<T>({ columns });

	// 행으로 할 수 있는 일이 하나라도 있으면 맨 끝에 "작업" 칸을 만든다
	const hasRowActions = !!onUpdateRow || !!onDeleteRow || !!getRowActions;

	// 재조회 중에는 keepPreviousData 로 이전 목록이 남아 있으므로 표를 스켈레톤으로 덮지 않고 진행 바만 띄운다
	const hasData = data.length > 0;
	const loadingState = {
		isLoading: isFetching && !hasData,
		showProgressBars: isFetching && hasData,
	};

	const table = useMaterialReactTable<T>({
		columns: resolvedColumns,
		renderTopToolbarCustomActions: () => (
			// 좌우 여백은 툴바(px-3) + MRT 기본(8px) = 20px — 다른 카드의 px-5 와 제목 시작 위치가 같아진다
			<div className='flex h-full flex-row items-center gap-3'>
				{title && (
					<div className='flex flex-row items-center gap-2'>
						<Typography className='text-[0.95rem] font-semibold text-gray-800'>
							{title}
						</Typography>
						<Chip
							size='small'
							label={`${(rowCount ?? data.length).toLocaleString()}건`}
							className='h-5 bg-blue-50 text-xs font-semibold text-blue-700'
						/>
					</div>
				)}
				{toolbarActions}
			</div>
		),
		// 기본 내부 도구는 필터 표시 버튼만 켜져 있다 — 그 오른쪽에 화면의 주 동작(등록)을 채운 박스로 둔다
		renderToolbarInternalActions: ({ table: tbl }) => (
			<div className='flex flex-row items-center gap-1'>
				{tbl.options.enableColumnFilters && <MRT_ToggleFiltersButton table={tbl} />}
				{onCreate && (
					<Tooltip title={createLabel}>
						<IconButton
							size='small'
							aria-label={createLabel}
							onClick={onCreate}
							className='size-8 rounded-lg bg-blue-600 text-white hover:bg-blue-700'
						>
							<AddIcon fontSize='small' />
						</IconButton>
					</Tooltip>
				)}
			</div>
		),

		/* ── 행 동작("작업" 칸) — mes_FE 와 같은 방식 ─────────────────────────────
		   화면이 버튼을 직접 그리지 않고, MRT 의 내장 행 동작 칸에 공통 렌더러를 꽂는다.
		   그래서 어느 화면이든 칸 이름은 "작업", 모양은 ⋮ 메뉴로 같다. */
		enableRowActions: hasRowActions,
		positionActionsColumn: 'last',
		renderRowActions: ({ row }) => (
			<RenderRowCustomActions
				row={row.original}
				onUpdateRow={onUpdateRow}
				onDeleteRow={onDeleteRow}
				isDeleteRowDisabled={isDeleteRowDisabled}
				getDeleteConfirmMessage={getDeleteConfirmMessage}
				labels={labels}
				getRowActions={getRowActions}
			/>
		),
		displayColumnDefOptions: {
			'mrt-row-actions': {
				// 화면이 넓어져도 늘어나지 않는다 (남는 폭은 데이터 컬럼이 나눠 갖는다)
				size: ROW_ACTION_COLUMN_SIZE,
				grow: false,
				// 오른쪽에 고정된 칸은 MRT 기본이 반투명(opacity 0.97 + 97% 배경 막 ::before)이라 밑으로 스크롤되는 글자가 비친다
				// → 불투명하게 바꾸고, 고정된 칸이라는 게 보이도록 행 색과 상관없이 옅은 회색(gray-50)으로 칠한다.
				// 컬럼에서 className 을 주면 표 전체 className 을 덮어쓰므로 공통 클래스를 함께 넣는다
				muiTableHeadCellProps: {
					align: 'center',
					className: cn(HEAD_CELL_CLASS, 'opacity-100 before:bg-gray-50'),
				},
				muiTableBodyCellProps: {
					align: 'center',
					className: cn(BODY_CELL_CLASS, 'opacity-100 before:bg-gray-50'),
				},
			},
		},

		data,
		rowCount: rowCount ?? data.length,
		// 서버사이드면 페이징 · 정렬 · 필터를 표가 직접 하지 않고, 바뀐 상태를 tableState 로 알려 서버에 다시 요청하게 한다
		manualPagination: isServerSide,
		manualSorting: isServerSide,
		manualFiltering: isServerSide,
		enableColumnFilters: true,
		enableColumnFilterModes: false,
		enableGlobalFilter: false,
		enableDensityToggle: false,
		enableFullScreenToggle: false,
		enableHiding: false,
		enableColumnActions: false,
		positionToolbarAlertBanner: 'none',
		// size 를 컬럼 폭 비율로 쓰게 한다 — 기본 semantic 모드는 브라우저가 균등 분배해 size 를 무시한다.
		// grow 는 useTableCore 가 컬럼마다 켠다.
		layoutMode: 'grid',
		// sortDescFirst: false — 헤더를 누를 때 모든 컬럼이 오름차순 → 내림차순 → 해제 순서로 돈다.
		// 지정하지 않으면 TanStack 이 "첫 행 값이 문자열이 아니면 내림차순부터"로 첫 방향을 매번 다시 정한다.
		// 날짜 컬럼은 오름차순 정렬 뒤 빈 값(null) 행이 맨 위로 오면서 첫 방향이 바뀌어, 내림차순을 건너뛰고 해제되던 문제가 있었다
		defaultColumn: { size: 140, sortDescFirst: false, ...props.defaultColumn },
		// "작업" 칸은 오른쪽에 고정한다 (mes_FE 와 같은 방식) — 컬럼이 많아 가로 스크롤이 생겨도 행 동작 ⋮ 이 항상 보인다.
		// 고정은 처음 상태로만 정하고, 헤더 메뉴(enableColumnActions: false)가 없어 사용자가 풀 수는 없다
		enableColumnPinning: true,
		initialState: {
			density: 'compact',
			...initialState,
			columnPinning: {
				...(hasRowActions && { right: ['mrt-row-actions'] }),
				...initialState?.columnPinning,
			},
		},
		...(isServerSide && {
			state: {
				pagination: tableState.pagination,
				sorting: tableState.sorting,
				columnFilters: tableState.columnFilters,
				...loadingState,
			},
			onPaginationChange: tableState.setPagination,
			onSortingChange: tableState.setSorting,
			onColumnFiltersChange: tableState.setColumnFilters,
		}),
		...(!isServerSide && { state: loadingState }),
		// 진행 바는 상단 툴바에만 — 기본값은 하단 페이지네이션 위에도 하나 더 그린다
		muiLinearProgressProps: ({ isTopToolbar }) => ({ className: isTopToolbar ? '' : 'hidden' }),
		// 부모가 세로 flex 면 남은 높이를 채우고(데이터가 없어도 화면을 꽉 채움), 행이 많으면 표 안에서 스크롤한다
		muiTablePaperProps: {
			elevation: 0,
			className:
				'flex min-h-60 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200',
		},
		// scrollbar-gutter-stable — 표 안 세로 스크롤바 자리를 항상 비워 둔다. 정렬 · 페이지 이동으로 재조회할 때
		// 스크롤바가 생겼다 없어지면 표 폭이 바뀌어 가로 스크롤바까지 따라 생기며 흔들리는 것을 막는다
		muiTableContainerProps: { className: 'flex-1 scrollbar-gutter-stable' },
		enableStickyHeader: true,
		// MRT 기본 고정 헤더는 opacity 0.97 이라 스크롤된 행 글자가 헤더 뒤로 비친다
		muiTableHeadProps: { className: 'opacity-100' },
		// 툴바 안쪽은 MRT 기본이 위쪽 정렬이라 제목이 오른쪽 아이콘보다 위에 붙는다 → 세로 가운데로 맞춘다
		muiTopToolbarProps: { className: 'px-3 py-1 [&>.MuiBox-root]:items-center' },
		// 헤더는 모든 컬럼 가운데 정렬 — 컬럼이 muiTableHeadCellProps 를 주면 이 값을 덮어쓰므로 컬럼에서는 헤더 정렬을 두지 않는다
		muiTableHeadCellProps: {
			align: 'center',
			className: HEAD_CELL_CLASS,
		},
		// 본문 칸은 기본 가운데 정렬 — 긴 글(도서명 · 저자 · 출판사)만 컬럼에서 왼쪽 정렬로 바꾼다(LEFT_ALIGN_CELL).
		// 컬럼 사이 세로선 (mes_FE 격자 스타일) — 바깥 테두리는 카드(Paper)가 그리므로 마지막 컬럼은 뺀다
		muiTableBodyCellProps: {
			align: 'center',
			className: BODY_CELL_CLASS,
		},
		paginationDisplayMode: 'pages',
		muiPaginationProps: {
			rowsPerPageOptions: ROWS_PER_PAGE_OPTIONS,
			showFirstButton: true,
			showLastButton: true,
			// 페이지 버튼의 스크린 리더용 이름 — MRT 가 아니라 MUI Pagination 이 만드는 문구라 한국어 묶음에 포함되지 않는다
			getItemAriaLabel: (type, page, selected) => {
				if (type === 'page') return selected ? `${page} 페이지` : `${page} 페이지로 이동`;
				return PAGE_BUTTON_LABELS[type];
			},
		},
		// 표의 모든 문구를 한국어로 — MRT 가 제공하는 한국어 묶음을 기본으로 깔고, 이 앱의 규칙에 맞출 것만 덮어쓴다.
		// 몇 개만 직접 번역하면 나머지(필터로 거른 결과 없음 · 필터 버튼 · 페이지 이동 버튼 등)가 영어로 남는다
		localization: {
			...MRT_Localization_KO,
			// "작업" — mes_FE 의 행 동작 칸 이름과 같다 (화면마다 처리/관리/신청으로 달랐던 것을 하나로)
			actions: '작업',
			// 데이터가 아예 없을 때 / 필터 · 검색 조건으로 걸렀더니 없을 때 — MRT 는 두 경우를 다른 문구로 보여 준다
			noRecordsToDisplay: '데이터가 없습니다.',
			noResultsFound: '데이터가 없습니다.',
			rowsPerPage: '페이지당 행 수',
			of: '/',
		},
		...props,
	});

	return <MaterialReactTable table={table} />;
};

export default Table;
