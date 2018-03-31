const assert = require('assert');
const vscode = require('vscode'); // eslint-disable-line import/no-unresolved

suite('Extension Tests', () => {
	test('should be loaded', () => {
		assert.ok(vscode.extensions.getExtension('erichbehrens.pull-request-monitor'));
	});

	test('should be active', (done) => {
		const extension = vscode.extensions.getExtension('erichbehrens.pull-request-monitor');
		assert.equal(extension.isActive, true);
		done();
	}).timeout(1000 * 15);

	const expectedCommands = [
		'PullRequestMonitor.setToken',
		'PullRequestMonitor.start',
		'PullRequestMonitor.stop',
		'PullRequestMonitor.refresh',
		'PullRequestMonitor.refresh.showError',
		'PullRequestMonitor.setMode',
		'PullRequestMonitor.selectRepository',
		'PullRequestMonitor.enterRepositoryName',
	];
	let actualCommands;
	test('should register commands', (done) => {
		vscode.commands.getCommands(true)
			.then(commands => commands.filter(command => command.startsWith('PullRequestMonitor.')))
			.then((commands) => {
				assert.equal(commands.length === expectedCommands.length, true);
				actualCommands = commands;
			})
			.then(() => done());
	});

	expectedCommands.forEach(command => test(`should register ${command}`, () => {
		assert.equal(actualCommands.includes(command), true);
	}));

	test('should register configuration', (done) => {
		const actualConfig = vscode.workspace.getConfiguration('pullRequestMonitor');
		assert.equal(actualConfig.get('showMerged'), false);
		assert.equal(actualConfig.get('showClosed'), false);
		assert.equal(actualConfig.get('refreshInterval'), 60);
		done();
	});
});
