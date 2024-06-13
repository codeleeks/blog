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
