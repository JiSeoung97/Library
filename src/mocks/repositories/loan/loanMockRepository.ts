import type { IMockContext } from '@/mocks/networks/httpMockClient';
import type BookMockRepository from '@/mocks/repositories/book/bookMockRepository';
import BaseMockRepository from '@/mocks/repositories/common/baseMockRepository';
import type MemberMockRepository from '@/mocks/repositories/member/memberMockRepository';
import type { IBookCopyWithLoan } from '@/types/book/book';
import type { IRequestBody, IResponseBody } from '@/types/common/repository';
import type {
	ILoan,
	ILoanCreateBody,
	ILoanSearch,
	ILoanSummary,
	TLoanStatus,
} from '@/types/loan/loan';
import { toLocalDate } from '@/utils/common/date';

import {
	ACTIVE_LOAN_STATUSES,
	EXTENSION_PERIOD_DAYS,
	LOAN_PERIOD_DAYS,
	MAX_ACTIVE_LOAN_COUNT,
	MAX_EXTENSION_COUNT,
	MAX_EXTENSION_REASON_LENGTH,
} from '@/consts/loan/loan';

const DAY_MS = 24 * 60 * 60 * 1000;

// 대출 상태 정렬 순서 (오름차순 기준) — 반납완료 → 대출중 → 연체.
// 내림차순이면 연체 → 대출중 → 반납완료로, 먼저 처리해야 할 연체가 위로 온다 (회원 목록 상태 정렬과 같은 원칙)
const STATUS_SORT_ORDER: TLoanStatus[] = ['RETURNED', 'BORROWED', 'OVERDUE'];

/** 오늘 기준 days 일 뒤(음수면 앞) 시각의 ISO 문자열 */
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY_MS).toISOString();

export default class LoanMockRepository extends BaseMockRepository<ILoan> {
	private sequence = 0;

	constructor(
		private readonly bookRepo: BookMockRepository,
		private readonly memberRepo: MemberMockRepository,
	) {
		super();
		this.seedLoans();
	}

	// 데모용 초기 대출 데이터 — 반납완료 / 대출중 / 연체 / 연장 신청 대기 케이스를 섞어 생성
	// 데모 로그인 회원(member = 홍길동, 회원 목록 맨 앞)은 아래 seedDemoMemberLoans 가 따로 심으므로 제외한다
	private seedLoans(): void {
		const members = this.memberRepo
			.getAll()
			.filter(member => member.status === 'ACTIVE' && member.loginId !== 'member');
		const books = this.bookRepo.getAll();
		if (members.length === 0 || books.length === 0) return;

		// 홍길동 몫으로 앞의 책 3권을 남겨 둔다
		let bookIndex = 3;
		const nextBook = () => books[bookIndex++ % books.length];

		const memberIdAt = (index: number) => members[index % members.length].memberId;

		const addLoan = (memberIndex: number, daysAgoLoaned: number, daysAgoDue: number) =>
			this.createLoan(memberIdAt(memberIndex), nextBook().bookId, {
				loanedAt: daysFromNow(-daysAgoLoaned),
				dueAt: daysFromNow(-daysAgoDue),
				status: 'BORROWED',
			});

		// 반납완료 5건 — 대출일로부터 14일 후 반납 기한, 그 전에 이미 반납
		for (let i = 0; i < 5; i++) {
			const loan = addLoan(i, 30, 16);
			if (!loan) continue;
			this.update(loan.loanId, { returnedAt: daysFromNow(-20), status: 'RETURNED' });
			this.bookRepo.releaseCopy(loan.copyId);
		}

		// 대출중 5건 — 최근 대출, 아직 반납 기한 전. 그중 1건은 연장 신청이 접수되어 관리자 승인을 기다린다
		for (let i = 5; i < 10; i++) {
			const loan = addLoan(i, 3, -11);
			if (loan && i === 5)
				this.update(loan.loanId, {
					pendingExtensionReason: '시험 기간이라 조금 더 보고 싶습니다',
				});
		}

		// 연체 3건 — 반납 기한이 지났는데 아직 미반납
		for (let i = 10; i < 13; i++) {
			addLoan(i, 20, 3);
		}

		this.seedDemoMemberLoans();
		this.refreshOverdueStatus();
	}

	// 데모 로그인 계정(member = 홍길동)이 로그인 직후 바로 각 상태를 볼 수 있도록 고정 2건을 심는다
	// — 대출중 1건(연장 신청 시연용), 2일 연체 1건(대출 차단 시연용)
	private seedDemoMemberLoans(): void {
		const demoMember = this.memberRepo.getAll().find(member => member.loginId === 'member');
		const books = this.bookRepo.getAll();
		if (!demoMember || books.length < 3) return;

		const { memberId } = demoMember;

		// 대출중 — 3일 전 대출, 반납기한 11일 남음
		this.createLoan(memberId, books[0].bookId, {
			loanedAt: daysFromNow(-3),
			dueAt: daysFromNow(LOAN_PERIOD_DAYS - 3),
			status: 'BORROWED',
		});

		// 연체 — 반납기한이 2일 지났다 (실제 연체일수는 refreshOverdueStatus 가 계산)
		this.createLoan(memberId, books[2].bookId, {
			loanedAt: daysFromNow(-(LOAN_PERIOD_DAYS + 2)),
			dueAt: daysFromNow(-2),
			status: 'BORROWED',
		});
	}

	protected getId = (item: ILoan): number => item.loanId;

	// 대출 가능한 낱권 하나를 배정하고 대출 레코드를 만든다 — 날짜 · 상태는 호출부(대출 처리 · 시드)가 정한다
	private createLoan(memberId: number, bookId: number, overrides: Partial<ILoan>): ILoan | null {
		const member = this.memberRepo.getMemberById(memberId);
		const book = this.bookRepo.getBookById(bookId);
		if (!member || !book) return null;

		const copy = this.bookRepo.allocateCopy(bookId);
		if (!copy) return null;

		return this.create({
			memberId,
			memberName: member.name,
			copyId: copy.copyId,
			lotNo: copy.lotNo,
			bookId,
			bookTitle: book.title,
			bookAuthor: book.author,
			bookPublisher: book.publisher,
			...overrides,
		});
	}

	protected createItem(overrides: Partial<ILoan> = {}): ILoan {
		this.sequence += 1;
		const now = new Date().toISOString();

		return {
			loanId: this.sequence,
			memberId: 0,
			memberName: '',
			copyId: 0,
			lotNo: '',
			bookId: 0,
			bookTitle: '',
			bookAuthor: '',
			bookPublisher: '',
			loanedAt: now,
			dueAt: now,
			returnedAt: null,
			status: 'BORROWED',
			overdueDays: 0,
			extensionCount: 0,
			pendingExtensionReason: null,
			createdAt: now,
			...overrides,
		};
	}

	// 조회 시점마다 대출중 건의 연체 여부를 재계산 (실서버라면 배치/스케줄러 역할)
	private refreshOverdueStatus(): void {
		const now = Date.now();
		let overdueChanged = false;

		this.items = this.items.map(loan => {
			if (loan.status !== 'BORROWED' && loan.status !== 'OVERDUE') return loan;
			const dueMs = new Date(loan.dueAt).getTime();
			const isOverdue = dueMs < now;
			const overdueDays = isOverdue ? Math.floor((now - dueMs) / DAY_MS) : 0;
			const status: TLoanStatus = isOverdue ? 'OVERDUE' : 'BORROWED';

			if (status !== loan.status) overdueChanged = true;
			return { ...loan, status, overdueDays };
		});

		if (overdueChanged) this.syncMemberOverdueCounts();
	}

	private syncMemberOverdueCounts(): void {
		const overdueByMember = new Map<number, number>();
		for (const loan of this.items) {
			if (loan.status !== 'OVERDUE') continue;
			overdueByMember.set(loan.memberId, (overdueByMember.get(loan.memberId) ?? 0) + 1);
		}
		for (const member of this.memberRepo.getAll()) {
			this.memberRepo.setOverdueCount(
				member.memberId,
				overdueByMember.get(member.memberId) ?? 0,
			);
		}
	}

	// 아직 반납하지 않은(대출중 · 연체) 건수 — 최대 대출 권수 제한, 회원 탈퇴 가능 여부 판단에 사용
	public activeLoanCount(memberId: number): number {
		return this.items.filter(
			loan => loan.memberId === memberId && ACTIVE_LOAN_STATUSES.includes(loan.status),
		).length;
	}

	private findActiveLoanByCopyId(copyId: number): ILoan | undefined {
		return this.items.find(
			loan => loan.copyId === copyId && ACTIVE_LOAN_STATUSES.includes(loan.status),
		);
	}

	// 대출 처리(postLoan) 검증 — 과제 3-3 "재고 0권 또는 연체 중인 회원은 대출 차단" + 최대 권수
	private validateNewLoan(memberId: number, bookId: number): string | null {
		const member = this.memberRepo.getMemberById(memberId);
		if (!member) return '회원을 찾을 수 없습니다.';
		if (member.status === 'WITHDRAWN') return '탈퇴한 회원은 대출할 수 없습니다.';
		if (member.overdueCount > 0) return '연체 중인 도서가 있어 대출할 수 없습니다.';

		const book = this.bookRepo.getBookById(bookId);
		if (!book || book.status === 'DELETED') return '도서를 찾을 수 없습니다.';
		if (this.bookRepo.getAvailableQty(bookId) <= 0) return '대출 가능한 재고가 없습니다.';
		if (this.activeLoanCount(memberId) >= MAX_ACTIVE_LOAN_COUNT)
			return `최대 ${MAX_ACTIVE_LOAN_COUNT}권까지만 대출할 수 있습니다.`;

		return null;
	}

	// 날짜(ISO 문자열)가 기간 [from, to] 안에 있는지 — 'YYYY-MM-DD' 는 문자열 비교가 곧 날짜 순서 비교다.
	// 기간 조건이 있는데 날짜가 없는 건(반납 전이라 반납일이 없는 대출 등)은 제외한다.
	private isWithinPeriod(value: string | null | undefined, from?: string, to?: string): boolean {
		if (!from && !to) return true;
		if (!value) return false;
		// 화면과 같은 기준(현지 시간대 날짜)으로 비교한다 — ISO 앞 10자리는 UTC 날짜라 한국 시간 새벽에는 하루 어긋난다
		const day = toLocalDate(value);
		return (!from || day >= from) && (!to || day <= to);
	}

	// 대출 목록 공통 정렬 · 페이징 — 대출 목록과 회원 대출 이력이 같은 규칙을 쓴다.
	// 화면 컬럼 중 실제 필드로 바로 정렬할 수 없는 두 컬럼을 바꿔 정렬한다:
	// - 상태: 저장값(영문 코드) 알파벳순이 아니라 STATUS_SORT_ORDER 순번으로 (내림차순 = 연체 → 대출중 → 반납완료), 같은 상태 안에서는 연체일수
	// - 연체료: 필드가 아니라 연체일수로부터 파생되므로 연체일수로
	private queryLoans(loans: ILoan[], body: IRequestBody<unknown>) {
		const rows = loans.map(loan => ({
			loan,
			...loan,
			statusRank: STATUS_SORT_ORDER.indexOf(loan.status),
		}));
		// 상태 정렬에는 연체일수를 같은 방향의 2차 기준으로 붙인다 — 같은 "연체"끼리도 내림차순이면 오래 연체된 건(3일 → 2일)이 위로.
		// 대출중 · 반납완료는 연체일수가 모두 0 이라 영향이 없다
		const sortings = body.sortings?.flatMap(sort => {
			if (sort.columName === 'status')
				return [
					{ ...sort, columName: 'statusRank' },
					{ ...sort, columName: 'overdueDays' },
				];
			if (sort.columName === 'overdueFee') return [{ ...sort, columName: 'overdueDays' }];
			return [sort];
		});
		const { items, total } = this.query(rows, { ...body, sortings });
		return { items: items.map(row => row.loan), total };
	}

	public getLoanList = this.httpMockClient.get(
		'/api/loans/list',
		async ({ body }: IMockContext<ILoanSearch>): Promise<IResponseBody<ILoan[]>> => {
			this.refreshOverdueStatus();

			const {
				memberName,
				bookTitle,
				loanedFrom,
				loanedTo,
				dueFrom,
				dueTo,
				status,
				hasPendingExtension,
			} = body.data ?? {};

			// 기본 순서는 서버가 정한다 — 정렬 조건이 없으면 최근 대출이 위로(대출일 내림차순).
			// 화면은 사용자가 헤더를 눌렀을 때만 정렬 조건을 보내고, 그때는 그 조건이 우선한다(안정 정렬이라 같은 값끼리는 이 순서 유지)
			const filtered = [...this.items]
				.sort((a, b) => new Date(b.loanedAt).getTime() - new Date(a.loanedAt).getTime())
				.filter(
					loan =>
						this.matchesFilter(loan, 'memberName', memberName) &&
						this.matchesFilter(loan, 'bookTitle', bookTitle) &&
						this.isWithinPeriod(loan.loanedAt, loanedFrom, loanedTo) &&
						this.isWithinPeriod(loan.dueAt, dueFrom, dueTo) &&
						(!status || loan.status === status) &&
						(!hasPendingExtension || !!loan.pendingExtensionReason),
				);
			const { items, total } = this.queryLoans(filtered, body);

			return { success: true, returnMess: '', data: items, totalRecords: total };
		},
	);

	public getLoanSummary = this.httpMockClient.get(
		'/api/loans/summary',
		async (): Promise<IResponseBody<ILoanSummary>> => {
			this.refreshOverdueStatus();

			const books = this.bookRepo.getAll().filter(book => book.status === 'ACTIVE');
			const totalBookCount = books.reduce(
				(sum, book) => sum + this.bookRepo.getBookCopies(book.bookId).length,
				0,
			);
			const borrowedCount = this.items.filter(loan =>
				ACTIVE_LOAN_STATUSES.includes(loan.status),
			).length;
			const overdueCount = this.items.filter(loan => loan.status === 'OVERDUE').length;
			const pendingExtensionCount = this.items.filter(
				loan => loan.pendingExtensionReason,
			).length;

			return {
				success: true,
				returnMess: '',
				data: {
					totalBookCount,
					borrowedCount,
					overdueCount,
					pendingExtensionCount,
				},
			};
		},
	);

	// 도서(제목)의 낱권 목록 + 낱권별 현재 대출 정보(대출중/연체일 때만) — 도서 상세 모달용
	public getBookCopies = this.httpMockClient.get(
		'/api/books/:bookId/copies',
		async ({ body, params }): Promise<IResponseBody<IBookCopyWithLoan[]>> => {
			this.refreshOverdueStatus();
			const bookId = Number(params.bookId);
			const copies = this.bookRepo.getBookCopies(bookId);

			const data: IBookCopyWithLoan[] = copies.map(copy => {
				const loan = this.findActiveLoanByCopyId(copy.copyId);
				return {
					...copy,
					activeLoan: loan
						? {
								loanId: loan.loanId,
								memberName: loan.memberName,
								loanedAt: loan.loanedAt,
								dueAt: loan.dueAt,
								isOverdue: loan.status === 'OVERDUE',
								overdueDays: loan.overdueDays,
							}
						: null,
				};
			});

			// 정렬 · 필터 · 페이징도 서버가 한다 — 표의 컬럼(대출자 · 대출일 · 반납예정일 · 연체일수)은 activeLoan 안에 있으므로
			// 컬럼 id 와 같은 이름으로 펼친 행을 만들어 공통 규칙(query)에 넘기고, 결과는 원래 모양으로 돌려준다
			const rows = data.map(copy => ({
				copy,
				lotNo: copy.lotNo,
				status: copy.status,
				memberName: copy.activeLoan?.memberName ?? null,
				loanedAt: copy.activeLoan?.loanedAt ?? null,
				dueAt: copy.activeLoan?.dueAt ?? null,
				overdueDays: copy.activeLoan?.isOverdue ? copy.activeLoan.overdueDays : 0,
			}));
			const { items, total } = this.query(rows, body);

			return {
				success: true,
				returnMess: '',
				data: items.map(row => row.copy),
				totalRecords: total,
			};
		},
	);

	// 관리자 대출 처리 — 대출 / 반납 현황에서 회원 · 도서를 골라 바로 대출한다(신청 · 승인 단계 없음)
	public postLoan = this.httpMockClient.post(
		'/api/loans/create',
		async ({ body }: IMockContext<ILoanCreateBody>): Promise<IResponseBody<ILoan | null>> => {
			// 연체 여부를 최신으로 맞춘 뒤 검사한다 — 오늘 반납 기한이 지난 건이 있으면 바로 차단된다
			this.refreshOverdueStatus();
			const { memberId = 0, bookId = 0 } = body.data ?? {};

			const validationError = this.validateNewLoan(memberId, bookId);
			if (validationError) return { success: false, returnMess: validationError, data: null };

			const loan = this.createLoan(memberId, bookId, {
				loanedAt: daysFromNow(0),
				dueAt: daysFromNow(LOAN_PERIOD_DAYS),
				status: 'BORROWED',
			});
			if (!loan)
				return { success: false, returnMess: '대출 가능한 재고가 없습니다.', data: null };

			return { success: true, returnMess: '', data: loan };
		},
	);

	// 회원 연장 신청 — BORROWED(연체 아님) 상태만, 최대 2회. 신청만 남기고 실제 연장은 관리자 승인 시 처리
	public postExtensionRequest = this.httpMockClient.post(
		'/api/loans/:loanId/extension-request',
		async ({
			body,
			params,
		}: IMockContext<{ reason: string }>): Promise<IResponseBody<ILoan | null>> => {
			this.refreshOverdueStatus();
			const loanId = Number(params.loanId);
			const loan = this.findById(loanId);
			const reason = body.data?.reason;

			if (!loan)
				return { success: false, returnMess: '대출 내역을 찾을 수 없습니다.', data: null };
			if (!reason?.trim() || reason.length > MAX_EXTENSION_REASON_LENGTH)
				return {
					success: false,
					returnMess: `연장 사유는 1~${MAX_EXTENSION_REASON_LENGTH}자로 입력해주세요.`,
					data: null,
				};
			if (loan.status !== 'BORROWED')
				return {
					success: false,
					returnMess:
						loan.status === 'OVERDUE'
							? '연체 중인 도서는 연장할 수 없습니다.'
							: '대출 중인 도서만 연장할 수 있습니다.',
					data: null,
				};
			if (loan.extensionCount >= MAX_EXTENSION_COUNT)
				return {
					success: false,
					returnMess: `연장은 최대 ${MAX_EXTENSION_COUNT}회까지만 가능합니다.`,
					data: null,
				};
			if (loan.pendingExtensionReason)
				return {
					success: false,
					returnMess: '이미 연장 신청이 접수되어 있습니다.',
					data: null,
				};

			const updated = this.update(loanId, { pendingExtensionReason: reason });

			return { success: true, returnMess: '', data: updated };
		},
	);

	// 관리자 연장 승인 — 반납예정일 + 7일 확정
	public patchExtensionApprove = this.httpMockClient.patch(
		'/api/loans/:loanId/extension-approve',
		async ({ params }): Promise<IResponseBody<ILoan | null>> => {
			const loanId = Number(params.loanId);
			const loan = this.findById(loanId);

			if (!loan)
				return { success: false, returnMess: '대출 내역을 찾을 수 없습니다.', data: null };
			// 연체 여부는 승인 때 다시 막지 않는다 — 신청할 때는 연체를 막지만, 신청 뒤 연체가 된 건을 승인할지는
			// 사유를 본 관리자의 판단(책임)으로 둔다 (의도된 정책)
			// 다른 관리자가 그사이 반납 처리했을 수 있다 — 반납된 대출은 연장하지 않는다
			if (loan.status === 'RETURNED')
				return { success: false, returnMess: '이미 반납된 대출입니다.', data: null };
			if (!loan.pendingExtensionReason)
				return {
					success: false,
					returnMess: '대기 중인 연장 신청이 아닙니다.',
					data: null,
				};

			const nextDueAt = new Date(
				new Date(loan.dueAt).getTime() + EXTENSION_PERIOD_DAYS * DAY_MS,
			);
			const updated = this.update(loanId, {
				dueAt: nextDueAt.toISOString(),
				extensionCount: loan.extensionCount + 1,
				pendingExtensionReason: null,
			});

			return { success: true, returnMess: '', data: updated };
		},
	);

	// 관리자 연장 거절 — 신청만 취소, 반납예정일은 그대로
	public patchExtensionReject = this.httpMockClient.patch(
		'/api/loans/:loanId/extension-reject',
		async ({ params }): Promise<IResponseBody<ILoan | null>> => {
			const loanId = Number(params.loanId);
			const loan = this.findById(loanId);

			if (!loan)
				return { success: false, returnMess: '대출 내역을 찾을 수 없습니다.', data: null };
			if (!loan.pendingExtensionReason)
				return {
					success: false,
					returnMess: '대기 중인 연장 신청이 아닙니다.',
					data: null,
				};

			const updated = this.update(loanId, { pendingExtensionReason: null });

			return { success: true, returnMess: '', data: updated };
		},
	);

	public patchLoanReturn = this.httpMockClient.patch(
		'/api/loans/:loanId/return',
		async ({ params }): Promise<IResponseBody<ILoan | null>> => {
			const loanId = Number(params.loanId);
			const loan = this.findById(loanId);
			if (!loan)
				return {
					success: false,
					returnMess: '대출 내역을 찾을 수 없습니다.',
					data: null,
				};
			if (loan.status !== 'BORROWED' && loan.status !== 'OVERDUE')
				return {
					success: false,
					returnMess: '반납할 수 있는 상태가 아닙니다.',
					data: null,
				};

			// 승인 대기 중인 연장 신청은 함께 취소한다 — 책을 돌려받았으니 연장할 대상이 없다.
			// 남겨 두면 반납된 대출이 연장 승인 목록에 계속 보이고, 승인하면 반납 예정일이 늘어나는 모순이 생긴다
			const updated = this.update(loanId, {
				returnedAt: new Date().toISOString(),
				status: 'RETURNED',
				overdueDays: 0,
				pendingExtensionReason: null,
			});
			this.bookRepo.releaseCopy(loan.copyId);
			this.syncMemberOverdueCounts();

			return { success: true, returnMess: '', data: updated };
		},
	);

	// 한 회원의 대출 이력 — 내 대출 현황 · 내 정보 · 회원 대출 이력 모달이 쓴다. 정렬 · 페이징은 서버가 한다
	public getLoansByMember = this.httpMockClient.get(
		'/api/members/:memberId/loans',
		async ({ body, params }): Promise<IResponseBody<ILoan[]>> => {
			this.refreshOverdueStatus();
			const memberId = Number(params.memberId);
			// 정렬 조건이 없을 때의 기본 순서는 최근 대출이 위로 — 정렬 조건이 있으면 그 조건이 우선한다(안정 정렬)
			const loans = this.items
				.filter(loan => loan.memberId === memberId)
				.sort((a, b) => new Date(b.loanedAt).getTime() - new Date(a.loanedAt).getTime());
			const { items, total } = this.queryLoans(loans, body);

			return { success: true, returnMess: '', data: items, totalRecords: total };
		},
	);
}
