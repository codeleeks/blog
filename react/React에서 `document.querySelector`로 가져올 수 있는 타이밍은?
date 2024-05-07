---
summary: react에서 querySelector로 요소를 가져올 수 있는 타이밍을 알아본다.
date: 2024-05-07
title-image: 'https://raw.githubusercontent.com/codeleeks/blog/codeleeks-images/react/querySelector%EA%B0%80%20%EA%B0%80%EC%A0%B8%EC%98%AC%20%EC%88%98%20%EC%9E%88%EB%8A%94%20%ED%83%80%EC%9D%B4%EB%B0%8D%EC%9D%80/title.png'
---

- 일반 컴포넌트

| 사용 시점            | 타겟과의 관계 | 결과 |
| -------------------- | ------------- | ---- |
| 컴포넌트             | 본인          | null |
| 컴포넌트의 useEffect | 본인          | 성공 |
| 컴포넌트             | 타겟이 부모   | null |
| 컴포넌트의 useEffect | 타겟이 부모   | 성공 |
| 컴포넌트             | 타겟이 자식   | null |
| 컴포넌트의 useEffect | 타겟이 자식   | 성공 |
| 컴포넌트             | 형제          | null |
| 컴포넌트의 useEffect | 형제          | 성공 |
| 컴포넌트             | 사촌          | null |
| 컴포넌트의 useEffect | 사촌          | 성공 |

- suspense / await 컴포넌트 (router provider 내부)

| 사용 시점            | 타겟과의 관계 | 결과     |
| -------------------- | ------------- | -------- |
| 컴포넌트             | 본인          | null     |
| 컴포넌트의 useEffect | 본인          | 성공     |
| 컴포넌트             | 타겟이 부모   | null     |
| 컴포넌트의 useEffect | 타겟이 부모   | 성공     |
| 컴포넌트             | 타겟이 자식   | null     |
| 컴포넌트의 useEffect | 타겟이 자식   | 성공     |
| 컴포넌트             | 형제          | null     |
| 컴포넌트의 useEffect | 형제          | 성공     |
| 컴포넌트             | 사촌          | null     |
| 컴포넌트의 useEffect | 사촌          | **null** |

## 분석

> 타겟이 부모인 경우에 자식 컴포넌트 내에서는 null이 리턴되고, `useEffect`에서는 성공했다.

👉 이는 렌더링시 `useEffect`가 queue에 등록되며, child 먼저 등록됨을 의미한다.

```
Parent Rendering
- Child Rendering
  - useEffect 등록
- Child Rendering 완료
- useEffect 등록.
- Parent Rendering 완료.
- 등록된 useEffect 실행.
```

> `RouterProvider` 외부에서는 useEffect 시점에서도 null이 리턴되었다.

👉 `SPA`에서는 라우트가 되어야만 html 요소가 추가되기 때문이다. 요소를 찾는 컴포넌트는 라우트 페이지와 동일한 생명주기를 가져야 한다.

## 결론

`document.querySelector`로 요소를 찾고 싶다면, `useEffect`를 쓰자.

또한, 찾고 싶은 요소를 가진 컴포넌트와 같은 라우트 생명 주기를 갖자.
