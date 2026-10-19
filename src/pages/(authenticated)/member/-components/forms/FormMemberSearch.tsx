import SearchToolbar, {
	SearchSelectField,
	SearchTextField,
} from '@/components/ui/toolbars/SearchToolbar';
import { MEMBER_DISPLAY_STATUS_OPTIONS } from '@/consts/member/member';
import useSearchForm from '@/hooks/common/search/useSearchForm';
import { schemaSearchMember, type ISchemaSearchMember } from '@/schemas/web/member/member';

const DEFAULT_VALUES: ISchemaSearchMember = { name: '', phone: '', status: '', email: '' };

interface IProps {
	onSearch: (values: ISchemaSearchMember) => void;
	onRefetch: () => void;
	/** 초기화 때 함께 되돌릴 표의 보기 상태(헤더 필터 · 정렬) — 보통 `tableState.resetTableView` */
	onResetTable?: () => void;
	/** 목록을 조회하는 중인지 (조회 훅의 isFetching) — 검색 · 초기화 버튼을 막는다 */
	isSearching?: boolean;
}

/** 회원 검색 조건(이름 · 연락처 · 상태, 모두 AND — 과제 3-2 "이름 · 연락처 검색") — 상태는 목록 Chip 과 같은 정상/연체/탈퇴 기준 */
const FormMemberSearch = ({ onSearch, onRefetch, onResetTable, isSearching }: IProps) => {
	const { control, onSubmit, onReset } = useSearchForm({
		schema: schemaSearchMember,
		defaultValues: DEFAULT_VALUES,
		onSearch,
		onRefetch,
		onReset: onResetTable,
	});

	return (
		<SearchToolbar onSubmit={onSubmit} onReset={onReset} isSearching={isSearching}>
			<SearchTextField label='이름' name='name' control={control} />
			<SearchTextField label='연락처' name='phone' control={control} />
			<SearchSelectField
				label='상태'
				name='status'
				control={control}
				options={MEMBER_DISPLAY_STATUS_OPTIONS}
			/>
			<SearchTextField label='이메일' name='email' control={control} />
		</SearchToolbar>
	);
};

export default FormMemberSearch;
