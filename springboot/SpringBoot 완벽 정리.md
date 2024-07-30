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
