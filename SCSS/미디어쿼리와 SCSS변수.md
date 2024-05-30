## 문제

media 쿼리와 변수를 함께 쓰면 컴파일이 이상하게 됨.

```scss
body {
  $title-font-size: 35px;
  $contents-width: 800px;
  $spacing: 10px;
  @media (max-width: 760px) {
    $title-font-size: 35px;
    $contents-width: 350px;
    $spacing: 1px;
  }
  max-width: $contents-width;
  padding: 20px calc(#{$spacing * 6});

  h1.title {
    font-size: $title-font-size;
    color: var(--font-title-color-bright);
    line-height: 1.5;
  }
}
```

컴파일하면,

```css
body {
  max-width: 350px;
  padding: 20px calc(6px);
}
body h1.title {
  font-size: 35px;
  color: var(--font-title-color-bright);
  line-height: 1.5;
}
```

미디어쿼리는 사라지고, 의도한 스타일 적용도 되지 않는다.

화면 너비가 작아지면 width, 여백을 줄이려 했으나 관련 스타일 코드가 사라졌다.

## 해결

해결 방법은 두 가지이다.

1. SCSS 변수를 그대로 사용하면서, 미디어쿼리 안에 조정이 필요한 코드를 모두 적는다.

```scss
body {
  $title-font-size: 35px;
  $contents-width: 800px;
  $spacing: 10px;
  @media (max-width: 760px) {
    $title-font-size: 35px;
    $contents-width: 350px;
    $spacing: 1px;

    max-width: $contents-width;
    padding: 20px calc(#{$spacing * 6});

    h1.title {
      font-size: $title-font-size;
    }
  }
  max-width: $contents-width;
  padding: 20px calc(#{$spacing * 6});

  h1.title {
    font-size: $title-font-size;
    color: var(--font-title-color-bright);
    line-height: 1.5;
  }
}
```

컴파일하면,

```css
body {
  max-width: 350px;
  padding: 20px calc(6px);
}
@media (max-width: 760px) {
  body {
    max-width: 350px;
    padding: 20px calc(6px);
  }
  body h1.title {
    font-size: 35px;
  }
}
body h1.title {
  font-size: 35px;
  color: var(--font-title-color-bright);
  line-height: 1.5;
}
```

미디어쿼리의 내용이 모두 들어 있는 것을 볼 수 있다.

vscode 코드 내비게이션 기능을 이용할 수 있는 장점이 있고,

1. css 변수 사용하기

```scss
body {
  --title-font-size: 35px;
  --contents-width: 800px;
  --spacing: 10px;
  @media (max-width: 760px) {
    --contents-width: 350px;
    --spacing: 1px;
  }
  max-width: var(--contents-width);
  padding: 20px calc(var(--spacing) * 6);

  h1.title {
    font-size: var(--title-font-size);
    color: var(--font-title-color-bright);
    line-height: 1.5;
  }
}
```

컴파일하면,

```css
body {
  --title-font-size: 35px;
  --contents-width: 800px;
  --spacing: 10px;
  max-width: var(--contents-width);
  padding: 20px calc(var(--spacing) * 6);
}
@media (max-width: 760px) {
  body {
    --contents-width: 350px;
    --spacing: 1px;
  }
}
body h1.title {
  font-size: var(--title-font-size);
  color: var(--font-title-color-bright);
  line-height: 1.5;
}
```

미디어쿼리 안에 변수 선언만 해도 scss 변수와는 달리 컴파일된 결과에 포함되는 것을 알 수 있다.

## 해결 방안 비교

| scss 변수 사용하기                            | css 변수 사용하기                             |
| --------------------------------------------- | --------------------------------------------- |
| vscode의 코드내비게이션 지원                  | 파일 간 vscode의 코드내비게이션 지원하지 않음 |
| 미디어쿼리에 동일한 스타일 로직이 들어가야 함 | 미디어쿼리 코드를 최소화할 수 있음            |
| 스타일 블록에서 로컬하게 사용됨               | 여러 파일 전체에서 글로벌하게 사용됨          |

## 선택

개인적으로는 미디어쿼리 코드를 최소화할 수 있다는 점이 결정적으로 좋아보여서 css 변수의 단점을 커버할 수 있는 방안을 궁리하는 편이다.
