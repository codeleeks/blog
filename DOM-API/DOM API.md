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
const boxEl = document.querySelector('.box');
```

## 요소의 클릭 이벤트 처리

```javascript
const boxEl = document.querySelector('.box');

// 해당 요소에 click이 일어나면 익명 함수 실행.
boxEl.addEventListener('click', function() {
  console.log('clicked');
});
```

## 요소의 클래스 정보 주입/삭제

```javascript
const boxEl = document.querySelector('.box');

//요소에 클래스 추가
boxEl.classList.add('active');

//요소에 클래스 조회
let isContains = boxEl.classList.contains('active');

//요소에 클래스 삭제
boxEl.classList.remove('active');
```

## 해당하는 요소 모두 찾기

```javascript
// HTML 요소(Element) 모두 검색
const boxEls = document.querySelectorAll('.box');

//찾은 요소를 순차 조회
//첫번째 인자는 해당 요소, 두번째는 인덱스.
boxEls.forEach(function(boxEl, index) {

})
```


## 요소의 content 제어하기

```javascript
const boxEl = document.querySelector('.box');

//콘텐트 Getter
console.log(boxEl.textContent);

//콘텐트 Setter
boxEl.textContent = 'HEROPY?!';
```
