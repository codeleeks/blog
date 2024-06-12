## 문제

HBD 프로젝트에서 편지 섹션에는 클릭했을 때 봉투에서 편지지가 나오는 애니메이션이 있다.

편지지가 나온 후 다시 클릭하면 편지가 봉투로 들어가는 애니메이션을 구현하고 싶었다.

즉, 편지가 나오는 애니메이션을 역방향으로 돌리는 것이다.

문제를 조금 바꿔서, 애니메이션 진행 도중 사용자 입력시 역방향으로 진행하는 문제를 풀어보았다.

## 해결

두 개의 애니메이션을 사용해야 하고, 각각 부모 요소와 자식 요소에 할당한다.

각 애니메이션의 `animation-play-state`를 `paused`로 두고, 사용자 입력시 `running`으로 변경한다.

HTML
```html
<div class="animation-container">
  <img src="https://cdn.pixabay.com/photo/2013/07/12/12/12/gear-145315_1280.png" alt="톱니바퀴" class='animation-target'>  
</div>
```

SCSS
```scss
.animation-container {
  width: 300px;
  height: 300px;
  margin: 50px auto 0;
  animation: clockwise 5s reverse linear infinite;
  animation-play-state: paused;
  .animation-target {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    animation: clockwise 5s forwards linear infinite;
    animation-play-state: paused;
    
    @keyframes clockwise {
      0% {
        transform: rotate(0deg);
      }
      50% {
        transform: rotate(180deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  }
  
  &.clockwise {
    .animation-target {
      animation-play-state: running;
    }
  }
  &.counterclockwise {
    animation-play-state: running;
  }
}

```

JAVASCRIPT
```javascript
const containerEl = document.querySelector('.animation-container')

const clockwiseListener = e => {
  e.stopPropagation()
  containerEl.className = 'animation-container'
  requestAnimationFrame((time) => {
    requestAnimationFrame((time) => {
      containerEl.classList.add('clockwise')
    })
  })
}

const counterclockwiseListener = (e) => {
  if (!containerEl.classList.contains('counterclockwise')) {
    containerEl.className = 'animation-container'
    requestAnimationFrame((time) => {
      requestAnimationFrame((time) => {
        containerEl.classList.add('counterclockwise')  
      })
    })
  }
}

containerEl.addEventListener('click', clockwiseListener, false)
document.body.addEventListener('click', counterclockwiseListener, false)
```

