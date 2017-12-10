exports.getCommitIcon = (value) => {
	// https://developer.github.com/v4/reference/enum/statusstate/
	if (!value) return undefined;
	switch (value.state) {
		case 'SUCCESS': return '$(check)';
		case 'PENDING': return '$(kebab-horizontal)';
		case 'FAILURE': return '$(tools)';
	}
};

exports.getMergeableIcon = (value) => {
	// https://developer.github.com/v4/reference/enum/statusstate/
	switch (value) {
		case 'MERGEABLE': return '$(git-merge)';
		case 'UNKNOWN': return '$(question)';
		case 'CONFLICTING': return '$(alert)';
	}
};

exports.getPullRequestStateIcon = (value) => {
	// https://developer.github.com/v4/reference/enum/pullrequeststate/
	switch (value) {
		case 'MERGED': return '$(git-merge)';
		case 'OPEN': return '$(git-pull-request)';
		case 'CLOSED': return '$(x)';
	}
};

exports.getColor = (mergeableState) => {
	switch (mergeableState) {
		case 'MERGED': return 'rgba(144, 0, 192, 1)'; // #9000c0
		case 'MERGEABLE': return 'rgba(64, 255, 16, 1)'; // #40ff10
		case 'CLOSED':
		case 'FAILURE': return 'rgba(144, 0, 0, 1)'; // #900000
		default: return 'rgba(255, 255, 255, 1)';
	}
};

exports.getMergeableState = (pr, reviews) => {
	// https://developer.github.com/v4/reference/enum/mergeablestate/
	const commit = pr.commits.nodes[0].commit.status;
	const { potentialMergeCommit } = pr;
	if (['MERGED', 'CLOSED'].includes(pr.state)) return pr.state;
	if (pr.mergeable === 'MERGEABLE' && reviews && (commit === null /* no tests defined */ || commit.state === 'SUCCESS') && potentialMergeCommit && potentialMergeCommit.status === null) return 'MERGEABLE';
	if (!reviews || commit.state === 'FAILURE' || pr.mergeable === 'CONFLICTING') return 'FAILURE';
	return 'OPEN';
};

exports.getStatesFilter = (showMerged, showClosed) => {
	if (showMerged && showClosed) {
		return ''; // no filter apllied
	}
	const states = ['OPEN'];
	if (showClosed) {
		states.push('CLOSED');
	}
	if (showMerged) {
		states.push('MERGED');
	}
	return `states: [${states.join(' ')}]`;
};

function getReviewsByAuthor(reviews) {
	return reviews.reduce((acc, { node }) => {
		acc[node.author.login] = acc[node.author.login] || [];
		acc[node.author.login].push(node);
		return acc;
	}, {});
}

function getLastStateByAuthor(reviewsByAuthor) {
	return Object.keys(reviewsByAuthor).map((author) => {
		let lastState;
		reviewsByAuthor[author].forEach(({ state }) => {
			if (['CHANGES_REQUESTED', 'APPROVED'].includes(state)) lastState = state;
		});
		return lastState;
	}).filter(item => item);
}

exports.getReviewState = (reviews) => {
	const reviewsCount = reviews.edges.length;
	let hasPendingChangeRequests;
	let isApproved;
	if (reviewsCount > 0) {
		const reviewsByAuthor = getReviewsByAuthor(reviews.edges);
		const lastStateByAuthor = getLastStateByAuthor(reviewsByAuthor);
		if (lastStateByAuthor && lastStateByAuthor.length > 0) {
			hasPendingChangeRequests = lastStateByAuthor.some(state => state === 'CHANGES_REQUESTED');
			isApproved = lastStateByAuthor.every(state => state === 'APPROVED');
		}
	}
	const hasComments = reviews.edges.some(({ node }) => node.state === 'COMMENTED');
	const reviewsPassing = reviewsCount === 0 || !hasPendingChangeRequests || isApproved;
	return {
		reviewsPassing,
		hasComments,
		hasPendingChangeRequests,
		isApproved,
	};
};

/* test exports */
exports.getReviewsByAuthor = getReviewsByAuthor;
exports.getLastStateByAuthor = getLastStateByAuthor;
