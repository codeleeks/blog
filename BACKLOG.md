## 개발 기록

### 포스트 보여주기

`markdown`으로 작성하고 깃헙에 업로드하면, 이를 가져와 `react-markdown`으로 보여준다.

커스텀 스타일링을 거의 하지 않고, 제공되는 라이브러리를 사용했다.

- `rehype-highlight, highlight.js, rehype-raw`

> 2024.05.16 마크다운 렌더링 로직 업데이트

`react-markdown`을 버리고, `mdx`를 도입한다.

`메시지박스`와 같이 커스텀 UI를 제공하고 싶을 때, `mdx`가 유리하기 때문이다.

### 목차(Table Of Contents) 만들기

#### 정규표현식

`heading`만을 추출하여, \# 갯수(level)와 heading 텍스트를 객체로 저장한다.

level에 따라 `padding-left`를 다르게 적용한다.

`React-Markdown`이 html 변환 과정에서 삽입한 id와 동일하게 href에 지정하기 위해 `rehype-slug`가 내부적으로 사용하는 `github slugger`를 anchor의 href로 지정한다.

#### gsap을 통한 scroll 애니메이션

요소 클릭시 handler에서 `gsap.to` 호출한다.

`gsap`을 통해 부드러운 스크롤 애니메이션을 구현했다.

#### sticky로 뷰포트에 고정하기

`flex`로 nav, section, aside(목차)를 나눈 상태에서 nav와 aside 영역을 sticky로 지정하려 한다.

교차축 정렬이 `stretch`로 되어 있기 때문에 주어진 height를 다 쓴다.

이렇게 되면 sticky 오퍼레이션이 적용되지 않는다.

`align-items: flex-start`로 height를 컨텐츠만큼 줄여준다.

#### TOC 컴포넌트의 scroll spy 기능 관련 이슈 해결

포스트 컴포넌트: 포스트 내용(markdown) -> html로 컴파일

TOC 컴포넌트: 포스트 html -> heading 태그 추출 -> intersecion observer에 등록.

이슈: intersection observer가 정상적으로 동작하지 않음

원인: 포스트 컴포넌트와 TOC 컴포넌트의 의존성 문제 때문. (TOC 컴포넌트는 포스트 컴포넌트의 렌더링이 필요. 마크다운 -> html로 변환 후 html heading element가 필요)

해결1: 포스트 컴포넌트(정확히 말하면 하위의 markdown 컴포넌트)에서 useEffect 안에 querySelector()로 heading element 리스트 조회 후 TOC 컴포넌트에 넘긴다.

해결1의 문제: querySelector()는 DOM 트리 구조에 종속적이기 때문에 좀 더 유연한 방법을 찾으면 좋을 것 같다.

해결2: markdown 컴포넌트의 부모컴포넌트(ArticleContents)에서 MarkdownnView 컴포넌트를 div로 wrapping하고, 이 div를 useRef로 연결한다. 그리고 ArticleContents에서 callback 함수를 정의하고, 이 콜백함수에서 ref를 활용하여 childNodex를 얻고, heading만 필터링한 뒤 intersection observer에 등록한다. MarkdownView 컴포넌트가 마크다운 컨텐츠를 컴파일하면 ArticleContents의 callback 함수를 호출한다.

useRef로 querySelector()를 통한 html 구조에 종속적인 코드를 제거할 수 있었다.

[관련 커밋](192f480)


### 메시지 박스 만들기

메시지 박스는 Notice나 주의 사항을 표시하는 안내문을 말한다.

<메시지박스예시>![메시지 박스 예시](./src/assets/메시지박스.png)

#### React Markdown feasibility

아쉽게도 특정 문자열 패턴에 대한 컴포넌트 주입 기능은 없었다.

그래서 리액트 컴포넌트로 만들 수 없었고, 문자열 보간으로 구현했다.

#### 유틸리티 함수 작성

포스트에 `///`라고 작성하면, 이를 메시지 박스 영역으로 가정한다.

해당 영역들을 포스트에서 모두 찾아서 필요한 내용을 추출했다.

메시지 박스 영역을 찾는 방법은 `indexOf`를 활용했고, 메시지 박스 안에서 필요한 내용을 추출하는 방법은 정규표현식을 사용했다.

하나의 정규식으로 메시지 박스 영역과 필요 내용을 추출하는 것은 쉽지 않았다.

#### 스타일링

메시지 유형(레벨)을 나타내는 아이콘과 제목 부분 높이를 맞추는 게 핵심이다.

제목 부분은 `padding`으로 박스 내에서 위치를 잡았다. 아이콘은 `before` 가상클래스를 사용하고, `absolute` 포지션을 통해 위치를 잡아 제목 부분과 높이를 맞췄다.

### PostPage 만들기

`flex` 컨테이너 내의 아이템은 `sticky` 포지션이더라도 flex 영역을 차지한다.

반응형을 위해 nav, aside 영역을 숨겨야 할 때, `translate`로 옮겨도 이전 영역을 차지하고 있다.

방법은 `fixed`로 flex 밖으로 벗어나 버린다.

`sticky` 영역은 블록 쌓임 맥락을 지키면서 위치를 잡는다. 상위에 블록 요소가 있을 때 그 height의 밑에 쌓이게 된다. 스크롤 요소가 body이고 `top: 0`으로 잡아도 상위 블록 요소의 height 위치에 자리잡는다.

### navigation Toggling UI 만들기

nav 요소는 scroll-contents, toggler, bg 로 구성한다.

nav는 flex로 지정하여 각 자식 요소를 가로로 배치한다.

nav는 sticky, toggler는 absolute, bg는 fixed로 위치를 잡는다.

scroll-contents는 특정 화면 너비에 진입하면 `translate(-100%, 0)`을 통해 화면 밖으로 이동하고(사라지고), nav는 fixed로 변경된다. 이에 따라 toggler는 nav의 위치 기준으로 위치를 변경한다.(최좌측)

toggler를 클릭하면 nav의 class에 `nav--open`을 토글하여, scroll-contents가 `translate(0,0)` 을 통해 제자리로 돌아온다.

- 돌아올 때는 toggler가 바로 우측에 위치할 수 있도록 scroll-contents의 width를 지정해준다.

z-index는 쌓임 맥락에 따라 bg가 다른 요소를 흐림 처리할 수 있도록 적당히 지정한다.

### anchor를 통한 heading 이동시 강조 애니메이션 추가

table of contents에서 특정 anchor 클릭시 상응하는 heading으로 스크롤한다.

이 때, 해당 heading에 highlight 컬러를 씌워서 스크롤하는 목표가 해당 요소임을 보여준다.

component 내의 로컬 변수로 slug를 저장하려고 했으나 실패했다.

- useRef는 타이머를 잘 제거했지만, 문자열 변수는 이전 값을 제대로 저장하지 못했다.
- local 변수로도 처리할 수 없었다.

전역 변수로 처리하여 이전 slug의 클래스를 제거했다.

### 어떤 걸 테스트로 넣어야 할까?

이슈가 발생했던 부분을 테스트로 만들기로 했다. (regression test)

예를 들면, 깃헙 이슈로 등록했던 아래 항목들이다.

1. 메시지 박스에서 body 내용이 보여야 함. (https://github.com/codeleeks/blog/issues/6)
2. 포스트 클릭시 포스트 내용이 나와야 함. (https://github.com/codeleeks/blog/issues/2)
3. 포스트의 테이블이 존재할 때, 테이블의 width가 포스트 영역의 width보다 작아야 함. (https://github.com/codeleeks/blog/issues/4)
4. 메시지 박스 내의 code 태그의 width가 메시지 박스의 width보다 작아야 함 (https://github.com/codeleeks/blog/issues/7)

등등.

#### react testing library가 충분하지 않은 이유

이슈 목록을 보면 여러 컴포넌트에 걸친 테스트가 필요한 케이스가 대부분이다.

포스트 페이지만 해도, aside, contents, nav가 자식 컴포넌트로 구성되어 있고, 각각은 또한 여러 뎁스의 자식 컴포넌트를 갖고 있다.

shallow rendering만 가능한 react testing library는 모든 케이스를 커버하기에 충분하지 않다고 판단했다.

충분히 커버하려면 사용자에게 실제 보여지는 화면을 사용자처럼 상호작용해가며 테스트하는 라이브러리를 추가적으로 사용해야 했다.

그래서 cypress도 추가하기로 결정했다.

[테스팅라이브러리 비교](https://haragoo30.medium.com/%ED%85%8C%EC%8A%A4%ED%8A%B8-%EB%9D%BC%EC%9D%B4%EB%B8%8C%EB%9F%AC%EB%A6%AC-%ED%94%84%EB%A0%88%EC%9E%84%EC%9B%8C%ED%81%AC-%EC%A1%B0%EC%82%AC-9ae863c6e1b)

### 깃헙 에디터 vs 커스텀 에디터

- 깃헙에디터
  - 장점
    - 포스트 내용에 이미지를 손쉽게 업로드할 수 있다.(클립보드에서 복사붙여넣기가 가능)
    - 깃헙이 업로드된 이미지를 관리한다. 이미지 저장용 디스크가 필요없다.
  - 단점
    - 당연한 얘기지만 커스텀 컴포넌트에 대한 프리뷰를 지원하지 않는다.
- 커스텀 에디터
  - 장점
    - 내가 개발하기 때문에 필요한 기능을 다 넣을 수 있다.(특히 커스텀 컴포넌트)
  - 단점
    - 인프라 세팅이 필요하거나 추가 개발이 필요하다. (이미지 저장 관리, 에디터 개발 등...)
    - 인프라 세팅시 비용이 들어갈 수 있다.

## 리팩토링

프로토타입 개발 완료 후 리팩토링을 진행합니다.

- SCSS 파일을 기능 별로 분리
- 컴포넌트 재사용
- 불필요 코드 제거

### SCSS 파일 분리

scss에서는 `partials`를 지원한다.

파일을 분리하되, 각 파일을 컴파일하지 않고 하나의 scss로 만든 뒤 컴파일한다.

성능, 관리 상의 이점을 볼 수 있다.

메인 파일 이외의 scss 파일은 이름 앞에 `_`를 붙인다.

#### 이슈

vscode에서 css variable의 code navigtaion이 동작하지 않는다.

깃헙에 [이슈](https://github.com/microsoft/vscode/issues/212064) 제기를 한 상태이다.

workaround로는 scss variable를 쓰는 방법이 있다.
