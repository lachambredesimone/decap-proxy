type OAuthConfig = {
	id: string;
	secret: string;
	target: {
		tokenHost: string;
		tokenPath: string;
		authorizePath: string;
	};
};

export class OAuthClient {
	private clientConfig: OAuthConfig;

	constructor(config: OAuthConfig) {
		this.clientConfig = config;
	}

	authorizeURL(options: { redirect_uri: string; scope: string; state: string }) {
		const { clientConfig } = this;
		const { tokenHost, authorizePath } = clientConfig.target;
		const authorizationUrl = new URL(authorizePath, tokenHost);

		authorizationUrl.searchParams.set('response_type', 'code');
		authorizationUrl.searchParams.set('client_id', clientConfig.id);
		authorizationUrl.searchParams.set('redirect_uri', options.redirect_uri);
		authorizationUrl.searchParams.set('scope', options.scope);
		authorizationUrl.searchParams.set('state', options.state);

		return authorizationUrl.toString();
	}

	async getToken(options: { code: string; redirect_uri: string }) {
		const { clientConfig } = this;
		const { tokenHost, tokenPath } = clientConfig.target;
		const { code, redirect_uri } = options;

		const response = await fetch(`${tokenHost}${tokenPath}`, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				client_id: clientConfig.id,
				client_secret: clientConfig.secret,
				code,
				redirect_uri,
				grant_type: 'authorization_code',
			}),
		});
		if (!response.ok) {
			throw new Error(`GitHub token exchange failed: ${response.status}`);
		}
		const json = (await response.json()) as { access_token: string };
		if (!json.access_token) {
			throw new Error('GitHub token response did not include an access token');
		}
		return json.access_token;
	}
}
