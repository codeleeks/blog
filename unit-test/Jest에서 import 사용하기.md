Jest는 import를 지원하지 않아서 import를 사용하려면 babel로 트랜스파일링해줘야 한다.

```bash
npm install --save-dev babel-jest @babel/core @babel/preset-env
```

```js package.json
module.exports = {
  presets: [['@babel/preset-env', {targets: {node: 'current'}}]],
};
```

https://jestjs.io/docs/getting-started#using-babel
