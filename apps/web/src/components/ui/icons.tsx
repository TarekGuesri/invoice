import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps) {
	return (
		<svg
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth={1.75}
			strokeLinecap='round'
			strokeLinejoin='round'
			aria-hidden
			{...props}
		>
			{children}
		</svg>
	)
}

export function GitHubIcon(props: IconProps) {
	return (
		<svg viewBox='0 0 24 24' fill='currentColor' aria-hidden {...props}>
			<path d='M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z' />
		</svg>
	)
}

export function SparklesIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<path d='M9.5 3 11 7.5 15.5 9 11 10.5 9.5 15 8 10.5 3.5 9 8 7.5Z' />
			<path d='M18 13.5 18.9 16.1 21.5 17 18.9 17.9 18 20.5 17.1 17.9 14.5 17 17.1 16.1Z' />
		</Icon>
	)
}

export function ActivityIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<path d='M3 12h4l3-8 4 16 3-8h4' />
		</Icon>
	)
}

export function TableIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<rect x='3' y='4' width='18' height='16' rx='2' />
			<path d='M3 10h18M3 15h18M9 4v16' />
		</Icon>
	)
}

export function ArrowRightIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<path d='M5 12h14M13 6l6 6-6 6' />
		</Icon>
	)
}
