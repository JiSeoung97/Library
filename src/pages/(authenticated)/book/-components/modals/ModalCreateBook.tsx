import FormModal from '@/components/modals/common/inputs/forms/FormModal';
import Modal, {
	type IModalBaseProps,
	type TModalConfirmHandler,
} from '@/components/ui/modals/Modal';
import { BOOK_FORM_FIELDS } from '@/pages/(authenticated)/book/-components/forms/bookFormFields';
import { schemaCreateBook, type ISchemaCreateBook } from '@/schemas/web/book/book';
import services from '@/services/services';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

// 빈 폼의 처음 값 — 저장에 성공하거나 닫으면 Modal 이 이 값으로 되돌린다
const DEFAULT_VALUES: ISchemaCreateBook = {
	title: '',
	author: '',
	category: '',
	publisher: '',
	isbn: '',
	publishedAt: '',
	totalQty: 1,
};

/**
 * 도서 등록 모달.
 *
 * 이 컴포넌트가 하는 일은 세 가지뿐이다: 폼 만들기(useForm) · 저장 요청(handleSubmit) · 칸 구성 넘기기.
 * 저장 버튼 활성 조건, "저장하시겠습니까?" 확인창, 성공 후 폼 초기화와 닫기, 변경 후 닫을 때 경고는 공통 Modal 이 한다.
 */
const ModalCreateBook = ({ open, onClose }: Omit<IModalBaseProps, 'data'>) => {
	const { bookService } = services;
	const mutation = bookService.usePostBook();

	const form = useForm<ISchemaCreateBook>({
		resolver: zodResolver(schemaCreateBook),
		// 'all' — 입력하는 즉시 검증한다. Modal 이 isValid 로 저장 버튼을 켜고 끄므로 검증 결과가 항상 최신이어야 한다
		mode: 'all',
		defaultValues: DEFAULT_VALUES,
	});

	// mutateAsync 를 await 한다 — 실패하면 예외가 Modal 로 올라가 모달을 닫지 않고 입력값을 유지한다.
	// 실패 안내(오류 다이얼로그)는 QueryProvider 의 MutationCache 가 띄운다.
	const handleSubmit: TModalConfirmHandler<ISchemaCreateBook> = async values => {
		await mutation.mutateAsync({ data: values });
	};

	return (
		<Modal<ISchemaCreateBook>
			open={open}
			title='도서 등록'
			size='small'
			variant='save'
			formProps={{ form, schema: schemaCreateBook }}
			onConfirm={handleSubmit}
			onClose={onClose}
		>
			<FormModal<ISchemaCreateBook>
				className='grid-cols-2'
				form={form}
				fields={BOOK_FORM_FIELDS}
			/>
		</Modal>
	);
};

export default ModalCreateBook;
