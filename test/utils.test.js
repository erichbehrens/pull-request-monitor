const assert = require('assert');
const { getReviewState, getReviewsByAuthor, getLastStateByAuthor } = require('../src/utils');

suite('Utils Tests', () => {
	const TEST_REVIEWS = [
		{ node: { author: { login: 'alice' }, state: 'COMMENTED' } },
		{ node: { author: { login: 'jane' }, state: 'COMMENTED' } },
		{ node: { author: { login: 'john' }, state: 'APPROVED' } },
		{ node: { author: { login: 'jane' }, state: 'APPROVED' } },
		{ node: { author: { login: 'marc' }, state: 'CHANGES_REQUESTED' } },
	];

	test('getReviewsByAuthor', () => {
		const expected = {
			alice: [
				{ author: { login: 'alice' }, state: 'COMMENTED' },
			],
			john: [
				{ author: { login: 'john' }, state: 'APPROVED' },
			],
			jane: [
				{ author: { login: 'jane' }, state: 'COMMENTED' },
				{ author: { login: 'jane' }, state: 'APPROVED' },
			],
			marc: [
				{ author: { login: 'marc' }, state: 'CHANGES_REQUESTED' },
			],
		};
		const actual = getReviewsByAuthor(TEST_REVIEWS);
		assert.deepEqual(actual, expected);
	});

	test('getLastStateByAuthor', () => {
		const expected = ['APPROVED', 'APPROVED', 'CHANGES_REQUESTED'];
		const reviewsByAuthor = getReviewsByAuthor(TEST_REVIEWS);
		const actual = getLastStateByAuthor(reviewsByAuthor);
		assert.deepEqual(actual, expected);
	});

	test('getReviewState - without reviews', () => {
		const reviews = [];
		const expected = {
			hasComments: false,
			isApproved: undefined,
			hasPendingChangeRequests: undefined,
			reviewsPassing: true,
		};
		const actual = getReviewState({ edges: reviews });
		assert.deepEqual(actual, expected);
	});
	test('getReviewState - with changes requested', () => {
		const expected = {
			hasComments: true,
			isApproved: false,
			hasPendingChangeRequests: true,
			reviewsPassing: false,
		};
		const actual = getReviewState({ edges: TEST_REVIEWS });
		assert.deepEqual(actual, expected);
	});

	test('getReviewState - approved', () => {
		const reviews = [
			{ node: { author: { login: 'alice' }, state: 'COMMENTED' } },
			{ node: { author: { login: 'jane' }, state: 'COMMENTED' } },
			{ node: { author: { login: 'john' }, state: 'APPROVED' } },
			{ node: { author: { login: 'jane' }, state: 'APPROVED' } },
			{ node: { author: { login: 'marc' }, state: 'CHANGES_REQUESTED' } },
			{ node: { author: { login: 'marc' }, state: 'APPROVED' } },
		];
		const expected = {
			hasComments: true,
			isApproved: true,
			hasPendingChangeRequests: false,
			reviewsPassing: true,
		};
		const actual = getReviewState({ edges: reviews });
		assert.deepEqual(actual, expected);
	});

	test('getReviewState - without comments', () => {
		const reviews = [
			{ node: { author: { login: 'john' }, state: 'APPROVED' } },
			{ node: { author: { login: 'jane' }, state: 'APPROVED' } },
			{ node: { author: { login: 'marc' }, state: 'CHANGES_REQUESTED' } },
			{ node: { author: { login: 'marc' }, state: 'APPROVED' } },
		];
		const expected = {
			hasComments: false,
			isApproved: true,
			hasPendingChangeRequests: false,
			reviewsPassing: true,
		};
		const actual = getReviewState({ edges: reviews });
		assert.deepEqual(actual, expected);
	});

	test('getReviewState - with comments only', () => {
		const reviews = [
			{ node: { author: { login: 'john' }, state: 'COMMENTED' } },
			{ node: { author: { login: 'jane' }, state: 'COMMENTED' } },
			{ node: { author: { login: 'marc' }, state: 'COMMENTED' } },
			{ node: { author: { login: 'marc' }, state: 'COMMENTED' } },
		];
		const expected = {
			hasComments: true,
			isApproved: undefined,
			hasPendingChangeRequests: undefined,
			reviewsPassing: true,
		};
		const actual = getReviewState({ edges: reviews });
		assert.deepEqual(actual, expected);
	});
});

