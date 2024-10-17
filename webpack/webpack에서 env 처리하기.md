개발용 설정에서는 `.env` 파일을 읽어서 환경변수를 셋팅한다.
`.env` 파일에는 환경변수를 정의한다.

```js
const Dotenv = require('dotenv-webpack');

module.exports = {
  // ...
  plugins: [
    new Dotenv({ path: '.env.development' }),
  ]
}
```

배포용 설정에서는 외부에서 환경변수를 주입하기 때문에 `.env` 파일 방식을 사용할 수 없다.
따라서 `webpack.EnvironmentPlugin`을 사용한다.

```js
new webpack.EnvironmentPlugin({
  NODE_ENV: 'development',
  DEBUG: true,
}),
```
https://velog.io/@bepyan/VanillaJS-webpack5-env
