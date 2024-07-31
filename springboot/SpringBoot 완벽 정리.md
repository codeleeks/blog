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
