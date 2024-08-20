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


```java
package blog.main.web;

import blog.main.common.CleanUpDb;
import blog.main.common.PostCrudRepository;
import blog.main.domain.Category;
import blog.main.domain.Post;
import blog.main.web.request.CategoryRequest;
import blog.main.web.request.PostSaveRequest;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class PostControllerTest {
    @Autowired
    PostCrudRepository postCrudRepository;

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void saveOne() throws Exception {
        CategoryRequest categoryRequest = new CategoryRequest();
        categoryRequest.setName("category1");

        PostSaveRequest postSaveRequest = new PostSaveRequest();
        postSaveRequest.setTitle("post1");
        postSaveRequest.setContents("안녕하세요 반가워요 재미없나요?");
        postSaveRequest.setCategory(categoryRequest);

        MvcResult mvcResult = mockMvc.perform(
                        MockMvcRequestBuilders.post("/posts")
                                .content(objectMapper.writeValueAsString(postSaveRequest))
                                .contentType(MediaType.APPLICATION_JSON)
                ).andExpect(MockMvcResultMatchers.status().isCreated())
                .andReturn();
        Long postId = objectMapper.readValue(mvcResult.getResponse().getContentAsString(), Long.class);


        Optional<Post> found = postCrudRepository.findById(postId);
        assertThat(found.isPresent()).isTrue();
        assertThat(found.get().getTitle()).isEqualTo(postSaveRequest.getTitle());
        assertThat(found.get().getContents()).isEqualTo(postSaveRequest.getContents());
        assertThat(found.get().getCategory()).isEqualTo(postSaveRequest.getCategory().toEntity());
        assertThat(found.get().getCreatedAt()).isNotNull();
        assertThat(found.get().getUpdatedAt()).isNotNull();
    }

    @Test
    void saveError() throws Exception {
        CategoryRequest categoryRequest = new CategoryRequest();
        categoryRequest.setName("category1");

        //category
        CategoryRequest categoryError = new CategoryRequest();
        StringBuilder stringBuilder = new StringBuilder();
        for (int i = 0; i <100; i++) {
            stringBuilder.append("a");
        }
        categoryError.setName(stringBuilder.toString());

        PostSaveRequest postSaveRequest = new PostSaveRequest();
        postSaveRequest.setTitle("post1");
        postSaveRequest.setContents("안녕하세요 반가워요 재미없나요?");
        postSaveRequest.setCategory(categoryError);

        mockMvc.perform(
                MockMvcRequestBuilders.post("/posts")
                        .content(objectMapper.writeValueAsString(postSaveRequest))
                        .contentType(MediaType.APPLICATION_JSON)
        ).andExpect(MockMvcResultMatchers.status().isUnprocessableEntity());

        //title
        postSaveRequest.setTitle("");
        postSaveRequest.setContents("안녕하세요 반가워요 재미없나요?");
        postSaveRequest.setCategory(categoryRequest);

        mockMvc.perform(
                MockMvcRequestBuilders.post("/posts")
                        .content(objectMapper.writeValueAsString(postSaveRequest))
                        .contentType(MediaType.APPLICATION_JSON)
        ).andExpect(MockMvcResultMatchers.status().isUnprocessableEntity());


        postSaveRequest.setTitle(stringBuilder.toString());
        postSaveRequest.setContents("안녕하세요 반가워요 재미없나요?");
        postSaveRequest.setCategory(categoryRequest);

        mockMvc.perform(
                MockMvcRequestBuilders.post("/posts")
                        .content(objectMapper.writeValueAsString(postSaveRequest))
                        .contentType(MediaType.APPLICATION_JSON)
        ).andExpect(MockMvcResultMatchers.status().isUnprocessableEntity());

        //contents
        postSaveRequest.setTitle("post1");
        postSaveRequest.setContents("");
        postSaveRequest.setCategory(categoryRequest);

        mockMvc.perform(
                MockMvcRequestBuilders.post("/posts")
                        .content(objectMapper.writeValueAsString(postSaveRequest))
                        .contentType(MediaType.APPLICATION_JSON)
        ).andExpect(MockMvcResultMatchers.status().isUnprocessableEntity());

    }

    @Test
    void deletePost() throws Exception {
        Post saved = postCrudRepository.save(Post.builder()
                .title("post2")
                .contents("post2 contents")
                .category(Category.builder()
                        .name("category")
                        .build()
                )
                .build()
        );

        assertThat(postCrudRepository.findById(saved.getId()).isPresent()).isTrue();
        MvcResult mvcResult = mockMvc.perform(
                        MockMvcRequestBuilders.delete("/posts/" + saved.getId())
                ).andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        Long postId = objectMapper.readValue(mvcResult.getResponse().getContentAsString(), Long.class);
        assertThat(postId).isEqualTo(saved.getId());
        assertThat(postCrudRepository.findById(postId).isEmpty()).isTrue();
    }
}
```

## `@Transactional` 사용하기

테스트 클래스나 메서드에 `@Transactional`을 붙이면 테스트 메서드 종료 후 자동으로 롤백을 한다.

별도의 디비 초기화 로직을 작성하지 않아도 되어 편리하다.

그러나 몇 가지 주의 사항이 있다.

- `AUTO_INCREMENT`는 롤백되지 않는다.
- `@Transactional(propagation = Propagation.REQUIRES_NEW)`를 쓰는 서비스는 롤백되지 않는다.

### `AUTO_INCREMENT`는 롤백되지 않는다

테스트 코드에서 엔티티의 id를 직접 사용하는 것은 좋지 않다.

id 자동 생성 전략을 어떻게 사용하느냐에 따라 달라질 수 있지만, `AUTO_INCREMENT`를 통해 증가된 엔티티 아이디는 롤백되지 않기 때문이다.

```java
@Test
void test1() {
  Long id = 1L;
  repository.save(entity);

  assertThat(repository.findById(id).isPresent()).isTrue(); //테스트 성공
}

@Test
void test2() {
  Long id = 1L;
  repository.save(entity);
  
  assertThat(repository.findById(id).isPresent()).isTrue(); //테스트 실패
}

@Test
void test3() {
  Long id = 3L;
  repository.save(entity);
  
  assertThat(repository.findById(id).isPresent()).isTrue(); //테스트 성공 (auto_increment로 인해 세 번 save했으므로 아이디는 3임)
}

@Test
void test4_bestpractice() {
  Entity entity = repository.save(entity);
  assertThat(repository.findById(entity.getId()).isPresent()).isTrue(); //테스트 성공. best practice.
}
```

### `@Transactional(propagation = Propagation.REQUIRES_NEW)`를 쓰는 서비스는 롤백되지 않는다

트랜잭션을 새로 판다면 테스트의 트랜잭션을 벗어나기 때문에 테스트의 트랜잭션의 롤백이 서비스의 롤백으로 적용되지 않는다.
