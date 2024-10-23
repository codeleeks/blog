---
summary: 프로젝트 생성 도구 없이 웹팩만으로 리액트 프로젝트를 구성해본다.
date: 2024-10-02
title-image: 'https://raw.githubusercontent.com/codeleeks/blog/codeleeks-images/react/react%20%EC%99%84%EB%B2%BD%20%EC%A0%95%EB%A6%AC/title.png'
---
## 동기

CRA나 VITE의 도움 없이 순수하게 웹팩만으로 리액트 프로젝트를 구성해보고 싶었다.
그러면 다른 프로젝트 생성 도구를 쓸 때에도 조금 더 이해하기 쉽지 않을까 하는 생각에서 였다.

## 웹팩

웹팩은 모듈 번들러이다.
자바스크립트는 다른 언어와 달리 파일 단위로 모듈화되지 않았다.
A 파일의 함수를 B 파일에서 그냥 사용할 수 있었다.
별도의 어떤 임포트나 익스포트 키워드 없이 마치 하나의 파일에 정의된 전역 함수와 변수처럼 쓸 수 있었다.

```js
// A.js
function sum(a, b) {
  return a + b
}

//B.js
const s = sum(1, 2) //성공

//C.js
const sum = 4
const s = sum(1, 2) //에러.
```

자바스크립트도 모듈화를 지원하기 위한 노력이 진핻되었다. (`CommonJS`, 'AMD`)

그런데 웹 시장이 발달하면서 웹브라우저에 더 많은 기능과 더 높은 성능을 요구하기 시작했다.
모듈화로 쪼개놓은 자바스크립트 파일이 많아질수록 필요한 파일을 가져오는 데 추가적인 네트워크 자원을 쓸 수밖에 없었다.
자바스크립트 파일 뿐만 아니라 각종 리소스 파일을 가져오려면 마찬가지로 네트워크 자원을 소모할 수밖에 없었다.

웹팩은 모듈화로 쪼개진 여러 개의 자바스크립트 파일을 하나로 합친다.
또한, 로더라는 개념을 통해 자바스크립트가 아닌 다른 리소스 파일도 번들링한다.

## 프로젝트 구성하기

### 패키지 설치

```bash
# package.json 생성
npm init -y

# react 패키지 설치
npm install react react-dom

# dev 패키지 설치
npm install --save-dev webpack webpack-cli html-webpack-plugin webpack-dev-server css-loader style-loader sass-loader node-sass babel-loader @babel/preset-react @babel/preset-env
```

- 패키지 리스트

|패키지|기능|
|---|---|
|webpack|웹팩|
|webpack-cli|명령어로 웹팩을 이용할 수 있는 라이브러리|
|html-webpack-plugin|번들링 후, 만들어 놓은 템플릿 html 파일을 이용해 번들링된 js를 `import(<script type="module" src="./dist/about.bundle.js"></script>)`하는 html 파일을 새로 만들어서 output 디렉터리에 생성|
|webpack-dev-server|개발할 때 사용하는 웹 서버|
|css-loader, style-loader, sass-loader|css/scss를 위한 웹팩 로더|
|node-sass|scss|
|babel-loader, @babel/preset-react, @babel/preset-env|jsx 트랜스파일링을 위한 바벨 패키지|

### 소스 파일 생성

- src/index.jsx
```js
import App from './App';
import React from 'react';
import ReactDOM from 'react-dom/client';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- src/App.jsx
```js
const App = () => {
  return <></>
}

export default App

```

- public/index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" href="image/x-icon" href="/avatar.ico">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Dev Blog</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

### 웹팩 설정하기

common, dev, prod로 구성한다.

웹팩에서 리액트를 쓰려면 JSX를 트랜스파일링할 수 있어야 한다.
바벨의 프리셋을 쓰면 된다.
바벨 8 이상부터 runtime의 디폴트값은 'automatic'이다.

```js
{
  test: /\.jsx/,
  loader: 'babel-loader',
  options: {
    presets: [
      ['@babel/preset-react', { runtime: 'automatic' }],
      '@babel/preset-env',
    ],
  },
  exclude: /node_modules/,
}
```

- webpack.common.js
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
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.jsx/,
        loader: 'babel-loader',
        options: {
          presets: [
            ['@babel/preset-react', { runtime: 'automatic' }],
            '@babel/preset-env',
          ],
        },
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  devtool: 'inline-source-map',
  devServer: {
    static: './dist',
    hot: true,
    open: true,
  },
}

```

- webpack.dev.js
```js
const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval',
  devServer: {
    historyApiFallback: true,
    port: 3000,
    hot: true,
  },
})

```

- webpack.prod.js
```js
const { merge } = require('webpack-merge')
const common = require('./webpack-common.js')

module.exports = merge(common, {
  mode: 'production',
  devtool: 'hidden-source-map',
})

```

### package.json 설정하기

- package.json
```json package.json
{
  "name": "blog-admin",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "dev": "webpack-dev-server --config webpack.dev.js --open --hot",
    "build": "webpack --config webpack.prod.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@babel/preset-env": "^7.25.9",
    "@babel/preset-react": "^7.25.9",
    "babel-loader": "^9.2.1",
    "css-loader": "^7.1.2",
    "html-webpack-plugin": "^5.6.3",
    "node-sass": "^9.0.0",
    "sass-loader": "^16.0.2",
    "style-loader": "^4.0.0",
    "webpack": "^5.95.0",
    "webpack-cli": "^5.1.4",
    "webpack-dev-server": "^5.1.0"
  }
}
```

## 참고

https://yogjin.tistory.com/59

https://twojobui.tistory.com/8

https://goo-gy.github.io/2021-12-31-webpack-react

https://velog.io/@sooyun9600/React-is-not-defined-%EC%97%90%EB%9F%AC-%ED%95%B4%EA%B2%B0
