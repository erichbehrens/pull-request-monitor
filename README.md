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

### Colors

![color green](images/color-green.png) **Green**: there are no conflicts, build is passing (if any), reviews are approved (if any)

![color red](images/color-red.png) **Red**: opposite of green or pull request closed

![color white](images/color-white.png) **White**: waiting for status

![color violet](images/color-violet.png) **Violet**: merged

### Icons

Note: white icons can become green or red depending on the pull request state.

#### State

![icon](images/icon-state-open.png) Open

![icon](images/icon-state-merged.png) Merged

![icon](images/icon-state-closed.png) Closed

#### Build

![icon](images/icon-build-ok.png) Build passes

![icon](images/icon-build-ko.png) Build fails

#### Branch

![icon](images/icon-mergeable-ok.png) Mergeable

![icon](images/icon-mergeable-ko.png) Conflicts

![icon](images/icon-mergeable-unknown.png) Unknown mergeable state

#### Reviews

![icon](images/icon-reviews-ok.png) Approved reviews

![icon](images/icon-reviews-ko.png) Changes requested

![icon](images/icon-reviews-comments.png) There are comments

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

- `PullRequestMonitor.enterRepositoryName`: set the private repository name you want to monitor. Something like `your-team-name/awesome-project`

## Extension configuration

- `pullRequestMonitor.refreshInterval`: `number` default = `60`, refresh interval in seconds (min `15`s)

- `pullRequestMonitor.showMerged`: `boolean` default = `false`, show or hide merged pull requests

- `pullRequestMonitor.showClosed` `boolean`, show or hide closed pull requests

- `pullRequestMonitor.autostart` `boolean`, automatically start the extension

### Default configuration

```json
{
    "pullRequestMonitor.refreshInterval": 60,
    "pullRequestMonitor.showClosed": false,
    "pullRequestMonitor.showMerged": false,
    "pullRequestMonitor.autostart": true,
}
```
