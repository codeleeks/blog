---
summary: Spring MVC를 정리합니다.
date: 2024-06-23
title-image: 'https://raw.githubusercontent.com/codeleeks/blog/codeleeks-images/springboot/Spring%20MVC%20%EC%99%84%EB%B2%BD%20%EC%A0%95%EB%A6%AC/title.png'
---

## Spring MVC

### 핸들러 스캐닝

모든 빈에서 핸들러를 리스트업한다.
핸들러의 조건은 핸들러 매핑마다 다르며, 자주 사용하는 어노테이션 기반 핸들러 매핑은 `@Controller`여야 한다.

![image](https://github.com/user-attachments/assets/d795e722-7f93-4136-9a20-038c45c49353)
![image](https://github.com/user-attachments/assets/f8d13ac8-e9a7-47aa-9f2b-bdafc124f5ef)



### `@RestController`

`HandlerMethodReturnValueHandlerComposite` 객체의 `handleReturnValue()` 메서드에서 처리.
`ModelAndView` 객체는 null로 리턴된다.
관련 어댑터가 `ModelAndView`를 리턴하기 전에 `ServletServerHttpResponse`를 통해 HTTP 응답을 보낸다.
이 응답의 바디에는 컨트롤러가 반환한 데이터가 `HttpMessageConverter`에 의해 직렬화되어 담긴다.

![image](https://github.com/user-attachments/assets/a12d7a53-9f87-4ce7-8e77-25f330287b4d)



## 로그인

### 요구 사항

- 디비에 있는 아이디/비번과 요청 데이터 안의 아이디/비번이 일치하는지를 확인한다.
- 사용자마다 접근 가능한 페이지가 있다.
- 로그아웃이 가능해야 한다.
- 보안 문제를 최소화해야 한다.

### 사용자마다 접근 가능한 페이지가 있다

쿠키를 사용한다.

```java
    @PostMapping("/login")
    public String login(@Valid @ModelAttribute LoginForm form, BindingResult
            bindingResult, HttpServletResponse response) {
        if (bindingResult.hasErrors()) {
            return "login/loginForm";
        }
        Member loginMember = loginService.login(form.getLoginId(),
                form.getPassword());
        log.info("login? {}", loginMember);
        if (loginMember == null) {
            bindingResult.reject("loginFail", "아이디 또는 비밀번호가 맞지 않습니다.");
            return "login/loginForm";
        }
        //로그인 성공 처리
        Cookie idCookie = new Cookie("memberId", String.valueOf(loginMember.getId()));
        response.addCookie(idCookie);

        return "redirect:/";
    }
```

응답에 쿠키를 설정하여 보내주면, 이후에 브라우저는 서버로 HTTP 요청할 때마다 요청 헤더에 쿠키를 넣어서 보낸다.

서버는 요청 헤더에 있는 쿠키를 보고 사용자가 접근 가능한 페이지를 보여줄 수 있다.

<MessageBox title='쿠키의 보안 문제' level='warning'>
  쿠키는 심각한 보안 문제를 갖고 있다.
  브라우저 디버깅을 통해 쿠키를 조회하고 수정할 수 있기 때문이다.
  
  따라서 쿠키는 민감한 정보를 포함해선 안 되고, 해커가 예측 불가능한 임의의 값이어야 하며, 유효기간을 짧게 걸어놓아야 한다.
</MessageBox>

#### 서블릿 필터가 필요한 이유

요청마다 쿠키를 확인하면 사용자가 접근 가능한 페이지인지 아닌지를 확인할 수 있다.

문제는 그러한 요청이 여러 개일 때 발생한다.

모든 요청에 대해 쿠키를 확인하는 로직이 들어가야 한다.

서블릿 필터를 사용하면 하나의 객체로 이를 처리할 수 있다.

서블릿 필터는 컨트롤러로 들어오기 전에 호출되는 로직이다. 

> `HTTP 요청 -> WAS -> 필터1 -> 필터2 -> ... -> 서블릿 -> 컨트롤러`

필터 인터페이스
```java
public interface Filter {

    public default void init(FilterConfig filterConfig) throws ServletException {}

    public void doFilter(ServletRequest request, ServletResponse response,
            FilterChain chain) throws IOException, ServletException;

    public default void destroy() {}
}
```

필터인터페이스를 구현하는 객체를 정의하고, `FilterRegistrationBean`을 통해 빈으로 등록한다.

필터인터페이스를 구현하는 객체 정의
```java
package hello.login.web.filter;

import hello.login.web.SessionConst;
import org.springframework.util.PatternMatchUtils;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;

public class LoginCheckFilter implements Filter {

    private static final String[] whiteList = {"/", "/members/add", "/login", "/logout", "/css/*"};

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        String requestURI = httpRequest.getRequestURI();

        if (isLoginCheckPath(requestURI)) {
            HttpSession session = httpRequest.getSession(false);
            if (session == null || session.getAttribute(SessionConst.LOGIN_MEMBER) == null) {
                httpResponse.sendRedirect("/login?redirectUrl=" + requestURI);
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private boolean isLoginCheckPath(String requestUri) {
        return !PatternMatchUtils.simpleMatch(whiteList, requestUri);
    }
}

```

`FilterRegistrationBean`을 통해 필터를 빈으로 등록
```java
package hello.login.web.login;

import hello.login.web.filter.LogFilter;
import hello.login.web.filter.LoginCheckFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.servlet.Filter;

@Configuration
public class WebConfig {

    @Bean
    public FilterRegistrationBean<Filter> logFilter() {
        FilterRegistrationBean<Filter> filterRegistrationBean = new FilterRegistrationBean<>();
        filterRegistrationBean.setFilter(new LogFilter());
        filterRegistrationBean.setOrder(1);
        filterRegistrationBean.addUrlPatterns("/*");
        return filterRegistrationBean;
    }

    @Bean
    public FilterRegistrationBean loginCheckFilter() {
        FilterRegistrationBean<Filter> filterRegistrationBean = new FilterRegistrationBean<>();
        filterRegistrationBean.setFilter(new LoginCheckFilter());
        filterRegistrationBean.setOrder(2);
        filterRegistrationBean.addUrlPatterns("/*");
        return filterRegistrationBean;
    }
}
```

#### 스프링 인터셉터가 필요한 이유

필터로도 충분히 로직을 잘 구현할 수 있다.

그러나 스프링에서는 필터보다 조금 더 편리하고 세밀한 제어를 할 수 있도록 제공한다.

그래서 보통은 필터보다 인터셉터를 사용한다.

인터셉터는 컨트롤러 호출 전에 호출되며, 필터와 마찬가지로 체인 구조이다.

`HTTP 요청 -> WAS -> 필터 체인 -> 서블릿 -> 인터셉터 -> 컨트롤러`

`HandlerInterceptor` 인터페이스
```java
public interface HandlerInterceptor {

	default boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
			throws Exception {

		return true;
	}

	default void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler,
			@Nullable ModelAndView modelAndView) throws Exception {
	}

	default void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler,
			@Nullable Exception ex) throws Exception {
	}

}
```

예외가 발생하지 않는다면 아래와 같이 수행된다.

`preHandle() -> 컨트롤러 -> postHandle() -> view 렌더링 -> afterCompletion() -> HTTP 응답`

그러나 예외가 발생하면 `postHandle()`은 호출되지 않는다.


인터셉터를 사용하려면,

`HandlerInterceptor`를 구현하는 객체를 정의하고, `addInterceptors` 메서드의 `registry` 객체에 등록한다.


`HandlerInterceptor`를 구현하는 객체를 정의
```java
package hello.login.web.interceptor;

import hello.login.web.SessionConst;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

@Slf4j
public class LogInCheckInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String requestURI = request.getRequestURI();

        HttpSession session = request.getSession();
        if (session == null || session.getAttribute(SessionConst.LOGIN_MEMBER) == null) {
            response.sendRedirect("/login?redirectUrl=" + requestURI);
            return false;
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        if (ex != null) {
            log.error("login check interceptor error - {}", ex);
        }
    }
}

```

`addInterceptors` 메서드의 `registry` 객체에 등록
```java
package hello.login.web.login;
import hello.login.web.interceptor.LogInCheckInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new LogInCheckInterceptor())
                .order(1)
                .addPathPatterns("/**")
                .excludePathPatterns("/css/**", "/*.ico", "/error", "/login", "/logout", "/member/add");
    }
}

```

<MessageBox title='인터셉터의 URL 패턴' level='info'>
    인터셉터에서 사용하는 URL 패턴은 필터와는 다르다.
    
    ```
    ? 한 문자 일치
    * 경로(/) 안에서 0개 이상의 문자 일치
    ** 경로 끝까지 0개 이상의 경로(/) 일치
    {spring} 경로(/)와 일치하고 spring이라는 변수로 캡처
    {spring:[a-z]+} matches the regexp [a-z]+ as a path variable named "spring"
    {spring:[a-z]+} regexp [a-z]+ 와 일치하고, "spring" 경로 변수로 캡처
    {*spring} 경로가 끝날 때 까지 0개 이상의 경로(/)와 일치하고 spring이라는 변수로 캡처
    /pages/t?st.html — matches /pages/test.html, /pages/tXst.html but not /pages/
    toast.html
    /resources/*.png — matches all .png files in the resources directory
    /resources/** — matches all files underneath the /resources/ path, including /
    resources/image.png and /resources/css/spring.css
    /resources/{*path} — matches all files underneath the /resources/ path and
    captures their relative path in a variable named "path"; /resources/image.png
    will match with "path" → "/image.png", and /resources/css/spring.css will match
    with "path" → "/css/spring.css"
    /resources/{filename:\\w+}.dat will match /resources/spring.dat and assign the
    value "spring" to the filename variable
    ```
    <a href='https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/util/pattern/PathPattern.html' target='_blank'>공식 문서 링크</a>
</MessageBox>



### 로그아웃이 가능해야 한다.

로그아웃은 `max-age`가 0인 쿠키를 응답에 넣어주면 된다.

기존 쿠키는 새로 생성된 쿠키에 의해 덮어쓰여지고, 새 쿠키는 `max-age`가 0이기 때문에 즉시 소멸된다.

```java
    @PostMapping("logout")
    public String logout(HttpServletResponse response) {
        expireCookie(response, "memberId");
        return "redirect:/";
    }

    private void expireCookie(HttpServletResponse response, String cookieName) {
        Cookie cookie = new Cookie(cookieName, null);
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }
```

### 보안 문제를 최소화해야 한다.

쿠키의 문제는 브라우저에 정보가 남는다는 점이다.

민감한 정보를 쿠키에 담을 수 없으며, 오로지 클라이언트와 서버 간의 연결을 위해서 사용되어야 한다.

이를 위해, **세션**이라는 개념을 도입한다.

#### 세션

세션은 내부적으로 예측불가능한 랜덤값의 키에 사용자의 데이터를 매핑시켜 쿠키로 만든다.

서블릿은 `HttpSession` 객체를 통해 세션 기능을 제공한다.


로그인 로직
```java
 @PostMapping("/login")
    public String loginV3(@Valid @ModelAttribute LoginForm form, BindingResult
            bindingResult, HttpServletRequest request, HttpServletResponse response) {
        if(bindingResult.hasErrors()) {
            return "login/loginForm";
        }

        Member loginMember = loginService.login(form.getLoginId(), form.getPassword());
        if (loginMember == null) {
            bindingResult.reject("loginFail", "아이디 또는 비밀번호가 맞지 않습니다.");
            return "login/loginForm";
        }

        //request에서 세션을 만든다.
        //getSession()은 저장된 세션을 반환하는데, true(기본값)일 때는 세션이 없는 경우 생성하며, false이면 세션이 없는 경우 null을 반환한다.
        HttpSession session = request.getSession();
        //session에 로그인 정보를 넣는다.
        session.setAttribute(SessionConst.LOGIN_MEMBER, loginMember);
        return "redirect:/";
    }
```

로그아웃 로직
```java
 @PostMapping("logout")
    public String logoutV3(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return "redirect:/";
    }
```

세션(로그인 정보)에 따라 다른 화면 보여주기
```java
 @GetMapping("/")
    public String loginHomeV3(HttpServletRequest request, Model model) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return "home";
        }

        Member loginMember = (Member)session.getAttribute(SessionConst.LOGIN_MEMBER);
        if (loginMember == null) {
            return "home";
        }

        model.addAttribute("member",loginMember);
        return "loginHome";
    }

    //spring에서는 더 편리하게 session에 저장된 사용자 데이터를 가져올 수 있도록 어노테이션을 제공한다.
    //이 기능을 통해서는 데이터 조회만 가능하며, 쿠키 생성은 불가능하다.
    @GetMapping("/")
    public String loginHomeV3Spring(@SessionAttribute(name=SessionConst.LOGIN_MEMBER ,required = false)
                                        Member loginMember, Model model) {
        if (loginMember == null) {
            return "home";
        }

        model.addAttribute("member",loginMember);
        return "loginHome";
    }
```

`HttpSession` 객체는 `JSESSIONID`라는 키를 갖는 쿠키를 생성하고, 하나 이상의 사용자 키밸류 데이터를 하나의 쿠키 value에 저장한다.

![image](https://github.com/codeleeks/blog/assets/166087781/13a0aa3f-4909-44c4-9113-dc0b1d272e7f)

#### 세션 타임아웃 설정

로그아웃하지 않고 브라우저를 종료했을 때를 대비한다.

세션에 타임아웃을 설정하고, 기준 시간을 `최근 요청 시간`으로 정한다.

타임아웃은 `appliction.properties`에서 `session.servlet.session.timeout=60`으로 지정할 수 있으며,

서버에 요청이 발생하면, `최근 요청 시간`이 변경되기 때문에 타임아웃도 연장된다.


## 예외

컨트롤러는 경우에 따라 예외를 발생시킨다.
예외는 두 가지 방법으로 발생한다.
1. throw exception -> WAS에서 500으로 리턴.
2. response.sendError(statusCode) -> WAS에서 등록된 오류페이지 리턴.

컨트롤러에서 예외가 발생하여 throws 했을 때 스프링은 어떻게 처리할까?

스프링이 예외를 처리하는 방식은 뷰 컨트롤러일 때와 API 컨트롤러일 때로 나뉜다.

### 뷰 컨트롤러가 던진 예외 처리하기

뷰 컨트롤러가 던진 예외는 브라우저에서 에러 페이지로 보여져야 한다.
여기서 에러 페이지를 만드는 몫은 서버이다. 
javascript로 작성된 클라이언트가 에러페이지를 만드는 게 아니라 브라우저가 서버에서 보내준 에러페이지를 띄우는 것이다.

WAS(톰캣)은 ErrorPage라는 객체로 에러페이지를 만드는 데 필요한 정보를 저장한다.
과거 XML에서는 ErrorPage를 아래와 같이 정의했다고 한다.

```xml
<web-app>
 <error-page>
    <error-code>404</error-code>
    <location>/error-page/404.html</location>
 </error-page>
 
 <error-page>
    <exception-type>java.lang.RuntimeException</exception-type>
    <location>/error-page/500.html</location>
 </error-page>
</web-app>
```

ErrorPage는 에러코드/예외-로케이션으로 구성된다.
WAS는 여기서 발전하여 자바 코드로 ErrorPage 객체를 만드는 것으로도 에러페이지 설정이 가능하다.

뷰 컨트롤러가 발생시킨 예외는 인터셉터, 디스패처 서블릿, 필터를 거쳐 WAS에 도달한다. (인터셉터나 필터도 예외를 던질 수 있다. 이 예외도 WAS로 전달된다)
어차피 자바 코드니깐 중간에 예외를 잡는 로직이 없다면 당연한 수순이다. WAS가 필터와 디스패처 서블릿의 메서드를 호출하고, 디스패처 서블릿의 메서드에서 어댑터, 인터셉터 등으로 호출이 되기 때문이다.

<MessageBox title='웹 요청의 흐름' level='info'>
	`HTTP 요청 -> WAS -> 필터(서블릿 필터) -> 디스패처서블릿 -> 인터셉터 -> 핸들러 어댑터 -> 핸들러`
	참고로 인터셉터의 `preHandle` 기준의 흐름이다.
	인터셉터는 핸들러 어댑터 호출 전, 호출 후에서 후킹 포인트를 제공한다.
	- preHandle: 핸들러 어댑터 호출 전
	- postHandle: 핸들러 어댑터 호출 후
	- afterCompletion: 뷰 처리 후 호출
</MessageBox>

예외가 WAS에 도달하면 WAS는 자기가 알고 있는 ErrorPage를 검색한다.
발생한 예외에 대한 ErrorPage가 있는 경우는 해당 url로 다시 요청한다.
ErrorPage가 없으면 WAS의 기본 에러페이지를 바로 반환한다.

스프링에서는 스프링부트로 오면서 기본적으로 `resources/static/error` 폴더와 `resources/template/error` 폴더에서 에러페이지용 html 파일을 작성할 수 있도록 세팅한다.
스프링부트는 AutoConfiguration 기능을 통해 에러페이지 관련 객체를 빈으로 등록한다.
`resources/static/error` 폴더와 `resources/template/error` 폴더에서 만든 파일을 참고하여 ErrorPage 객체를 빈으로 등록하고, 에러페이지 뷰 이름을 반환하는 컨트롤러(BasicErrorController)도 빈으로 등록한다. (`/error` uri로 등록)

종합하면 스프링에서 ErrorPage는 `상태 코드 혹은 예외클래스 -> (url path) -> (controller) -> (view 이름) -> 오류페이지파일(html)`순으로 매핑되는 것이다.

<MessageBox title='static과 template' level='info'>
  	오류 페이지는 static, template 방식으로 만들 수 있다.
	`static/error/500.html, static/error/4xx.html, template/error/500.html` 와 같이 상태코드를 파일 이름으로 하여 만들 수 있다.
	static, template 둘 다 동일한 상태 코드로 파일을 만든 경우, 우선순위가 적용된다.(tempate이 static 보다 우선순위가 높음)
</MessageBox>

### API 컨트롤러가 던진 예외 처리하기

API 컨트롤러가 던진 예외는 에러 페이지를 반환하지 않고 데이터를 반환한다.
데이터라는 것은 json 형태의 개발자가 정의한 어떤 자바 객체 자체이거나 스프링이 제공하는 `ResponseEntity`와 같이 여러 가지 HTTP 응답 정보(상태 코드 등)을 담은 객체일 수도 있다.

이러한 데이터는 HTTP 응답으로 변환해줘야 하는데, 이를 

BasicErrorController는 ResponseEntity를 반환한다. 컨트롤러가 반환한 에러 객체는 ResponseEntity의 body로 들어간다.

```java
//BasicErrorController의 API 컨트롤러용 에러 메서드
@RequestMapping
public ResponseEntity<Map<String, Object>> error(HttpServletRequest request) {}

//<Map<String, Object>에 담기는 내용 관련 예제
@RequestMapping(value = "/error-page/500", produces =MediaType.APPLICATION_JSON_VALUE)
public ResponseEntity<Map<String, Object>> errorPage500Api(HttpServletRequest request, HttpServletResponse response) {
  log.info("API errorPage 500");
  Map<String, Object> result = new HashMap<>();
  Exception ex = (Exception) request.getAttribute(ERROR_EXCEPTION);
  result.put("status", request.getAttribute(ERROR_STATUS_CODE));
  result.put("message", ex.getMessage());
  Integer statusCode = (Integer)
  request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
  return new ResponseEntity(result, HttpStatus.valueOf(statusCode));
}
/**
* 응답 예제
{
 "message": "잘못된 사용자",
 "status": 500
}
**/
```

BasicErrorController는 뷰 컨트롤러의 예외를 처리할 때는 편리하지만, API 컨트롤러의 예외를 처리할 때는 유용하지 않다.
API 컨트롤러에서는 같은 예외라도 어떤 컨트롤러가 던졌느냐에 따라 다르게 처리해야 하는 경우도 있기 때문이다.
그래서 `@ExceptionHandler` 기능이 더 편리하다.

### ExceptionResolver

WAS까지 거치는 예외 스택이 비효율적으로 보일 수 있다.
또한 API 컨트롤러가 발생하는 예외든 뷰 컨트롤러가 발생하는 예외든 한 군데에서 직접 처리하고 싶을 수 있다.
스프링은 HandlerExceptionResolver(이하 ExceptionResolver)라는 인터페이스를 제공한다. 
ExceptionResolver는 디스패처 서블릿 단에서 호출된다. 
핸들러 어댑터가 예외를 발생하면 디스패처 서블릿은 이 예외를 try-catch로 잡고, 등록된 ExceptionResolver를 하나씩 조회하여 이 예외를 처리할 수 있는지 확인한다.
ExceptionResolver의 구현체는 스프링이 제공하는 것도 있고, 개발자가 만들 수도 있다.

![image](https://github.com/codeleeks/blog/assets/166087781/86a4ed9b-ba90-4c4c-9d4d-8522c83c678c)

(출처: 김영한 Spring MVC2 강의 ([인프런](https://inf.run/GMo43)))

```java

public interface HandlerExceptionResolver {
 ModelAndView resolveException(
 HttpServletRequest request, HttpServletResponse response,
 Object handler, Exception ex);
}
```

```java
package hello.exception.resolver;
package test.restclient;

import com.fasterxml.jackson.databind.ObjectMapper;
import hello.exception.exception.UserException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.servlet.HandlerExceptionResolver;
import org.springframework.web.servlet.ModelAndView;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
public class UserHandlerExceptionResolver implements HandlerExceptionResolver {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public ModelAndView resolveException(HttpServletRequest request,
                                         HttpServletResponse response, Object handler, Exception ex) {
        try {
            if (ex instanceof UserException) {
                log.info("UserException resolver to 400");
                String acceptHeader = request.getHeader("accept");
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                if ("application/json".equals(acceptHeader)) {
                    Map<String, Object> errorResult = new HashMap<>();
                    errorResult.put("ex", ex.getClass());
                    errorResult.put("message", ex.getMessage());
                    String result =
                            objectMapper.writeValueAsString(errorResult);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("utf-8");
                    response.getWriter().write(result);
                    return new ModelAndView();
                } else {
                    //TEXT/HTML
                    return new ModelAndView("error/400");
                }
            }
        } catch (IOException e) {
            log.error("resolver ex", e);
        }
        return null;
    }
}
```

스프링이 기본적으로 제공하는 ExceptionResolver 구현체를 써도 충분히 많은 상황을 커버할 수 있다.

스프링이 제공하는 ExceptionResolver의 구현체는 세 가지이다.
- `ExceptionHandlerExceptionResolver`: `@ExceptionHandler`를 처리한다
- `ResponseStatusExceptionResolver`: `@ResponseStatus`를 처리한다.
- `DefaultHandlerExceptionResolver`: 스프링 내부 기본 예외를 처리한다.

`ExceptionHandlerExceptionResolver`가 우선순위가 제일 높고, `DefaultHandlerExceptionResolver`가 우선순위가 가장 낮다.

#### `ExceptionHandlerExceptionResolver`
`ExceptionHandlerExceptionResolver`는 예외가 발생한 컨트롤러에 `@ExceptionHandler` 어노테이션이 붙은 메서드가 있는지 확인한다.
`@ExceptionHandler` 붙은 메서드는 일종의 오류 처리 컨트롤러 메서드이다. 특정한 예외를 처리하는 메서드로서, 컨트롤러의 도메인과 그 예외에 맞는 데이터를 반환하고 응답코드를 넣을 수 있다.

```java
package hello.exception.exhandler;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@Slf4j
@RestController
public class ApiExceptionV2Controller {
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(IllegalArgumentException.class)
    public ErrorResult illegalExHandle(IllegalArgumentException e) {
        log.error("[exceptionHandle] ex", e);
        return new ErrorResult("BAD", e.getMessage());
    }
    @ExceptionHandler
    public ResponseEntity<ErrorResult> userExHandle(UserException e) {
        log.error("[exceptionHandle] ex", e);
        ErrorResult errorResult = new ErrorResult("USER-EX", e.getMessage());
        return new ResponseEntity<>(errorResult, HttpStatus.BAD_REQUEST);
    }
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ExceptionHandler
    public ErrorResult exHandle(Exception e) {
        log.error("[exceptionHandle] ex", e);
        return new ErrorResult("EX", "내부 오류");
    }
    @GetMapping("/api2/members/{id}")
    public MemberDto getMember(@PathVariable("id") String id) {
        if (id.equals("ex")) {
            throw new RuntimeException("잘못된 사용자");
        }
        if (id.equals("bad")) {
            throw new IllegalArgumentException("잘못된 입력 값");
        }
        return new MemberDto(id, "hello " + id);
    }
    @Data
    @AllArgsConstructor
    static class MemberDto {
        private String memberId;
        private String name;
    }
}
```

<MessageBox title='예외 처리 로직 분리하기' level='info'>
  `@ControllerAdvice`를 사용하면 컨트롤러에서 발생한 예외를 별도의 클래스에서 처리할 수 있다.
  
  기존의 `@ExceptionHandler`를 사용하면 컨트롤러 내에 예외 처리 메서드가 들어갔지만,
  `@ControllerAdvice`를 사용하면, 예외 처리 로직을 별도의 클래스로 분리하여 가독성을 높일 수 있다.
   <br /><br />
  ```java
	package hello.exception.exhandler.advice;
	import hello.exception.exception.UserException;
	import hello.exception.exhandler.ErrorResult;
	import lombok.extern.slf4j.Slf4j;
	import org.springframework.http.HttpStatus;
	import org.springframework.http.ResponseEntity;
	import org.springframework.web.bind.annotation.ExceptionHandler;
	import org.springframework.web.bind.annotation.ResponseStatus;
	import org.springframework.web.bind.annotation.RestControllerAdvice;
	@Slf4j
	@RestControllerAdvice
	public class ExControllerAdvice {
	    @ResponseStatus(HttpStatus.BAD_REQUEST)
	    @ExceptionHandler(IllegalArgumentException.class)
	    public ErrorResult illegalExHandle(IllegalArgumentException e) {
	        log.error("[exceptionHandle] ex", e);
	        return new ErrorResult("BAD", e.getMessage());
	    }
	    @ExceptionHandler
	    public ResponseEntity<ErrorResult> userExHandle(UserException e) {
	        log.error("[exceptionHandle] ex", e);
	        ErrorResult errorResult = new ErrorResult("USER-EX", e.getMessage());
	        return new ResponseEntity<>(errorResult, HttpStatus.BAD_REQUEST);
	    }
	    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
	    @ExceptionHandler
	    public ErrorResult exHandle(Exception e) {
	        log.error("[exceptionHandle] ex", e);
	        return new ErrorResult("EX", "내부 오류");
	    }
	}
  ```
</MessageBox>

### `ResponseStatusExceptionResolver`
`ResponseStatusExceptionResolver`는 예외를 발생하면 내부적으로 `response.sendError(statusCode)`를 통해 명시한 status code를 넣어주는 역할을 한다.

### `DefaultHandlerExceptionResolver`
`DefaultHandlerExceptionResolver`는 스프링 코드 내부에서 발생한 예외를 처리한다. 예를 들어, 컨트롤러의 파라미터와 요청 파라미터의 타입이 안 맞을 때 예외가 발생하는데, 이 때 `DefaultHandlerExceptionResolver`가 예외를 처리한다.(예시의 경우 상태코드 500이 아니라 400으로 넣어서 응답하는 식이다.)

### `@ExceptionHandler`

컨트롤러에 `@ExceptionHandler`를 붙이면 해당 컨트롤러의 어느 메서드에서 발생한 예외든 처리할 수 있다.
물론 `@ExceptionHandler`의 메서드에서 정의한 예외인 경우이다.
이는 ExceptionHandlerExceptionResolver가 디스패처 서블릿 단에서 처리해주는 것이다.

```java
package test.restclient;

import hello.exception.exception.UserException;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
public class ApiExceptionV2Controller {
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(IllegalArgumentException.class)
    public ErrorResult illegalExHandle(IllegalArgumentException e) {
        log.error("[exceptionHandle] ex", e);
        return new ErrorResult("BAD", e.getMessage());
    }

    @ExceptionHandler
    public ResponseEntity<ErrorResult> userExHandle(UserException e) {
        log.error("[exceptionHandle] ex", e);
        ErrorResult errorResult = new ErrorResult("USER-EX", e.getMessage());
        return new ResponseEntity<>(errorResult, HttpStatus.BAD_REQUEST);
    }

    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ExceptionHandler
    public ErrorResult exHandle(Exception e) {
        log.error("[exceptionHandle] ex", e);
        return new ErrorResult("EX", "내부 오류");
    }

    @GetMapping("/api2/members/{id}")
    public MemberDto getMember(@PathVariable("id") String id) {
        if (id.equals("ex")) {
            throw new RuntimeException("잘못된 사용자");
        }
        if (id.equals("bad")) {
            throw new IllegalArgumentException("잘못된 입력 값");
        }
        if (id.equals("user-ex")) {
            throw new UserException("사용자 오류");
        }
        return new MemberDto(id, "hello " + id);
    }

    @Data
    @AllArgsConstructor
    static class MemberDto {
        private String memberId;
        private String name;
    }
}
```



이렇게 `@ExceptionHandler`는 컨트롤러 빈의 메서드에 붙일 수도 있지만, `@ControllerAdvice`가 붙은 클래스에도 붙일 수 있다.
이 클래스는 여러 컨트롤러에서 발생하는 예외를 처리할 수 있다. `@ControllerAdvice`에서 타겟 클래스 목록을 패키지 경로, 클래스 타입 등으로 정의할 수 있다.

```java
package test.restclient;

import hello.exception.exception.UserException;
import hello.exception.exhandler.ErrorResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class ExControllerAdvice {
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(IllegalArgumentException.class)
    public ErrorResult illegalExHandle(IllegalArgumentException e) {
        log.error("[exceptionHandle] ex", e);
        return new ErrorResult("BAD", e.getMessage());
    }

    @ExceptionHandler
    public ResponseEntity<ErrorResult> userExHandle(UserException e) {
        log.error("[exceptionHandle] ex", e);
        ErrorResult errorResult = new ErrorResult("USER-EX", e.getMessage());
        return new ResponseEntity<>(errorResult, HttpStatus.BAD_REQUEST);
    }

    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ExceptionHandler
    public ErrorResult exHandle(Exception e) {
        log.error("[exceptionHandle] ex", e);
        return new ErrorResult("EX", "내부 오류");
    }
}
```

```java
@ControllerAdvice(annotations = RestController.class)
public class ExampleAdvice1 {}
// Target all Controllers within specific packages
@ControllerAdvice("org.example.controllers")
public class ExampleAdvice2 {}
// Target all Controllers assignable to specific classes
@ControllerAdvice(assignableTypes = {ControllerInterface.class,
        AbstractController.class})
public class ExampleAdvice3 {}

//참고: https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#mvc-ann-controller-advice
```

## 컨버터

컨버터는 `@RequestParam`, `@ModelAttribute`, `@PathVariable`, 뷰 템플릿에서 적절한 타입으로 변환하는 역할을 담당한다.

```java
//converter 인터페이스
package org.springframework.core.convert.converter;
public interface Converter<S, T> {
 T convert(S source);
}
```

소스 객체를 받아 목적 객체로 변환한다.

```java
class StringToIntegerConverter implements Converter<String, Integer> {
  @Override
  public Integer convert(String source) {
    return Integer.valueOf(source);
  }
}
```


### 컨버젼서비스(ConversionService)

타입 변환을 위해선 적합한 컨버터 객체를 찾아야 했다.

컨버젼서비스는 적합한 컨버터를 찾는 수고를 없앴다.

```java
//conversionService 인터페이스
package org.springframework.core.convert;
import org.springframework.lang.Nullable;
public interface ConversionService {
    boolean canConvert(@Nullable Class<?> sourceType, Class<?> targetType);
    boolean canConvert(@Nullable TypeDescriptor sourceType, TypeDescriptor
            targetType);
    <T> T convert(@Nullable Object source, Class<T> targetType);
    Object convert(@Nullable Object source, @Nullable TypeDescriptor sourceType,
                   TypeDescriptor targetType);
}
```

컨버터 객체를 생성할 필요없이, 변환할 타입만 적어주면 타입 변환을 할 수 있다.
컨버전 서비스에 사전에 등록된 컨버터 중에 사용자가 명시한 소스/목적 타입에 적합한 컨버터를 찾아서 호출하는 식이다.

```java
class StringToIntegerConverter implements Converter<String, Integer> {
    @Override
    public Integer convert(String source) {
        DefaultConversionService defaultConversionService = new DefaultConversionService();
        return defaultConversionService.convert(source, Integer.class);
    }
}
```

컨트롤러의 파라미터에 붙여지는 어노테이션들을 처리하는 `ArgumentResolver`는 내부적으로 컨버전서비스를 사용한다.
예를 들어, `@RequestParam`은 `RequestParamMethodArgumentResolver`에서 `conversionService`를 사용하여 타입을 변환한다.

```java
//문자를 숫자로 변환.
//내부적으로 converionService 구현체에 등록된 컨버터를 사용.
@GetMapping("/hello-v2")
public String helloV2(@RequestParam Integer data) {
 System.out.println("data = " + data);
 return "ok";
}
```


### 포매터
컨버터의 특수한 버전.

웹어플리케이션에서 빈번하게 발생하는 유즈케이스에만 집중.
문자->객체, 객체->문자 컨버젼과 현지화(locale)에 집중했다.

```java
//Formatter 인터페이스
public interface Printer<T> {
  String print(T object, Locale locale);
}
public interface Parser<T> {
  T parse(String text, Locale locale) throws ParseException;
}
public interface Formatter<T> extends Printer<T>, Parser<T> {
}
```

#### 스프링이 제공하는 기본 포매터
스프링은 어노테이션 기반으로 포매터를 적용할 수 있게 제공한다.
어노테이션 기반 제공의 장점은 객체의 필드마다 다른 포매터를 적용할 수 있다는 점이다.

에를 들어,
- `@NumberFormat` : 숫자 관련 형식 지정 포맷터 사용, `NumberFormatAnnotationFormatterFactory`가 실제 포매터.
- `@DateTimeFormat` : 날짜 관련 형식 지정 포맷터 사용, `Jsr310DateTimeFormatAnnotationFormatterFactory`가 실제 포매터.

```java
@Data
static class Form {
  @NumberFormat(pattern = "###,###")
  private Integer number;
  @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
  private LocalDateTime localDateTime;
}
```

<MessageBox title='메시지 컨버터와 컨버터' level='warning'>
  메시지 컨버터(HttpMessageConverter)와 여기서 말하는 컨버터는 관련이 없다.
  메시지 컨버터는 HTTP 요청 바디를 객체로, 객체를 HTTP 응답 바디로 변환한다.

  예를 들어, JSON 바디 데이터를 객체로 만들어주거나, 컨트롤러에서 객체를 리턴하면 JSON으로 변환하여 HTTP 응답 바디에 넣어주는 식이다.
  이 과정에서 무언가 커스터마이징이 필요한 경우(예를 들어, JSON으로 변환된 필드의 포매팅을 바꾸고 싶을 때) HttpMessageConverter가 사용하는 JSON 라이브러리의 설정법을 봐야 한다.

  여기서 말하는 컨버터는 @RequestParam, @ModelAttribute, @PathVariable, 뷰 템플릿와 같이 파라미터의 타입변환, 뷰 렌더링시 사용되는 타입 변환 등에 해당하는 기능이다.
</MessageBox>
