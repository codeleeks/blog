---
summary: `spring-validation` 기능을 활용해 요청 데이터를 검증하는 방법을 정리합니다.
date: 2024-09-01
title-image: 'https://raw.githubusercontent.com/codeleeks/blog/codeleeks-images/springboot/%EC%9A%94%EC%B2%AD%20%EB%8D%B0%EC%9D%B4%ED%84%B0%20%EA%B2%80%EC%A6%9D(Validate)%ED%95%98%EA%B8%B0/title.png'
---


## 문제

요청 DTO에 대한 밸리데이션은 서비스 레이어에 녹아 있는 경우가 많았다.

JSR 표준에서 제공하는 기본적인 밸리데이션은 간단한 어노테이션으로 구현할 수 있지만, 디비 조회가 필요한 밸리데이션 요구 사항을 커버하지 못한다.
디비에 접근하려면 트랜잭션이 필요하기 때문에 밸리데이션 코드는 서비스 레이어로 넘어왔다.

하이버네이트가 제공하는 빈 밸리데이션(`@Valid`)과 스프링이 제공하는 `@Validated`의 간결함을 계승하여, 서비스 레이어에서 밸리데이션 코드를 제거하고 싶었다.
빈 밸리데이션은 커스텀 밸리데이터를 지원한다. 어노테이션으로 제공하는 기본 밸리데이션 이외에 필요한 밸리데이터를 직접 만들 수 있다. 이 커스텀 밸리데이터 기능을 써보기로 했다.

## Custom Validator로 해결하기

아래와 같은 요구 사항이 있다고 하자.

- 회원가입 서비스를 구현한다.
- 요구사항 1. 비밀번호를 두 번 입력받고, 두 개의 비밀번호가 동일할 때만 회원가입이 허용된다.
- 요구사항 2. 중복된 이메일로 회원 가입할 수 없다.
- 요구사항 3. 기존에 탈퇴한 회원은 30일 간 재가입할 수 없다.
- 요구사항 4. 블랙리스트에 등록된 회원은 재가입할 수 없다.

### 요구사항 1. 비밀번호를 두 번 입력받고, 두 개의 비밀번호가 동일할 때만 회원가입이 허용된다

DTO에 `password`, `retypePassword`라는 두 개의 필드를 두고, 이 두 개의 필드가 같은지 확인한다.

크로스 필드 밸리데이션은 DTO 내 메서드로 처리한다.

`@AssertTrue`를 메서드에 붙이면 DTO 내 여러 필드를 조합하여 검증할 수 있다.

```java
package test.validation.web.request;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.Getter;
import org.springframework.format.annotation.DateTimeFormat;
import test.validation.web.request.validator.ReSignUpConstraint;

import java.util.Objects;

@Data
public class SignUpRequest {
    @NotBlank
    private String name;
    @NotBlank
    @Pattern(regexp = "^\\d{3}-\\d{3,4}-\\d{4}$")
    private String phoneNumber;
    @Email
    private String email;
    @NotBlank
    @Size(min = 6, max = 20)
    private String password;
    @NotBlank
    @Size(min = 6, max = 20)
    private String retypePassword;
//    생년월일.
    @DateTimeFormat
    private String birth;

    @AssertTrue
    public boolean isPasswordSame() {
        System.out.println("SignUpRequest.isPasswordSame");
        return Objects.equals(this.password, this.retypePassword);
    }
}
```

### 요구사항 2. 중복된 이메일로 회원 가입할 수 없다.

중복된 이메일임을 알기 위해선 디비에서 회원 정보를 조회해야 한다.

DTO 내부에서 처리할 수 있는 게 아니고, custom validator를 만들어야 한다.

custom validator는 내부적으로 `DataBinder`에서 하이버네이트의 validator인 `ValidatorImpl`를 거쳐서, `ConstructorResolver`를 통해 생성된다.
`ConstructResolver`는 스프링 빈을 만들 때 사용되는 클래스인데, 이는 **커스텀 밸리데이터가 빈은 아니지만 빈처럼 DI 기능을 사용할 수 있다는 뜻**이다.

따라서 커스텀 밸리데이터는 레포지토리 빈을 주입 받아서 디비를 조회할 수 있다.

```java
//밸리데이터
public class DuplicateEmailValidator implements ConstraintValidator<NotDuplicateEmail, String> {
    //레포지토리 빈을 주입받는다.
    private final MemberRepository memberRepository;
    public DuplicateEmailValidator(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }


    @Override
    public void initialize(NotDuplicateEmail constraintAnnotation) {
        System.out.println("DuplicateEmailValidator.initialize");
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return memberRepository.findByEmail(value)
                .isEmpty();
    }
}

//constraint 어노테이션
@Documented
@Constraint(validatedBy = DuplicateEmailValidator.class)
@Target(FIELD)
@Retention(RUNTIME)
public @interface NotDuplicateEmail {

    String message() default "Duplicated email is not allowed";

    Class<?>[] groups() default { };

    Class<? extends Payload>[] payload() default { };
}


//DTO
@Data
public class SignUpRequest {
    @NotBlank
    private String name;
    @NotBlank
    @Pattern(regexp = "^\\d{3}-\\d{3,4}-\\d{4}$")
    private String phoneNumber;
    @Email
    @NotDuplicateEmail
    private String email;
  ...
}
```

### 요구사항 3. 기존에 탈퇴한 회원은 30일 간 재가입할 수 없다, 요구사항 4. 블랙리스트에 등록된 회원은 재가입할 수 없다.

회원을 식별하는 필드는 무엇일까?
회원을 식별하는 필드로 "기존에 탈퇴된 회원"과 "지금 가입하는 회원" 간의 동등성을 가려야 한다.

회원을 식별하는 필드는 도메인마다 다르겠지만 여기선 이름과 생년월일을 사용했다.
이름과 생년월일이 각각 같으면 동일 인물로 본다.

이렇게 DTO가 갖고 있는 여러 개의 필드가 필요하면서 디비에서 조회를 해야 하는 검증 요구 사항은 까다롭다.
요구사항 2는 한 개의 필드만 검증하면 되기 때문에 어노테이션을 해당 필드에 붙이면 됐다.
그런데 여러 개의 필드가 필요한 경우에는 어노테이션을 어떻게 붙여야 할까?

두 가지 방법이 있다.
- DTO에 어노테이션을 붙인다.
- 파라미터에 어노테이션을 붙인다.

#### 해결방법1 DTO에 어노테이션을 붙인다

```java
//constraint 어노테이션
@Documented
@Constraint(validatedBy = ReSignUpConstraintValidator.class)
//어노테이션을 클래스에 붙일 것이기 때문에 타겟은 type이 된다.
@Target(TYPE)
@Retention(RUNTIME)
public @interface ReSignUpConstraint {
    String message() default "signing up again within 1 month is not allowed ";

    Class<?>[] groups() default { };

    Class<? extends Payload>[] payload() default { };
}

@Slf4j
public class ReSignUpConstraintValidator implements ConstraintValidator<ReSignUpConstraint, SignUpRequest> {

    @Override
    public boolean isValid(SignUpRequest value, ConstraintValidatorContext context) {
        System.out.println("ReSignUpConstraintValidator.isValid");
        log.info("value - {}", value);
        return false;
    }
}

@Documented
@Constraint(validatedBy = BlackListConstraintValidator.class)
@Target({TYPE, PARAMETER})
@Retention(RUNTIME)
public @interface BlackListConstraint {
    String message() default "블랙리스트는 회원 가입이 안 됩니다.";

    Class<?>[] groups() default { };

    Class<? extends Payload>[] payload() default { };
}

@Slf4j
public class BlackListConstraintValidator implements ConstraintValidator<BlackListConstraint, SignUpRequest> {
    @Override
    public void initialize(BlackListConstraint constraintAnnotation) {
        ConstraintValidator.super.initialize(constraintAnnotation);
    }

    @Override
    public boolean isValid(SignUpRequest value, ConstraintValidatorContext context) {
        System.out.println("BlackListConstraintValidator.isValid");
        log.info("value - {}", value);
        return false;
    }
}

@Data
@ReSignUpConstraint
@BlackListConstraint
public class SignUpRequest {
    @NotBlank
    private String name;
}
```

#### 해결방법2 컨트롤러의 파라미터에 어노테이션을 붙인다

컨트롤러 클래스에 `@Validated` 어노테이션을 붙이고, 파라미터에 제약 조건 어노테이션을 붙인다.
그러면 요청 객체에 대한 클래스, 필드 검증을 마친 뒤, 컨트롤러 메서드를 호출하기 직전에 파라미터 밸리데이션이 수행된다.
즉, 요청 객체의 필드에 붙인 제약 조건을 그대로 사용하면서 여러 필드와 디비 접근이 필요한 검증을 수행할 수 있다.

클래스나 필드에 붙이는 어노테이션은 `invocableMethod`의 `invokeForRequest()`에서 `getMethodArugmentValues()`를 호출할 때 관련된 밸리데이터가 생성되고 호출된다.
이는 웹 요청을 처리하는 핸들러(컨트롤러)를 찾기 위한 아규먼트 리졸브 단계에 해당한다.

반면, 컨트롤러의 파라미터에 붙은 어노테이션은 `invocableMethod`의 `invokeForRequest()`에서 `doInvoke()`를 호출할 때 관련된 밸리데이터가 생성되고 호출된다.
이는 웹 요청을 처리할 핸들러를 찾은 후에 핸들러의 메서드를 호출하기 전에 수행된다.
컨트롤러 클래스에 `@Validated` 어노테이션이 붙으면 프록시로 처리된다.
이 프록시가 메소드밸리데이터를 호출하기 때문에 메서드 파라미터에 붙인 커스텀 밸리데이터가 호출된다.

![image](https://github.com/user-attachments/assets/eaf6c091-e32c-4123-b43d-bab067f29dbd)

```java
//파라미터 제약 조건 어노테이션
//어노테이션 그룹핑 - @BlackListConstraint, @ReSignUpConstraint (위에서부터 순차적으로 실행됨)
@Documented
@Constraint(validatedBy = {})
@Target({TYPE, PARAMETER})
@Retention(RUNTIME)
@BlackListConstraint
@ReSignUpConstraint
public @interface BusinessValidated {
    String message() default "default";

    Class<?>[] groups() default { };

    Class<? extends Payload>[] payload() default { };
}

// 컨트롤러 클래스
// @Validated를 클래스에 붙이면 메소드 파라미터 밸리데이션이 가능하다
@RestController
@Slf4j
@Validated
public class SignUpController {
    @PostMapping("/signup")
    public void signUp(@RequestBody @Validated @BusinessValidated SignUpRequest signUpRequest) {
        log.info("validation passed! - {}", signUpRequest);
    }

    @PutMapping("/signup")
    public void update(@RequestBody @Validated(UpdateConstraintGroup.class) @BusinessValidated SignUpRequest signUpRequest) {
        log.info("update validation passed! - {}", signUpRequest);
    }
}
```


## 메시지

에러 메시지를 정의하는 방법도 다양하다.

- 어노테이션의 디폴트를 사용한다.
- 메시지가 담긴 예외를 던지고 어드바이스에서 잡아 메시지를 응답한다.

특별한 이유가 없다면 **디폴트를 사용**하는 게 작성할 코드량이 적다. 

어떤 방법을 사용하든 **메시지 소스**를 활용하는 것이 좋다.

스프링 부트는 메시지 소스라는 빈을 자동으로 등록한다. 
메시지 소스는 `messages.properties`를 참고하여 만들어진 메시지를 조회할 수 있다.
메시지 자체는 `MessageCodeResolver`가 만든다.

`messages.properties`에는 코드와 템플릿을 정의한다.

```
my.resign = "{duration}일 동안 재가입이 불가합니다~!"
my.blacklist="블랙리스트래요~"
```

```java
@Documented
@Constraint(validatedBy = ReSignUpConstraintValidator.class)
@Target({TYPE, PARAMETER})
@Retention(RUNTIME)
public @interface ReSignUpConstraint {
    String message() default "{my.resign}";

    Class<?>[] groups() default { };

    Class<? extends Payload>[] payload() default { };

    int duration() default 30;
}

@Documented
@Constraint(validatedBy = BlackListConstraintValidator.class)
@Target({TYPE, PARAMETER})
@Retention(RUNTIME)
public @interface BlackListConstraint {
    String message() default "{my.blacklist}";

    Class<?>[] groups() default { };

    Class<? extends Payload>[] payload() default { };
}
```

결과는

```bash
jakarta.validation.ConstraintViolationException: signUp.signUpRequest: "30일 동안 재가입이 불가합니다~!", signUp.signUpRequest: "블랙리스트래요~"
```

fail된 밸리데이션 목록이 `ConstraintViolationException` 예외에 담긴다.
`ConstraintViolationException`는 `getConstraintViolations()` 메서드를 제공하므로 해당 밸리데이션 실패 목록을 가져와 재구성할 수도 있다.

또한, 메시지소스를 사용하면 국제화도 가능하다.
locale을 설정하고, `messages_ko.properties`, `messages_en.properties` 등의 파일에서 정의하면 스프링부트가 알아서 메시지코드리졸버를 통해 에러 메시지를 등록해준다.

## Validator 내부 동작

처음 요청시 `SpringConstraintValidatorFactory`를 통해 validtor를 빈처럼 만들어준다.
빈처럼 만들어준다는 뜻은 DI를 가능케해준다는 뜻이다.
밸리데이터를 만드는 팩토리(`SpringConstraintValidatorFactory`)는 빈을 만들 때 사용하는 `AutowireCapableBeanFactory`를 사용한다.

![image](https://github.com/user-attachments/assets/cbdd9288-a066-44c6-a568-042b8fb7232d)

요청마다 밸리데이터 객체를 만들지 않는다.
내부적으로 캐싱하고 있고, 동시성 처리도 하고 있다. 

![image](https://github.com/user-attachments/assets/15938eb8-7ac1-4712-8d30-5f71cc3e7b8d)

처음 요청시에는 `createAndInitializeValidator`를 통해 밸리데이터를 생성하고, 캐시에 있다면 그것을 가져온다.

![image](https://github.com/user-attachments/assets/3791ce7d-62a2-437d-82b0-cf771e5e65b0)

ConstraintTree에서 각 constraint에 따른 밸리데이터를 `defaultInitializedConstraintValidator`라는 멤버 필드로 가지고 있다.
이 멤버 변수가 null인 경우에 위의 동작처럼 `ConstraintValidatorManagerImpl`에서 `getInitializedValidator` 메서드를 통해 validator를 가져온다.

![image](https://github.com/user-attachments/assets/ec261874-c93e-407c-a21c-632f765ed126)

custom validator 뿐만 아니라 기본으로 제공하는 constraint 어노테이션(`@NotBlank`, `@Size`, `@Email`, `@Pattern` 등)에 대한 validator도 동일하게 만들어진다.

또한, type -> field -> method -> parameter 순으로 validator가 호출된다.
그래서 parameter에 여러 필드를 디비 조회를 통해 검증해야 하는 밸리데이터(`@BusinessValidated`)가 들어갈 수 있다.

```java
    @PostMapping("/signup")
    public void signUp(@RequestBody @Validated @BusinessValidated SignUpRequest signUpRequest) {
        log.info("validation passed! - {}", signUpRequest);
    }
```
