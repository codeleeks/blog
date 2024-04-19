# Blog

## URL

[Go to blog](https://codeleeks.github.io/blog/)

## 기술 설명

- markdown으로 포스팅.
  - view: `react-markdown, rehype-highlight, highlight.js, rehype-raw`
  - post: `github.js` thanks to [this gist](https://gist.github.com/maskaravivek/a477c2c98651bdfbda5b99a81b261c37#file-twt-1b5e2427-e5fc-49c4-a29e-a305fce63aab-js)
- `vite` 사용.

  - github에 푸시 => github page 배포 (official github action)
  - 좋은점: `gh-pages` 패키지 설치 필요 없음

- `gsap`
  - scroll 애니메이션 적용.

## 기록

### 카테고리 포스트 목록 만들기

#### 묘하게 다른 두 도메인과 공통 컴포넌트

- 프롤로그와 카테고리 포스트는 프리뷰 포스트 형식을 쓴다는 점에서 도메인이 동일하다.
- 그러나 포스트 도메인은 프리뷰가 아니라 내용이 보여져야 한다.
- 두 도메인을 공통 컴포넌트인 `Post`로 묶기는 어려웠다.
- 우선 `PreviewPost`를 따로 만들어 분리하여 개발하고, 리팩토링할 때 공통 컴포넌트화할 수 있을지 고민한다.

#### 미리보기 구현 방법 연구 필요

- 기존 블로그에서 볼 수 있는 내용 미리보기 기능을 구현한다.
- 단순히 글 내용을 가져와 `overflow: hidden`으로 잘라버리면 될 거라 생각했다.
- `overflow: hidden`만으로는 어색하게 보이고, 마지막에 `...`과 같은 ellipsis도 나오지 않았다.
- 구글링해보니 `-webkit-box`라는게 있고, 이걸 활용해 아래와 같이 구현한다.

```css
display: -webkit-box;
-webkit-line-clamp: 10;
-webkit-box-orient: vertical;
overflow: hidden;
text-overflow: ellipsis '[...]';
```

- 잠깐 보니 여러 개의 `<li>`를 자식 엘리먼트로 생성하고, 줄마다 이를 hidden 처리하는 것처럼 보였다.

### 목차(Table Of Contents) 만들기

#### 정규표현식

- `heading`만을 추출하여, \# 갯수(level)와 heading 텍스트를 객체로 저장.
- level에 따라 `padding-left`를 다르게 적용.
- `rehype-slug`가 내부적으로 사용하는 `github slugger`를 anchor의 href로 지정
  - `React-Markdown`이 html 변환 과정에서 삽입한 id와 동일하게 href에 지정 가능.

#### gsap을 통한 scroll 애니메이션

- 클릭시 handler에서 `gsap.to` 호출.

#### sticky로 뷰포트에 고정하기
- ```flex```로 nav, section, aside(목차)를 나눈 상태에서 nav와 aside 영역을 sticky로 지정하려 한다.
- 교차축 정렬이 ```stretch```로 되어 있기 때문에 주어진 height를 다 쓴다.
- 이렇게 되면 sticky 오퍼레이션이 적용되지 않는다.
- ```align-items: flex-start```로 height를 컨텐츠만큼 줄여준다.

### 스타일링

#### font-size

- `clamp`를 이용하여 반응형으로 font size를 조절할 수 있다. 그런데 개인적으로 글자가 커졌다 작아졌다 하는게 좋아보이지 않는다.

#### heading color

- heading 태그 선택자에 `color` 속성을 넣지 않는 게 좋다.
- heading의 의미는 제목인데, 기술적으로 상관없지만 의미적으로 heading을 여러 군데에서 쓴다.
- 이때, hover시 `color`를 변경하는 애니메이션을 주려면, 기본적으로 color 속성이 없거나 메인으로 사용하는 font color와 동일해야 한다.
- 그렇지 않으면, heading과 엮여 있는 다른 태그의 font color와 동일한 타이밍에 color 변환을 하기 어려워진다.