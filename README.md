# 포스트 작성 규칙

1. 제목에 쉼표 포함시 띄어쓰기를 꼭 넣는다. (관련 이슈: https://github.com/codeleeks/blog/issues/1)
2. 줄바꿈을 위한 heading 삽입은 금지한다.
3. 타이틀 이미지 사이즈는 `872x470`으로 고정한다.

## message-box 작성 규칙

message-box는 내용상 주의 사항, 중요 공지 사항을 보여주는 UI이다.

![메시지박스 예시 이미지](https://raw.githubusercontent.com/codeleeks/blog/main/src/assets/%EB%A9%94%EC%8B%9C%EC%A7%80%EB%B0%95%EC%8A%A4.png)

```
///message-box --level=[info | warning]
title: [제목을 한 줄로 적는다.]
body: [바디는 텍스트, html 태그 등을 여러 줄로 적을 수 있다.]
///
```

### 예시

간단한 텍스트 예시
```
///message-box --level=info
title: [] 안에 특수기능문자가 들어가도 문자로서의 의미만 남고, 기능이 사라져버림. 
body: ., ?, * 등과 같은 특별한 의미의 문자도 []안에 들어가면 온점, 물음표, 별표에만 해당함.
///
```

html 태그를 포함한 예시
```
///message-box --level=warning
title: wildcard(와일드카드)가 모든 문자를 커버하지 않음.
body: 
개행문자는 커버하지 못함.
커버하려면 ```s``` 옵션을 줘야 함.
<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions/Character_classes#:~:text=Matches%20any%20single%20character%20except%20line%20terminators'>MDN 관련 링크</a>
///
```
