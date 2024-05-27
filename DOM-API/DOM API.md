---
summary: DOM API의 정의와 개발시 유용한 로직을 살펴봅니다.
date: 2024-04-19
title-image: 'https://raw.githubusercontent.com/codeleeks/blog/7170ea038bc9f650bac8e6a9e572b8448ca7369d/DOM-API/DOM%20API/title.svg'
---

# DOM API

Document Object Model API의 축약어이다.
DOM이란 html document에 들어 있는 오브젝트 모델을 의미한다.
오브젝트 모델이란 블록, 인라인, 인라인-블록 요소 등 화면에 배치되는 요소들의 특성을 정의한다.

## 요소 한 개 찾기

```javascript
// HTML 요소(Element) 1개 검색/찾기.(가장 먼저 발견된 요소 검색)
const boxEl = document.querySelector('.box')
```

## 요소의 클릭 이벤트 처리

```javascript
const boxEl = document.querySelector('.box')

// 해당 요소에 click이 일어나면 익명 함수 실행.
boxEl.addEventListener('click', function () {
  console.log('clicked')
})
```

## 요소의 클래스 정보 주입/삭제

```javascript
const boxEl = document.querySelector('.box')

//요소에 클래스 추가
boxEl.classList.add('active')

//요소에 클래스 조회
let isContains = boxEl.classList.contains('active')

//요소에 클래스 삭제
boxEl.classList.remove('active')
```

## 해당하는 요소 모두 찾기

```javascript
// HTML 요소(Element) 모두 검색
const boxEls = document.querySelectorAll('.box')

//찾은 요소를 순차 조회
//첫번째 인자는 해당 요소, 두번째는 인덱스.
boxEls.forEach(function (boxEl, index) {})
```

## 요소의 content 제어하기

```javascript
const boxEl = document.querySelector('.box')

//콘텐트 Getter
console.log(boxEl.textContent)

//콘텐트 Setter
boxEl.textContent = 'HEROPY?!'
```

## location과 history

`location` 객체는 페이지와 URL 관련 정보를 제어할 수 있는 객체이다.
`history` 객체는 페이지 이동 내역을 관리하는 객체이다.

> `location`는 페이지를 이동하면서 페이지 히스토리를 수정하고, `history`는 페이지 히스토리를 통해 이전 페이지 이동 등의 기능을 제공한다.

### 핵심 함수

- `location.replace()`: 페이지를 특정 URL로 이동시킨다.
  - 이동 전 현재 페이지를 히스토리에서 날린다(이동할 페이지로 대체)
- `location.assign()`: 페이지를 특정 URL로 이동시킨다.
  - 이동 전 현재 페이지를 히스토리에서 날리지 않는다.
- `history.back()`: 이전 페이지로 이동한다.

## Navigator

현재 브라우저와 OS 관련 정보를 관리하는 객체이다.

userAgent , clipboard, geolocation 등

## 이벤트

### 이벤트 캡처링 & 버블링

브라우저가 이벤트를 처리할 때에는 두 가지 단계를 거친다.

`capturing` 단계와 `bubbling` 단계이다.

`capturing` 단계에서는 바깥에서 안쪽 요소 순서대로 이벤트 핸들러를 호출하고,

`bubbling` 단계에서는 안쪽에서 바깥 요소 순서대로 이벤트 핸들러를 호출한다.

`addEventListener`를 통해 핸들러 함수가 어느 단계에서 처리될지 선택할 수 있다.

```js
// 세 번째 파라미터는 capturing 단계에서 호출하는지 여부를 지정.
// 기본값은 false로, bubbling 단계에서 호출한다.
div.addEventListener('click', () => {}, true)
```

### Drag & Drop

웹페이지에서 드래그 앤 드랍을 구현한다.

#### 핵심 이벤트

| 이름        | 발행 조건                                                                         | 발행 주체                |
| ----------- | --------------------------------------------------------------------------------- | ------------------------ |
| `drag`      | `draggable` 요소를 드래그할 때 0.1초마다 발행                                     | `draggable` 요소         |
| `dragstart` | `drggable`요소를 드래그하기 시작할 때 발행                                        | `draggable` 요소         |
| `dragenter` | `draggable` 요소를 드래그하여 `valid drop target` 요소에 진입할 때 발행           | `valid drop target` 요소 |
| `dragover`  | `draggable` 요소를 드래그하여 `valid drop target` 요소에 진입할 때 0.1초마다 발행 | `valid drop target` 요소 |
| `dragleave` | `draggable` 요소를 드래그하여 `valid drop target` 요소에서 벗어날 때 발행         | `valid drop target` 요소 |
| `dragend`   | 드래그를 끝낼 때 발행                                                             | `draggable` 요소         |
| `drop`      | `drggable` 요소를 드래그하여 `valid drop target`에 드랍했을 때 발행               | `valid drop target` 요소 |

#### 구현 방법

- 타겟 요소를 `draggable`하게 만든다.
  - `<div drggable='true'></div>`
- ➡️ `dragstart` 이벤트 리스너를 등록하고 데이터를 추가한다
  - `dragstart` 리스너에서 `event.dataTransfer.setData(MIME, 데이터)` 형태로 데이터 추가.
- ➡️ `drgaenter`, `dragover` 이벤트 리스너를 등록한다. (`dragover`의 기본 동작은 drop 이벤트 발행 취소이므로 `preventDefault()`를 호출한다.)
  - `event.dataTransfer.types`를 활용하여 원하는 MIME인지를 확인한다.
- ➡️ `dragleave` 이벤트 리스너를 등록하여 `immediate user selection` 영역의 style을 업데이트한다.
  - child 영역에 진입할 때에도 부모 영역의 `dragleave` 이벤트가 발행되기 때문에, `event.relatedTarget`의 조상 중에 부모 요소가 있는지 확인한다.
    - `if (event.relatedTarget.closest(부모 요소) !== 부모요소)`
- ➡️ `drop` 이벤트 리스너를 등록하고 전달받은 데이터를 업데이트한다.
  - `event.dataTransfer.getData(MIME)`으로 데이터를 얻는다.
- ➡️ `dragend` 이벤트 리스너를 등록하고 `draggable`한 타겟 요소에 대한 데이터 변경 혹은 스타일 변경을 실행한다.
  - `if(event.dataTransfer.dropEffect !== 'none')`로 드래그앤드랍이 성공했는지를 구분한다.

## 브라우저 저장소

| local storage / session storage              | cookie                                       | indexedDB                                                                  |
| -------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| simple key-value store                       | simple key-value store                       | sophisticated client-side database                                         |
| manage user preferences, basic user data     | manage user preferences, basic user data     | manage complex data                                                        |
| easy to use, versatile, bad for complex data | easy to use, versatile, bad for complex data | quite difficult to use, versatile, good for complex data, good performance |

### local storage / session storage

단순한 key-value store이다.

session storage는 탭이 종료되면 초기화된다.

#### 핵심 함수

- `localStoarge.setITem(key, value)`
  - value는 `toString()` 메서드를 호출하여 `string`으로 변환됨
- `localStoarge.getItem(key)`
- `sessionStorage.setItem(key, value)`
  - value는 `toString()` 메서드를 호출하여 `string`으로 변환됨
- `sessionStorage.getItem(key)`

### cookie

쿠키는 HTTP 프로토콜에서 저장 가능하다.

서버사이드에서 HTTP 응답 헤더에 쿠키를 넣을 수 있다.

```js
//6분 유효시간을 갖는 key=value 쿠키 설정
document.cookie = 'key=value; max-age=360'

btnEl.addEventListener('click', (e) => {
  const cookieData = document.cookie.split(';')
  const data = cookieData.map((i) => {
    return i.trim()
  })
  console.log(data.includes('key').split('=')[1]) //value 출력
})
```

### indexed db

브라우저 내장 디비를 사용한다.

스프레드 시트와 같이 offline 환경에서 사용자 작업 데이터를 잃으면 안 되는 케이스에서 사용하고,

일반적인 케이스에서는 서버에 저장하는 방식으로 처리한다.

