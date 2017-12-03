// import {window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument} from 'vscode';
const vscode = require('vscode');
const { clearTimeout, setTimeout } = require('timers');
const { getCommitIcon, getColor, getMergeableIcon, getMergeableState, getPullRequestStateIcon } = require('./utils');
const { loadPullRequests, loadRepositories } = require('./requests');

const MODES = {
	VIEWER: 'viewer',
	REPOSITORY: 'repository',
}
exports.MODES = MODES;
let statusBarItems;

// config
let mode = MODES.VIEWER;
let token;
let timer;
let currentRepository;
let showMerged = false;
let showClosed = false;
let refreshInterval = 60000;

function createStatusBarItem(context, prId, url) {
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	context.subscriptions.push(statusBarItem);
	const disposable = vscode.commands.registerCommand(`PullRequestMonitor.openPullRequest.${prId}`, () => {
		vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
	});
	context.subscriptions.push(disposable);
	statusBarItems[prId] = statusBarItem;
};

async function getPullRequests(context) {
	try {
		const pullRequests = await loadPullRequests(token, { mode, showMerged, showClosed, repository: currentRepository })
		pullRequests.forEach((pr) => {
			const prId = `${pr.repository.name}${pr.number}`;
			if (!statusBarItems) {
				statusBarItems = {};
			}
			if (!statusBarItems[prId]) {
				createStatusBarItem(context, prId, pr.url);
			}
			const reviewsCount = pr.reviews.edges.length;
			const reviewsApproved = reviewsCount === 0 || (pr.reviews.edges.every(({ node }) => ['APPROVED', 'COMMENTED'].includes(node.state)));
			const mergeableState = getMergeableState(pr, reviewsApproved, pr.commits.nodes[0].commit.status, pr.potentialMergeCommit);
			const closed = mergeableState === 'CLOSED';
			const statusBarItem = statusBarItems[prId];
			const text = [
				getPullRequestStateIcon(pr.state),
				pr.number,
				!pr.merged && !closed && getCommitIcon(pr.commits.nodes[0].commit.status),
				!pr.merged && !closed && getMergeableIcon(pr.mergeable),
				!closed && reviewsCount > 0 && (reviewsApproved ? '$(thumbsup)' : '$(thumbsdown)'),
				!closed && pr.potentialCommit && pr.potentialCommit.status,
				!closed && pr.potentialCommit && pr.potentialCommit.status && pr.potentialCommit.status.state,
			]
			statusBarItem.text = text.filter(item => item).join(' ');
			statusBarItem.color = getColor(mergeableState);
			statusBarItem.command = `PullRequestMonitor.openPullRequest.${prId}`;
			statusBarItem.tooltip = pr.title;
			statusBarItem.prominentBackground = true;
			statusBarItem.show();
		});
	} catch (e) {
		console.log(e)
		vscode.window.showErrorMessage('Pull Request Monitor error rendering');
	}
	timer = setTimeout(() => getPullRequests(context), refreshInterval)
}

function resetPullRequests(context) {
	statusBarItems && Object.keys(statusBarItems).forEach(item => statusBarItems[item].hide());
	clearTimeout(timer);
	getPullRequests(context);
}

function activate(context) {
	console.log('PullRequestMonitor activated');
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	statusBarItem.command = 'PullRequestMonitor.refresh';
	statusBarItem.text = '$(sync)';
	statusBarItem.tooltip = 'Refresh Pull Request Monitor';
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);

	let disposable = vscode.commands.registerCommand('PullRequestMonitor.start', function () {
		getPullRequests(context);
		vscode.window.showInformationMessage('Pull Request Monitor started!');
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('PullRequestMonitor.stop', function () {
		clearTimeout(timer);
		vscode.window.showInformationMessage('Pull Request Monitor stopped!');
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('PullRequestMonitor.refresh', function () {
		clearTimeout(timer);
		getPullRequests(context);
		vscode.window.showInformationMessage('Pull Request Monitor refreshing');
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('PullRequestMonitor.setMode', function () {
		vscode.window.showQuickPick([MODES.REPOSITORY, MODES.VIEWER], { placeHolder: 'Please select the mode' }).then(selectedMode => {
			if (selectedMode && mode !== selectedMode) {
				if (selectedMode === MODES.REPOSITORY && !currentRepository) {
					vscode.commands.executeCommand('PullRequestMonitor.selectRepository');
					return;
				}
				mode = selectedMode;
				resetPullRequests(context)
			}
		});

	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('PullRequestMonitor.selectRepository', async () => {
		const repositories = await loadRepositories(token);
		const repositoryNames = repositories.map(repository => repository.nameWithOwner);

		vscode.window.showQuickPick(repositoryNames, { placeHolder: 'Please select the repository' }).then(selectedRepository => {
			if (selectedRepository && (!currentRepository || currentRepository.nameWithOwner !== selectedRepository)) {
				currentRepository = {
					nameWithOwner: selectedRepository,
					owner: selectedRepository.split('/')[0],
					name: selectedRepository.split('/')[1],
				}
				mode = MODES.REPOSITORY;
				resetPullRequests(context);
			}
		});

	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('PullRequestMonitor.setRepository', async () => {
		vscode.window.showInputBox({ placeHolder: 'Please enter the full repository name, ie: your-team/awesome-project' }).then(selectedRepository => {
			if (selectedRepository && (!currentRepository || currentRepository.nameWithOwner !== selectedRepository)) {
				if (selectedRepository.indexOf('/') === -1) {
					vscode.window.showErrorMessage('Enter a valid repository name, ie: your-team/awesome-project');
					return;
				}
				currentRepository = {
					nameWithOwner: selectedRepository,
					owner: selectedRepository.split('/')[0],
					name: selectedRepository.split('/')[1],
				}
				mode = MODES.REPOSITORY;
				resetPullRequests(context);
			}
		});

	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('PullRequestMonitor.setToken', function () {

		vscode.window.showInputBox({ placeHolder: 'Please enter your GitHGub token' }).then(newToken => {
			if (newToken && mode !== newToken) {
				token = newToken;
				resetPullRequests(context);
				vscode.window.showInformationMessage(`Token saved for current session.`);
			}
		});

	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {
	// todo
}
exports.deactivate = deactivate;
