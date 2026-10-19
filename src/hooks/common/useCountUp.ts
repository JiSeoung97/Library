import { useEffect, useRef, useState } from 'react';

const DURATION_MS = 600;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * 숫자가 바뀌면 직전에 보이던 값에서 새 값까지 부드럽게 올라가거나 내려간다.
 * OS 의 '동작 줄이기' 설정이 켜져 있으면 애니메이션 없이 바로 새 값을 보여준다.
 */
const useCountUp = (target: number, duration = DURATION_MS) => {
	const [display, setDisplay] = useState(0);
	const currentRef = useRef(0);

	useEffect(() => {
		const from = currentRef.current;
		const total = prefersReducedMotion() ? 0 : duration;
		let startedAt: number | null = null;
		let frameId = 0;

		const step = (now: number) => {
			startedAt ??= now;
			const progress = total === 0 ? 1 : Math.min((now - startedAt) / total, 1);
			const next = Math.round(from + (target - from) * easeOutCubic(progress));

			currentRef.current = next;
			setDisplay(next);
			if (progress < 1) frameId = requestAnimationFrame(step);
		};

		frameId = requestAnimationFrame(step);

		return () => cancelAnimationFrame(frameId);
	}, [target, duration]);

	return display;
};

export default useCountUp;
