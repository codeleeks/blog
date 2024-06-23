## 요약

||`@RequestBody`|`@RequestParam`|`@ModelAttribute`|
|---|---|---|---|
|content-type|`application/json`|`application/x-www-form-urlencoded`, `multipart/form-data`|`application/x-www-form-urlencoded`, `multipart/form-data`|
|method|`POST`|`POST`|`POST`|
|허용 타입|모든 객체|primitive 타입, String, Integer 등 기본 타입, List, Map|모든 객체|
|오류시 동작|4xx 응답|4xx 응답|2xx 응답(null 필드 허용)|

<MessageBox title='GET 요청과 요청 데이터' level='warning'>
  HTTP 테스트 툴에 따라 GET 요청할 때 메시지가 바디에 담기는 경우가 있고 아닌 경우가 있다.
  
  표준에서 금지하고 있지 않지만, GET 요청에 담기는 메시지의 의미가 모호하기 때문에 허용하지 않는 툴이 많다.

  따라서 표준에도 GET 요청에 메시지를 담는 시도는 안 하는 것이 바람직하다고 나와 있다.(<a href='https://developer.mozilla.org/ko/docs/Web/HTTP/Methods/GET' target='_blank'>관련 링크</a>)
</MessageBox>

## `@RequestBody`

![image](https://github.com/codeleeks/blog/assets/166087781/60fb23b0-e7ec-4e3f-a3f7-a54d3b99847b)


## `@RequestParam`

![image](https://github.com/codeleeks/blog/assets/166087781/56f36623-4b29-4f75-a90b-2bdb1a69428c)


## `@ModelAttribute`

form 요청 메시지에 객체 필드를 넣으면, 스프링에서 객체에 각 필드값을 담아 생성해준다.

![image](https://github.com/codeleeks/blog/assets/166087781/2de51f5e-df01-450c-8783-09a2d6c5216c)


## 테스트 코드
```java
package hello.upload.domain;

import lombok.AllArgsConstructor;
import lombok.Data;

@AllArgsConstructor
@Data
public class Test {
    Long id;
    String name;
}
```

```java
package hello.upload.controller;

import hello.upload.domain.Test;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;


@Slf4j
@Controller
@RequestMapping("/test")
public class TestController {
    @PostMapping("requestBody")
    public ResponseEntity<?> requestBodyPost(@RequestBody Test test) {
        log.info("test: {}", test);
        return ResponseEntity.ok(test);
    }

    @PostMapping("requestParam")
    public ResponseEntity<?> requestParamPost(@RequestParam long id, @RequestParam String name) {
        return ResponseEntity.ok(new Test(id, name));
    }

    @PostMapping("modelAttribute")
    public ResponseEntity<?> modelAttributePost(@ModelAttribute Test test) {
        log.info("test : {}", test);
        return ResponseEntity.ok(test);
    }

    @GetMapping("requestBody")
    public ResponseEntity<?> requestBodyGet(@RequestBody Test test) {
        return ResponseEntity.ok(test);
    }

    @GetMapping("requestParam")
    public ResponseEntity<?> requestParamGet(@RequestParam long id, @RequestParam String name) {
        return ResponseEntity.ok(new Test(id, name));
    }

    @GetMapping("modelAttribute")
    public ResponseEntity<?> modelAttributeGet(@ModelAttribute Test test) {
        return ResponseEntity.ok(test);
    }
}
```
