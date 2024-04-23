---
summary: GSAP 라이브러리를 사용하기 위한 quickstart 코드!
date: 2024-01-26
title-image: 'https://raw.githubusercontent.com/codeleeks/blog/codeleeks-images/libraries/gsap/title.png'
---

# GSAP

- javascript 애니메이션 라이브러리.
- 스크롤시 배지 숨기기, 딜레이를 두고 요소를 순차적으로 보이게 하기 등을 구현할 수 있음.

## quickstart

- https://cdnjs.com/libraries/gsap 에서 `copy script tag`

```html
<head>
  <script
    src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.6.0/gsap.min.js"
    integrity="sha512-1dalHDkG9EtcOmCnoCjiwQ/HEB5SDNqw8d4G2MKoNwjiwMNeBAkudsBCmSlMnXdsH8Bm0mOd3tl/6nL5y0bMaQ=="
    crossorigin="anonymous"
    referrerpolicy="no-referrer"
  ></script>
</head>
```

## gsap.to()

- `gsap.to(요소, 지속시간, 옵션)`
- 지속시간(초 단위)만큼 요소를 옵션에 해당하는 애니메이션 적용

```javascript
//some-el클래스를 갖는 요소를 찾아서 0.5초의 지속시간으로 opacity: 0과 display: none을 적용한다.
const element = document.querySelector('.some-el')
gsap.to(element, 0.5, {
  opacity: 0,
  display: none,
})
```
