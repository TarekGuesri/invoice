import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import type { ReactNode } from 'react'

import './globals.css'
import { Providers } from './providers'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
})

export const metadata: Metadata = {
	title: 'Invoice — AI receipt & invoice inbox for freelancers',
	description:
		'Drop in receipts and invoices from anywhere. Invoice extracts vendor, dates, amounts and tax, flags anything uncertain for review, and exports clean data for your accountant.',
}

interface RootLayoutProps {
	children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
	return (
		<html
			lang='en'
			className={`${geistSans.variable} ${geistMono.variable}`}
		>
			<body className='min-h-dvh font-sans'>
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
