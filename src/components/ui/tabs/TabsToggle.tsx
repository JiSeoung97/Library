import { ToggleButton, ToggleButtonGroup } from '@mui/material';

interface IProps<T extends string> {
	/** 현재 선택된 탭 */
	value: T;
	/** 탭 목록 — 왼쪽부터 순서대로 그린다 */
	options: readonly { label: string; value: T }[];
	onChange: (value: T) => void;
}

/**
 * 표 툴바에 놓는 작은 탭 — 목록을 한 가지 기준(예: 대출 상태)으로 빠르게 걸러 볼 때 쓴다.
 * 대출 / 반납 현황의 상태 탭과 대출 / 연장 승인의 구분 탭이 같은 모양을 쓰도록 공통 부품으로 뺐다.
 */
const TabsToggle = <T extends string>({ value, options, onChange }: IProps<T>) => (
	<ToggleButtonGroup
		size='small'
		exclusive
		value={value}
		// exclusive 모드에서 이미 선택된 탭을 다시 누르면 null 이 온다 — 선택이 풀리지 않도록 무시한다
		onChange={(_, next: T | null) => next && onChange(next)}
		className='[&_.MuiToggleButton-root]:px-2.5 [&_.MuiToggleButton-root]:py-0.5 [&_.MuiToggleButton-root]:text-xs'
	>
		{options.map(option => (
			<ToggleButton key={option.value} value={option.value}>
				{option.label}
			</ToggleButton>
		))}
	</ToggleButtonGroup>
);

export default TabsToggle;
