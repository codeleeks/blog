/** @type {import('jest').Config} */
const config = {
  transformIgnorePatterns: [
    '/\\.pnp\\.[^\\/]+$',
    '/node_modules/(?!(github-slugger)/)',
  ],
}

module.exports = config
