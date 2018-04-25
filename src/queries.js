exports.viewer = `query {
  viewer {
    login
      pullRequests(last: @count @states) {
          nodes {
            repository{
              name
            }
            number
            mergeable
            state
            title
            mergedAt
            merged
            url
            potentialMergeCommit {
              status {
                state
                commit {
                  status{ state }
                }
              }
            }
            commits(last: 1){
              nodes{
                commit{
                  status{
                    state
                  }
                }
              }
            }
            reviews(first: 10) {
              edges {
                node {
                  state
                  author {
                    login
                  }
                }
              }
            }
          }
    }
  }
}`;

exports.repository = `{
  repository(owner: "@owner" name: "@name") {
    pullRequests(last: @count @states) {
      nodes {
        repository{
          name
        }
        number
        mergeable
        state
        title
        mergedAt
        merged
        url
        potentialMergeCommit {
          status {
            state
            commit {
              status{ state }
            }
          }
        }
        commits(last: 1){
          nodes{
            commit{
              status{
                state
              }
            }
          }
        }
        reviews(first: 10) {
          edges {
            node {
              state
              author {
                login
              }
            }
          }
        }
      }
    }
  }
}`;

exports.repositories = `query {
  viewer {
    login
    repositories(first: 100) {
      nodes{
        name
        nameWithOwner
        owner {
          login
        }
      }
    }
  }
}`;
