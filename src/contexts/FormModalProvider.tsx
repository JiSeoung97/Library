import { createContext, use, type SubmitEventHandler } from 'react';

/**
 * Modal 과 그 안의 폼(FormModal)이 "폼 id" 와 "제출 처리기"를 공유하는 통로 (mes_FE 와 같은 구조).
 *
 * 왜 필요한가:
 * 저장 버튼은 Modal 의 푸터에 있고, <form> 은 본문(children) 안에 있다 — 서로 부모 자식이 아니라 떨어져 있다.
 * 버튼에 `form={formId}` 를 주면 폼 밖에 있어도 그 폼을 제출할 수 있다. 그 id 를 양쪽이 알아야 해서 Context 로 넘긴다.
 * 덕분에 Enter 키와 저장 버튼이 같은 제출 경로(onSubmit)를 탄다.
 */
export interface IFormModalContext {
	/** <form id> 와 저장 버튼의 form 속성에 함께 쓰는 값 */
	formId: string;
	/** 폼 제출 처리 — 검증 · 저장 확인창 · onConfirm 호출을 Modal 이 맡는다 */
	onSubmit: SubmitEventHandler<HTMLFormElement>;
}

const FormModalContext = createContext<IFormModalContext | null>(null);

export const FormModalProvider = FormModalContext.Provider;

/** 폼이 아닌 모달(조회용)에서는 null 이다 */
export const useFormModal = () => use(FormModalContext);
