import FormModal from '@/components/modals/common/inputs/forms/FormModal';
import Modal, {
	type IModalBaseProps,
	type TModalConfirmHandler,
} from '@/components/ui/modals/Modal';
import { BOOK_FORM_FIELDS } from '@/pages/(authenticated)/book/-components/forms/bookFormFields';
import { schemaUpdateBook, type ISchemaUpdateBook } from '@/schemas/web/book/book';
import services from '@/services/services';
import type { IBook } from '@/types/book/book';
import { toLocalDate } from '@/utils/common/date';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

/**
 * 도서 수정 모달 — `data` 로 받은 도서를 폼에 채워 보여 주고, 바꾼 값만 서버로 보낸다.
 * 부모는 수정할 도서가 있을 때만 이 모달을 마운트한다(열 때마다 그 도서 값으로 폼이 새로 만들어진다).
 */
const ModalUpdateBook = ({ open, data, onClose }: IModalBaseProps<IBook>) => {
	const { bookService } = services;
	const mutation = bookService.usePutBook();

	const form = useForm<ISchemaUpdateBook>({
		resolver: zodResolver(schemaUpdateBook),
		mode: 'all',
		// values — 서버 데이터를 폼에 채운다. 이 값이 "바뀌었는지(dirty)"를 판단하는 기준이 된다
		values: {
			title: data.title,
			author: data.author,
			category: data.category,
			publisher: data.publisher,
			isbn: data.isbn,
			publishedAt: toLocalDate(data.publishedAt), // ISO 문자열 → 현지 날짜(YYYY-MM-DD)
			totalQty: data.totalQty,
		},
	});

	// 바꾼 값(dirtiedValues)만 보낸다 — 어느 도서인지(bookId)는 항상 함께 넣는다.
	// 권수를 줄일 수 있는지(대출 중인 낱권 수 미만 불가) 같은 규칙은 서버가 검사한다.
	const handleSubmit: TModalConfirmHandler<ISchemaUpdateBook> = async (
		_values,
		dirtiedValues,
	) => {
		await mutation.mutateAsync({ data: { ...dirtiedValues, bookId: data.bookId } });
	};

	return (
		<Modal<ISchemaUpdateBook>
			open={open}
			title='도서 수정'
			size='small'
			variant='save'
			formProps={{ form, schema: schemaUpdateBook }}
			onConfirm={handleSubmit}
			onClose={onClose}
		>
			<FormModal<ISchemaUpdateBook>
				className='grid-cols-2'
				form={form}
				fields={BOOK_FORM_FIELDS}
			/>
		</Modal>
	);
};

export default ModalUpdateBook;
