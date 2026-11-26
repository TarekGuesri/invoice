import { ArchitectureOverview } from '@/features/landing/components/ArchitectureOverview'
import { FeatureList } from '@/features/landing/components/FeatureList'
import { Hero } from '@/features/landing/components/Hero'
import { SiteFooter } from '@/features/landing/components/SiteFooter'
import { SiteHeader } from '@/features/landing/components/SiteHeader'

export default function HomePage() {
	return (
		<>
			<SiteHeader />
			<main>
				<Hero />
				<FeatureList />
				<ArchitectureOverview />
			</main>
			<SiteFooter />
		</>
	)
}
