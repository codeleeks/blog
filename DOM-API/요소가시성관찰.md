---
summary: IntersectionObserver의 quickstart 코드!
date: 2024-02-29
title-image: 'https://raw.githubusercontent.com/codeleeks/blog/codeleeks-images/DOM-API/%EC%9A%94%EC%86%8C%EA%B0%80%EC%8B%9C%EC%84%B1%EA%B4%80%EC%B0%B0/title.png'
---

# 요소 가시성 관찰

- 뷰포트에 요소가 나타는지 사라지는지를 감지하는 javascript 기능.

```javascript
const io = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    // entry가 뷰포트에 보이면 true, 사라지면 false
    if (!entry.isIntersecting) {
      return
    }
    entry.target.classList.add('show')
  })
})

const infoEls = document.querySelectorAll('.info')
infoEls.forEach(function (el) {
  io.observe(el)
})
```
