import { notifyMutationError, notifyQueryError } from '@/utils/common/mutationError';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';

/**
 * TanStack Query 의 중앙 저장소 — 서버에서 받은 데이터(도서 · 회원 · 대출)의 캐시가 모두 여기 있다.
 * 컴포넌트 밖(BaseService 의 무효화, AuthService 의 로그아웃)에서도 써야 해서 모듈 밖으로 내보낸다.
 */
export const queryClient = new QueryClient({
	// 쓰기(useMutation) 실패는 여기 한 곳에서 공용 오류 다이얼로그로 안내한다.
	// 화면마다 try/catch 나 오류 표시 코드를 두지 않아도 되고, 어떤 저장이 실패하든 같은 방식으로 보인다.
	// (오류 문구는 interceptorError 가 이미 사용자에게 보여 줄 수 있는 형태로 정리해 둔다)
	mutationCache: new MutationCache({ onError: notifyMutationError }),
	// 읽기(useQuery) 실패도 같은 방식으로 알린다 — 그냥 두면 실패한 목록이 빈 표로 보여 "데이터가 없음"과 구분되지 않는다
	queryCache: new QueryCache({ onError: error => void notifyQueryError(error) }),
	defaultOptions: {
		queries: {
			// 5분 동안은 "신선한" 데이터로 본다 — 같은 조건으로 다시 들어와도 요청하지 않고 캐시를 쓴다.
			// 그 안에 데이터가 바뀌면? 저장 성공 시 Service 가 관련 캐시를 무효화하므로 화면은 최신이 된다
			staleTime: 5 * 60 * 1000,
			// 화면에서 쓰지 않게 된 캐시를 메모리에 남겨 두는 시간 (staleTime 보다 조금 길게)
			gcTime: 5.5 * 60 * 1000,
			// 실패해도 자동으로 다시 시도하지 않는다 — 업무 규칙 위반(success:false)은 다시 해도 같은 결과다
			retry: false,
			// 다른 창에 갔다 돌아올 때마다 다시 조회하지 않는다
			refetchOnWindowFocus: false,
		},
		mutations: {
			retry: false,
		},
	},
});

interface IProps {
	children: ReactNode;
}

const QueryProvider = ({ children }: IProps) => (
	<QueryClientProvider client={queryClient}>
		{children}
		{/* 개발 중 캐시 상태를 들여다보는 도구 — 프로덕션 빌드에는 포함되지 않는다 */}
		<ReactQueryDevtools initialIsOpen={false} />
	</QueryClientProvider>
);

export default QueryProvider;
