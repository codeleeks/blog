const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const { EnvironmentPlugin } = require('webpack')

module.exports = merge(common, {
  mode: 'production',
  devtool: 'hidden-source-map',
  plugins: [
    new EnvironmentPlugin(['VITE_GITHUB_ACCESS_TOKEN', 'BLOG_BASE_URL']),
  ],
})
