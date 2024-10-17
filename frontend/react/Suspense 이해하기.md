---
summary: Suspense를 코드로 이해해봅니다.
date: 2024-10-17
title-image: 'https://raw.githubusercontent.com/codeleeks/blog/codeleeks-images/react/react%20%EC%99%84%EB%B2%BD%20%EC%A0%95%EB%A6%AC/title.png'
---

## Suspense란?

Suspense는 하위 컴포넌트가 비동기 데이터를 기다리느라 화면을 그리지 못하는 경우 fallback UI를 그려주는 컴포넌트이다.
fallback UI에는 대체로 로딩 UI를 사용한다.

Suspense는 하위 컴포넌트가 throw한 비동기 데이터에 대한 프로미스를 catch한 뒤 await 하고, 그동안에 fallback UI를 그려준다.
await가 끝나면 fallback UI를 제거하고 하위 컴포넌트의 UI를 그려준다.

```js
function Suspense(task) {
  for(;;) {
    try {
      return task()
    }
    catch(e) {
      if (e instaceof Promise) {
        await e
      } else {
        throw e
      }
    }
  }
}
```

```js
function fetchUser(userId) {
  let user = null;
  let isError = false;

  const suspender = fetch(`https://jsonplaceholder.typicode.com/users/${userId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      return response.json();
    })
    .then((data) => {
        user = data;
    })

  return {
    read() {
			//user가 null이면 Promise를 throw해준다.
      if (user === null) {
        throw suspender;
      }
			// user값을 받은 경우
      return user;
    },
  };
}

//-----------------------------------------

function App() {
  return (
      <Suspense fallback={<Loading></Loading>}>
				<User resource={fetchUser("1")}/>      
		  </Suspense>
  );
}

//-----------------------------------------

function User({resource) {
	console.log("유저 정보 가져오기");
  const user = resource.read();
  console.log("유저 화면 그리기");

  return (
    <div>
      <p>
        {user.name}({user.email}) 님이 작성한 글
      </p>
    </div>
  );
}
```

출처: https://velog.io/@ddowoo/React-Suspense%EC%9D%98-%EC%82%AC%EC%9A%A9-%EB%B0%A9%EB%B2%95-%EC%9E%91%EB%8F%99%EC%9B%90%EB%A6%AC-%EC%82%AC%EC%9A%A9%ED%95%98%EB%8A%94-%EC%9D%B4%EC%9C%A0%EB%A5%BC-%EC%95%8C%EC%95%84%EB%B3%B4%EC%9E%90

## Suspense의 장점

선언적 프로그래밍을 할 수 있다.
