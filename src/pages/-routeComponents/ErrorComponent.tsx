import { Typography } from '@mui/material';
import type { ErrorComponentProps } from '@tanstack/react-router';

const ErrorComponent = ({ error }: ErrorComponentProps) => (
	<div className='flex h-screen flex-col items-center justify-center gap-4'>
		<Typography variant='h5'>오류가 발생했습니다.</Typography>
		<Typography color='text.secondary'>
			{error instanceof Error ? error.message : String(error)}
		</Typography>
	</div>
);

export default ErrorComponent;
