# 도서관 통합 관리 시스템 (Frontend)

도서 · 회원 · 대출 정보를 관리하는 도서관 관리 프로그램의 프론트엔드입니다.
관리자(사서)는 도서·회원을 관리하고 창구에서 대출·반납을 처리하며, 회원은 도서를 검색해 대출 가능 여부와 자기 대출 현황을 확인하고 반납 기한 연장을 신청합니다.

> 백엔드(ASP.NET Core + MSSQL)는 아직 없습니다. **MSW(Mock Service Worker)** 가 브라우저 안에서 API 서버 역할을 하며, mock 저장소에 담긴 비즈니스 규칙이 곧 백엔드 API 명세입니다.

---

## 시작하기

```bash
pnpm install
pnpm dev          # http://localhost:3400
```

| 스크립트 | 설명 |
|---|---|
| `pnpm dev` | 개발 서버 (포트 3400) |
| `pnpm build` | 타입 검사 후 프로덕션 빌드 |
| `pnpm lint` | 타입 검사 + oxlint(--fix) + Prettier (mes_FE 규칙) |
| `pnpm preview` | 빌드 결과 미리보기 |

### 환경 변수 (`.env.development`)

| 변수 | 기본값 | 설명 |
|---|---|---|
| `VITE_DEV_PORT` | `3400` | 개발 서버 포트 |
| `VITE_API_BASE_URL` | `http://localhost:5100` | API 서버 주소 |
| `VITE_ENABLE_MSW` | `true` | `true` 면 MSW mock 서버 사용, `false` 면 실제 API 호출 |

### 데모 계정

| 역할 | 로그인 화면 | 아이디 / 비밀번호 | 로그인 직후 화면 |
|---|---|---|---|
| 관리자 (김사서) | `/admin/login` | `admin` / `admin1234` | 대시보드 |
| 회원 (홍길동) | `/login` | `member` / `member1234` | 도서 검색 |

데모 회원 계정에는 **대출중 1건 · 2일 연체 1건** 이 미리 들어 있습니다 (연체 중이라 새 대출은 차단됩니다). 다른 회원의 연장 신청 1건도 승인 대기 중입니다.

> ⚠️ mock 데이터는 메모리에만 있어 **새로고침하면 새로 생성**됩니다 (로그인 상태는 localStorage 에 남습니다).

---

## 기술 스택

| 구분 | 사용 |
|---|---|
| 언어 · 빌드 | TypeScript 5.9 (strict), React 19, Vite 7 (SWC) |
| UI | MUI 7, material-react-table 3, Tailwind CSS 4 |
| 라우팅 | TanStack Router (파일 기반, `src/pages`) |
| 서버 상태 | TanStack Query 5 |
| 클라이언트 상태 | Zustand (로그인 사용자) |
| 폼 · 검증 | react-hook-form + Zod |
| HTTP | axios |
| Mock | MSW 2 + Faker |

---

## 화면

| 역할 | 화면 | 경로 | 주요 기능 |
|---|---|---|---|
| 회원 | 회원 로그인 | `/login` | 회원 테이블 계정으로 로그인 (기본 진입점) |
| 관리자 | 관리자 로그인 | `/admin/login` | 관리자 테이블 계정으로 로그인 |
| 관리자 | 대시보드 | `/dashboard` | 전체 도서 수 · 대출 중 · 연체 · 연장 승인대기 요약, 최근 대출(최근 30일 대출 건 · 최신 대출 순 · 페이징) |
| 관리자 | 도서 관리 | `/book` | 도서 검색 · 등록 · 수정 · 삭제, 낱권별 대출 현황 (행 더블클릭) |
| 관리자 | 회원 관리 | `/member` | 회원 검색(이름 · 연락처 · 상태) · 등록 · 수정 · 탈퇴, 회원별 대출 이력 |
| 관리자 | 대출 / 반납 현황 | `/loanStatus` | **대출 처리**(+ 버튼 → 회원 검색·선택 → 도서 검색·선택 → 대출), 반납 처리, 대출일 · 반납예정일 기간 · 회원명 · 도서명 검색, 상태 탭 |
| 관리자 | 연장 승인 | `/extension` | 회원의 반납 기한 연장 신청을 승인 · 거절 |
| 회원 | 도서 검색 | `/bookSearch` | 도서 검색, 대출 가능 여부, 낱권별 반납 예정일 (행 더블클릭) |
| 회원 | 내 대출 현황 | `/myLoan` | 반납 예정일 · 연체 여부 · 연체료 확인, 반납 기한 연장 신청 |
| 회원 | 내 정보 | `/myInfo` | 연락처 · 이메일 수정, 대출 이력 |

라우트 `beforeLoad` 의 `guardAuth`(로그인 여부) · `guardRole`(ADMIN / MEMBER) 이 접근을 막고, 권한이 없으면 역할별 첫 화면으로 보냅니다. 로그인하지 않았으면 회원 로그인(`/login`)으로, 로그아웃하면 쓰던 역할의 로그인 화면으로 보냅니다.

관리자와 회원은 **계정 테이블과 진입점이 다릅니다** — 관리자(`admins`)는 `/admin/login`, 회원(`members`)은 `/login`. 어느 로그인 API 로 보냈는지가 곧 역할이라 요청에 역할을 담지 않고, 회원 목록 · 아이디 중복 확인 등 회원 기능에 관리자가 섞이지 않습니다.

---

## 비즈니스 규칙

정책값은 `src/consts/loan/loan.ts` 한 곳에 있고, 화면 안내와 mock 서버가 같은 값을 씁니다.

| 규칙 | 내용 |
|---|---|
| 대출 흐름 | 관리자가 창구에서 회원 선택 → 도서 선택 → 대출 처리 (과제 3-3, 신청 · 승인 단계 없음) → 반납 처리 |
| 대출 기간 | 대출일로부터 **14일** |
| 최대 대출 | 회원당 **5권** (대출중 · 연체 합산) |
| 대출 차단 | 재고 0권 · 연체 중인 회원 · 탈퇴 회원 · 5권 초과. 화면(대출 모달)이 먼저 막고, 서버도 다시 검사 |
| 연장 | 대출 중(연체 아님)일 때 사유(**1~100자**)와 함께 신청 → 관리자 승인 시 **+7일**, 최대 **2회**. 승인 전에 반납하면 연장 신청은 함께 취소 |
| 연체 | 반납기한이 지난 미반납 건. 조회할 때마다 다시 계산 (실서버라면 배치 작업) |
| 연체료 | 연체 1일당 **100원** (연체 중인 건만 표시, 결제 연동은 과제 범위 밖) |
| 도서 삭제 | 대출 중인 낱권이 있으면 불가. 이력 보존을 위해 소프트 삭제 |
| 권수 감소 | 대출 중·분실 낱권 수보다 적게 줄일 수 없음 |
| 회원 탈퇴 | 반납하지 않은 대출(대출중·연체)이 있으면 불가. 탈퇴 회원은 로그인 불가 |

**파생 상태** — 아래 두 값은 저장된 필드가 아니라 계산값이며, 목록 Chip · 검색 조건 · 컬럼 필터 · 정렬이 모두 같은 규칙을 따릅니다.

- 회원 **연체**: 정상 회원 중 `overdueCount > 0`
- 도서 **대출 가능 여부**: `availableQty > 0`

---

## 아키텍처

```
1. Pages ──────── src/pages         화면 조립 (라우트 · 부품 배치 · 이벤트 연결)
     │
2. Components ─── src/components    UI 부품 (Table · 검색 툴바 · 모달 · 칩)
     │
3. Services ───── src/services      TanStack Query 훅 · 조회 캐시 · 쓰기 후 무효화
     │                              (services.ts 가 Repository → Service 를 조립)
4. Repositories ─ src/repositories  순수 HTTP 요청 (URL · 메서드)
     │
5. Networks ───── src/networks      HttpClient = axios + 인터셉터 (토큰 첨부, success:false → 오류)
     │
     ▼  ── 여기부터는 앱 밖(서버) ──
   백엔드 API    개발 중에는 MSW 가 요청을 가로채 MockRepository(메모리 DB + 비즈니스 규칙 = 백엔드 명세)가 응답
```

의존은 위에서 아래 한 방향만 흐릅니다. 화면은 Service 훅으로만 서버와 통신하고, Repository · HttpClient 를 직접 부르지 않습니다.

- **전송**: mes_FE 처럼 **모든 요청을 POST** 로 보냅니다. `httpClient.get · post · put · patch · delete` 는 요청의 의도를 나타내는 이름이고, 동작은 URL 끝(`/list` · `/create` · `/:id/update`)으로 구분합니다.
- **요청 모양**: 조회든 저장이든 본문은 `IRequestBody` 하나입니다. Repository · 조회 훅은 `body` 하나만 받고, 쓰기 훅은 `mutate({ data })` 로 부릅니다 (mes_FE repository-service 규칙).
- **조회**: `useTableState` 가 페이지 · 정렬 · 컬럼 필터 · 검색 조건을 들고 `requestBody` 로 묶습니다. 검색 조건은 `setData` 로 바꾸며, 바꾸는 순간 1페이지로 돌아갑니다. 목록 API 는 `requestBody` 를 요청 본문에 그대로 담아 보냅니다.
- **쓰기**: 폼 저장은 공통 `Modal` 이 검증 → 저장 확인창 → 요청 → 폼 초기화 · 닫기를 맡습니다 (mes_FE Modal 이식). 삭제 · 반납 · 연장 승인 같은 행 동작도 확인창을 거칩니다. 성공하면 `BaseService.invalidate(QUERY_KEYS…)` 로 관련 목록이 자동 갱신되고, 실패하면 `QueryProvider` 의 `MutationCache` 가 공용 오류 다이얼로그를 띄웁니다.
- **표**: 행 동작은 화면이 버튼을 직접 그리지 않고 `onUpdateRow` · `onDeleteRow` · `getRowActions`(동작 목록 데이터)만 넘깁니다. 공통 `Table` 이 "작업" 칸에 ⋮ 메뉴(아이콘 + 이름)로 그려, 모든 화면의 모양이 같습니다 (mes_FE RenderRowCustomActions · MenuMore).
- **응답 형식**: `{ success, returnMess, data, totalRecords? }` (필드 이름은 mes_FE 와 동일). 실패도 HTTP 200 + `success: false` 로 오며, `interceptorSuccess` 가 이를 오류로 바꿉니다.

설계는 사내 MES 프론트엔드(mes_FE)의 5계층 구조와 mock 패턴, 전송 규칙(전부 POST · 응답 필드 이름)을 따릅니다. URL 만 mes_FE 의 `/v2/{module}/{signature}/{functionCode}` 대신 `/api/{도메인}/…` 형태를 씁니다.

---

## 폴더 구조

```
src/
├── pages/                  라우트 = 화면 (TanStack Router 파일 기반)
│   ├── (unauthenticated)/  회원 로그인(/login) · 관리자 로그인(/admin/login) · 공용 LoginCard
│   ├── (authenticated)/    인증 레이아웃(사이드바 · 화면 간격 규칙) + 화면 8개
│   │   └── -components/    여러 화면이 함께 쓰는 부품 (Sidebar, FormBookSearch, ModalInfoBookCopies)
│   ├── -guards/            guardAuth, guardRole
│   └── -routeComponents/   오류 · 404 화면
├── components/
│   ├── ui/                 도메인을 모르는 순수 UI (Table, Modal, ModalConfirm, SearchToolbar, PageHeader …)
│   ├── tables/             행 타입 1개 = 테이블 1개 (TableBooks, TableLoans, TableMembers …)
│   ├── modals/common/      모달 안의 폼 (FormModal — 칸 구성만 넘기면 같은 모양으로 그린다)
│   └── chips/              상태 표시 규칙 (ChipLoanStatus, ChipMemberStatus …)
├── services/               TanStack Query 훅 (BaseService: keyOf · invalidate), services.ts = 서비스 조립
├── repositories/           API 호출
├── networks/               axios HttpClient · 인터셉터
├── mocks/                  MSW mock 서버 (repositories/* 에 비즈니스 규칙)
├── consts/                 정책값 · 상태 옵션(라벨·색) · 쿼리 키 · 역할별 첫 화면
├── types/  schemas/        데이터 타입 · Zod 폼 스키마
├── stores/                 Zustand (로그인 사용자)
├── contexts/               Provider (Query · Router · MSW · 확인창)
├── hooks/                  useTableState, useTableCore, useSearchForm, useCountUp
└── utils/                  cn, date, number, confirm, mutationError …
```

### 컴포넌트 배치 규칙

- `components/ui` — 어느 화면에서나 쓰는 순수 UI. 도메인 지식 없음.
- `components/tables` — 한 행 타입의 컬럼 정의는 한 곳에만. 화면마다 다른 구성은 `initialState.columnVisibility` 로 가립니다 (`TableLoans` 는 6개 화면이 공유).
- `components/modals/common` — 모달 안의 폼(`FormModal`). 칸 구성(`fields`)만 넘기면 구획 제목 · 입력칸을 같은 모양으로 그립니다.
- 간격 — 화면 구획 사이는 페이지 컨테이너의 `gap-4`, 카드 안쪽 여백은 `px-5 py-4` 로 통일합니다 (`pages/(authenticated)/route.tsx` 주석 참고). 화면마다 `mb-*` 를 주지 않습니다.
- `pages/**/-components` — 그 화면(계층)에서만 쓰는 부품. 두 화면이 함께 쓰게 되면 공통 조상 폴더로 올립니다.
- 스타일은 MUI 테마 없이 공통 컴포넌트에 Tailwind 로 주며, `index.css` 의 `@import 'tailwindcss' important` 로 Tailwind 클래스가 MUI 기본 스타일보다 우선합니다 (mes_FE 동일).

---

## API (MSW mock 기준)

전송은 전부 **POST** 입니다. 아래 "의도"는 `httpClient` 의 어느 메서드로 부르는지(조회 · 등록 · 수정 · 삭제)를 뜻합니다.

| 도메인 | 의도 | 경로 | 설명 |
|---|---|---|---|
| 인증 | post | `/api/auth/login` | 회원 로그인 (회원 테이블 · 탈퇴 여부 검사) |
| 인증 | post | `/api/auth/admin/login` | 관리자 로그인 (관리자 테이블) |
| 도서 | get | `/api/books/list` | 목록 (제목 · 저자 · 분류 · 출판사 · 대출 가능 여부, 페이징 · 정렬 · 필터) |
| 도서 | post | `/api/books/create` | 등록 |
| 도서 | put | `/api/books/:bookId/update` | 수정 (권수 변경 시 낱권 추가 · 삭제) |
| 도서 | delete | `/api/books/:bookId/delete` | 삭제 (소프트 삭제) |
| 도서 | get | `/api/books/:bookId/copies` | 낱권별 대출 현황 |
| 회원 | get | `/api/members/list` | 목록 (이름 · 상태) |
| 회원 | get | `/api/members/:memberId/detail` | 단건 |
| 회원 | get | `/api/members/login-id/availability` | 아이디 중복 확인 (아이디는 body) |
| 회원 | post | `/api/members/create` | 등록 |
| 회원 | put | `/api/members/:memberId/update` | 수정 (비밀번호는 입력 시에만 변경) |
| 회원 | delete | `/api/members/:memberId/delete` | 탈퇴 처리 |
| 회원 | get | `/api/members/:memberId/loans` | 회원별 대출 이력 |
| 대출 | get | `/api/loans/list` | 목록 (상태 필터) |
| 대출 | get | `/api/loans/summary` | 현황 요약 |
| 대출 | post | `/api/loans/create` | 대출 처리 (관리자) |
| 대출 | post | `/api/loans/:loanId/extension-request` | 연장 신청 (회원) |
| 대출 | patch | `/api/loans/:loanId/extension-approve` · `/extension-reject` | 연장 승인 · 거절 (관리자) |
| 대출 | patch | `/api/loans/:loanId/return` | 반납 (관리자) |

---

## 앞으로

- 2026-10 백엔드(ASP.NET Core + MSSQL) 연동 — mock 서버의 URL · 규칙을 명세로 구현한 뒤 `VITE_ENABLE_MSW=false` 로 전환
- 연장 신청 · 내 대출 조회에서 클라이언트가 보내는 `memberId` 대신 서버가 토큰으로 사용자 확인
