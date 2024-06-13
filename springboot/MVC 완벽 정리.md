## 로그인

### 요구 사항

- 디비에 있는 아이디/비번과 요청 데이터 안의 아이디/비번이 일치하는지를 확인한다.
- 사용자마다 접근 가능한 페이지가 있다.
- 로그아웃이 가능해야 한다.
- 보안 문제를 최소화해야 한다.

### 사용자마다 접근 가능한 페이지가 있다

`사용자마다 접근 가능한 페이지가 있다.` -> 쿠키를 사용한다.

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

#### 세션션

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
