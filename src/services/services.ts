import { ENV_API_BASE_URL } from '@/consts/common/envKeys';
import HttpClient from '@/networks/httpClient';
import AuthRepository from '@/repositories/auth/authRepository';
import BookRepository from '@/repositories/book/bookRepository';
import LoanRepository from '@/repositories/loan/loanRepository';
import MemberRepository from '@/repositories/member/memberRepository';
import AuthService from '@/services/auth/authService';
import BookService from '@/services/book/bookService';
import LoanService from '@/services/loan/loanService';
import MemberService from '@/services/member/memberService';

/*
 * ───────────────────────────── Composition Root ─────────────────────────────
 * 계층을 "조립"하는 단 한 곳 — HttpClient → Repository → Service 순서로 끼워 맞춘다 (mes_FE services.ts 와 같은 구조).
 *
 *   HttpClient(통신) ──주입──▶ Repository(요청 정의) ──주입──▶ Service(서버 상태)
 *
 * 각 클래스는 자기가 쓸 아래 계층을 직접 만들지(new) 않고 생성자로 받는다(의존성 주입).
 * 그래서 Service 는 Repository 가 어떻게 통신하는지 모르고, 여기만 바꾸면 조립을 바꿀 수 있다.
 */

// 앱 전체가 HttpClient 하나를 함께 쓴다 — 서버 주소 · 인터셉터 설정이 한 번만 이루어진다
const httpClient = new HttpClient(ENV_API_BASE_URL);

/** Repository 와 Service 를 짝지어 만든다 — 인스턴스는 직접 new 하지 않고 항상 이 함수로만 만든다 */
const wire = <R, S>(Repo: new (h: HttpClient) => R, Service: new (r: R) => S): S =>
	new Service(new Repo(httpClient));

const authService = wire(AuthRepository, AuthService);
// 요청 인터셉터에 "토큰을 얻는 함수"를 넘긴다.
// HttpClient 가 AuthService 를 직접 import 하면 순환 의존이 생기므로, 조립이 끝난 여기서 연결한다
httpClient.loadInterceptors(authService.getToken);

/**
 * 화면이 쓰는 서비스 모음 — `import services from '@/services/services'` 후 `const { bookService } = services`.
 *
 * React Context(useServices 훅)로 나눠 주지 않고 모듈로 내보내는 이유 (mes_FE 와 같은 결정):
 * Context 훅으로 꺼내면 `bookService.useGetBookList` 가 "렌더링마다 바뀔 수 있는 훅"으로 보여 hooks 린트 규칙에 걸린다.
 * 모듈 import 는 값이 고정이라 훅이 정적으로 결정되고, 라우트 가드처럼 React 밖에서도 같은 방식으로 쓸 수 있다.
 */
const services = {
	authService,
	bookService: wire(BookRepository, BookService),
	memberService: wire(MemberRepository, MemberService),
	loanService: wire(LoanRepository, LoanService),
};

export default services;
