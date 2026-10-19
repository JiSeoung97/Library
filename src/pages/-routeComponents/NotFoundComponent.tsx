import { Button, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';

const NotFoundComponent = () => (
	<div className='flex h-screen flex-col items-center justify-center gap-4'>
		<Typography variant='h5'>페이지를 찾을 수 없습니다.</Typography>
		<Button component={Link} to='/' variant='contained'>
			홈으로 이동
		</Button>
	</div>
);

export default NotFoundComponent;
