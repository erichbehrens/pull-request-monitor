# GitHub Pull Request Monitor
[![Travis](https://img.shields.io/travis/erichbehrens/pull-request-monitor.svg)](https://travis-ci.org/erichbehrens/pull-request-monitor)
[![Marketplace Version](https://vsmarketplacebadge.apphb.com/version/erichbehrens.pull-request-monitor.svg)](https://marketplace.visualstudio.com/items?itemName=erichbehrens.pull-request-monitor)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/erichbehrens.pull-request-monitor.svg)](https://marketplace.visualstudio.com/items?itemName=erichbehrens.pull-request-monitor)


This extension uses the GitHub api to monitor the state of your pull requests and let you know when it's time to merge or if someone requested changes.

![Statusbar items](images/statusBarItems.png)

Source code on GitHub: https://github.com/erichbehrens/pull-request-monitor


## Features

- Monitor all the pull requests for your account

- Monitor a specific repository (and quickly switch between them)

- Quickly open GitHub pull requests from VS Code

- Colors and icons to identify pull requests that require attention

**Green**: there are no conflicts, tests are passing (if any), reviews are approved (if any requested)

**Red**: opposite of green

**White**: waiting for status

#### Missing features

- detect outdated branches

## Instructions

- Install the extension

- Generate a GitHub token here: https://github.com/settings/tokens

> **Required permissions:**
>
> If you only need to monitor public repositories enable `public_repo`, if you use private teams enable `repo`.

- Open the command palette and execute `PullRequestMonitor.setToken`

- Paste your token, the extension will start monitoring your pull requests

## Extension Commands

- `PullRequestMonitor.setToken`: set the GitHub token

- `PullRequestMonitor.start`: start monitoring = refresh pull request state every minute

- `PullRequestMonitor.stop`: stop monitoring

- `PullRequestMonitor.refresh`: refresh pull request state

- `PullRequestMonitor.setMode`: select the mode between `viewer` (your pull requests) or `repository`

- `PullRequestMonitor.selectRepository`: select the repository to monitor through the list of your repositories (some private repositories will not appear here, in this case use `PullRequestMonitor.enterRepositoryName` )

- `PullRequestMonitor.enterRepositoryName`: set the private repository name you want to monitor. Something like `your-team-nam/awesome-project`

## Extension configuration

- `pullRequestMonitor.refreshInterval`: `number` default = `60`, refresh interval in seconds (min `15`s)

- `pullRequestMonitor.showMerged`: `boolean` default = `false`, show or hide merged pull requests

- `pullRequestMonitor.showClosed` `boolean`, show or hide closed pull requests

```json
{
    "pullRequestMonitor.refreshInterval": 60,
    "pullRequestMonitor.showClosed": false,
    "pullRequestMonitor.showMerged": false,
}
```
## Known Issues

Please report any bugs here: https://github.com/erichbehrens/pull-request-monitor/issues




