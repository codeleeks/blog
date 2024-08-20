## 실제 웹 요청처럼 테스트하기

테스트 코드에서 웹 요청을 모킹하여 실제 웹 요청에 대한 동작을 테스트할 수 있다.

`@Valid`,`@Validated` 등 검증 로직은 물론, 서비스 영역과 레포지토리 영역과의 연계를 통한 전체 테스트도 가능하다.

웹 요청을 모킹할 때 스프링이 제공하는 객체는 `MockMvc`이다.
`MockMvc`는 일종의 웹 클라이언트로 보면 된다.

```java
@Autowired
private MockMvc mockMvc;

@Test
void test() {
  MvcResult mvcResult = mockMvc.perform(
                      MockMvcRequestBuilders.post("/posts")
                              .content(objectMapper.writeValueAsString(postSaveRequest))
                              .contentType(MediaType.APPLICATION_JSON)
              ).andExpect(MockMvcResultMatchers.status().isCreated())
              .andReturn();
}
```

`MockMvc` 빈을 등록하는 방법은 두 가지이다.

- `@WebMvcTest`
- `@AutoConfigureMockMvc`

### `@WebMvcTest`

`@WebMvcTest`는 웹 요청과 응답 관련 빈들을 등록한다. (컨트롤러, 필터, 인터셉터 등)

모킹할 Controller 클래스를 명시하면 된다. (`@WebMvcTest(PostController.class)`)

web 관련 빈만 등록하기 때문에 service, configuration, repository 등의 빈을 사용하지 못한다.
이 빈들은 전부 mock으로 처리해야 한다.

애초에 웹 요청과 응답 부분에 대한 단위 테스트 용도로 만들어졌다.

그 목적에 맞게 `@Valid`와 같은 검증 로직, 필터 로직 등에 대한 단위 테스트를 작성할 때 사용한다.

`@SpringBootTest`와 충돌하여 같이 쓸 수 없다.

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

### `@AutoConfigureMockMvc`

`@AutoConfigureMockMvc`는 `@SpringBootTest`와 같이 사용할 수 있다.

`@SpringBootTest`의 도움으로 모든 빈을 인식할 수 있다.

그래서 웹 요청부터 서비스 로직, 레포지토리 로직까지 거의 전 영역에 걸친 테스트를 진행할 수 있다.
단위 테스트보다는 통합 테스트에 가깝다.

`@WebMvcTest`보다는 등록하는 빈이 많기 때문에 테스트 수행 속도가 오래 걸린다.
