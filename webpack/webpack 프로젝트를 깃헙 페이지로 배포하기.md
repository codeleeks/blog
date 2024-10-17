
## 환경변수 처리하기

dev는 dotenv, prod는 EnvironmentPlugin을 사용한다.

```bash
npm run build
shell: /usr/bin/bash -e {0}
env:
  VITE_GITHUB_ACCESS_TOKEN: ***
  BLOG_BASE_URL: /blog
```

## refresh 이슈 해결하기

index.html의 복사본을 만드는데 파일 이름을 404.html로 생성한다.
리프레시를 하면 404 에러가 뜨면서 깃헙 페이지는 404.html을 참고한다.
이 때 404.html의 `bundle.js` 로직이 처리되면서 URL에 해당하는 페이지로 포워딩한다.

```bash
cp ./dist/index.html ./dist/404.html
```

https://velog.io/@coolchaem/React-Router-%EC%97%90%EB%9F%AC-SPA-refresh-%EB%AC%B8%EC%A0%9C
