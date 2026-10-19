import SearchToolbar, {
	SearchSelectField,
	SearchTextField,
} from '@/components/ui/toolbars/SearchToolbar';
import { AVAILABILITY_OPTIONS, CATEGORY_OPTIONS } from '@/consts/book/book';
import useSearchForm from '@/hooks/common/search/useSearchForm';
import { schemaSearchBook, type ISchemaSearchBook } from '@/schemas/web/book/book';

const DEFAULT_VALUES: ISchemaSearchBook = {
	title: '',
	author: '',
	category: '',
	publisher: '',
	availability: '',
};

interface IProps {
	onSearch: (values: ISchemaSearchBook) => void;
	onRefetch: () => void;
	/** 초기화 때 함께 되돌릴 표의 보기 상태(헤더 필터 · 정렬) — 보통 `tableState.resetTableView` */
	onResetTable?: () => void;
	/** 목록을 조회하는 중인지 (조회 훅의 isFetching) — 검색 · 초기화 버튼을 막는다 */
	isSearching?: boolean;
}

/** 도서 검색 조건 — 목록 컬럼과 같은 순서(도서명·저자·분류·출판사·대출 가능 여부), 모두 AND. 도서 관리·도서 검색 공용 */
const FormBookSearch = ({ onSearch, onRefetch, onResetTable, isSearching }: IProps) => {
	const { control, onSubmit, onReset } = useSearchForm({
		schema: schemaSearchBook,
		defaultValues: DEFAULT_VALUES,
		onSearch,
		onRefetch,
		onReset: onResetTable,
	});

	return (
		<SearchToolbar onSubmit={onSubmit} onReset={onReset} isSearching={isSearching}>
			<SearchTextField label='도서명' name='title' control={control} />
			<SearchTextField label='저자' name='author' control={control} />
			<SearchSelectField
				label='분류'
				name='category'
				control={control}
				options={CATEGORY_OPTIONS}
			/>
			<SearchTextField label='출판사' name='publisher' control={control} />
			<SearchSelectField
				label='대출 가능 여부'
				name='availability'
				control={control}
				options={AVAILABILITY_OPTIONS}
			/>
		</SearchToolbar>
	);
};

export default FormBookSearch;
