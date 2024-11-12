---
summary: SpringBoot의 탄생과 활용 방법을 정리합니다.
date: 2024-07-29
title-image: 'https://raw.githubusercontent.com/codeleeks/blog/codeleeks-images/springboot/SpringBoot%20%EC%99%84%EB%B2%BD%20%EC%A0%95%EB%A6%AC/title.png'
---


## 과거에는 어땠나...? - 서블릿 컨테이너

과거의 개발 방식은 
> 톰캣 설치 ➡️ 자바 어플리케이션을 WAR(Web Application Archive)로 빌드 ➡️ WAR를 톰캣의 특정 경로에 복사(배포)

현재 스프링부트에서는
> 스프링부트 라이브러리 설치 ➡️ 자바 어플리케이션을 JAR로 빌드(JAR 안에 톰캣 라이브러리 포함(내장 톰캣 방식))


### WAR 구조

`WEB-INF` 디렉토리와 그 외의 파일로 구성.

`WEB-INF`에 자바 어플리케이션의 클래스와 jar 라이브러리가 포함됨.

그 외의 파일에는 html, css 파일 등이 포함됨.

- `WEB-INF`
  - `classes`
    - `hello/servlet/TestServlet.class`
  - `lib`
    - `jakarta.servlet-api-6.0.0.jar`
- `index.html`

WAR 파일 구조는 톰캣과 약속된 구조이다.
톰캣은 약속된 경로에 약속된 파일을 읽으며 자바 어플리케이션을 실행한다.

### 서블릿 컨테이너 초기화

톰캣은 JavaEE 에서 정의한 서블릿 컨테이너의 구현체이다. ([관련 포스팅](https://codeleeks.github.io/blog/posts/java/%EC%9E%90%EB%B0%94%20%EA%B4%80%EB%A0%A8%20%EC%9A%A9%EC%96%B4%20%EC%A0%95%EB%A6%AC.md))

서블릿 컨테이너는 초기화 인터페이스를 제공한다.

어플리케이션 개발자는 초기화 인터페이스를 통해 서블릿을 생성하고 초기화한다.

```java
//초기화 인터페이스
public interface ServletContainerInitializer {
 public void onStartup(Set<Class<?>> c, ServletContext ctx) throws
ServletException;
}

//서블릿 컨테이너 초기화 클래스
//resources/META-INF/services/jakarta.servlet.ServletContainerInitializer 파일에 해당 클래스의 패키지 풀 경로를 적어서 서블릿 컨테이너에 등록한다.(hello.container.MyContainerInitV1)
public class MyContainerInitV1 implements ServletContainerInitializer {
 @Override
 public void onStartup(Set<Class<?>> c, ServletContext ctx) throws
ServletException {
   System.out.println("MyContainerInitV1.onStartup");
   System.out.println("MyContainerInitV1 c = " + c);
   System.out.println("MyContainerInitV1 ctx = " + ctx);
 }
}
```

매번 resources 경로에 초기화 클래스 파일을 넣는 것은 번거롭다.
그래서 서블릿 컨테이너는 서블릿 컨테이너에 등록하는 클래스와 그 등록된 클래스가 실행하는 초기화 로직을 분리할 수 있는 방법을 제공한다.

서블릿 컨테이너 초기화 클래스에 `@HandlesTypes(어플리케이션 초기화 인터페이스)` 어노테이션을 붙이면, 서블릿 컨테이너는 이 어플리케이션 초기화 인터페이스를 구현한 클래스를 읽어서 `Set<Class<?>> c` 컬렉션에 넣어준다.
서블릿 컨테이너 초기화 클래스에서는 `Set<Class<?>> c`를 사용하여 어플리케이션 초기화 클래스를 생성하고 초기화 함수를 호출한다.
어플리케이션 초기화 클래스에서는 서블릿을 생성하고 서블릿에 url 매핑을 한다.

![image](https://github.com/user-attachments/assets/1dc39c2c-1a83-4b66-a62b-318aca68436a)
(출처: 김영한의 스프링부트 - 핵심 원리와 활용)

```java
//어플리케이션 초기화 인터페이스
public interface AppInit {
 void onStartup(ServletContext servletContext);
}

//어플리케이션 초기화 클래스
public class AppInitV1Servlet implements AppInit {
 @Override
 public void onStartup(ServletContext servletContext) {
   System.out.println("AppInitV1Servlet.onStartup");
   //순수 서블릿 코드 등록
   ServletRegistration.Dynamic helloServlet = servletContext.addServlet("helloServlet", new HelloServlet());
   helloServlet.addMapping("/hello-servlet");
 }
}

//서블릿 컨테이너 초기화 클래스
//resources/META-INF/services/jakarta.servlet.ServletContainerInitializer 경로에 해당 클래스의 풀 패키지 경로를 작성하여 서블릿 컨테이너 초기화 클래스로 등록한다.
@HandlesTypes(AppInit.class)
public class MyContainerInitV2 implements ServletContainerInitializer {
 @Override
 public void onStartup(Set<Class<?>> c, ServletContext ctx) throws
ServletException {
 System.out.println("MyContainerInitV2.onStartup");
 System.out.println("MyContainerInitV2 c = " + c);
 System.out.println("MyContainerInitV2 container = " + ctx);
 for (Class<?> appInitClass : c) {
     try {
       //new AppInitV1Servlet()과 같은 코드
       AppInit appInit = (AppInit) appInitClass.getDeclaredConstructor().newInstance();
       appInit.onStartup(ctx);
     } catch (Exception e) {
       throw new RuntimeException(e);
     }
   }
 }
}

//서블릿 클래스
public class HelloServlet extends HttpServlet {
 @Override
 protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
   System.out.println("HelloServlet.service");
   resp.getWriter().println("hello servlet!");
 }
}
```

### 스프링과 서블릿 컨테이너

스프링도 내부적으로 서블릿 컨테이너 초기화 클래스를 등록하고, 어플리케이션 초기화 클래스를 실행시켜서 디스패처 서블릿을 등록한다.
디스패처 서블릿은 스프링 컨테이너를 의존하고 있기 때문에, 디스패처 서블릿을 등록하는 과정에서 스프링 컨테이너를 생성하고 초기화하여 디스패처 서블릿의 생성자의 파라미터로 전달한다.

![image](https://github.com/user-attachments/assets/5482d010-ac69-45c7-b2f1-d5c4463f8e64)
(출처: 김영한의 스프링부트 - 핵심 원리와 활용)


```java
//어플리케이션 초기화 클래스
//스프링이 사용하는 어플리케이션 초기화 클래스의 간단한 버전
//WebApplicationInitializer는 스프링이 사용하는 어플리케이션 초기화 인터페이스
public class AppInitV3SpringMvc implements WebApplicationInitializer {
 @Override
 public void onStartup(ServletContext servletContext) throws ServletException
{
   System.out.println("AppInitV3SpringMvc.onStartup");
   //스프링 컨테이너 생성
   AnnotationConfigWebApplicationContext appContext = new AnnotationConfigWebApplicationContext();
   //스프링 컨테이너 초기화 로직. 예시로 `@Configuration` 클래스를 등록하는 과정을 작성함.
   appContext.register(HelloConfig.class);

   //스프링 MVC 디스패처 서블릿 생성, 스프링 컨테이너 연결
   DispatcherServlet dispatcher = new DispatcherServlet(appContext);
   //디스패처 서블릿을 서블릿 컨테이너에 등록 (이름 주의! dispatcherV3)
   ServletRegistration.Dynamic servlet = servletContext.addServlet("dispatcherV3", dispatcher);
   //모든 요청이 디스패처 서블릿을 통하도록 설정
   servlet.addMapping("/");
 }
```

스프링에서도 실제로 `resources/META-INF/services/jakarta.servlet.ServletContainerInitializer` 경로에 서블릿 컨테이너 초기화 클래스를 등록하고, 어플리케이션 초기화 클래스(WebApplicationInitializer)를 사용해서 스프링 관련 초기화(디스패처 초기화, 스프링 컨테이너 초기화 등)를 진행한다.
![image](https://github.com/user-attachments/assets/23971dfb-e2ae-4904-aaea-625a07f1bbbd)


## 스프링 부트

톰캣이 라이브러리 형태로 제공되면서, 내장 톰캣을 사용할 수 있게 되었다.

스프링 부트는 내장 톰캣을 사용하고, 내장 톰캣에 디스패처 서블릿을 등록한다.

```java
//스프링부트 어노테이션.
//여기선 간단하게 컴포넌트 스캔만 사용하고 있다.
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@ComponentScan
public @interface MySpringBootApplication {
}

//스프링부트 메인 클래스
//스프링부트 어노테이션을 붙이고, 스프링 컨테이너에 메인 클래스를 등록한다.
@MySpringBootApplication
public class MySpringBootMain {
    public static void main(String[] args) {
        System.out.println("MySpringBootAppMain.main");
        MySpringApplication.run(MySpringBootMain.class, args);
    }
}

//스프링어플리케이션 클래스
//스프링부트 메인 클래스를 스프링 컨테이너에 등록하여 스프링부트 메인 클래스에 붙인 스프링부트 어노테이션을 적용한다.
//내부 톰캣을 생성하고 디스패처 서블릿을 등록한 뒤 실행한다.
public class MySpringApplication {
    public static void run(Class configClass, String[] args) {
        System.out.println("MySpringApplication.run args=" + List.of(args));

//       톰캣 설정
        Tomcat tomcat = new Tomcat();
        Connector connector = new Connector();
        connector.setPort(8080);
        tomcat.setConnector(connector);

        Context context = tomcat.addContext("", "/");
        File docBaseFile = new File(context.getDocBase());
        if (!docBaseFile.isAbsolute()) {
            docBaseFile = new File(((org.apache.catalina.Host)
                    context.getParent()).getAppBaseFile(), docBaseFile.getPath());
        }
        docBaseFile.mkdirs();

        //        스프링 컨테이너 설정
        AnnotationConfigWebApplicationContext appContext = new AnnotationConfigWebApplicationContext();
        appContext.register(configClass);

//        서블릿 등록
        DispatcherServlet dispatcher = new DispatcherServlet(appContext);
        tomcat.addServlet("", "dispatcher", dispatcher);
        context.addServletMappingDecoded("/", "dispatcher");


        try {
            tomcat.start();
        } catch (LifecycleException e) {
            throw new RuntimeException(e);
        }
    }
}
```

### 실제 스프링 부트 실행 과정

스프링 부트 실행 과정에서 중요한 부분은 두 가지이다.

- 스프링 컨테이너 생성
- 내부 톰캣 생성

#### 스프링 컨테이너 생성

`SpringApplication.run() > SpringApplication.createApplicationContext() > ServletWebServerApplicationContextFactory.create() > ServletWebServerApplicationContextFactory.createContext()`

![image](https://github.com/user-attachments/assets/59311910-8954-4d29-b44f-6e3d2b3545ce)


![image](https://github.com/user-attachments/assets/54d373c5-7394-4373-b3af-cabd2f1ca2fa)


![image](https://github.com/user-attachments/assets/f9052ba8-38e2-40af-94cd-5c2721c769b5)


#### 톰캣 생성 및 초기화

`SpringApplication.run() > SpringApplication.refreshContext() > ServletWebServerApplicationContext.refresh() > ServletWebServerApplicationContext.createWebServer() > TomcatServletWebServerFactory.getWebServer()`


![image](https://github.com/user-attachments/assets/3f0e5464-c5d7-4eef-a62e-f673c59ebd7d)

![image](https://github.com/user-attachments/assets/03266b34-aaed-4403-ad94-cde592dceb5b)

![image](https://github.com/user-attachments/assets/9d31caaa-30f6-445b-84c8-5da0cda60e88)

![image](https://github.com/user-attachments/assets/df4c2915-2ed6-46d1-8622-2540b71b3258)

![image](https://github.com/user-attachments/assets/caf2902e-87ca-420b-96b4-92917ed4fced)


### 실제 스프링 부트 배포 파일 구조

자바 표준상 jar는 다른 jar를 포함하지 못하게 되어 있다.

그래서 라이브러리를 쓴 어플리케이션 배포할 때는 라이브러리 jar를 클래스 및 설정파일로 풀어서 포함시켜야 한다.
이 방식을 FatJar라고 한다.

FatJar는 두 가지 문제를 안고 있다.

- 두 개 이상의 라이브러리에서 이름이 동일한 클래스나 설정 파일이 있다면 하나만 선택된다.
- 어플리케이션이 어떤 라이브러리를 의존하고 있는지 알기 어렵다.

스프링은 이 문제를 해결하기 위해 표준에 없는 새로운 jar 형식을 만들었다.
실행 가능 jar(executable jar)라고 한다.

실행 가능 jar의 구조는 

- `BOOT-INF`
  - `classes`
  - `lib`
  - `classpath.idx`
  - `layers.idx`
- `META-INF`
- `org/springframework/boot/loader`

로 되어 있다.

`BOOT-INF`는 `WAR`의 `WEB-INF` 처럼 `classes`와 `lib`으로 구성된다.
`classes`는 어플리케이션 개발자가 만든 클래스 모음이며, `lib`은 어플리케이션이 의존하는 라이브러리(jar) 모음이다.

`META-INF`에는 jar와 마찬가지로 실행할 main 클래스 정보를 담고 있다.
```bash
Manifest-Version: 1.0
Main-Class: org.springframework.boot.loader.JarLauncher
Start-Class: hello.boot.BootApplication
Spring-Boot-Version: 3.0.2
Spring-Boot-Classes: BOOT-INF/classes/
Spring-Boot-Lib: BOOT-INF/lib/
Spring-Boot-Classpath-Index: BOOT-INF/classpath.idx
Spring-Boot-Layers-Index: BOOT-INF/layers.idx
Build-Jdk-Spec: 17
```

`org/springframework/boot/loader`에는 실행 가능 jar의 구조를 이용해 어플리케이션을 실행시킬 수 있는 인프라 코드들이 작성되어 있다.
`META-INF/MANIFEST.MF` 파일에 실행할 메인클래스로 작성된 `org.springframework.boot.loader.JarLauncher`는 인프라코드 중 하나이다.

`java -jar 스프링부트.jar`를 실행하면 `JarLauncher`의 메인 함수가 호출되고, `org/springframework/boot/loader`의 인프라 코드들이 실행되면서 결과적으로 어플리케이션의 메인클래스(`hello.boot.BootApplication`)의 메인 함수를 호출한다.


## 라이브러리 관리

스프링 에코시스템에서는 [`io.spring.dependency-management` gradle 플러그인](https://github.com/spring-projects/spring-boot/blob/main/spring-boot-project/spring-boot-dependencies/build.gradle)을 통해 스프링의 다양한 기능을 뒷받침하는 다양한 라이브러리의 버전을 관리한다.(BOM, Bill of materials)
새로운 스프링 버전이 나올 때마다 라이브러리 간의 호환성을 체크하여 stable 버전을 정해놓는다.

어플리케이션 개발자는 스프링 에코시스템에서 정리해놓은 라이브러리 목록을 쓰면 된다. 

<MessageBox title='BOM' level='info'>
  BOM은 자재명세서라는 뜻으로, 필요한 모든 자재 목록을 말한다.
  
  BOM은 다른 BOM을 import할 수 있다.
  예를 들어, 스프링 BOM은 Jackson 라이브러리 관리를 할 때 Jackson BOM을 import한다.
  Jackson 자체적으로도 BOM으로 필요한 라이브러리를 관리하고 있기 때문에, 스프링은 이를 그대로 사용하는 것이다.
  
  ```gradle
  library("Jackson Bom", "${jacksonVersion}") {
		group("com.fasterxml.jackson") {
			imports = [
				"jackson-bom"
			]
		}
	}
  ```

  BOM을 사용하면 각 라이브러리의 버전 정보가 한 눈에 안 들어온다.
  스프링 에코시스템은 스프링 부트의 의존 라이브러리 및 버전을 (웹 페이지)[(https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html#appendix.dependency-versions.coordinates)
]로 제공한다. 
</MessageBox>

스프링 에코시스템이 관리하지 않는 라이브러리를 추가하고 싶을 때는 일반적인 메이븐 라이브러리 추가하는 것처럼 버전 정보까지 적어주면 된다.

```gradle
implementation 'org.yaml:snakeyaml:1.30'
```

반대로 스프링 에코시스템이 관리하는 라이브러리인데 버전을 바꾸고 싶을 때는 `ext`를 사용한다.
[라이브러리에 맞는 적절한 프로퍼티](https://docs.spring.io/spring-boot/appendix/dependency-versions/properties.html#appendix.dependency-versions.properties)를 사용해야 한다. 
```gradle
ext['tomcat.version'] = '10.1.4'
```

### 스프링 부트 스타터

스프링 에코시스템은 더 나아가 유즈케이스에 따라 필요한 라이브러리 목록을 사용할 수 있도록 스타터 라이브러리를 제공한다.

스프링 부트로 웹 어플리케이션을 개발하고 싶다면 `spring-boot-starter-web` 라이브러리를, JPA를 사용하여 데이터베이스에 접근해야 한다면 `spring-boot-starter-data-jpa` 라이브러리를 추가하면 된다.

[스타터 라이브러리 시리즈](https://docs.spring.io/spring-boot/reference/using/build-systems.html#using.build-systems.starters)를 통해 빈번한 유즈케이스에 필요한 라이브러리 목록을 일일이 찾아서 추가하지 않아도 된다.

```
spring-boot-starter : 핵심 스타터, 자동 구성, 로깅, YAML
spring-boot-starter-jdbc : JDBC, HikariCP 커넥션풀
spring-boot-starter-data-jpa : 스프링 데이터 JPA, 하이버네이트
spring-boot-starter-data-mongodb : 스프링 데이터 몽고
spring-boot-starter-data-redis : 스프링 데이터 Redis, Lettuce 클라이언트
spring-boot-starter-thymeleaf : 타임리프 뷰와 웹 MVC
spring-boot-starter-web : 웹 구축을 위한 스타터, RESTful, 스프링 MVC, 내장 톰캣
spring-boot-starter-validation : 자바 빈 검증기(하이버네이트 Validator)
spring-boot-starter-batch : 스프링 배치를 위한 스타터
```

## Auto Configuration

스프링은 라이브러리를 개발할 때 자동으로 빈을 등록하기 위한 방법을 제공한다.
`@AutoConfiguration` 어노테이션이다.

`@AutoConfiguration`을 설정 클래스에 붙이고, `META-INF\spring\org.springframework.boot.autoconfigure.AutoConfiguration.imports`에 클래스 패키지 명을 적으면 스프링이 해당 클래스를 설정 클래스로 인식한다.

### `@Conditonal`

스프링은 VM 옵션이나 프로그램 아규먼트, 특정 빈 유무 등 조건에 따라 라이브러리의 빈들을 자동으로 등록할지 말지를 결정할 수 있는 기능도 제공한다.

```java
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Conditional {
	Class<? extends Condition>[] value();
}

@FunctionalInterface
public interface Condition {
	boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata);
}
```

`@Conditonal` 어노테이션은 `Conditon` 인터페이스를 요구한다.
`Condition` 인터페이스는 `matches()` 메서드를 통해 조건 만족 여부를 계산한다.

```java
//Condition을 구현하여 VM 옵션에 특정값이(-Dmemory=on) 셋팅되어 있는지 확인한다.
public class MemoryCondition implements Condition {
    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        String memory = context.getEnvironment().getProperty("memory");
        System.out.println("memory = " + memory);
        return "on".equals(memory);
    }
}

//설정 클래스에서 @Conditional을 적용한다.
@Configuration
@Conditional(MemoryCondition.class)
public class MemoryConfig {

    @Bean
    public MemoryController memoryController() {
        return new MemoryController(memoryFinder());
    }

    @Bean
    public MemoryFinder memoryFinder() {
        return new MemoryFinder();
    }
}
```

`@Condtional`은 스프링 프레임워크에서 제공하는 어노테이션이다.

스프링 부트에서는 구현체를 만들지 않고 어노테이션만으로 사용할 수 있도록 다양한 `@ConditionalOnXXX` 어노테이션을 지원한다.

- `@ConditionalOnProperty(name = "memory", havingValue="on")`: `Environment`의 `Property` 중 name과 havingValue에 해당하는 키와 값이 있는지 확인한다.
- `@ConditionalOnBean(name = "DbConfig")`: 특정 빈이 있는지 확인한다.
- `@ConditionalOnMissingBean(name = "DbConfig")`: 특정 빈이 없는지 확인한다.

이 외에도 다양한 조건을 확인하는 [여러 `@ConditionalOnXXX` 시리즈](https://docs.spring.io/spring-boot/reference/features/developing-auto-configuration.html#features.developing-auto-configuration.condition-annotations)가 있다.


### 실제 스프링부트에서 AutoConfiguration 실행 과정

`@SpringBootApplication`은 `@EnableAutoConfiguration`를 포함한다.
`@EnableAutoConfiguration`은 `@Import(AutoConfigurationImportSelector.class)`로 AutoConfiguration을 적용할 설정 클래스를 동적으로 가져온다.

<MessageBox title='`@Import`' level='info'>
	`@Import`는 설정 클래스를 그룹핑하는 개념이다.

 	설정 클래스를 그룹핑하여 어플리케이션에 다 같이 적용한다.
</MessageBox>

`AutoConfigurationImportSelector`는 `ImportSelector`의 구현체이다.

```java
package org.springframework.context.annotation;
public interface ImportSelector {
	String[] selectImports(AnnotationMetadata importingClassMetadata);

	@Nullable
	default Predicate<String> getExclusionFilter() {
		return null;
	}
}
```

`selectImports()`에서 선택할 클래스의 풀 패키지 경로를 반환한다.

`AutoConfigurationImportSelector`는 `selectImports()`를 재정의한다.
`META-INF\spring\org.springframework.boot.autoconfigure.AutoConfiguration.imports` 파일에 적힌 클래스들을 반환한다.

이 클래스들이 `@EnableAutoConfiguration`의 `@Import()`로 그룹핑되어 스프링 컨테이너에 등록된다.

![image](https://github.com/user-attachments/assets/bfde2965-6895-47e9-add2-faadb6f50ffe)


<MessageBox title='AutoConfiguration과 컴포넌트 스캔' level='info'>
	AutoConfiguration은 컴포넌트 스캔에서 제외된다.
	![image](https://github.com/user-attachments/assets/991b1099-3391-4a59-b00f-81842ba59206)
</MessageBox>

## 실행 파일 외부에서 설정값 주입하기

실행 파일 외부에서 설정값을 주입하는 방법은 4가지이다.

- OS 환경 변수
- 자바 시스템 속성
- 자바 커맨드 라인
- 어플리케이션에서 외부 리소스 읽기

### OS 환경 변수

`System.getenv()`를 사용한다.

```java
@Slf4j
public class OsEnv {
	public static void main(String[] args) {
 		Map<String, String> envMap = System.getenv();
 		for (String key : envMap.keySet()) {
 			log.info("env {}={}", key, System.getenv(key));
 		}
 	}
}
```

OS에서 실행되는 다른 어플리케이션과 공유하는 변수이다.

### 자바 시스템 속성

`System.getProperties()`를 사용한다.

```java
@Slf4j
public class JavaSystemProperties {
	public static void main(String[] args) {
 		Properties properties = System.getProperties();
		for (Object key : properties.keySet()) {
			log.info("prop {}={}", key,
			System.getProperty(String.valueOf(key)));
		}
 	}
}
```

`java -Dmemory=on -jar app.jar`로 어플리케이션을 실행할 때 `-D`에 들어가는 키와 값에 해당한다.

어플리케이션에서만 사용할 수 있는 변수이다.
다른 어플리케이션과 공유하지 않는다.

### 자바 커맨드 라인

메인메서드의 파라미터인 `args`를 사용한다.

```java
public class CommandLineV1 {
 public static void main(String[] args) {
	 for (String arg : args) {
	 	log.info("arg {}", arg);
	 }
 }
}
```

`java -jar app.jar dataA dataB`로 어플리케이션을 실행할 때 `dataA`, `dataB`에 해당한다.

스프링은 `ApplicationArguments` 빈을 제공한다. 
`ApplicationArguments`는 메인 메서드로 전달되는 `args`를 읽어서 편리하게 키와 값을 뽑을 수 있게 도와준다.

커맨드라인의 인수는 `--key=value` 패턴을 따른다. (`--url=devdb --username=dev_user --password=dev_pw`)
`getOptionNames()` 메서드는 이러한 패턴의 인수들을 뽑는다.
이 패턴을 따르지 않는 인수는 `getSourceArgs()` 메서드로 얻을 수 있다.

```java
@Slf4j
@Component
public class CommandLineBean {
 	private final ApplicationArguments arguments;

	public CommandLineBean(ApplicationArguments arguments) {
 		this.arguments = arguments;
 	}

	 @PostConstruct
	 public void init() {
		 log.info("source {}", List.of(arguments.getSourceArgs()));
		 log.info("optionNames {}", arguments.getOptionNames());
		 Set<String> optionNames = arguments.getOptionNames();
		 for (String optionName : optionNames) {
			 log.info("option args {}={}", optionName, arguments.getOptionValues(optionName));
		 }
	 }
}
```

### 스프링 통합

OS 환경 변수, 자바 시스템 속성, 자바 커맨드 라인 모두 키와 값으로 설정 정보를 제공한다는 점에서 동일하다.
다만 어디서 이 정보를 뽑느냐가 다르다.

스프링은 이 세 가지 설정 소스들을 `Environment`와 `PropertySource`로 추상화했다.
또한, `application.properites`라는 내부 파일에 설정 정보를 작성하는 방법도 설정 소스로 볼 수 있기 때문에 추상화에 포함되었다.

![image](https://github.com/user-attachments/assets/fcc28219-1d6a-4535-bdf7-65fb6360f9a6)
(출처: 김영한의 스프링부트 - 핵심 원리와 활용)

```java
@Slf4j
@Component
public class EnvironmentCheck {
 private final Environment env;
 public EnvironmentCheck(Environment env) {
 	this.env = env;
 }

 @PostConstruct
 public void init() {
	 String url = env.getProperty("url");
	 String username = env.getProperty("username");
	 String password = env.getProperty("password");
	 log.info("env url={}", url);
	 log.info("env username={}", username);
	 log.info("env password={}", password);
 }
}
```

### `application.properties`

설정 파일이 내부인지 외부인지 판단하는 기준은 jar이다.
설정 파일이 jar 안에 포함되어 있으면 내부 파일, jar 밖에 있으면 외부 파일이다.

스프링은 설정 파일을 내부 파일로 관리한다. 
외부에서 어떤 내부 파일을 읽을지를 명시하면 스프링이 해당 내부 파일을 읽어 설정 정보를 어플리케이션에 적용한다.

이 방식은 외부에서 주입해야 하는 설정 정보의 양을 줄일 수 있고, 프로젝트 내에서 설정 파일이 관리되기 때문에 버전 관리도 용이하다.

스프링의 내부 파일은 `application.properties`이다. (`application.yml`도 가능하다.)
스프링이 권장하는 변수 표기법은 kebab case (`-`를 통한 구분)이다.

```
# 케밥 케이스로 적는다.
url=dev.db.com
username=dev_user
password=dev_pw
max-connection=10
```

외부에서는 `spring.profiles.active`을 통해 스프링의 내부 파일 중 어떤 파일을 적용할 것인지를 선택한다.
`spring.profiles.active`에 지정한 값을 profile이라고 하며, `application-{profile}.properties` 파일을 선택한다.
예를 들어, `spring.profiles.active=dev`면 profile이 dev이며, 스프링은 `application-dev.properties` 파일을 읽어서 설정 정보를 어플리케이션에 적용한다.


#### `application.properties`의 논리 파일

스프링은 하나의 설정 파일에 여러 개의 논리 설정 파일을 정의할 수 있는 기능을 지원한다.

논리 파일은 `spring.config.activate.on-profile=[profile 이름]`으로 시작하며, `#---`로 구분한다.
`#---` 위 아래에 주석이 없어야 하고, 같은 줄에 공백이 없어야 한다.

```
spring.config.activate.on-profile=dev
url=dev.db.com
username=dev_user
password=dev_pw
#---
spring.config.activate.on-profile=prod
url=prod.db.com
username=prod_user
password=prod_pw
```

<MessageBox title='논리 파일의 설정 적용 방법' level='warning'>
	
	```
	url=local.db.com
	username=local_user
	password=local_pw
	#---
	spring.config.activate.on-profile=dev
	url=dev.db.com
	username=dev_user
	password=dev_pw
	#---
	spring.config.activate.on-profile=prod
	url=prod.db.com
	username=prod_user
	password=prod_pw
	#---
	url=hello.db.com
 	```

 	profile이 적히지 않으면(spring.config.activate.on-profile 값 정의가 없으면) default profile이다.

   	어떤 profile을 외부에서 명시하든 url은 `hello.db.com`이 된다.
    	그 이유는 스프링이 설정 파일을 읽는 방법 때문이다.
     	스프링은 위에서 아래로 설정 정보를 읽는다.
      	이 때, `spring.config.activate.on-profile`이 있으면 외부에서 명시한 profile과 일치하는지 확인한다.
       	일치하는 경우 읽기를 계속하며, 겹치는 키는 새로운 값으로 덮어쓴다.
	일치하지 않으면 `#---`를 만날 때까지 설정 정보를 무시한다.

 	이런 식으로 외부에서 설정한 profile이 일치하는 경우에만 설정 정보를 적용한다.
  	그런데 `spring.config.activate.on-profile`을 만날 때 profile 일치 여부를 확인하기 때문에, `spring.config.activate.on-profile`이 없이 설정 정보를 적으면 해당 설정 정보가 적용된다.
   	따라서 맨 마지막 줄에 적은 `url=hello.db.com` 설정이 가장 마지막으로 적용되어 외부에서 명시한 profile과 무관하게 url의 값이 정해지는 것이다.
    
</MessageBox>

### 설정 주입 방법들의 우선 순위

- 자바 커맨드 라인 (높음)
- 자바 시스템 변수
- OS 환경 변수
- 설정 파일 (낮음)


설정 파일은 
- `application-{profile}.properties`  (높음)
- `application.properties` (낮음)

## 외부 설정을 객체로 관리하기

스프링에서 외부 설정은 `Environment`로 추상화하고 있다.

어플리케이션에서 `Environment`를 조회하는 방법은 세 가지이다.

- `Environment` 빈으로 직접 조회
- `@Value`
- `@ConfigurationProperties`

### `Environment` 빈으로 직접 조회

`Environment`는 빈으로 등록되어 있기 때문에 설정 클래스에서 주입 받아 사용한다.

```java
@Slf4j
@Configuration
public class MyDataSourceEnvConfig {
    private final Environment env;

    public MyDataSourceEnvConfig(Environment env) {
        this.env = env;
    }

    @Bean
    public MyDataSource myDataSource() {
        String url = env.getProperty("my.datasource.url");
        String username = env.getProperty("my.datasource.username");
        String password = env.getProperty("my.datasource.passowrd");
        int maxConnection = env.getProperty("my.datasource.etc.max-connection", Integer.class);
        Duration timeout = env.getProperty("my.datasource.etc.timeout", Duration.class);
        List<String> options = env.getProperty("my.datasource.etc.options", List.class);

        return new MyDataSource(url, username, password, maxConnection, timeout, options);
    }
}
```

설정 정보 갯수만큼 `getProperty()`로 가져오는 코드를 작성해야 한다.
설정 정보가 많아지면 관리하기 힘들다.

### `@Value`

`@Value` 어노테이션을 통해 설정 정보를 지칭해서 변수에 할당한다.
클래스의 필드나 메서드의 파라미터 변수에 `@Value`를 붙인다.

```java
@Slf4j
@Configuration
public class MyDataSourceValueConfig {
    @Value("${my.datasource.url}")
    private String url;
    @Value("${my.datasource.username}")
    private String username;
    @Value("${my.datasource.password}")
    private String password;
    @Value("${my.datasource.etc.max-connection:1}")
    private int maxConnection;
    @Value("${my.datasource.etc.timeout}")
    private Duration timeout;
    private List<String> options;

    @Bean
    public MyDataSource myDataSource() {
        return new MyDataSource(url, username, password, maxConnection, timeout, options);
    }

    @Bean
    public MyDataSource myDataSource2(
            @Value("${my.datasource.url}") String url,
            @Value("${my.datasource.username}") String username,
            @Value("${my.datasource.password}") String password,
            @Value("${my.datasource.etc.max-connection}") int maxConnection,
            @Value("${my.datasource.etc.timeout}") Duration timeout,
            @Value("${my.datasource.etc.options}") List<String> options
    ) {
        return new MyDataSource(url, username, password, maxConnection, timeout, options);
    }
}
```

`Environment`를 직접 조회하는 방법보다는 조금 낫지만 마찬가지로 설정 정보가 많을 때는 문제가 된다.
설정 정보가 계층적으로 되어 있지 않아서 가독성이 좋지 않기 때문이다.

### `@ConfigurationProperties`

설정 정보를 클래스에 매핑시킨다.

방법은 두 가지이다.

- 자바빈 메서드(세터)를 활용 (기본 설정)
- 생성자 활용

자바빈 메서드를 활용하는 방법은 클래스의 모든 필드에 세터를 뚫어놔야 하기 때문에 잠재적인 버그 가능성이 있다.
좀 더 안전한 방법은 생성자를 활용하는 방법이다.

<MessageBox title='자바빈 방법과 생성자 방법' level='warning'>
	
	자바빈 방법으로 프로퍼티 클래스를 구성하면 빈으로 직접 등록할 수 있다.
	
	```java
	@Data
	@Component
	@ConfigurationProperties("my.datasource")
	public class MyDataSourcePropertiesV1 {
	    private String url;
	    private String username;
	    private String password;
	    private Etc etc = new Etc();
	
	    @Data
	    public static class Etc {
	        private int maxConnection;
	        private Duration timeout;
	        private List<String> options = new ArrayList<>();
	    }
	}
	```

 	반면에 생성자 방식은 빈으로 직접 등록하면 오류가 난다.
  
  	```bash
	MyDataSourcePropertiesV3 is annotated with @ConstructorBinding but it is defined as a regular bean which caused dependency injection to fail.
    	```
     
  	에러의 내용으로 추측컨대 설정 정보를 셋팅해주는 작업은 컴포넌트 스캔에 의한 빈 생성 작업 이후에 수행되기 때문에, 빈 생성 시점에 설정 정보를 넣어야 하는 생성자 방식은 의존성 주입에서 문제가 생기는 것 같다.

   	해결하려면 `@Configuration`과 `@EnableConfigurationProperties` 조합을 사용하거나 `@ConfigurationPropertiesScan`으로 프로퍼티 클래스를 스캔하는 별도의 로직을 실행하게 설정하면 된다.
    
</MessageBox>

```yml
my:
  datasource:
    url: local.db.com
    username: local_user
    password: local_pw
    etc:
      max-connection: 1
      timeout: 60s
      options: LOCAL, CACHE
```

- `EnableconfigurationProperties`을 이용하기

```java
@Getter
@ConfigurationProperties("my.datasource")
public class MyDataSourcePropertiesV2 {
    private String url;
    private String username;
    private String password;
    private Etc etc;

    public MyDataSourcePropertiesV2(String url, String username, String password, @DefaultValue Etc etc) {
        this.url = url;
        this.username = username;
        this.password = password;
        this.etc = etc;
    }

    @Getter
    public static class Etc {
        private int maxConnection;
        private Duration timeout;
        private List<String> options;

        public Etc(int maxConnection, Duration timeout, @DefaultValue("DEFAULT") List<String> options) {
            this.maxConnection = maxConnection;
            this.timeout = timeout;
            this.options = options;
        }
    }
}

//설정 클래스 정의
//@ConfigurationProperties가 적용된 클래스를 활용하여 빈을 만들기 위해 @EnableConfigurationProperties를 사용한다.
@Slf4j
@EnableConfigurationProperties(MyDataSourcePropertiesV2.class)
public class MyDataSourceConfigV2 {
    private final MyDataSourcePropertiesV2 properties;

    public MyDataSourceConfigV2(MyDataSourcePropertiesV2 properties) {
        this.properties = properties;
    }

    @Bean
    public MyDataSource dataSource() {
        return new MyDataSource(
                properties.getUrl(),
                properties.getUsername(),
                properties.getPassword(),
                properties.getEtc().getMaxConnection(),
                properties.getEtc().getTimeout(),
                properties.getEtc().getOptions()
        );
    }
}
```

- `configurationPropertiesScan`을 이용하기

```java

@SpringBootApplication
@ConfigurationPropertiesScan
public class BlogApplication {

	public static void main(String[] args) {
		SpringApplication.run(BlogApplication.class, args);
	}

}

package service.blog.config;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "custom.github")
@Getter
@AllArgsConstructor
public class GithubConfig {
    final String token;
}

```

클래스를 활용하여 설정 정보를 계층적으로 표현할 수 있기 때문에 가독성이 좋다.

또한, 하이버네이트가 제공하는 검증기를 붙여서 어플리케이션 부트 타임에 올바른 설정 정보가 셋팅되어 있는지 검증할 수 있다.

```java
@Getter
@ConfigurationProperties("my.datasource")
@Validated
public class MyDataSourcePropertiesV3 {
    @NotEmpty
    private String url;
    @NotEmpty
    private String username;
    @NotEmpty
    private String password;
    private Etc etc;

    public MyDataSourcePropertiesV3(String url, String username, String password, Etc etc) {
        this.url = url;
        this.username = username;
        this.password = password;
        this.etc = etc;
    }

    @Getter
    public static class Etc {
        @Min(1) @Max(999)
        private int maxConnection;
        @DurationMin(seconds = 1) @DurationMax(seconds = 60)
        private Duration timeout;
        private List<String> options;

        public Etc(int maxConnection, Duration timeout, List<String> options) {
            this.maxConnection = maxConnection;
            this.timeout = timeout;
            this.options = options;
        }
    }
}
```

#### `@ConfigurationPropertiesScan` - 프로퍼티 클래스 자동으로 등록하기

컴포넌트 스캔으로 `@Component` 클래스를 빈으로 등록하는 것처럼, 프로퍼티 클래스를 스캔하여 자동으로 등록한다.
생성자 방식을 사용하여 프로퍼트 클래스를 생성하는 경우, 이 방법으로 편리하게 빈으로 등록할 수 있다.

```java
@SpringBootApplication
@ConfigurationPropertiesScan("hello.datasource") //basePackage. 기본값은 현재 패키지.
public class ExternalReadApplication {
    public static void main(String[] args) {
        SpringApplication.run(ExternalReadApplication.class, args);
    }
}

//프로퍼티 클래스는 별도로 손 볼 것이 없다.
@Getter
@Component
@ConfigurationProperties("my.datasource")
@Validated
public class MyDataSourcePropertiesV3 {
    @NotEmpty
    private String url;
    @NotEmpty
    private String username;
    @NotEmpty
    private String password;
    private Etc etc;

    @ConstructorBinding
    public MyDataSourcePropertiesV3(String url, String username, String password, Etc etc) {
        this.url = url;
        this.username = username;
        this.password = password;
        this.etc = etc;
    }

    @Getter
    public static class Etc {
        @Min(1) @Max(999)
        private int maxConnection;
        @DurationMin(seconds = 1) @DurationMax(seconds = 60)
        private Duration timeout;
        private List<String> options;

        public Etc(int maxConnection, Duration timeout, List<String> options) {
            this.maxConnection = maxConnection;
            this.timeout = timeout;
            this.options = options;
        }
    }
}
```

#### `@Profile` - Profile에 따른 프로퍼티 클래스 적용하기.

```java
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Conditional(ProfileCondition.class)
public @interface Profile {
	String[] value();
}
```

Profile로 생성될 설정 정보 빈을 선택한다.

프로퍼티 클래스에 붙일 수 있고, 설정 클래스의 `@Bean`에 붙일 수도 있다.

- 프로퍼티 클래스에 붙이는 방법

```java
@Getter
@Profile("prod")
@ConfigurationProperties("my.datasource")
@Validated
public class MyDataSourcePropertiesV3 {
    @NotEmpty
    private String url;
    @NotEmpty
    private String username;
    @NotEmpty
    private String password;
    private Etc etc;

    @ConstructorBinding
    public MyDataSourcePropertiesV3(String url, String username, String password, Etc etc) {
        this.url = url;
        this.username = username;
        this.password = password;
        this.etc = etc;
    }

    @Getter
    public static class Etc {
        @Min(1) @Max(999)
        private int maxConnection;
        @DurationMin(seconds = 1) @DurationMax(seconds = 60)
        private Duration timeout;
        private List<String> options;

        public Etc(int maxConnection, Duration timeout, List<String> options) {
            this.maxConnection = maxConnection;
            this.timeout = timeout;
            this.options = options;
        }
    }
}
```

- 설정 클래스의 `@Bean` 메서드에 붙이는 방법

```java
@Slf4j
@Configuration
public class PayConfig {
 @Bean
 @Profile("default")
 public LocalPayClient localPayClient() {
	 log.info("LocalPayClient 빈 등록");
	 return new LocalPayClient();
 }

 @Bean
 @Profile("prod")
 public ProdPayClient prodPayClient() {
 	log.info("ProdPayClient 빈 등록");
 	return new ProdPayClient();
 }
}
```


## 모니터링 - 액츄에이터

스프링 부트는 어플리케이션에서 중요한 모니터링 지표를 노출한다.

`GET http://localhost:8080/actuator/[지표 이름]`

- `beans`: 스프링 빈 리스트
- `conditions`: `Condition` 인터페이스를 통해 빈이 등록되거나 등록되지 않은 이유를 설명
- `configprops`: 설정 정보인 `@ConfigurationProperties` 클래스 리스트.
- `env`: 어플리케이션에 적용된 설정 정보(`Enviroment`)
- `health`: 어플리케이션의 헬스 정보. [커스텀 헬스 인디케이터](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html#actuator.endpoints.health.writing-custom-health-indicators)를 개발할 수 있음.
- `httpexchanges`: HTTP 요청 및 응답 정보. `HttpExchangeRepository` 구현체를 빈으로 등록해야 한다.
- `info`: 어플리케이션의 정보(java, os, build 정보, git 이력, info 설정 정보(`application.yml`에 `info.xxx`로 정의한 내용))
- `loggers`: 각 클래스별 로깅 레벨. POST로 런타임 중 로그 레벨 조정 가능.
- `metrics`: connection pool, jvm, tomcat 등 어플리케이션 및 인프라 기술의 메트릭 정보
- `mappings`: `@RequestMapping` 정보 (servlet, servlet filter, controller 등)
- `threaddump`: 어플리케이션의 스레드 덤프
- `shutdown`: 어플리케이션을 종료한다.


```yml
management:
  info:
    java:
      enabled: true
    os:
      enabled: true
    env:
      enabled: true
# 기본값은 commit id만 보여줌. 더 많은 정보가 필요하면 mode를 full로 설정
#    git:
#      mode: "full"
  endpoint:
    health:
      # health를 결정하는 컴포넌트들의 상세 헬스 정보를 켠다.
      #show-details: always
      show-components: always
    shutdown:
      enabled: true
  endpoints:
    web:
      # 웹에 노출할 엔드포인트를 지정. *은 모든 엔드포인트를 노출. exclude로 제외시킬 수 있음.
      exposure:
        include: "*"
        #exclude: "env,beans"
      # /actuator 경로 대신에 /manage를 쓴다.
      #base-path: "/manage"
  # 노출되는 정보가 보안상 위험하기 때문에 액츄에이터 포트를 서비스 포트와 다르게 가져가는 게 좋다.
  server:
    port: 9292

# 외부 설정으로서 작동. info가 최상위로 되어 있어서 /actuator/info 에서 조회 가능.
info:
  app:
    name: hello-actuator
    company: yh

# 패키지에 로깅 레벨 지정
logging:
  level:
    hello.controller: debug
```

### `info`

#### build

빌드 정보를 노출하고 싶은 경우 `build.gradle`에 아래 코드를 추가해야 한다.

```gradle
springBoot {
    buildInfo()
}
```

#### git

깃 정보를 노출하고 싶은 경우 `build.gradle`에 플러그인을 추가해야 한다.

```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.0.2'
    id 'io.spring.dependency-management' version '1.1.0'
    id "com.gorylenko.gradle-git-properties" version "2.4.1" //git info
}
```

### `logger`

런타임 중에 특정 클래스나 패키지의 로깅 레벨을 변경할 수 있다.

```
POST http://localhost:8080/actuator/loggers/[패키지 경로]
{
 "configuredLevel": "TRACE"
}
```

### `httpexchanges`

```java
@SpringBootApplication
public class ActuatorApplication {

    public static void main(String[] args) {
        SpringApplication.run(ActuatorApplication.class, args);
    }
    @Bean
    public InMemoryHttpExchangeRepository httpExchangeRepository() {
        InMemoryHttpExchangeRepository repository = new InMemoryHttpExchangeRepository();
        //저장할 이력 갯수 지정. 기본값은 100. 넘어가면 과거 값을 삭제한다.
        repository.setCapacity(200);
        return repository;
    }
```

### `shutdown`

POST로 실행해야 한다.

```bash
POST /actuator/shutdown HTTP/1.1
Host: localhost
Content-Type: application/json
Content-Length: 0
```

## 마이크로미터 (micrometer)

모니터링 툴이 요구하는 포맷이 툴마다 다르다.
모니터링 툴을 바꾸면 포맷도 바뀌기 때문에 어플리케이션의 메트릭을 노출할 때에도 새로운 툴의 포맷에 맞게 변경해야 한다. (즉, 코드가 바뀌어야 한다.)

마이크로미터는 모니터링 포맷을 추상화하고 각 툴이 요구하는 포맷에 따라 구현체를 제공하여 어플리케이션의 코드 변경을 막는다.
스프링은 내부적으로 마이크로미터를 사용한다.
스프링 부트에서는 자동 구성 기능을 통해 여러 메트릭에 대한 마이크로미터의 구현체를 등록한다.

```bash
// /actuator/beans 중에서

...
"jvmThreadMetrics": {
  "aliases": [],
  "scope": "singleton",
  "type": "io.micrometer.core.instrument.binder.jvm.JvmThreadMetrics",
  "resource": "class path resource [org/springframework/boot/actuate/autoconfigure/metrics/JvmMetricsAutoConfiguration.class]",
  "dependencies": [
    "org.springframework.boot.actuate.autoconfigure.metrics.JvmMetricsAutoConfiguration"
  ]
},
...

```

어플리케이션 개발자는 툴이 변경되면 해당 툴이 요구하는 포맷을 지원하는 마이크로미터 라이브러리를 등록하기만 하면 된다.

![image](https://github.com/user-attachments/assets/47214628-a6c4-448a-a5df-076884b84163)
(출처: 김영한의 스프링부트 - 핵심 원리와 활용)

### 기본 제공 메트릭

application, jvm, tomcat, hikari 등의 메트릭을 기본으로 제공한다.


```json
// localhost:8080/actuator/metrics/application.ready.time
{
  "name": "application.ready.time",
  "description": "Time taken (ms) for the application to be ready to service requests",
  "baseUnit": "seconds",
  "measurements": [
    {
      "statistic": "VALUE",
      "value": 5.924
    }
  ],
  "availableTags": [
    {
      "tag": "main.application.class",
      "values": [
        "hello.ActuatorApplication"
      ]
    }
  ]
}
```

### 프로메테우스 지원

마이크로미터가 지원하는 프로메테우스 라이브러리를 추가한다.

```gradle
implementation 'io.micrometer:micrometer-registry-prometheus'
```

스프링 부트에서 이 라이브러리를 추가하면 프로메테우스 구현체를 빈으로 등록하고, 프로메테우스 포맷으로 메트릭을 노출하는 `/actuator/prometheus` 엔드포인트를 오픈한다.

### 커스텀 메트릭

비즈니스 도메인에 맞는 메트릭 모니터링이 필요할 때가 있다.

마이크로미터는 커스텀 메트릭 기능을 지원한다.

```java
@Configuration
@Slf4j
public class OrderConfigV2 {
    @Bean
    public OrderService orderService() {
        return new OrderServiceV2();
    }

    //카운터 메트릭(증가만 하는 메트릭)
    @Bean
    public CountedAspect countedAspect(MeterRegistry registry) {
        return new CountedAspect(registry);
    }
    //타임 메트릭 (카운터 + 소요 시간 관련 메트릭)
    @Bean
    public TimedAspect timedAspect(MeterRegistry registry) {
        return new TimedAspect(registry);
    }
    //게이지 메트릭 (증감이 있는 메트릭)
    @Bean
    public MeterBinder stockSize(OrderService orderService) {
        return registry -> Gauge.builder("my.stock", orderService, service -> {
            log.info("stock gauge call");
            return service.getStock().get();
        }).register(registry);
    }
}

// AOP 방식의 메트릭 수집 지원
@Timed("my.order")
@Slf4j
public class OrderServiceV2 implements OrderService {
    private AtomicInteger stock = new AtomicInteger(100);

    @Counted("my.order")
    @Override
    public void order() {
        log.info("주문");
        stock.decrementAndGet();
    }

    @Counted("my.order")
    @Override
    public void cancel() {
        log.info("취소");
        stock.incrementAndGet();
    }

    @Override
    public AtomicInteger getStock() {
        return stock;
    }
}
```

