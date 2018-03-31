const { window } = require('vscode'); // eslint-disable-line import/no-unresolved
const fetch = require('isomorphic-fetch');
const queries = require('./queries');
const { getStatesFilter } = require('./utils');

let errorCount = 0;

async function execQuery(token, query, showError) {
	if (showError) {
		errorCount = 0;
	}
	if (!token) {
		window.showWarningMessage('Pull Request Monitor needs a token');
		return;
	}
	try {
		const res = await fetch('https://api.github.com/graphql', {
			method: 'POST',
			headers: { Authorization: `bearer ${token}` },
			body: JSON.stringify({ query }),
		});
		if (res.status === 200) {
			const { data } = await res.json();
			return { status: 'ok', data };
		}
		if (res.status === 401 || res.status === 403) {
			window.showErrorMessage('Pull Request Monitor token not authorized');
			return { status: 'error', code: 401 };
		}
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
	async (token, { mode, showMerged, showClosed, repository, showError }) => {
		let query = queries[mode].replace('@states', getStatesFilter(showMerged, showClosed));
		if (mode === 'repository') {
			if (!repository) {
				window.showWarningMessage('Pull Request Monitor needs a repository to watch');
				return { status: 'error' };
			}
			query = query.replace('@owner', repository.owner).replace('@name', repository.name);
		}
		const { status, code, data } = await execQuery(token, query, showError);
		const pullRequests = data && data[mode].pullRequests.nodes;
		return { status, code, data: pullRequests };
	};

exports.loadRepositories = async (token) => {
	const { status, code, data } = await execQuery(token, queries.repositories);
	const repositories = data && data.viewer.repositories.nodes;
	return { status, code, data: repositories };
};
