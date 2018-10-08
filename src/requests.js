const { window } = require('vscode'); // eslint-disable-line import/no-unresolved
const fetch = require('isomorphic-fetch');
const https = require('https');
const queries = require('./queries');
const { getStatesFilter } = require('./utils');

let errorCount = 0;

async function execQuery(token, query, showError, graphqlEndpoint, allowUnsafeSSL = false) {
	if (!graphqlEndpoint.startsWith('https://') && showError) {
		window.showErrorMessage('GitHub enterprise url must start with https://');
		return { status: 'error' };
	}
	if (showError) {
		errorCount = 0;
	}
	if (!token) {
		window.showWarningMessage('Pull Request Monitor needs a token');
		return { status: 'error' };
	}
	try {
		const res = await fetch(graphqlEndpoint, {
			method: 'POST',
			headers: { Authorization: `bearer ${token}` },
			body: JSON.stringify({ query }),
			agent: new https.Agent({ rejectUnauthorized: !allowUnsafeSSL }),
		});
		if (res.status === 200) {
			const { data } = await res.json();
			return { status: 'ok', data };
		}
		if (res.status === 401 || res.status === 403) {
			window.showErrorMessage('Pull Request Monitor token not authorized');
			return { status: 'error', code: 401 };
		}
		window.showErrorMessage(`Pull Request Monitor http error ${res.status}`);
		return { status: 'error', code: res.status };
	} catch (e) {
		console.error(e); // eslint-disable-line no-console
		if (!showError) {
			errorCount += 1;
		}
		if (showError || errorCount === 2) {
			window.showErrorMessage('Pull Request Monitor error fetching data');
		}
		return { status: 'error' };
	}
}

exports.loadPullRequests =
	async (token,
		{ mode, showMerged, showClosed, repository, showError, count, url, allowUnsafeSSL },
	) => {
		let query = queries[mode]
			.replace('@states', getStatesFilter(showMerged, showClosed))
			.replace('@count', count);
		if (mode === 'repository') {
			if (!repository) {
				window.showWarningMessage('Pull Request Monitor needs a repository to watch');
				return { status: 'error' };
			}
			query = query.replace('@owner', repository.owner).replace('@name', repository.name);
		}
		const { status, code, data } = await execQuery(token, query, showError, url, allowUnsafeSSL);
		const pullRequests = data && data[mode].pullRequests.nodes;
		return { status, code, data: pullRequests };
	};

exports.loadRepositories = async (token, { url, allowUnsafeSSL }) => {
	const query = queries.repositories;
	const { status, code, data } = await execQuery(token, query, true, url, allowUnsafeSSL);
	const repositories = data && data.viewer.repositories.nodes;
	return { status, code, data: repositories };
};
