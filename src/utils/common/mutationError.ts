import { confirm } from '@/utils/common/confirm';

// 뮤테이션 실패 공용 안내 — 화면마다 Alert 를 두지 않고 오류 다이얼로그 하나로 띄운다 (mes_FE 동일)
export const notifyMutationError = (error: Error) =>
	void confirm({ variant: 'error', message: error.message, labels: { close: '확인' } });

// 조회 실패 다이얼로그가 이미 떠 있는지 — 한 화면의 여러 조회(예: 대시보드 요약 · 목록)가 함께 실패해도 하나만 띄운다
let isQueryErrorOpen = false;

/**
 * 조회 실패 공용 안내 — 처리하지 않으면 실패한 목록이 빈 표("데이터가 없습니다")로 보여
 * "데이터가 없다"와 "불러오지 못했다"를 구분할 수 없다. 저장 실패와 같은 오류 다이얼로그로 알린다.
 */
export const notifyQueryError = async (error: Error) => {
	if (isQueryErrorOpen) return;
	isQueryErrorOpen = true;
	try {
		await confirm({
			variant: 'error',
			message: `데이터를 불러오지 못했습니다.\n${error.message}`,
			labels: { close: '확인' },
		});
	} finally {
		isQueryErrorOpen = false;
	}
};
