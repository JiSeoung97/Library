import { zodResolver } from '@hookform/resolvers/zod';
import { isEqual } from 'es-toolkit';
import { useState } from 'react';
import { useForm, type DefaultValues, type FieldValues, type Resolver } from 'react-hook-form';
import type { ZodType } from 'zod';

interface IParams<T extends FieldValues> {
	/** 입력값 검증 규칙 (Zod) */
	schema: ZodType<T, T>;
	/** 폼의 처음 값 — "초기화" 버튼이 되돌아갈 값이기도 하다 */
	defaultValues: T;
	/** 조건이 바뀌었을 때 — 보통 `tableState.setData` 를 넘겨 새 조건으로 목록을 조회한다 */
	onSearch: (values: T) => void;
	/** 같은 조건으로 다시 검색했을 때 — 보통 조회 훅의 `refetch` 를 넘긴다 */
	onRefetch: () => void;
	/** 초기화 버튼을 눌렀을 때 검색 조건 말고도 함께 비울 것 — 보통 `tableState.resetTableView` (헤더 필터 · 정렬) */
	onReset?: () => void;
}

/**
 * 검색 폼의 공통 동작 — 검색이 있는 모든 목록 화면이 같은 방식으로 동작하게 한다.
 *
 * 1. 입력 중에는 조회하지 않는다.
 *    입력값은 react-hook-form 이 폼 안에서만 들고 있고, 검색 버튼(Enter)을 눌러야 onSearch 로 넘긴다.
 *    글자를 칠 때마다 API 를 부르지 않는다.
 *
 * 2. 같은 조건으로 다시 검색하면 강제로 다시 조회한다.
 *    조건이 그대로면 queryKey 도 그대로라 TanStack Query 는 "이미 가진 데이터"로 보고 요청하지 않는다.
 *    사용자는 검색을 눌렀는데 아무 일도 없는 것처럼 느끼므로, 직전 조건과 같으면 onRefetch 로 직접 다시 부른다.
 *    (다른 사람이 그사이 데이터를 바꿨어도 검색 한 번으로 최신 목록을 본다)
 *
 * 3. 초기화 = 입력칸을 기본값으로 되돌리고 그 조건으로 바로 다시 검색한다.
 *    입력칸만 비우면 화면의 조건과 목록이 어긋난다. 표 헤더 필터처럼 폼 밖의 조건도 onReset 으로 함께 비운다.
 */
const useSearchForm = <T extends FieldValues>({
	schema,
	defaultValues,
	onSearch,
	onRefetch,
	onReset,
}: IParams<T>) => {
	const form = useForm<T>({
		resolver: zodResolver(schema) as Resolver<T>,
		defaultValues: defaultValues as DefaultValues<T>,
	});
	// 직전에 검색한 조건 — 2번 규칙의 비교 기준
	const [lastSearched, setLastSearched] = useState(defaultValues);

	const search = (values: T) => {
		// 객체는 참조가 달라도 내용이 같을 수 있으므로 내용으로 비교한다 (es-toolkit isEqual — mes_FE 와 같은 도구)
		if (isEqual(values, lastSearched)) return onRefetch();

		setLastSearched(values);
		onSearch(values);
	};

	const handleReset = () => {
		form.reset(defaultValues);
		onReset?.();
		// search() 를 거치지 않는다 — 조건이 직전과 같으면 search 는 refetch 를 부르는데,
		// 그 순간에는 방금 비운 헤더 필터가 아직 반영되기 전이라 "필터가 걸린 예전 조회"를 한 번 더 부르게 된다.
		// 조건을 그대로 넘기면 필터가 비워진 새 조건으로 조회되고, 바뀐 게 없으면 캐시를 그대로 쓴다
		setLastSearched(defaultValues);
		onSearch(defaultValues);
	};

	return {
		/** 날짜 짝(시작일~종료일) 제약처럼 폼 전체가 필요한 입력칸을 위해 form 도 함께 돌려준다 */
		form,
		control: form.control,
		onSubmit: form.handleSubmit(search),
		onReset: handleReset,
	};
};

export default useSearchForm;
