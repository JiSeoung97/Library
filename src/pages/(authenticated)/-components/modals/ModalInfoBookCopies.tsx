import ChipBookAvailability from '@/components/chips/ChipBookAvailability';
import TableBookCopies, { useColumns } from '@/components/tables/book/TableBookCopies';
import BoxInfo from '@/components/ui/containers/BoxInfo';
import BoxInfoGrid from '@/components/ui/containers/BoxInfoGrid';
import Modal, { type IModalBaseProps } from '@/components/ui/modals/Modal';
import useTableState from '@/hooks/common/table/useTableState';
import services from '@/services/services';
import type { IBook } from '@/types/book/book';
import { formatDate } from '@/utils/common/date';
import { toColumnVisibility } from '@/utils/common/table/toColumnVisibility';

interface IProps extends IModalBaseProps<IBook> {
	/** 관리자 화면이면 대출자 · Lot 번호 · ISBN 까지 보여 준다. 회원 화면은 "언제 돌아오는지"만 보여 준다 */
	isAdmin: boolean;
}

// 같은 낱권 표를 역할에 따라 다르게 보여 준다 — 회원에게는 다른 회원의 이름을 보여 주지 않는다
const ADMIN_COLUMNS = ['lotNo', 'status', 'memberName', 'loanedAt', 'dueAt', 'overdueDays'];
const MEMBER_COLUMNS = ['status', 'dueAt', 'overdueDays'];

/**
 * 도서 상세 모달 — 도서 한 종의 기본 정보와 낱권별 대출 현황. 도서 관리(관리자)와 도서 검색(회원)이 함께 쓴다.
 * 조회만 하는 모달이라 variant 는 기본값 'info'(닫기 버튼만)를 쓴다.
 */
const ModalInfoBookCopies = ({ open, data: book, isAdmin, onClose }: IProps) => {
	const { bookService } = services;
	// 서버 페이징 · 정렬 · 필터 — 낱권이 많은 도서도 다른 목록과 같은 방식으로 본다
	const tableState = useTableState<{ bookId: number }>({
		data: { bookId: book.bookId },
	});
	const { data, isFetching } = bookService.useGetBookCopies(tableState.requestBody);
	const columns = useColumns();

	return (
		<Modal open={open} title={book.title} size='medium' onClose={onClose}>
			<div className='flex flex-col gap-4'>
				<BoxInfoGrid>
					<BoxInfo title='저자' data={book.author} />
					<BoxInfo title='출판사' data={book.publisher} />
					<BoxInfo title='분류' data={book.category} />
					{isAdmin && <BoxInfo title='출간일' data={formatDate(book.publishedAt)} />}
					<BoxInfo title='재고'>
						<ChipBookAvailability
							availableQty={book.availableQty}
							totalQty={book.totalQty}
						/>
					</BoxInfo>
					{/* 관리자는 6칸(3줄), 회원은 4칸(2줄) — 항목 수가 짝수라 표의 마지막 칸이 비지 않는다 */}
					{isAdmin && <BoxInfo title='ISBN' data={book.isbn} />}
				</BoxInfoGrid>

				<TableBookCopies
					title='낱권별 대출 현황'
					data={data?.data ?? []}
					rowCount={data?.totalRecords ?? 0}
					isFetching={isFetching}
					tableState={tableState}
					initialState={{
						columnVisibility: toColumnVisibility(
							columns,
							isAdmin ? ADMIN_COLUMNS : MEMBER_COLUMNS,
						),
					}}
				/>
			</div>
		</Modal>
	);
};

export default ModalInfoBookCopies;
