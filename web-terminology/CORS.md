---
summary: CORS에 대해 정리합니다.
date: 2024-05-25
title-image: ''
---

Cross Origin Resource Sharing. 간단히 말해서, 내 리소스를 받아갈 수 있게 허용할 것이냐? 이다.

사실 당연하게 가져갈 수 있는 것 아닌가하고 생각했던 이유는 우리가 github 레포지토리 API나 구글 유튜브 API 등과 같은 외부 API를 사용할 때 이런 것을 신경쓰지 않았기 때문이다.

그러나 우리가 node.js나 spring으로 직접 웹서버를 만들 때, 클라이언트 측에서 우리의 API를 가져오지 못하는 문제에 부딪히게 되면서 이런 정책이 있는지를 알게 된다.

우리가 사용하는 외부 API는 사실 CORS 정책을 잘 적용했기 때문에 별 문제 없이 사용할 수 있었다.

그래서 반대로 생각하는 편이 개발하면서 빼먹지 않는 비결이다.

➡️ 외부 리소스를 가져오는 것은 원래 허용되지 않는 것인데, 정책을 통해 허용할 수 있다.

## 워크플로우

대부분의 경우 `preflight` 요청이 먼저 발생한다.

preflight라는 이름대로 실제 요청 전에, 요청에 사용할 HTTP 메서드, origin, content-type 등을 서버에 보내어 확인 받는 작업이다.

```bash
# 요청헤더
Access-Control-Request-Headers:
authorization,x-github-api-version
Access-Control-Request-Method:
GET
Origin:
https://codeleeks.github.io
```

서버는 `preflight` 요청을 받고, 정책을 확인한 후, 허용 여부를 HTTP 응답 헤더에 담아 보낸다.

```bash
# 응답헤더
Access-Control-Allow-Headers:
Authorization, Content-Type, If-Match, If-Modified-Since, If-None-Match, If-Unmodified-Since, Accept-Encoding, X-GitHub-OTP, X-Requested-With, User-Agent, GraphQL-Features, X-Github-Next-Global-ID, X-GitHub-Api-Version
Access-Control-Allow-Methods:
GET, POST, PATCH, PUT, DELETE
Access-Control-Allow-Origin:
*
```

서버의 응답결과는 서버의 정책을 말해주는데,

- `Access-Control-Allow-Origin`: 허용하는 `origin`, `*`는 `origin` 상관 않겠다는 뜻.
- `Access-Control-Allow-Headers`: 허용하는 요청 헤더 필드.
- `Access-Control-Allow-Methods`: 허용하는 요청 메서드.

따라서, 서버 개발자는 세 가지 필드에 적절한 값을 정하여 정책을 정하면 된다.

## 참고

https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
