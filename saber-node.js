const fetch = require('node-fetch')

exports.onCreatePages = async function() {
  const [recentRepos, pinnedRepos] = await Promise.all([
    getRecentRepos(),
    getPinnedRepos()
  ])
  for (const page of this.pages.values()) {
    if (page.attributes.permalink === '/') {
      this.pages.extendPageProp(page.internal.id, {
        recentRepos,
        pinnedRepos
      })
    }
  }
}

const cache = new Map()

async function getPinnedRepos() {
  if (cache.get('pinned')) return cache.get('pinned')

  const { data } = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${process.env.GH_TOKEN}`
    },
    body: JSON.stringify({
      query: `query {
      repositoryOwner(login: "egoist") {
        ... on User {
          pinnedItems(first: 6) {
            nodes {
              ... on Repository {
                name
                description
                url
                primaryLanguage {
                  name
                }
                stargazers {
                  totalCount
                }
              }
            }
          }
        }
      }
    }`
    })
  }).then(res => res.json())

  const result = data.repositoryOwner.pinnedItems.nodes

  cache.set('pinned', result)

  return result
}

async function getRecentRepos() {
  if (cache.get('recent')) return cache.get('recent')

  const { data } = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${process.env.GH_TOKEN}`
    },
    body: JSON.stringify({
      query: `query {
        repositoryOwner(login: "egoist") {
          ... on User {
            repositories(first: 6, privacy: PUBLIC, orderBy: { field: CREATED_AT, direction: DESC }) {
              nodes {
                ... on Repository {
                  name
                  description
                  url
                  primaryLanguage {
                    name
                  }
                  stargazers {
                    totalCount
                  }
                }
              }
            }
          }
        }
      }`
    })
  }).then(res => res.json())

  const result = data.repositoryOwner.repositories.nodes

  cache.set('recent', result)

  return result
}