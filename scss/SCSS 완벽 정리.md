---
summary: SCSS의 기본을 완벽하게 정리합니다.
date: 2024-05-30
title-image: 'https://raw.githubusercontent.com/codeleeks/blog/codeleeks-images/scss/SCSS%20%EC%99%84%EB%B2%BD%20%EC%A0%95%EB%A6%AC/title.png'
---

## @extend

extend할 선택자를 HTML 요소에 추가하는 것과 같은 효과를 낸다.

복수선택자로 컴파일된다.

```scss
.error {
  border: 1px #f00;
  background-color: #fdd;

  &--serious {
    @extend .error;
    border-width: 3px;
  }
}
```

컴파일하면,

```css
.error,
.error--serious {
  border: 1px #f00;
  background-color: #fdd;
}
.error--serious {
  border-width: 3px;
}
```

### `@mixin`와 차이

|                 | `@extend`                              | `@mixin`                      |
| --------------- | -------------------------------------- | ----------------------------- |
| 기능            | HTML 요소에 클래스 추가하기            | 스타일룰 붙여넣기             |
| CSS 컴파일 결과 | comma로 구분되는 복수선택자로 컴파일됨 | 각 선택자에 스타일룰이 추가됨 |

### 흥미로운 점

선택자가 여러 군데에서 사용되는 경우에 조금 불필요하거나 예상치못한 코드로 컴파일될 수도 있는 것 같다.

```scss
.content nav.sidebar {
  @extend .info;
}

// This won't be extended, because `p` is incompatible with `nav`.
p.info {
  background-color: #dee9fc;
}

// There's no way to know whether `<div class="guide">` will be inside or
// outside `<div class="content">`, so Sass generates both to be safe.
.guide .info {
  border: 1px solid rgba(#000, 0.8);
  border-radius: 2px;
}

// Sass knows that every element matching "main.content" also matches ".content"
// and avoids generating unnecessary interleaved selectors.
main.content .info {
  font-size: 0.8em;
}
```

컴파일하면,

```css
p.info {
  background-color: #dee9fc;
}

.guide .info,
.guide .content nav.sidebar,
.content .guide nav.sidebar {
  border: 1px solid rgba(0, 0, 0, 0.8);
  border-radius: 2px;
}

main.content .info,
main.content nav.sidebar {
  font-size: 0.8em;
}
```

`.info` 클래스를 extend하고 있는데, `.info`가 사용되는 여러 스타일 로직들과 다 복수선택자를 이루며 스타일을 적용받으려고 하고 있다.

### limitations

- at-rule 밖에 선언된 선택자를 at-rule 안에서 extend할 수 없다.

```scss
@media screen and (max-width: 600px) {
  .error--serious {
    @extend .error;
    //      ^^^^^^
    // Error: ".error" was extended in @media, but used outside it.
  }
}

.error {
  border: 1px #f00;
  background-color: #fdd;
}
```

- 단순한 선택자만 extend할 수 있다.

```scss
.alert {
  @extend .message.info;
  //      ^^^^^^^^^^^^^
  // Error: Write @extend .message, .info instead.

  @extend .main .info;
  //      ^^^^^^^^^^^
  // Error: write @extend .info instead.
}
```

## @at-root

`@at-root`안에 정의한 코드는 `style rules`, `at-rules`에서 벗어나 문서의 루트 영역으로 이동한다.

> `@at-root <selector> { ... }`

### 파라미터

nesting 문법을 빠져나갈지 말지를 명시할 수 있다.

nesting 문법이란 style rules, at-rules을 말한다.

- `with`: 여기에 명시된 nesting 문법 말고 다른 모든 nesting 문법에서 벗어날 수 있다.
- `without` 여기에 명시된 nesting 문법에서 벗어날 수 있다.

모든 at-root 룰에 더해 아래의 nesting 예약 키워드도 지원한다.

- `rule`: `style rules`을 의미
- `all`: 모든 nesting 문법을 의미

### 예시

`without: media`라고 하면 `media` 쿼리 밖으로 벗어나지만, 선택자(selector) 구조는 그대로 유지된다.

```scss
@media (max-width: 700px) {
  body {
    $w: 600px;
    width: $w;

    @at-root (without: media) {
      .child {
        height: 100%;
      }
    }
  }
}
```

컴파일하면,

```css
@media (max-width: 700px) {
  body {
    width: 600px;
  }
}
body .child {
  height: 100%;
}
```

`all` 예약 키워드를 사용해 모든 nesting 문법에서 벗어난다.

```scss
@media (max-width: 700px) {
  body {
    $w: 600px;
    width: $w;

    @at-root (without: all) {
      .child {
        height: 100%;
      }
    }
  }
}
```

컴파일하면,

```css
@media (max-width: 700px) {
  body {
    width: 600px;
  }
}
.child {
  height: 100%;
}
```
