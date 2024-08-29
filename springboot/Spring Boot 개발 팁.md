## 디렉토리 구조

- web/request
  - request 객체. 
  - controller 메서드의 파라미터로 사용. `toEntity()` 메서드를 통해 entity로 변환하여 서비스 레이어에 전달.

## 읽기 컨트롤러와 쓰기 컨트롤러 분리

`@RequestMapping`을 사용한다.

view와 edit을 분리하여 두 개의 컨트롤러로 관리할 때 view는 `method = RequestMethod.GET` 으로 처리, edit은 디폴트로 처리하면 method에 따라 매핑되는 컨트롤러가 달라진다.
