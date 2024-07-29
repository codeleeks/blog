## 빈 출력하기

```java
@SpringBootTest
class DemoApplicationTests {
	//1. new AnnotationConfigApplicationContext()으로 스프링 컨테이너를 만든다.
	//2. AppConfig.class를 빈으로 등록한다.(다중 파라미터로 여러 개의 빈 등록 가능)
	AnnotationConfigApplicationContext ac = new AnnotationConfigApplicationContext(AppConfig.class);

	@Autowired
	MemberService memberService;
	@Autowired
	MemberRepository repository;

	@Test
	@DisplayName("모든 빈 찾기")
	void findAllBean() {
		String[] beanDefinitionNames = ac.getBeanDefinitionNames();
		for (String beanDefinitionName : beanDefinitionNames) {
			System.out.println("beanDefinitionName = " + beanDefinitionName);
		}

		System.out.println("memberService = " + memberService);
		System.out.println("repository = " + repository);
	}

	@Test
	@DisplayName("빈 종류에 따라 찾기")
	void findApplicationBeans() {
		String[] beanDefinitionNames = ac.getBeanDefinitionNames();
		for (String beanDefinitionName : beanDefinitionNames) {
			BeanDefinition beanDefinition = ac.getBeanDefinition(beanDefinitionName);
			if (beanDefinition.getRole() == BeanDefinition.ROLE_APPLICATION) {
				System.out.println("Application beanDefinitionName = " + beanDefinitionName);
			} else if (beanDefinition.getRole() == BeanDefinition.ROLE_INFRASTRUCTURE) {
				System.out.println("Infra beanDefinitionName = " + beanDefinitionName);
			}

		}
	}

	@Test
	@DisplayName("특정 타입을 모두 조회하기")
	void findAllBeanByType() {
		Map<String, MemberServiceImpl> beansOfType = ac.getBeansOfType(MemberServiceImpl.class);
		for (String key : beansOfType.keySet()) {
			System.out.println("key = " + key + " value = " + beansOfType.get(key));
		}
		System.out.println("beansOfType = " + beansOfType);
	}

	@Test
	@DisplayName("빈 설정 메타정보 확인")
	void findApplicationBean() {
		String[] beanDefinitionNames = ac.getBeanDefinitionNames();
		for (String beanDefinitionName : beanDefinitionNames) {
			BeanDefinition beanDefinition =
					ac.getBeanDefinition(beanDefinitionName);
			if (beanDefinition.getRole() == BeanDefinition.ROLE_APPLICATION) {
				System.out.println("beanDefinitionName" + beanDefinitionName +
						" beanDefinition = " + beanDefinition);
			}
		}
	}
}
```

<MessageBox title='AnnotationConfigApplicationContext와 빈 등록하기' level='info'>
	```java
	//1. new AnnotationConfigApplicationContext()으로 스프링 컨테이너를 만든다.
	//2. AppConfig.class를 빈으로 등록한다.(다중 파라미터로 여러 개의 빈 등록 가능)
	AnnotationConfigApplicationContext ac = new AnnotationConfigApplicationContext(AppConfig.class);
 	```
</MessageBox>

## 스프링 컨테이너

빈을 관리한다.

부가적으로 국제화, 환경변수, 이벤트, 리소스 조회 등의 기능을 담당한다.

코드적으로는 BeanFactory, ApplicationContext이다.

![image](https://github.com/user-attachments/assets/41cb4beb-1d9d-49ec-b0af-6a4a06b7fc42)
출처: 김영한의 스프링 핵심 원리 기본편


BeanFactory나 ApplicationContext는 인터페이스고, 실제 구현체는 빈을 어떻게 관리할 것인가에 따라 다르다.
스프링 부트의 기본 방법은 java annotation을 활용하여 빈을 등록한다. (`AnnotationConfigApplicationContext`)

![image](https://github.com/user-attachments/assets/1bbf208f-83c5-4d05-987a-5d287a17d744)
출처: 김영한의 스프링 핵심 원리 기본편

`AnnotationConfigApplicationContext`은 `AnnotatedBeanDefinitionReader`를 사용해서 자바로 작성된 컨피그 파일을 읽고 빈을 등록한다.
빈을 등록할 때는 `BeanDefinition`이라는 인터페이스를 사용한다.
`BeanDefinition`은 빈에 대한 메타 정보(클래스경로, 팩토리 클래스 및 메서드, 의존관계 정보 등)를 갖고 있다.

### 스프링 빈

어플리케이션 전체에서 딱 하나만 존재하는 인스턴스이다.
스프링은 디폴트로 인스턴스를 딱 한 개만 만들고, 그 인스턴스를 재사용한다.

스프링 컨테이너 안에 맵이 있고, 그 맵은 빈 이름을 키로하고, 인스턴스를 밸류로 한다.

![image](https://github.com/user-attachments/assets/c8aec91b-f94f-4fcb-a2f7-25a3c02942e3)
출처: 김영한의 스프링 핵심 원리 기본편


### `@Configuration`과 싱글톤

```java
@Configuration
public class AppConfig {

    @Bean
    public MemberService memberService() {
        return new MemberService(memberRepository());
    }

    @Bean
    public MemberRepository memberRepository() {
        return new MemberRepository();
    }
}
```

`memberRepository()`는 `memberSerivce()`에서 사용되고 있다.
`memberRepository()`는 `MemberRepository` 빈을 만들 때 한 번, `memberService()`가 호출될 때 한 번 호출되어서 총 두 번이 호출되는 것처럼 보인다.
그런데 `memberRepository()`는 호출될 때마다 `MemberRepository` 객체를 만든다.
그러면 싱글톤으로 관리되어야 할 빈이 두 개의 인스턴스로 생기지 않을까?

실제로 로그를 찍어보면 `memberRepository()` 함수는 한 번만 호출된다.

스프링은 `@Configuration`이 달린 클래스를 빈으로 만들 때 cglib 라이브러리를 써서 상속받은 프록시 클래스로 만들고, 해당 클래스의 바이트 코드를 조작한 뒤 이 프록시 클래스를 객체로 만든다.

![image](https://github.com/user-attachments/assets/ebd873f2-d15e-4b13-9370-1a6664aa7298)
출처: 김영한의 스프링 핵심 원리 기본편

AppConfig 클래스의 `memberService()` 메서드를 수정하여, 의존성 주입할 때 MemberRepository 빈이 있는지 확인한 뒤에 없으면 MemberRepository를 빈으로 먼저 등록하고, 그 객체를 주입할 것이라 추측된다.


## 컴포넌트 스캔

`@Configuration` 클래스를 통해 자바 코드로 빈을 등록하거나, XML로 작성하는 방법이 있었다.
이는 빈으로 등록할 모든 클래스를 개발자가 관리해야 한다는 뜻으로, 클래스가 수십, 수백 개가 되면 여간 귀찮은 일이 아닐 수 없다.

스프링은 이러한 문제를 해결하기 위해 자동으로 빈을 등록하는 기능을 개발했다.
바로 컴포넌트 스캔(`@ComponentScan`)이다.

컴포넌트 스캔은 `@Component`가 붙은 클래스를 찾고, 이 클래스를 빈으로 등록한다.


### `basePackages`

프로젝트에 있는 모든 자바 클래스를 다 스캔하면 시간이 오래 걸린다. 
그래서 컴포넌트 스캔은 탐색할 위치를 지정하는 옵션을 제공한다.

```java
@ComponentScan(
  basePackages = "hello.core"
)
```

`basePackages`는 지정한 패키지와 모든 하위 패키지에서 `@Component`가 붙은 클래스를 찾는다.

`basePackages`를 지정하지 않으면, 기본값이 적용된다.
기본값은 `@ComponentScan`이 붙은 클래스의 현재 패키지이다.

스프링 부트에서는 main 클래스에 `@ComponentScan`이 붙어 있다.(`@SpringBootApplication`는 `@ComponentScan`을 포함한다.)
main 클래스 패키지 하에 있는 모든 패키지에서 컴포넌트 클래스를 찾는다.

### `includeFilters`, `excludeFilters`

컴포넌트 스캔시 포함할 클래스와 제외할 클래스를 지정한다.

마킹(`FilterType`)은 어노테이션, 클래스, 패키지 이름(aspectJ 표현식,  정규표현식), `TypeFilter`라는 인터페이스를 구현해서 처리하는 방법이 있다.

```java
 @Configuration
 @ComponentScan(
   includeFilters = @Filter(type = FilterType.ANNOTATION, classes = MyIncludeComponent.class),
   excludeFilters = @Filter(type = FilterType.ANNOTATION, classes = MyExcludeComponent.class)
 )
 class AppConfig {
 }
```

## 빈 중복 등록과 충돌

자동 빈 등록 vs 자동 빈 등록: `ConflictBeanDefinitionException` 예외 발생
수동 빈 등록 vs 자동 빈 등록: 오버라이딩된다고 나와 있는데, 테스트 결과 컴포넌트 스캔에서 제외된 것처럼 보인다.

- `@Configuration`의 빈 등록 코드를 작성했을 때 (수동 등록)

```java
@Configuration
public class AppConfig {

    @Bean(name = "memberRepository")
    public MemberRepository memberRepository() {
        MemberRepository memberRepository = new MemberRepository();
        System.out.println("repository from configuration " + memberRepository);
        return memberRepository;
    }
}

@Component
public class MemberRepository {
    public MemberRepository() {
        System.out.println("repository called");
    }
}
@Service
public class OrderService {
    private final MemberRepository repository;

    public OrderService(MemberRepository repository) {
        this.repository = repository;
        System.out.println("repository = " + repository);
    }
}
```
```bash
repository called
repository from configuration com.example.demo.MemberRepository@5cc5b667
repository = com.example.demo.MemberRepository@5cc5b667
```

- `@Configuration`의 빈 등록 코드를 제거했을 때 (자동 등록)
```java
@Configuration
public class AppConfig {
//
//    @Bean(name = "memberRepository")
//    public MemberRepository memberRepository() {
//        MemberRepository memberRepository = new MemberRepository();
//        System.out.println("repository from configuration " + memberRepository);
//        return memberRepository;
//    }
}
@Component
public class MemberRepository {
    public MemberRepository() {
        System.out.println("repository called");
    }
}
@Service
public class OrderService {
    private final MemberRepository repository;

    public OrderService(MemberRepository repository) {
        this.repository = repository;
        System.out.println("repository = " + repository);
    }
}
```
```bash
repository called
repository = com.example.demo.MemberRepository@24a1c17f
```

### 인터페이스 구현체가 두 개 이상일 때 빈 충돌

어떤 빈이 인터페이스를 의존하고 있고, 그 인터페이스를 구현하는 빈이 두 개 이상일 때 빈 충돌이 발생한다.

해결 방법은 세 가지이다.
- `@AutoWired` 매칭 조건 사용
- `@Qualifier`
- `@Primary`

#### `@AutoWired` 매칭 조건

```java
//DiscountPolicy 인터페이스를 구현하는 rateDiscountPolicy 빈을 찾는다.
@Autowired
private DiscountPolicy rateDiscountPolicy
```

`@AutoWired`가 빈을 찾는 순서가 있다.

1. 타입 매칭
2. 필드명(혹은 파라미터명) 매칭

#### `@Qualifier`

빈에 추가적인 정보를 부여하고, 클라이언트에서 추가적인 정보로 빈을 찾는다.

```java
@Component
@Qualifier("mainDiscountPolicy") //추가적인 정보
public class RateDiscountPolicy implements DiscountPolicy {}

@Component
@Qualifier("fixDiscountPolicy") //추가적인 정보
public class FixDiscountPolicy implements DiscountPolicy {}

//클라이언트
//@Qualifier("mainDiscountPolicy")가 붙은 빈을 찾는다.
@Autowired
public OrderServiceImpl(MemberRepository memberRepository, @Qualifier("mainDiscountPolicy") DiscountPolicy discountPolicy) {
 this.memberRepository = memberRepository;
 this.discountPolicy = discountPolicy;
}
```

`@Qualifier`는 빈을 찾는 순서가 있다.
- `@Qualifier` 매칭
- `@Qualifier`에 적은 텍스트가 빈 이름과 매칭하는지 확인


#### `@Primary`

빈 충돌시 우선이 되는 빈을 지정한다.

```java
//빈 충돌시 RateDiscountPolicy 빈이 우선한다.
@Component
@Primary
public class RateDiscountPolicy implements DiscountPolicy {}

@Component
public class FixDiscountPolicy implements DiscountPolicy {}
```

#### 결론

`@Primary`와 `@Qualifier`를 섞어서 쓰자.

주로 사용되는 구현체는 `@Primary`를 붙이고, 가끔 사용되는 구현체는 `@Qualifier`를 적용한다.
클라이언트에서는 `@Qualifier`를 붙이지 않으면 주로 사용되는 구현체가 선택된다.
`@Qualifier`를 붙인다면 가끔 사용되는 구현체가 선택된다.

오타 방지를 위해 `@Qualifier`는 커스텀 어노테이션으로 만들어버리는 것도 좋다.

```java
@Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER,
ElementType.TYPE, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Qualifier("mainDiscountPolicy")
public @interface MainDiscountPolicy {
}

@Component
@MainDiscountPolicy
public class RateDiscountPolicy implements DiscountPolicy {}

@Autowired
public OrderServiceImpl(MemberRepository memberRepository, @MainDiscountPolicy DiscountPolicy discountPolicy) {
 this.memberRepository = memberRepository;
 this.discountPolicy = discountPolicy;
}
```

### 인터페이스 구현체가 두 개 이상일 때, 모두 가져오는 방법

인터페이스를 구현하는 모든 빈을 가져와야 하는 경우도 있다.

이 때는 컬렉션을 사용한다.

```java
@Service
@RequiredArgsConstructor
class DiscountService {
 private final Map<String, DiscountPolicy> policyMap;
 //키는 각 빈의 이름, 밸류는 빈
 private final List<DiscountPolicy> policies;
}
```

## 의존관계 주입

의존관계를 주입하는 방법은 세 가지가 있다.
모두 `@Autowired`를 사용한다.

- 생성자 주입
- 수정자 주입
- 필드 주입

### 생성자 주입
```java
@Component
public class OrderServiceImpl implements OrderService {
 private final MemberRepository memberRepository;
 private final DiscountPolicy discountPolicy;

 @Autowired
 public OrderServiceImpl(MemberRepository memberRepository, DiscountPolicy discountPolicy) {
 	this.memberRepository = memberRepository;
 	this.discountPolicy = discountPolicy;
 }
}
```

생성자가 한 개라면 `@Autowired`를 생략할 수 있다.
그래서 lombok의 `@RequiredArgsConstructor`를 사용하면 편리하게 생성자 주입을 사용할 수 있다.

객체를 생성할 때 필요한 의존관계를 받아야 하므로(+final을 사용함으로써 추가적인 보완), 의존관계가 채워지지 않으면 컴파일 오류를 낸다.
또한, 의존 관계는 객체 생성 시점에 세팅이 되기 때문에 생성 이후에는 의존 관계가 불변한다.

### 수정자 주입
```java
@Component
public class OrderServiceImpl implements OrderService {
 private MemberRepository memberRepository;
 private DiscountPolicy discountPolicy;

 @Autowired
 public void setMemberRepository(MemberRepository memberRepository) {
 	this.memberRepository = memberRepository;
 }
 @Autowired
 public void setDiscountPolicy(DiscountPolicy discountPolicy) {
 	this.discountPolicy = discountPolicy;
 }
}
```

세터 메서드를 통해 의존관계를 주입한다.
세터 메서드의 이름은 자바빈 메서드 규약을 따라야 한다. (`set필드이름`)

의존관계 주입없이 객체를 생성할 수 있으므로, 런타임 오류(특히 NPE)가 발생할 수 있다.

### 필드 주입

```java
@Component
public class OrderServiceImpl implements OrderService {
 @Autowired
 private MemberRepository memberRepository;
 @Autowired
 private DiscountPolicy discountPolicy;
}
```

의존 관계 필드에 `@AutoWired`를 달아버린다.

의존 관계를 외부에서 셋팅할 수 있는 방법이 없으므로, 의존관계를 모킹하여 테스트하기 어렵다는 단점이 있다.

### 의존 관계 강제화 해제

의존 관계 주입을 생략하거나 null을 넣는 방법도 있다.

```java
//호출 안됨
@Autowired(required = false)
public void setNoBean1(Member member) {
 System.out.println("setNoBean1 = " + member);
}
//null 호출
@Autowired
public void setNoBean2(@Nullable Member member) {
 System.out.println("setNoBean2 = " + member);
}
//Optional.empty 호출
@Autowired(required = false)
public void setNoBean3(Optional<Member> member) {
 System.out.println("setNoBean3 = " + member);
}
```

## 빈 생명주기

> 스프링 컨테이너 생성 ➡️ 스프링 빈 생성 ➡️ 의존관계 주입 ➡️ 초기화 콜백 ➡️ 사용 ➡️ 소멸전 콜백 ➡️ 스프링 컨테이너 종료

개발자는 초기화 콜백과 소멸전 콜백에 어떤 작업을 할지를 메서드로 작할 수 있다.

세 가지 방법이 있다.

- `initializingBean`, `DisposableBean`의 추상 메서드를 구현한다.
- `@Bean(initMethod = "", destroyMehtod = "")`
- `@PostConstruct`, `@PreDestroy`, `@EventListener(ApplicationReadyEvent.class)`


### `initializingBean`, `DisposableBean`의 추상 메서드를 구현한다.

이 방법은 다른 두 방법이 더 편리하기 때문에 사용하지 않는다.

### `@Bean(initMethod = "", destroyMehtod = "")`

`@Bean` 어노테이션을 붙일 때 콜백함수명을 적는다.

```java
@Configuration
static class LifeCycleConfig {
 @Bean(initMethod = "init", destroyMethod = "close")
 	public NetworkClient networkClient() {
 	NetworkClient networkClient = new NetworkClient();
 	networkClient.setUrl("http://hello-spring.dev");
	return networkClient;
 }
}
```

소스 코드를 변경할 수 없는 외부 라이브러리 객체를 사용할 때 유용하다.
외부 라이브러리 객체가 제공하는 초기화 메서드의 이름과 소멸 전 작업을 처리하는 메서드의 이름만 알면 된다.

추가적으로 `destroyMehtod`는 `close`, `shutdown` 등의 메서드 이름을 발견하면 이를 소멸 전 작업 메서드라고 판단한다.
`destroyMehtod = ""`라고 지정하면 메서드 이름 추론을 하지 않는다.

### `@PostConstruct`, `@PreDestroy`, `@EventListener(ApplicationReadyEvent.class)`

빈 메서드에 어노테이션을 붙인다.

```java
 @PostConstruct
 public void init() {
 	System.out.println("NetworkClient.init");
 	connect();
 	call("초기화 연결 메시지");
 }
 @PreDestroy
 public void close() {
 	System.out.println("NetworkClient.close");
 	disConnect();
 }
```

`@PostConstruct`는 `@EventListener(ApplicationReadyEvent.class)`로 대체할 수 있다.

```java
 @EventListener(ApplicationReadyEvent.class)
 public void init() {
 	System.out.println("NetworkClient.init");
 	connect();
 	call("초기화 연결 메시지");
 }
 @PreDestroy
 public void close() {
 	System.out.println("NetworkClient.close");
 	disConnect();
 }
```

`@PostConstruct`는 빈 생성 및 의존성 해결 후에 호출이 된다.
`@EventListener(ApplicationReadyEvent.class)`는 모든 빈이 초기화된 이후에 호출된다.

(프록시 빈에서 `@PostConstruct`가 실패할 수 있다고 인터넷에 나오긴 하지만, 간단한 테스트 하에서 검증하지 못했다)

```java
@SpringBootTest
class JpashopApplicationTests {
	@Autowired
	private MemberRepository repository;
	@Test
	void contextLoads() {
		System.out.println("repository = " + repository.getClass());
		System.out.println("repository.getData() = " + repository.getData());
	}

}

@Repository
@RequiredArgsConstructor
public class MemberRepository {
    private final EntityManager em;

    public void save(Member member) {
        em.persist(member);
    }

    public Member findOne(Long id) {
        return em.find(Member.class, id);
    }
    public List<Member> findAll() {
        return em.createQuery("select m from Member m", Member.class)
                .getResultList();
    }
    public List<Member> findByName(String name) {
        return em.createQuery("select m from Member m where m.name = :name", Member.class)
                .setParameter("name", name)
                .getResultList();
    }

    Integer data;

    public Integer getData() {
        return data;
    }

    @PostConstruct
    public void init() {
        data = 10;
        System.out.println("init called, data = " + data);
    }
}
```
```bash
repository = class jpabook.jpashop.repository.MemberRepository$$SpringCGLIB$$0
repository.getData() = 10
```
