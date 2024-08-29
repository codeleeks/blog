## 문제

보통 컬러값은 16진수 형태를 사용한다.

alpha 값을 주고싶다면 `rgba()` 함수를 사용하는 게 편하다.

그런데 `rgba()` 함수는 10진수를 사용하기 때문에 매번 값을 변환해줘야 한다.


## 해결

scss에서는 그럴 필요 없다.

`rgba()` 함수에 16진수값을 넣으면 10진수로 바꿔준다.

```scss
$base-color: #c6538c;
$border-dark: rgba($base-color, 0.88);
$border-red: rgba(#fff, 0.1);

.alert {
  border: 1px solid $border-dark;
  background-color: $border-red;
}
```

컴파일하면,

```css
.alert {
  border: 1px solid rgba(198, 83, 140, 0.88);
  background-color: rgba(255, 255, 255, 0.1);
}
```
