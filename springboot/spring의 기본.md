## 빈 출력하기

```java
	@Test
	@DisplayName("모든 빈 찾기")
	void findAllBean() {
		String[] beanDefinitionNames = ac.getBeanDefinitionNames();
		for (String beanDefinitionName : beanDefinitionNames) {
			System.out.println("beanDefinitionName = " + beanDefinitionName);

		}
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
		Map<String, MemberService> beansOfType = ac.getBeansOfType(MemberService.class);
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
```

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

`@Configuration`의 빈 등록 코드를 작성했을 때 (수동 등록)
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

`@Configuration`의 빈 등록 코드를 제거했을 때 (자동 등록)
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
