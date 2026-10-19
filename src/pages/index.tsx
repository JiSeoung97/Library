import { HOME_PATH_BY_ROLE, LOGIN_PATH_BY_ROLE } from '@/consts/common/auth';
import { useAuthStore } from '@/stores/auth/authStore';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
	beforeLoad: () => {
		const { user } = useAuthStore.getState();
		if (!user) throw redirect({ to: LOGIN_PATH_BY_ROLE.MEMBER });
		throw redirect({ to: HOME_PATH_BY_ROLE[user.role] });
	},
});
