## `@SpringBootTest`

```java
@SpringBootTest
class JpashopApplicationTests {

	@Test
	void contextLoads() {
	}

}
```

이 기능에 대한 공식 설명이다.

> - Uses SpringBootContextLoader as the default ContextLoader when no specific @ContextConfiguration(loader=...) is defined.
> - Automatically searches for a @SpringBootConfiguration when nested @Configuration is not used, and no explicit classes are specified.
> - Allows custom Environment properties to be defined using the properties attribute.
> - Allows application arguments to be defined using the args attribute.
> - Provides support for different webEnvironment modes, including the ability to start a fully running web server listening on a defined or random port.
> - Registers a TestRestTemplate and/or WebTestClient bean for use in web tests that are using a fully running web server.

### TODO ApplicationContext? 컨텍스트 로더?

### 필요한 빈만 등록한다.

테스트할 때 main 하에 정의된 빈 클래스들을 등록해서 사용할 수도, 아니면 test 하에서 필요한 빈들만 등록해서 사용할 수도 있다.

`@SpringBootTest`는 `@SpringBootConfiguration`이 붙은 클래스를 찾는다. (`Automatically searches for a @SpringBootConfiguration when nested @Configuration is not used, and no explicit classes are specified.`)
`@SpringBootConfiguration`은 프로젝트에서 한 번만 사용되고, `@SpringBootApplication`에서 사용되기 때문에 결과적으로 SpringBootApplication 클래스를 찾는다는 뜻이다.
SpringBootApplication은 `@SpringBootApplication`에서 정의하듯 빈으로 정의된 클래스를 컴포넌트 스캔을 통해 등록한다.

따라서 테스트할 때 `@SpringBootTest`를 쓰면 `@SpringBootApplication`을 찾아서 실행을 시키고, 이 때 SpringBootApplication의 컴포넌트 스캔을 통해 main 하의 빈 클래스들이 빈으로 등록이 되어 테스트 환경에서 사용할 수 있는 것이다.

test 하에서 필요한 빈들만 등록하고 싶을 때는 어떻게 할까?
`when nested @Configuration is not used, and no explicit classes are specified.`라고 한 것처럼 `@SpringBootTest`를 붙인 테스트 클래스 안에 `@Configuration` 클래스를 정의하면 된다.

[관련 실험 확인할 수 있는 포스트](https://hyuk0309.tistory.com/15)

<MessageBox title='`@springBootConfiguration`과 `@Configuration`의 차이' level='info'>
  `@SpringBootConfiguration`은 특별한 `@Configuration`이다. 프로젝트에서 하나만 사용되고, Spring이 자동으로 찾아준다.
  반대로 `@Configuration`은 등록 과정이 필요하고, 여러 개를 등록할 수 있다.
</MessageBox>
