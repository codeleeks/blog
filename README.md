# Blog

저의 개발 블로그 입니다.

이 [링크](https://codeleeks.github.io/blog/)로 접속하여 구경해 보세요.

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white) ![SASS](https://img.shields.io/badge/SASS-hotpink.svg?style=for-the-badge&logo=SASS&logoColor=white) ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E) ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white) ![Markdown](https://img.shields.io/badge/markdown-%23000000.svg?style=for-the-badge&logo=markdown&logoColor=white)

## 기능

### 블로그

- [ ] 포스트
  - [ ] 카테고리
  - [ ] 좋아요
  - [ ] 코멘트
- [ ] 프롤로그
- [ ] 검색 기능
- [ ] 로그인
- [ ] 통계

### 인프라

- [ ] AWS 마이그레이션
- [ ] 모니터링 구축
- [ ] 로그 구축
- [ ] 구글에 검색 노출
- [ ] 네이버에 검색 노출


## 상세 기능

### 포스트 기능

#### 기본 기능
- 포스트를 클릭하여 포스트 내용을 볼 수 있다.
- 어드민만 포스트를 수정할 수 있다.
  - 어드민으로 로그인해야만 포스트를 수정하는 방법이 보여진다. (어드민 페이지로 이동)
- 포스트를 에디터로 수정할 수 있다.
  - 제공되는 커스텀 컴포넌트를 간편하게 추가할 수 있다.
  - 포스트의 타이틀 이미지를 등록할 수 있다.
  - 포스트 내용 중 이미지를 등록할 수 있다.
- 수정된 내용을 마크다운이 컴파일된 프리뷰로 볼 수 있다.

#### 카테고리
- 등록된 카테고리 전체를 한 번에 볼 수 있다.
- 카테고리 필터로 매칭하는 포스트만 보여줄 수 있다.
- 카테고리는 다른 카테코리를 포함할 수 있다.
  - 포스트는 계층적인 카테고리 안에 포함될 수 있다. DB 카테고리에는 SQL 카테고리가 있을 수 있다. SQL 포스트는 DB 카테고리로 필터링해도 보이고, SQL 카테고리로 필터링해도 보인다.

#### 좋아요 기능
- 임의의 사용자는 포스트에 좋아요를 할 수 있다.

#### 코멘트 기능
- 임의의 사용자는 포스트에 댓글을 달 수 있다.
  - 사용자는 이름과 내용을 적는다.

### 프롤로그 기능
- 전체 포스트를 몇 개로 쪼개서 보여줄 수 있다. (페이지네이션)
- 다음 몇 개를 볼 수 있는 방법을 제공한다.

### 검색 기능
- 사용자는 포스트 내용, 포스트 제목을 검색할 수 있다.
- 검색은 자동완성 기능을 제공한다.
  - 포스트 제목은 글자 단위의 자동완성 기능을 제공한다.
  - 포스트 내용은 단어 단위의 자동완성 기능을 제공한다.

### 로그인 기능
- 어드민 계정의 아이디 패스워드를 체크한다.
- 로그인 이후에만 어드민 페이지에 접속할 수 있다.
  - 어드민 페이지로 이동하는 방법은 로그인 이후에만 보여진다.
  - URL로 직접 접속 시도하더라도 로그인이 되어 있는 경우에만 접속을 허용한다.
- 로그인 세션은 만료 시간을 갖는다.
  - 서버로 API 요청이 발생하면 시간이 연장된다.

### 통계 기능
- 조회수 통계를 제공한다.
  - 전체 기간 포스트 당 조회수 집계
    - 일별 통계, 월별 통계
- 좋아요 통계를 제공한다.
  - 전체 기간 포스트 당 좋아요 집계
    - 일별 통계, 월별 통계
- 포스트 통계를 제공한다.
  - 전체 포스트 글자수. (코드 포함, 코드 제외)
  - 포스트 갯수.
  - 카테고리별 포스트 글자수.
  - 카테고리별 포스트 갯수.

## 도메인 설계

![image](https://github.com/user-attachments/assets/cd5c2e94-6966-408b-96b7-7b7ad2b77e06)


## API 설계

[Swagger Docs](https://codeleeks.github.io/blog-api-docs/)

## 테스트 환경

### in-memory DB를 통한 단위 테스트

postgresql의 in-memory test는 `testcontainer`가 필요함.
`testcontainer`는 호스트의 도커가 필요한데, windows 환경에서 hyper-v를 쓰려면 OS 버전이 Pro 이상이어야 함.

h2 in memory db로 대체함.

## 배포

배포는 `github pages`를 사용했다.

메인 브랜치에 머지 혹은 푸시가 발생하면, `vite`에서 제공하는 github action 스크립트를 통해 페이지를 배포한다.

## 이슈 & 고려 사항

[BACKLOG 링크](https://github.com/codeleeks/blog/blob/main/BACKLOG.md)
