# Blog

저의 개발 블로그 입니다.

이 [링크](https://codeleeks.github.io/blog/)로 접속하여 구경해 보세요.

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white) ![SASS](https://img.shields.io/badge/SASS-hotpink.svg?style=for-the-badge&logo=SASS&logoColor=white) ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E) ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white) ![Markdown](https://img.shields.io/badge/markdown-%23000000.svg?style=for-the-badge&logo=markdown&logoColor=white)

## 기능

### 블로그

- [ ] 검색 기능
- [ ] 코드 스니펫
- [ ] 글로벌 버튼
- [ ] 프롤로그에서 포스트 목록 페이지네이션
- [ ] SSR

### 어드민

- [ ] 로그인
- [ ] 로그아웃(+idle 타임아웃)
- [ ] 코드 스니펫 에디터
- [ ] 블로그 조회수
- [ ] 포스트별 조회수
- [ ] 카테고리별 조회수

### 인프라

- [ ] AWS 마이그레이션
- [ ] 모니터링 구축
- [ ] 로그 구축
- [ ] 구글에 검색 노출
- [ ] 네이버에 검색 노출

## 배포

배포는 `github pages`를 사용했다.

메인 브랜치에 머지 혹은 푸시가 발생하면, `vite`에서 제공하는 github action 스크립트를 통해 페이지를 배포한다.

## 테스트

### 어떤 걸 테스트로 넣어야 할까?

이슈가 발생했던 부분을 테스트로 만들기로 했다. (regression test)

예를 들면, 깃헙 이슈로 등록했던 아래 항목들이다.

1. 메시지 박스에서 body 내용이 보여야 함. (https://github.com/codeleeks/blog/issues/6)
2. 포스트 클릭시 포스트 내용이 나와야 함. (https://github.com/codeleeks/blog/issues/2)
3. 포스트의 테이블이 존재할 때, 테이블의 width가 포스트 영역의 width보다 작아야 함. (https://github.com/codeleeks/blog/issues/4)
4. 메시지 박스 내의 code 태그의 width가 메시지 박스의 width보다 작아야 함 (https://github.com/codeleeks/blog/issues/7)

등등.

### react testing library가 충분하지 않은 이유

이슈 목록을 보면 여러 컴포넌트에 걸친 테스트가 필요한 케이스가 대부분이다.

포스트 페이지만 해도, aside, contents, nav가 자식 컴포넌트로 구성되어 있고, 각각은 또한 여러 뎁스의 자식 컴포넌트를 갖고 있다.

shallow rendering만 가능한 react testing library는 모든 케이스를 커버하기에 충분하지 않다고 판단했다.

충분히 커버하려면 사용자에게 실제 보여지는 화면을 사용자처럼 상호작용해가며 테스트하는 라이브러리를 추가적으로 사용해야 했다.

그래서 cypress도 추가하기로 결정했다.

[테스팅라이브러리 비교](https://haragoo30.medium.com/%ED%85%8C%EC%8A%A4%ED%8A%B8-%EB%9D%BC%EC%9D%B4%EB%B8%8C%EB%9F%AC%EB%A6%AC-%ED%94%84%EB%A0%88%EC%9E%84%EC%9B%8C%ED%81%AC-%EC%A1%B0%EC%82%AC-9ae863c6e1b)
