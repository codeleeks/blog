## 디렉토리 구조

- web/request
  - request 객체. 
  - controller 메서드의 파라미터로 사용. `toEntity()` 메서드를 통해 entity로 변환하여 서비스 레이어에 전달.

## 읽기 컨트롤러와 쓰기 컨트롤러 분리

`@RequestMapping`을 사용한다.

view와 edit을 분리하여 두 개의 컨트롤러로 관리할 때 view는 `method = RequestMethod.GET` 으로 처리, edit은 디폴트로 처리하면 method에 따라 매핑되는 컨트롤러가 달라진다.

## `@Valid`, `@Validated` 테스트

`@WebMvcTest` 를 사용한다.
여기에 Controller 클래스를 명시하면 된다. (`@WebMvcTest(PostController.class)`)

web 관련 빈만 등록하기 때문에 service, configuration, repository 등의 빈을 사용하지 못한다.
이 빈들은 전부 mock으로 처리해야 한다.

이러한 단점 때문에 validation 검증과 exception 핸들링 검증 용도로만 사용한다.
성공 예제는 `@SpringBootTest`를 통해 검증한다.

<MessageBox title='`@EnableJpaAuditing`' level='warning'>
  `@WebMvcTest`는 web 관련 컴포넌트만 빈으로 등록한다.
  그런데 `@CreatedDate`, `@LastModifiedDate`를 사용하기 위해 `@EnableJpaAuditing`를 스프링부트 메인클래스에 걸어놓는데, 이것이 `@WebMvcTest` 테스트 실행시 문제가 된다. (`jpa metamodel must not be empty!`)
  auditing 관련 빈을 사용하지 못하기 때문이다.

  그래서 `@Configuration` 클래스를 만들고 거기에 `@EnableJpaAuditing`를 걸어놓는다.

  ```java
  @Configuration
  @EnableJpaAuditing
  public class JpaAuditingConfiguration {
  }
  ```
  
  `@WebMvcTest` 실행시에 `@Configuration`은 무시되기 때문에 auditing 기능이 제외된다. 테스트 과정에서 엔티티를 가져올 일이 없기 때문에 auditing은 필요없다.
  부트런시에는 스프링부트가 `@Configuration`를 빈으로 만들기 때문에 `@EnableJpaAuditing`이 적용된다.
</MessageBox>
