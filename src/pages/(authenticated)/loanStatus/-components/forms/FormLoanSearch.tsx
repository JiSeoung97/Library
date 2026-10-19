import SearchToolbar, {
	SearchDateRangeField,
	SearchTextField,
} from '@/components/ui/toolbars/SearchToolbar';
import useSearchForm from '@/hooks/common/search/useSearchForm';
import { schemaSearchLoan, type ISchemaSearchLoan } from '@/schemas/web/loan/loan';

const DEFAULT_VALUES: ISchemaSearchLoan = {
	memberName: '',
	bookTitle: '',
	loanedFrom: '',
	loanedTo: '',
	dueFrom: '',
	dueTo: '',
};

interface IProps {
	onSearch: (values: ISchemaSearchLoan) => void;
	onRefetch: () => void;
	/** 초기화 때 함께 되돌릴 표의 보기 상태(헤더 필터 · 정렬) — 보통 `tableState.resetTableView` */
	onResetTable?: () => void;
	/** 목록을 조회하는 중인지 (조회 훅의 isFetching) — 검색 · 초기화 버튼을 막는다 */
	isSearching?: boolean;
}

/** 대출 검색 조건(대출일 기간 · 반납예정일 기간 · 회원명 · 도서명, 모두 AND) — 상태는 표 위 탭으로 고른다 */
const FormLoanSearch = ({ onSearch, onRefetch, onResetTable, isSearching }: IProps) => {
	const { control, onSubmit, onReset } = useSearchForm({
		schema: schemaSearchLoan,
		defaultValues: DEFAULT_VALUES,
		onSearch,
		onRefetch,
		onReset: onResetTable,
	});

	// 순서: 기간(대출일 · 반납예정일) → 사람 · 책(회원명 · 도서명) — 현황 화면은 기간으로 먼저 좁혀 보는 경우가 많다.
	// 조건이 넷이라 기본 폭이면 두 줄로 넘어간다 → 이 화면만 칸 폭을 줄여(기간 w-72 · 글자 w-36) 한 줄에 맞춘다
	return (
		<SearchToolbar onSubmit={onSubmit} onReset={onReset} isSearching={isSearching}>
			<SearchDateRangeField
				label='대출일'
				fromName='loanedFrom'
				toName='loanedTo'
				control={control}
				className='w-72'
			/>
			<SearchDateRangeField
				label='반납예정일'
				fromName='dueFrom'
				toName='dueTo'
				control={control}
				className='w-72'
			/>
			<SearchTextField label='회원명' name='memberName' control={control} className='w-36' />
			<SearchTextField label='도서명' name='bookTitle' control={control} className='w-36' />
		</SearchToolbar>
	);
};

export default FormLoanSearch;
