// test/index.spec.ts
import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { OAuthClient } from '../src/oauth';

describe('GET /', () => {
	it('responds with no-op (Hello)', async () => {
		const response = await SELF.fetch('https://example.com');
		expect(await response.text()).toBe('Hello 👋');
	});
});

describe('GET /auth', () => {
	it('rejects an unsupported provider', async () => {
		const response = await SELF.fetch('https://example.com/auth?provider=other');
		expect(response.status).toBe(400);
	});

	it('returns a clear error when OAuth credentials are missing', async () => {
		const response = await SELF.fetch('https://example.com/auth?provider=github');
		expect(response.status).toBe(500);
		expect(await response.text()).toBe('GitHub OAuth credentials are not configured');
	});
});

describe('GET /callback', () => {
	it('returns a clear error when OAuth credentials are missing', async () => {
		const response = await SELF.fetch(
			'https://example.com/callback?code=some-authorization-code'
		);
		expect(response.status).toBe(500);
		expect(await response.text()).toBe('GitHub OAuth credentials are not configured');
	});
});

describe('OAuthClient.authorizeURL', () => {
	it('encodes the redirect URI as a single query parameter', () => {
		const oauth = new OAuthClient({
			id: 'test-client-id',
			secret: 'test-client-secret',
			target: {
				tokenHost: 'https://github.com',
				tokenPath: '/login/oauth/access_token',
				authorizePath: '/login/oauth/authorize',
			},
		});

		const authorizationUrl = new URL(
			oauth.authorizeURL({
				redirect_uri: 'https://example.com/callback',
				scope: 'public_repo,user',
				state: '12345678',
			})
		);

		expect(authorizationUrl.origin).toBe('https://github.com');
		expect(authorizationUrl.pathname).toBe('/login/oauth/authorize');
		expect(authorizationUrl.searchParams.get('client_id')).toBe('test-client-id');
		expect(authorizationUrl.searchParams.get('redirect_uri')).toBe(
			'https://example.com/callback'
		);
		expect(authorizationUrl.searchParams.get('scope')).toBe('public_repo,user');
		expect(authorizationUrl.searchParams.get('state')).toBe('12345678');
	});
});
