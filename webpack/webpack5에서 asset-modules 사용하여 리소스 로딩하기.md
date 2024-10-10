## webpack5의 업데이트

webpack은 버전 5로 넘어오면서 url-loader, file-loader, raw-loader의 기능을 내장했다.

asset-modules가 그 역할을 담당한다.
asset-modules를 사용하면 해당 로더들을 추가로 설치할 필요가 없어진다.

https://webpack.js.org/guides/asset-modules/

## asset-modules 사용법 - 이미지 로딩하기(asset/resource)

- url-loader를 사용하여 이미지 로딩하기
```js
{
  module: {
  strictExportPresence: true,
  rules: [
    {
    test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
    loader: require.resolve(‘url-loader’),
    options: {
      limit: 10000,
      name: ‘static/media/[name].[hash:8].[ext]’,
    }
  ]
}
```


- asset/resource를 사용하여 이미지 로딩하기

```js
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { runtime } = require('webpack')

module.exports = {
  mode: 'development',
  entry: './src/index.jsx',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    assetModuleFilename: '[name][ext]',
  },
  module: {
    rules: [
      {
        test: /\.png/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
}
```

asset/resource를 사용하면 이미지 파일 이름이 디폴트로 해시.확장자 형태로 만들어진다.
`assetModuleFilename`로 이를 설정할 수 있다.

js에서 이미지 파일을 사용할 때에는 import로 이미지 파일을 가져온다.
그러면 번들링 이후에 이미지를 가져올 변환된 경로를 반환한다.(예를 들어, localhost:3000/이미지.png)
이 경로를 img의 src에 넣어주면 된다.

```js
import AvatarImg from './assets/avatar.png'

const Prologue = () => {
  console.log(AvatarImg) //http://localhost:3000/avatar.png
  return (
      <img src={AvatarImg} alt='avatar' />
  )
}
```
