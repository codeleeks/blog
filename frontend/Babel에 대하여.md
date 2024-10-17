---
summary: babel에 대해 정리합니다.
date: 2024-10-01
title-image: 'https://github.com/user-attachments/assets/6eb85d4f-a97a-4058-8e80-099fd8b70117'
---

## Babel 이란?

babel은 javascript 컴파일러이다. 트랜스파일링이라고 한다.

오래된 브라우저를 지원하기 위해 만들어졌다.

javascript는 버전이 올라가면서 여러 가지 신규 문법을 만들어 제공한다.
오래된 브라우저에서는 이러한 문법을 해석하지 못하기 때문에, 신규 문법을 사용한 웹 어플리케이션은 호환성이 떨어진다.
바벨은 이러한 문제를 해결하기 위해 신규 문법을 기존 문법으로 컴파일한다.

또한, 폴리필로 신규 제공 프로토타입들을 추가하기도 한다.

트랜스파일링과 폴리필의 차이는 신규로 추가된 기능이 문법이냐 프로토타입이냐로 구분할 수 있다.

```javascript
//// 트랜스파일
//원본 코드
let total = 10;
let sum = total ?? 100;
//트랜스 파일 후
"use strict";

let total = 10;
let sum = total !== null && total !== void 0 ? total : 100;

//// 폴리필
//polyfill을 생성하는 예시 코드
if (!Number.isNaN) {
    Number.isNaN = function isNaN(x) {
        return x !== x;
    };
}

출처: https://velog.io/@bbaa3218/Polyfill%EA%B3%BC-Transpiler
```

## 바벨과 JSX

바벨은 또한 JSX 문법을 javascript로 변환한다.

## 바벨의 동작 과정

- AST 만들기 `@babel/parser`
- AST 순회하며 플러그인 실행 -> 새 AST 생성 `@babel/traverse`
- 새 AST로 javascript 코드 생성 `@babel/generator`


바벨을 npm에서 다운받아서 실행하면 원본 자바스크립트가 컴파일된다.

```bash
npm install --save-dev @babel/core @babel/cli @babel/preset-env

// package.json
{
	...
    "scripts": {
      "test": "echo \"Error: no test specified\" && exit 1",
      "compile": "babel src -d dist"
  	},
    ...
}

//결과
├── dist/ 컴파일된 소스 코드
│   └── index.js
└── src/ 원본 소스 코드
    └── index.js
```

## 바벨 설정하기

```json
// babel.config.json
//  "compile": "babel src -d dist --presets=@babel/env" 처럼 babel 커맨드의 argument를 config 파일로 정의.
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "edge": "17",
          "firefox": "60",
          "chrome": "67",
          "safari": "11.1"
        },
        //폴리필 적용(소스폴더의 모든 코드를 검사하여 필요한 폴리필만 추가)
        "useBuiltIns": "usage"
      }
    ]
  ]
}
```

`babel.config.json`은 프로젝트 전역 설정 파일이며, `.babelrc.json`은 개별 폴더 설정 파일이다.



## 참고

https://velog.io/@suyeon9456/Babel
