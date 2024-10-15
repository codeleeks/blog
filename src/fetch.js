import { defer } from 'react-router'

const config = {
  token: process.env.VITE_GITHUB_ACCESS_TOKEN,
  owner: 'codeleeks',
  repo: 'blog',
  postsBranch: 'codeleeks-posts',
  snippetsBranch: 'codeleeks-snippets',
}

const testData = {
  sha: '4c9bd960df194ba150815da01865945098984bfe',
  url: 'https://api.github.com/repos/codeleeks/blog/git/trees/4c9bd960df194ba150815da01865945098984bfe',
  tree: [
    {
      path: '.gitignore',
      mode: '100644',
      type: 'blob',
      sha: 'bdfa6b815298631d446ae10b8f2783adb5b49835',
      size: 22,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/bdfa6b815298631d446ae10b8f2783adb5b49835',
    },
    {
      path: 'README.md',
      mode: '100644',
      type: 'blob',
      sha: '3f758bc95b23d3605a2a4dece8a84af679ce4099',
      size: 1493,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/3f758bc95b23d3605a2a4dece8a84af679ce4099',
    },
    {
      path: 'database',
      mode: '040000',
      type: 'tree',
      sha: '7f0b1f2ca389d0d7c196f1bb75c25c6be0e5403b',
      url: 'https://api.github.com/repos/codeleeks/blog/git/trees/7f0b1f2ca389d0d7c196f1bb75c25c6be0e5403b',
    },
    {
      path: 'database/elasticsearch',
      mode: '040000',
      type: 'tree',
      sha: 'e977f2b7c294e214d35ad1b4b14e8aef39b32b7d',
      url: 'https://api.github.com/repos/codeleeks/blog/git/trees/e977f2b7c294e214d35ad1b4b14e8aef39b32b7d',
    },
    {
      path: 'database/elasticsearch/ElasticSearch SSL 적용하기.md',
      mode: '100644',
      type: 'blob',
      sha: '2d10b8f7936a67a7d1d5c0fecfcf80a2f2ec8f5f',
      size: 13933,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/2d10b8f7936a67a7d1d5c0fecfcf80a2f2ec8f5f',
    },
    {
      path: 'database/elasticsearch/ElasticSearch로 검색하기.md',
      mode: '100644',
      type: 'blob',
      sha: '88a145f3d0062431e3e3485cc2a293c703e189af',
      size: 51572,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/88a145f3d0062431e3e3485cc2a293c703e189af',
    },
    {
      path: 'database/elasticsearch/JPA와 ElasticSearch.md',
      mode: '100644',
      type: 'blob',
      sha: '3e415bb8b74a08c86526bb8ed6d73836f0a015e1',
      size: 3014,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/3e415bb8b74a08c86526bb8ed6d73836f0a015e1',
    },
    {
      path: 'database/mysql',
      mode: '040000',
      type: 'tree',
      sha: 'b140e028defaa897d4335f18e32efc80e424f4ca',
      url: 'https://api.github.com/repos/codeleeks/blog/git/trees/b140e028defaa897d4335f18e32efc80e424f4ca',
    },
    {
      path: 'database/mysql/MySQL 락 파헤치기.md',
      mode: '100644',
      type: 'blob',
      sha: 'f4565e0010ce5ef52b19008014d99a3668e7bc4c',
      size: 7743,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/f4565e0010ce5ef52b19008014d99a3668e7bc4c',
    },
    {
      path: 'database/mysql/MySQL 인덱스 파헤치기.md',
      mode: '100644',
      type: 'blob',
      sha: '2d9d0d3299a504e3e45714eabacc2178428487a0',
      size: 21507,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/2d9d0d3299a504e3e45714eabacc2178428487a0',
    },
    {
      path: 'database/sql',
      mode: '040000',
      type: 'tree',
      sha: 'ca7c47ce91b2167c221eb64cd86f9e5877165f0b',
      url: 'https://api.github.com/repos/codeleeks/blog/git/trees/ca7c47ce91b2167c221eb64cd86f9e5877165f0b',
    },
    {
      path: 'database/sql/SQL 완벽 정리.md',
      mode: '100644',
      type: 'blob',
      sha: 'e59cc3f9532d8a12516982d7246638b6510dbfed',
      size: 27200,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/e59cc3f9532d8a12516982d7246638b6510dbfed',
    },
    {
      path: 'database/정규화 종류.md',
      mode: '100644',
      type: 'blob',
      sha: '97bf21a48328c8b697c897c5d4270d01e78e64a9',
      size: 3965,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/97bf21a48328c8b697c897c5d4270d01e78e64a9',
    },
    {
      path: 'database/키 종류.md',
      mode: '100644',
      type: 'blob',
      sha: '4e4ec56f40db45be48bad22c29c9cbf42da92621',
      size: 2044,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/4e4ec56f40db45be48bad22c29c9cbf42da92621',
    },
    {
      path: 'database/트랜잭션 격리 수준.md',
      mode: '100644',
      type: 'blob',
      sha: '45ff2e2234c0b9b1b3d89cdb1a9a08c9a36578ac',
      size: 3055,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/45ff2e2234c0b9b1b3d89cdb1a9a08c9a36578ac',
    },
    {
      path: 'examples',
      mode: '040000',
      type: 'tree',
      sha: '77e24fc5447c9483750bd0406242506ce063a7a5',
      url: 'https://api.github.com/repos/codeleeks/blog/git/trees/77e24fc5447c9483750bd0406242506ce063a7a5',
    },
    {
      path: 'examples/ElasticSearch를 활용하여 자동완성 검색 기능 구현하기.md',
      mode: '100644',
      type: 'blob',
      sha: '1d8e2d14ab171cb3fc9b181363286d01a8b2b2ad',
      size: 6895,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/1d8e2d14ab171cb3fc9b181363286d01a8b2b2ad',
    },
    {
      path: 'examples/토큰 기반 로그인 예제.md',
      mode: '100644',
      type: 'blob',
      sha: 'e2dcde4800af6862b152722b789ac4827e6a5487',
      size: 17276,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/e2dcde4800af6862b152722b789ac4827e6a5487',
    },
    {
      path: 'frontend',
      mode: '040000',
      type: 'tree',
      sha: '9b09e98c256cb5e645275042182283fd8995a433',
      url: 'https://api.github.com/repos/codeleeks/blog/git/trees/9b09e98c256cb5e645275042182283fd8995a433',
    },
    {
      path: 'frontend/Babel에 대하여.md',
      mode: '100644',
      type: 'blob',
      sha: '3be9fe70c08c3e93530c40205a7fd81725fdba0e',
      size: 2598,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/3be9fe70c08c3e93530c40205a7fd81725fdba0e',
    },
    {
      path: 'frontend/TODO 프론트엔드 면접 질문.md',
      mode: '100644',
      type: 'blob',
      sha: '22d6a51bda94478566d18af3561c6ee441162628',
      size: 7574,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/22d6a51bda94478566d18af3561c6ee441162628',
    },
    {
      path: 'frontend/javascript',
      mode: '040000',
      type: 'tree',
      sha: 'c19c9cfd74220424a9682ac19fcc301a465c80ef',
      url: 'https://api.github.com/repos/codeleeks/blog/git/trees/c19c9cfd74220424a9682ac19fcc301a465c80ef',
    },
    {
      path: 'frontend/javascript/자바스크립트 완벽 정리.md',
      mode: '100644',
      type: 'blob',
      sha: '855da7008f95b9e612a733661e58b72b04b732dd',
      size: 20514,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/855da7008f95b9e612a733661e58b72b04b732dd',
    },
    {
      path: 'frontend/javascript/정규표현식 완벽 정리.md',
      mode: '100644',
      type: 'blob',
      sha: '0e04c5ae45b5862f6ca25cb470aba186c4cf50c8',
      size: 3562,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/0e04c5ae45b5862f6ca25cb470aba186c4cf50c8',
    },
    {
      path: 'frontend/react',
      mode: '040000',
      type: 'tree',
      sha: 'c46cba4c0a374e71d31ae4e6e9cf0b45d8a611ab',
      url: 'https://api.github.com/repos/codeleeks/blog/git/trees/c46cba4c0a374e71d31ae4e6e9cf0b45d8a611ab',
    },
    {
      path: 'frontend/react/CRA 없이 리액트 프로젝트 만들기.md',
      mode: '100644',
      type: 'blob',
      sha: 'c43a674f7115f8862d694588e9f7c2afa2ab8e19',
      size: 5547,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/c43a674f7115f8862d694588e9f7c2afa2ab8e19',
    },
    {
      path: 'frontend/react/React에서 querySelector 사용하기.md',
      mode: '100644',
      type: 'blob',
      sha: 'd2ad6a3faed98810f0dc1d507edc5cbb28f8661c',
      size: 2615,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/d2ad6a3faed98810f0dc1d507edc5cbb28f8661c',
    },
    {
      path: 'frontend/react/react 완벽 정리.md',
      mode: '100644',
      type: 'blob',
      sha: 'd48c6fb3732e0446f2c2d9931806b3ed3686108f',
      size: 43564,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/d48c6fb3732e0446f2c2d9931806b3ed3686108f',
    },
    {
      path: 'frontend/scss',
      mode: '040000',
      type: 'tree',
      sha: '72838f6074501419b3a2e0ded733edba8cbc696d',
      url: 'https://api.github.com/repos/codeleeks/blog/git/trees/72838f6074501419b3a2e0ded733edba8cbc696d',
    },
    {
      path: 'frontend/scss/SCSS 완벽 정리.md',
      mode: '100644',
      type: 'blob',
      sha: '98a76d966c2f2847ff302dfbc0644b0fdd47737d',
      size: 4337,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/98a76d966c2f2847ff302dfbc0644b0fdd47737d',
    },
    {
      path: 'frontend/typescript',
      mode: '040000',
      type: 'tree',
      sha: '8666eaa33c7812faa595a09f4b14f4723b0fe7ec',
      url: 'https://api.github.com/repos/codeleeks/blog/git/trees/8666eaa33c7812faa595a09f4b14f4723b0fe7ec',
    },
    {
      path: 'frontend/typescript/typescript 완벽 정리.md',
      mode: '100644',
      type: 'blob',
      sha: '5e464ca30a9dfc8e1eaee839db7a523cd768be04',
      size: 9755,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/5e464ca30a9dfc8e1eaee839db7a523cd768be04',
    },
    {
      path: 'java',
      mode: '040000',
      type: 'tree',
      sha: 'b8ab9c2ac9d41f0528525c1b47dd95e1253252bc',
      url: 'https://api.github.com/repos/codeleeks/blog/git/trees/b8ab9c2ac9d41f0528525c1b47dd95e1253252bc',
    },
    {
      path: 'java/람다캡처링과 클로저.md',
      mode: '100644',
      type: 'blob',
      sha: '27e9d10eda1c96bc23c18269b595c7eb59a9265c',
      size: 2726,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/27e9d10eda1c96bc23c18269b595c7eb59a9265c',
    },
    {
      path: 'java/자바 관련 용어 정리.md',
      mode: '100644',
      type: 'blob',
      sha: '7aa99bc484d2280ca4d32bcf39e17809193b204d',
      size: 6149,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/7aa99bc484d2280ca4d32bcf39e17809193b204d',
    },
    {
      path: 'libraries',
      mode: '040000',
      type: 'tree',
      sha: '262aa2c5b3215e23036630a73fd307422e2d5afe',
      url: 'https://api.github.com/repos/codeleeks/blog/git/trees/262aa2c5b3215e23036630a73fd307422e2d5afe',
    },
    {
      path: 'libraries/gsap.md',
      mode: '100644',
      type: 'blob',
      sha: 'c3f43bf068d4e01fbcda67a13d63753d2b02eff8',
      size: 1152,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/c3f43bf068d4e01fbcda67a13d63753d2b02eff8',
    },
    {
      path: 'libraries/lodash.md',
      mode: '100644',
      type: 'blob',
      sha: 'fb1fe70d8f4aefabac28d26249f9da7b1a937b1c',
      size: 1135,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/fb1fe70d8f4aefabac28d26249f9da7b1a937b1c',
    },
    {
      path: 'libraries/swiper.md',
      mode: '100644',
      type: 'blob',
      sha: '7978f071f39b4ff8d719a4460df95b5cb312312e',
      size: 1904,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/7978f071f39b4ff8d719a4460df95b5cb312312e',
    },
    {
      path: 'springboot',
      mode: '040000',
      type: 'tree',
      sha: 'ecff94db8bb5d7e3f6833ab96b1e8559d1367518',
      url: 'https://api.github.com/repos/codeleeks/blog/git/trees/ecff94db8bb5d7e3f6833ab96b1e8559d1367518',
    },
    {
      path: 'springboot/@Transactional 완벽 정리.md',
      mode: '100644',
      type: 'blob',
      sha: '80e8a8c762c19c1b7cad7f094cc2c179f4d2504e',
      size: 4645,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/80e8a8c762c19c1b7cad7f094cc2c179f4d2504e',
    },
    {
      path: 'springboot/JPA 완벽 정리.md',
      mode: '100644',
      type: 'blob',
      sha: '557b5373ab09000b58c134ee8b14f03ac67a48a6',
      size: 82451,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/557b5373ab09000b58c134ee8b14f03ac67a48a6',
    },
    {
      path: 'springboot/JPA 트러블슈팅.md',
      mode: '100644',
      type: 'blob',
      sha: 'dbfb4373c1e5ed5138bbbd5caaea1616ffa66e0b',
      size: 5303,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/dbfb4373c1e5ed5138bbbd5caaea1616ffa66e0b',
    },
    {
      path: 'springboot/N+1 문제.md',
      mode: '100644',
      type: 'blob',
      sha: '2b44f3d7749a90efcdf37827c720b6f685ae4e45',
      size: 11686,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/2b44f3d7749a90efcdf37827c720b6f685ae4e45',
    },
    {
      path: 'springboot/OneToMany와 ManyToOne 비교하기.md',
      mode: '100644',
      type: 'blob',
      sha: 'd50f7b5b7ea08603f29189f316adfa8aec8f44ea',
      size: 5960,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/d50f7b5b7ea08603f29189f316adfa8aec8f44ea',
    },
    {
      path: 'springboot/QueryDSL 레시피.md',
      mode: '100644',
      type: 'blob',
      sha: '0ebf7cb4d1ca993ce5ea7f6e4e0ebc855b254467',
      size: 41502,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/0ebf7cb4d1ca993ce5ea7f6e4e0ebc855b254467',
    },
    {
      path: 'springboot/Spring DB 완벽 정리.md',
      mode: '100644',
      type: 'blob',
      sha: '9f3ca43b74a4a3d001e1f4693a53b75c0c486d49',
      size: 54643,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/9f3ca43b74a4a3d001e1f4693a53b75c0c486d49',
    },
    {
      path: 'springboot/Spring Data JPA 완벽 정리.md',
      mode: '100644',
      type: 'blob',
      sha: '35b542c8508539b7773514643644e1edb0d996c9',
      size: 31035,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/35b542c8508539b7773514643644e1edb0d996c9',
    },
    {
      path: 'springboot/Spring MVC 완벽 정리.md',
      mode: '100644',
      type: 'blob',
      sha: '43ba21d71bf7e2554f10f3f4d62cba92e76c02a1',
      size: 38871,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/43ba21d71bf7e2554f10f3f4d62cba92e76c02a1',
    },
    {
      path: 'springboot/Spring Test.md',
      mode: '100644',
      type: 'blob',
      sha: '35e7b699bca81a6c65d5a18baa8d442b845adcb7',
      size: 15062,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/35e7b699bca81a6c65d5a18baa8d442b845adcb7',
    },
    {
      path: 'springboot/Spring Thread Local 완벽 정리.md',
      mode: '100644',
      type: 'blob',
      sha: '496a923344e5f2455d2075f00cf70354eb67afec',
      size: 3714,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/496a923344e5f2455d2075f00cf70354eb67afec',
    },
    {
      path: 'springboot/SpringBoot 완벽 정리.md',
      mode: '100644',
      type: 'blob',
      sha: '66573fdb068f7bbfc128cb311f7cf2126ae77dc4',
      size: 48147,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/66573fdb068f7bbfc128cb311f7cf2126ae77dc4',
    },
    {
      path: 'springboot/Spring에서 부가 기능을 추가하는 방법.md',
      mode: '100644',
      type: 'blob',
      sha: 'c5c1e5017f99bc6d85793a0b9bf757e496c2b860',
      size: 53225,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/c5c1e5017f99bc6d85793a0b9bf757e496c2b860',
    },
    {
      path: 'springboot/Spring의 기본.md',
      mode: '100644',
      type: 'blob',
      sha: '441ce62e12f3c00f85f69e10b231450cc03f74b2',
      size: 21700,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/441ce62e12f3c00f85f69e10b231450cc03f74b2',
    },
    {
      path: 'springboot/요청 데이터 검증(Validate)하기.md',
      mode: '100644',
      type: 'blob',
      sha: '2b2752e6e93d82797be14bf5c634f201d7d394c2',
      size: 14711,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/2b2752e6e93d82797be14bf5c634f201d7d394c2',
    },
    {
      path: 'springboot/커서 페이징 구현하기.md',
      mode: '100644',
      type: 'blob',
      sha: '11e6619ee2aaee345025395cbc18ee424d5cde9b',
      size: 18911,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/11e6619ee2aaee345025395cbc18ee424d5cde9b',
    },
    {
      path: 'springboot/팬텀리드, 논리피터블리드.md',
      mode: '100644',
      type: 'blob',
      sha: '430860cac7851fd1c248d5ee5996d752e03511b4',
      size: 8701,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/430860cac7851fd1c248d5ee5996d752e03511b4',
    },
    {
      path: 'web-terminology',
      mode: '040000',
      type: 'tree',
      sha: 'af5fc214a33aa28ac49f1062c67376d554965ce8',
      url: 'https://api.github.com/repos/codeleeks/blog/git/trees/af5fc214a33aa28ac49f1062c67376d554965ce8',
    },
    {
      path: 'web-terminology/CORS.md',
      mode: '100644',
      type: 'blob',
      sha: '6dbe2bb5414d1ad40cb70e12f5bd0ddfc7f1823a',
      size: 2477,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/6dbe2bb5414d1ad40cb70e12f5bd0ddfc7f1823a',
    },
    {
      path: 'web-terminology/RESTful API 완벽 정리.md',
      mode: '100644',
      type: 'blob',
      sha: 'c5cf94277d2bf108c67a1177ee9e6986d1047f47',
      size: 9723,
      url: 'https://api.github.com/repos/codeleeks/blog/git/blobs/c5cf94277d2bf108c67a1177ee9e6986d1047f47',
    },
  ],
  truncated: false,
}

export function extractHeader(key, contents) {
  let matched = /(?<=---)(.*?)(?=---)/gs.exec(contents)
  if (!matched) return undefined
  let header = matched[1]

  matched = undefined
  switch (key) {
    case 'summary':
      matched = /(?<=summary:)(.*?)(?=\n)/g.exec(header)
      break
    case 'date':
      matched = /(?<=date:)(.*?)(?=\n)/g.exec(header)
      break
    case 'title-image':
      matched = /(?<=title-image: \')(.*?)(?=\'\n)/g.exec(header)
      break
    default:
      break
  }
  if (!matched) return undefined

  let value = matched[1]

  for (let index = 0; index < value.length; index++) {
    if (value[index] !== ' ') {
      value = value.slice(index)
      break
    }
  }
  return value
}

function extractCategory(path) {
  const last = path.lastIndexOf('/')
  const category = path.substring(0, last)
  return category
}

function extractTitle(path) {
  const last = path.lastIndexOf('/')
  const ext = path.lastIndexOf('.md')
  const title = path.substring(last + 1, ext)
  return title
}

export function removeHeaderFromContents(contents) {
  const regex = /-{3}\n(.*?)-{3}\n/gs
  const matched = regex.exec(contents)
  if (!matched) return contents

  const removed = contents.replace(regex, '')
  let removedLineFeed = removed
  for (let index = 0; index < removed.length; index++) {
    const element = removed[index]
    if (element !== '\n') {
      removedLineFeed = removedLineFeed.slice(index)
      break
    }
  }

  return removedLineFeed
}

export async function fetchPost(path) {
  const { owner, repo, token, postsBranch } = config
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${postsBranch}`

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github.raw+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!resp.ok) {
    throw new Error(`could not fetch contents ${path}`)
  }

  const contents = new TextDecoder().decode(
    new Uint8Array(await resp.arrayBuffer())
  )

  return {
    contentsWithoutHeader: removeHeaderFromContents(contents),
    title: extractTitle(path),
    category: extractCategory(path),
    summary: extractHeader('summary', contents),
    date: extractHeader('date', contents),
    titleImage: extractHeader('title-image', contents),
  }
}

export async function fetchPosts() {
  const { owner, repo, token, postsBranch } = config

  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${postsBranch}?recursive=true`

  // return fetch(url, {
  //   method: 'GET',
  //   headers: {
  //     Accept: 'application/vnd.github+json',
  //     Authorization: `Bearer ${token}`,
  //     'X-Github-Api-Version': '2022-11-28',
  //   },
  // })

  return Promise.resolve(testData).then((json) => {
    const { tree } = json
    const posts = tree
      .filter(
        (t) =>
          t.mode === '100644' &&
          t.path.endsWith('.md') &&
          t.path !== 'README.md'
      )
      .map((cur) => {
        const post = {
          ...cur,
          title: extractTitle(cur.path),
          category: extractCategory(cur.path),
          fetchContents(callback) {
            fetchPost(cur.path).then((post) => {
              const { summary, date, titleImage } = post
              this.summary = summary
              this.date = date
              this.titleImage = titleImage

              callback(this)
            })
          },
        }

        return post
      })

    return posts
  })
}

export function postsLoader() {
  return defer({ posts: fetchPosts() })
}

export function postContentsLoader({ params }) {
  return defer({
    contents: fetchPost(params['*']),
    articles: fetchPosts(),
  })
}
