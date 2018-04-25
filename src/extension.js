const vscode = require('vscode'); // eslint-disable-line import/no-unresolved
const { clearTimeout, setTimeout } = require('timers');
const { getCommitIcon, getColor, getMergeableIcon, getMergeableState, getPullRequestStateIcon, getReviewState } = require('./utils');
const { loadPullRequests, loadRepositories } = require('./requests');

const MODES = {
	VIEWER: 'viewer',
	REPOSITORY: 'repository',
};

let statusBarItems;

let timer;

function createStatusBarItem(context, prId, url) {
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	context.subscriptions.push(statusBarItem);
	const disposable = vscode.commands.registerCommand(`PullRequestMonitor.openPullRequest.${prId}`, () => {
		vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
	});
	context.subscriptions.push(disposable);
	statusBarItems[prId] = statusBarItem;
}

let pullRequests = [];
let refreshButton;
let noResultsLabel;

async function getPullRequests(context, showError) {
	clearTimeout(timer);
	let overrideRefreshInterval;
	try {
		const mode = context.globalState.get('mode', MODES.VIEWER);
		const repository = context.globalState.get('currentRepository');
		const showMerged = vscode.workspace.getConfiguration('pullRequestMonitor').get('showMerged');
		const showClosed = vscode.workspace.getConfiguration('pullRequestMonitor').get('showClosed');
		const count = vscode.workspace.getConfiguration('pullRequestMonitor').get('count');
		const updatedPullRequests = await loadPullRequests(context.globalState.get('token'), { mode, showMerged, showClosed, repository, showError, count });
		if (updatedPullRequests.code === 401) {
			refreshButton.command = 'PullRequestMonitor.setToken';
			refreshButton.text = '$(key)';
			refreshButton.tooltip = 'Set GitHub token for Pull Request Monitor';
			return;
		} else if (updatedPullRequests.status === 'error') {
			refreshButton.command = 'PullRequestMonitor.refresh.showError';
			refreshButton.text = '$(zap)';
			refreshButton.tooltip = 'Connect Pull Request Monitor';
			overrideRefreshInterval = 15;
		} else {
			refreshButton.command = 'PullRequestMonitor.refresh';
			refreshButton.text = '$(sync)';
			refreshButton.tooltip = 'Refresh Pull Request Monitor';
			pullRequests = updatedPullRequests.data;
		}
		if (!statusBarItems) {
			statusBarItems = {};
		} else {
			const prIds = pullRequests.map(pr => `${pr.repository.name}${pr.number}`);
			Object.keys(statusBarItems)
				.forEach(item => !prIds.includes(item) && statusBarItems[item].hide());
		}
		if (pullRequests.length === 0) {
			noResultsLabel.show();
		} else {
			noResultsLabel.hide();
		}
		pullRequests.forEach((pr) => {
			const prId = `${pr.repository.name}${pr.number}`;
			if (!statusBarItems[prId]) {
				createStatusBarItem(context, prId, pr.url);
			}
			const {
				reviewsPassing,
				hasComments,
				hasPendingChangeRequests,
				isApproved,
			} = getReviewState(pr.reviews);
			const mergeableState = getMergeableState(pr, reviewsPassing);
			const closed = mergeableState === 'CLOSED';

			const statusBarItem = statusBarItems[prId];
			const text = [
				getPullRequestStateIcon(pr.state),
				pr.number,
				!pr.merged && !closed && getCommitIcon(pr.commits.nodes[0].commit.status),
				!pr.merged && !closed && getMergeableIcon(pr.mergeable),
				hasComments && '$(comment)',
				hasPendingChangeRequests && '$(thumbsdown)',
				isApproved && '$(thumbsup)',
			];
			statusBarItem.text = text.filter(item => item).join(' ');
			statusBarItem.color = getColor(mergeableState);
			statusBarItem.command = `PullRequestMonitor.openPullRequest.${prId}`;
			statusBarItem.tooltip = pr.title;
			statusBarItem.prominentBackground = true;
			statusBarItem.show();
		});
	} catch (e) {
		console.error(e); // eslint-disable-line no-console
		vscode.window.showErrorMessage('Pull Request Monitor error rendering');
	}
	// we store the interval in seconds and prevent the users to set a value lower than 15s
	const userRefreshInterval = overrideRefreshInterval || Number.parseInt(vscode.workspace.getConfiguration('pullRequestMonitor').get('refreshInterval'), 10);
	const refreshInterval = userRefreshInterval >= 15 ? userRefreshInterval : 60;
	if (!refreshInterval) return;
	timer = setTimeout(() => getPullRequests(context), refreshInterval * 1000);
}

function setRepository(context, nameWithOwner) {
	const currentRepository = context.globalState.get('currentRepository');
	if (nameWithOwner && (!currentRepository || currentRepository.nameWithOwner !== nameWithOwner)) {
		context.globalState.update('currentRepository', {
			nameWithOwner,
			owner: nameWithOwner.split('/')[0],
			name: nameWithOwner.split('/')[1],
		});
		context.globalState.update('mode', MODES.REPOSITORY);
		getPullRequests(context);
	}
}

function activate(context) {
	noResultsLabel = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	noResultsLabel.command = 'PullRequestMonitor.selectRepository';
	noResultsLabel.text = 'No PRs';
	noResultsLabel.tooltip = 'Select another repository';
	context.subscriptions.push(noResultsLabel);

	refreshButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	refreshButton.command = 'PullRequestMonitor.refresh';
	refreshButton.text = '$(sync)';
	refreshButton.tooltip = 'Refresh Pull Request Monitor';
	refreshButton.show();
	context.subscriptions.push(refreshButton);

	let disposable = vscode.commands.registerCommand('PullRequestMonitor.start', (options = {}) => {
		const { silent } = options;
		getPullRequests(context);
		if (!silent) vscode.window.showInformationMessage('Pull Request Monitor started!');
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('PullRequestMonitor.stop', () => {
		clearTimeout(timer);
		vscode.window.showInformationMessage('Pull Request Monitor stopped!');
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('PullRequestMonitor.refresh', () => {
		getPullRequests(context);
		vscode.window.showInformationMessage('Pull Request Monitor refreshing');
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('PullRequestMonitor.refresh.showError', () => {
		getPullRequests(context, true);
		vscode.window.showInformationMessage('Pull Request Monitor refreshing');
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('PullRequestMonitor.setMode', async () => {
		const selectedMode = await vscode.window.showQuickPick([MODES.REPOSITORY, MODES.VIEWER], { placeHolder: 'Please select the mode' });
		if (selectedMode && context.globalState.get('mode') !== selectedMode) {
			if (selectedMode === MODES.REPOSITORY && !context.globalState.get('currentRepository')) {
				vscode.commands.executeCommand('PullRequestMonitor.selectRepository');
				return;
			}
			context.globalState.update('mode', selectedMode);
			getPullRequests(context);
		}
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('PullRequestMonitor.selectRepository', async () => {
		const { data: repositories } = await loadRepositories(context.globalState.get('token'));
		if (!repositories) {
			return;
		}
		const repositoryNames = repositories.map(repository => repository.nameWithOwner);
		const selectedRepository = await vscode.window.showQuickPick(repositoryNames, { placeHolder: 'Please select the repository' });
		setRepository(context, selectedRepository);
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('PullRequestMonitor.enterRepositoryName', async () => {
		const selectedRepository = await vscode.window.showInputBox({ placeHolder: 'Please enter the full repository name, ie: your-team/awesome-project' });
		setRepository(context, selectedRepository);
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('PullRequestMonitor.setToken', async () => {
		const token = await vscode.window.showInputBox({ placeHolder: 'Please enter your GitHGub token' });
		if (token) {
			context.globalState.update('token', token);
			getPullRequests(context);
			vscode.window.showInformationMessage('Token saved.');
		}
	});

	context.subscriptions.push(disposable);

	if (vscode.workspace.getConfiguration('pullRequestMonitor').get('autostart') && context.globalState.get('token')) {
		vscode.commands.executeCommand('PullRequestMonitor.start', { silent: true });
	}
}
exports.activate = activate;

function deactivate() {
	// todo
}
exports.deactivate = deactivate;
