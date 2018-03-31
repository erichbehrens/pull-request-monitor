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
		const { data } = await res.json();
		return data;
	} catch (e) {
		console.error(e); // eslint-disable-line no-console
		if (!showError) {
			errorCount += 1;
		}
		if (showError || errorCount === 2) {
			window.showErrorMessage('Pull Request Monitor error fetching data');
		}
	}
}

exports.loadPullRequests =
	async (token, { mode, showMerged, showClosed, repository, showError }) => {
		let query = queries[mode].replace('@states', getStatesFilter(showMerged, showClosed));
		if (mode === 'repository') {
			if (!repository) {
				window.showWarningMessage('Pull Request Monitor needs a repository to watch');
				return;
			}
			query = query.replace('@owner', repository.owner).replace('@name', repository.name);
		}
		const data = await execQuery(token, query, showError);
		const pullRequests = data && data[mode].pullRequests.nodes;
		return pullRequests;
	};

exports.loadRepositories = async (token) => {
	const data = await execQuery(token, queries.repositories);
	const repositories = data.viewer.repositories.nodes;
	return repositories;
};
