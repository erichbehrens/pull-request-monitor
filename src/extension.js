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

async function getPullRequests(context) {
	try {
		const mode = context.globalState.get('mode', MODES.VIEWER);
		const repository = context.globalState.get('currentRepository');
		const showMerged = context.globalState.get('showMerged', false);
		const showClosed = context.globalState.get('showClosed', false);
		const pullRequests = await loadPullRequests(context.globalState.get('token'), { mode, showMerged, showClosed, repository });
		pullRequests.forEach((pr) => {
			const prId = `${pr.repository.name}${pr.number}`;
			if (!statusBarItems) {
				statusBarItems = {};
			}
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
	// users store intervals in seconds
	// we convert it to ms and prevent them to set a value lower than 15s
	const refreshInterval = Math.max(context.globalState.get('refreshInterval', 60) * 1000, 15000);
	timer = setTimeout(() => getPullRequests(context), refreshInterval);
}

function resetPullRequests(context) {
	if (statusBarItems) {
		Object.keys(statusBarItems).forEach(item => statusBarItems[item].hide());
	}
	clearTimeout(timer);
	getPullRequests(context);
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
		resetPullRequests(context);
	}
}

function activate(context) {
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	statusBarItem.command = 'PullRequestMonitor.refresh';
	statusBarItem.text = '$(sync)';
	statusBarItem.tooltip = 'Refresh Pull Request Monitor';
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);

	let disposable = vscode.commands.registerCommand('PullRequestMonitor.start', () => {
		getPullRequests(context);
		vscode.window.showInformationMessage('Pull Request Monitor started!');
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('PullRequestMonitor.stop', () => {
		clearTimeout(timer);
		vscode.window.showInformationMessage('Pull Request Monitor stopped!');
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('PullRequestMonitor.refresh', () => {
		clearTimeout(timer);
		getPullRequests(context);
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
			resetPullRequests(context);
		}
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('PullRequestMonitor.selectRepository', async () => {
		const repositories = await loadRepositories(context.globalState.get('token'));
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
			resetPullRequests(context);
			vscode.window.showInformationMessage('Token saved.');
		}
	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {
	// todo
}
exports.deactivate = deactivate;
