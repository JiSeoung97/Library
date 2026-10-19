import { faker, fakerKO } from '@faker-js/faker';
import type { HttpHandler } from 'msw';

import AdminMockRepository from '@/mocks/repositories/admin/adminMockRepository';
import AuthMockRepository from '@/mocks/repositories/auth/authMockRepository';
import BookMockRepository from '@/mocks/repositories/book/bookMockRepository';
import LoanMockRepository from '@/mocks/repositories/loan/loanMockRepository';
import MemberMockRepository from '@/mocks/repositories/member/memberMockRepository';

/** faker 시드 — 아무 숫자나 되지만 바꾸면 데모 데이터 전체가 달라진다 */
const MOCK_DATA_SEED = 20261002;

// 무작위 값의 시작점을 고정한다 — 새로고침할 때마다 같은 도서 · 회원 · 대출 데이터가 만들어진다.
// 시드가 없으면 faker 가 매번 다른 값을 만들어 전체 도서 수 · 책 제목이 새로고침마다 바뀐다(시연 · 설명이 어렵다).
// 반드시 저장소를 만들기(new) 전에 호출해야 한다 — 데이터는 각 저장소의 생성자에서 만들어진다.
// (날짜는 "오늘 기준 며칠 전"으로 만들어지므로 날짜 값 자체는 실행하는 날에 따라 달라진다)
faker.seed(MOCK_DATA_SEED);
// 한국어 faker(회원 이름)는 무작위 시작점을 따로 가지므로 함께 고정한다
fakerKO.seed(MOCK_DATA_SEED);

const bookRepo = new BookMockRepository();
const memberRepo = new MemberMockRepository();
const loanRepo = new LoanMockRepository(bookRepo, memberRepo);
memberRepo.setActiveLoanCounter(memberId => loanRepo.activeLoanCount(memberId));
const adminRepo = new AdminMockRepository();
const authRepo = new AuthMockRepository(adminRepo, memberRepo);

export const handlers: HttpHandler[] = [
	...authRepo.getHandlers(),
	...bookRepo.getHandlers(),
	...memberRepo.getHandlers(),
	...loanRepo.getHandlers(),
];
