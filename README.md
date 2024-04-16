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
