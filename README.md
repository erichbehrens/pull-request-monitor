# Pull Request Monitor
[![Marketplace Version](https://vsmarketplacebadge.apphb.com/version/erichbehrens.pull-request-monitor.svg)](https://marketplace.visualstudio.com/items?itemName=erichbehrens.pull-request-monitor)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/erichbehrens.pull-request-monitor.svg)](https://marketplace.visualstudio.com/items?itemName=erichbehrens.pull-request-monitor)


This extension monitors the state of your pull requests and let's you know when it's time to merge or if someone requested changes.

Source code on GitHub: https://github.com/erichbehrens/pull-request-monitor/


## Features

- Monitor all the pull requests for your account

- Monitor a specific repository

- Quickly open GitHub pull requests from VS Code

#### Missing features

- store token and settings
- detect outdated branches
- keep comments and approved reviews separate

## Requirements

You need to enter a GitHub api token generated here: https://github.com/settings/tokens

**Required permissions:**

If you only need to monitor public repositories you can enable `public_repo`, otherwise enable `repo`.


## Extension Commands

- `PullRequestMonitor.setToken`: set the GitHub token

- `PullRequestMonitor.start`: start monitoring

- `PullRequestMonitor.stop`: stop monitoring

- `PullRequestMonitor.refresh`: refresh pull request state

- `PullRequestMonitor.setMode`: selects the mode `viewer` (your pull requests) or `repository`

- `PullRequestMonitor.selectRepository`: select the repository to monitor through the list of your repositories (some private repositories will not appear here, in this case use `PullRequestMonitor.setRepository` )

- `PullRequestMonitor.setRepository`: set the private repository name you want to monitor. Something like `your-team-nam/awesome-project`

## Known Issues

The extension is still under development, please report any bugs here: https://github.com/erichbehrens/pull-request-monitor/issues


## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release



