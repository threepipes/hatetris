const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path');

const miniCssExtractPlugin = new MiniCssExtractPlugin({
  filename: 'bundle.css'
})

module.exports = {
  mode: 'development',
  plugins: [
    miniCssExtractPlugin
  ],
  module: {
    rules: [{
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader'
      }
    }, {
      test: /\.(ico|html)$/,
      use: {
        loader: 'file-loader',
        options: {
          name: '[name].[ext]'
        }
      }
    }, {
      test: /\.css$/,
      use: [{
        loader: MiniCssExtractPlugin.loader
      }, 'css-loader']
    }]
  },
  target: 'node',
  devServer: {
    contentBase: path.resolve(__dirname, 'dist'),
    port: 3000,
  },
  output: {
    filename: 'bundle.js',
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM'
  }
}
