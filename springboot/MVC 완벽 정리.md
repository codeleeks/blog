## 로그인

### 요구 사항

- 디비에 있는 아이디/비번과 요청 데이터 안의 아이디/비번이 일치하는지를 확인한다.
- 사용자마다 접근 가능한 페이지가 있다.
- 로그아웃이 가능해야 한다.

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
