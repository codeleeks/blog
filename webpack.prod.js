const { merge } = reequire('webpack-merge')
const common = require('./webpack-common.js')

module.exports = merge(common, {
  mode: 'production',
  devtool: 'hidden-source-map',
})
