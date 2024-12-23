const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const Dotenv = require('dotenv-webpack')

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval',
  devServer: {
    historyApiFallback: true,
    port: 3001,
    hot: true,
  },
  stats: {
    loggingDebug: ['sass-loader'],
  },
  plugins: [new Dotenv({ path: '.env' })],
})
