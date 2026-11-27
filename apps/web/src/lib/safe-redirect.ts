/**
 * Only same-site paths are allowed as a post-login destination, so a crafted
 * `?next=https://evil.example` link can't bounce users off the site.
 */
export function safeRedirectPath(next: unknown, fallback = '/app') {
	if (typeof next !== 'string') return fallback
	if (!next.startsWith('/') || next.startsWith('//')) return fallback
	if (next.includes('\\')) return fallback
	return next
}
