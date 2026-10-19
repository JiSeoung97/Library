import type { IFiltering, IRequestBody, ISortings } from '@/types/common/repository';
import type {
	MRT_ColumnFiltersState,
	MRT_PaginationState,
	MRT_SortingState,
} from 'material-react-table';
import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';

/**
 * 테이블이 "보이는 모습"에 필요한 상태 — 공통 Table 컴포넌트는 이것만 알면 된다.
 * 검색 조건(data)을 빼 둔 이유: Table 은 어떤 조건으로 조회했는지 몰라도 그릴 수 있고,
 * 조건 타입(T)이 화면마다 달라 Table 의 prop 타입에 섞이면 화면별 타입을 Table 에 맞출 수 없다.
 */
export interface ITableViewState {
	pagination: MRT_PaginationState;
	sorting: MRT_SortingState;
	columnFilters: MRT_ColumnFiltersState;
	setPagination: Dispatch<SetStateAction<MRT_PaginationState>>;
	setSorting: Dispatch<SetStateAction<MRT_SortingState>>;
	setColumnFilters: Dispatch<SetStateAction<MRT_ColumnFiltersState>>;
}

/** 화면(페이지)이 쓰는 전체 상태 — 보이는 상태 + 검색 조건 + 서버로 보낼 요청 본문 */
export interface ITableState<T = Record<string, unknown>> extends ITableViewState {
	/** 서버로 보낼 조회 조건 — Service 조회 훅에 그대로 넘긴다 */
	requestBody: IRequestBody<T>;
	/** 현재 검색 조건 (검색 폼 · 상태 탭 등 화면이 정한 조건) */
	data: T | undefined;
	/** 검색 조건을 바꾼다 — 바꾸는 순간 1페이지로 돌아간다 */
	setData: Dispatch<SetStateAction<T | undefined>>;
	/** 헤더 필터를 비우고 정렬을 처음 정렬로 되돌린다 — 검색 폼의 "초기화"가 함께 부른다 */
	resetTableView: () => void;
}

export interface IUseTableStateOptions<T = Record<string, unknown>> {
	/** 페이지당 행 수 — 생략하면 20. 모든 표가 같은 값을 쓰도록 화면에서는 보통 넘기지 않는다 */
	take?: number;
	/** 처음 조회할 때의 검색 조건 (예: 연장 승인 화면의 { hasPendingExtension: true }) */
	data?: T;
	/**
	 * 처음부터 헤더에 표시할 정렬 — 헤더에 화살표(여러 개면 우선순위 번호)가 보인다.
	 * 목록의 "기본 순서"를 정하는 용도로 쓰지 않는다: 기본 순서는 서버가 정렬 조건이 없을 때 정하고,
	 * 헤더에는 사용자가 직접 고른 정렬만 보이게 한다 (예: 회원 목록 상태 → 회원번호, 대출 목록 대출일 최신 순)
	 */
	sorting?: MRT_SortingState;
}

// material-react-table 의 정렬 상태([{ id, desc }]) → 서버 형식([{ columName, typeSorting }])
const toSortings = (sorting: MRT_SortingState): ISortings[] =>
	sorting.map(s => ({ columName: s.id, typeSorting: s.desc ? 'DESC' : 'ASC' }));

// 컬럼 헤더 필터 → 서버 형식. 값이 비어 있는 필터는 조건에서 뺀다
const toFiltering = (columnFilters: MRT_ColumnFiltersState): IFiltering[] =>
	columnFilters
		.filter(f => f.value !== undefined && f.value !== null && f.value !== '')
		.map(f => ({
			columName: f.id,
			typeFilter: 'Contains',
			valueDefault: String(f.value),
		}));

/**
 * 테이블 상태(페이지 · 정렬 · 컬럼 필터 · 검색 조건)를 한곳에서 관리하고, 서버 요청 본문(requestBody)으로 바꿔 준다.
 * mes_FE useTableState 의 핵심만 축소 이식했다.
 *
 * ■ 흐름
 *   사용자가 페이지를 넘기거나 검색 → 여기 상태가 바뀜 → requestBody 가 새로 만들어짐
 *   → Service 의 queryKey 가 바뀜 → TanStack Query 가 자동으로 다시 조회
 *   그래서 화면에는 "다시 조회하는 코드"가 없다.
 *
 * ■ 조건이 바뀌면 1페이지로
 *   3페이지를 보다가 검색어를 바꿨는데 결과가 5건뿐이면 3페이지는 비어 있다.
 *   그래서 결과 건수가 달라지는 변경(검색 조건 · 컬럼 필터)은 바꾸는 함수 안에서 1페이지로 함께 되돌린다.
 *   정렬은 순서만 바뀌고 건수는 같아 페이지를 유지한다.
 *
 * ■ 검색 조건(data)을 이 훅이 직접 들고 있는 이유 (mes_FE 와 같은 구조)
 *   예전에는 화면이 조건을 state 로 들고 이 훅에 넘겼고, 훅이 매 렌더링마다 JSON.stringify 로 "바뀌었는지" 추측했다.
 *   - 조건을 바꾼 쪽은 이미 바뀐 걸 아는데, 받는 쪽이 매번 직렬화해서 다시 알아내는 구조였다.
 *   - 렌더링 도중에 state 를 고쳐야 해서 흐름을 읽기 어려웠다.
 *   지금은 "조건을 바꾸는 함수(setData)"가 조건 변경과 1페이지 초기화를 한 번에 한다 — 추측이 필요 없다.
 */
const useTableState = <T = Record<string, unknown>>({
	take = 20,
	data: initialData,
	sorting: initialSorting = [],
}: IUseTableStateOptions<T> = {}): ITableState<T> => {
	const [pagination, setPagination] = useState<MRT_PaginationState>({
		pageIndex: 0,
		pageSize: take,
	});
	// 처음 정렬은 초기화 때 되돌아갈 값이라 처음 받은 값을 그대로 기억해 둔다
	// (옵션 객체는 렌더링마다 새로 만들어지므로 매번 읽지 않고 첫 값만 쓴다)
	const [defaultSorting] = useState(initialSorting);
	const [sorting, setSorting] = useState<MRT_SortingState>(defaultSorting);
	const [columnFilters, setColumnFiltersState] = useState<MRT_ColumnFiltersState>([]);
	const [data, setDataState] = useState<T | undefined>(initialData);

	// 1페이지로 되돌리기 — 검색 조건 · 컬럼 필터를 바꾸는 두 함수가 함께 쓴다
	const resetPage = useCallback(() => setPagination(prev => ({ ...prev, pageIndex: 0 })), []);

	// useState 의 set 함수와 같은 모양(값 또는 `prev => next`)을 그대로 받는다
	// → 화면이 `setData(prev => ({ ...prev, status }))` 처럼 일부 조건만 바꿀 수 있다
	const setData = useCallback<Dispatch<SetStateAction<T | undefined>>>(
		updater => {
			setDataState(updater);
			resetPage();
		},
		[resetPage],
	);

	const setColumnFilters = useCallback<Dispatch<SetStateAction<MRT_ColumnFiltersState>>>(
		updater => {
			setColumnFiltersState(updater);
			resetPage();
		},
		[resetPage],
	);

	// 초기화 버튼은 검색 조건만이 아니라 표의 보기 상태(헤더 필터 · 정렬)까지 처음으로 돌린다.
	// 검색 칸은 비었는데 필터나 정렬이 남아 있으면 사용자는 왜 결과가 적거나 순서가 다른지 알기 어렵다.
	// 정렬은 "해제"가 아니라 화면의 처음 정렬(예: 대시보드는 대출일 최신 순)로 되돌린다.
	// setColumnFilters 를 거치므로 1페이지로도 돌아간다
	const resetTableView = useCallback(() => {
		setColumnFilters([]);
		setSorting(defaultSorting);
	}, [setColumnFilters, defaultSorting]);

	// 서버로 보낼 본문 — 상태가 바뀔 때만 새 객체를 만든다(useMemo). 이 객체가 곧 queryKey 의 일부다
	const requestBody = useMemo<IRequestBody<T>>(
		() => ({
			skip: pagination.pageIndex * pagination.pageSize, // 3페이지 · 10건이면 20번째부터
			take: pagination.pageSize,
			sortings: toSortings(sorting),
			filtering: toFiltering(columnFilters),
			data,
		}),
		[pagination, sorting, columnFilters, data],
	);

	return {
		requestBody,
		pagination,
		sorting,
		columnFilters,
		data,
		setPagination,
		setSorting,
		setColumnFilters,
		setData,
		resetTableView,
	};
};

export default useTableState;
