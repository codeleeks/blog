## AOP 적용시 인터페이스 VS 추상클래스

[AOP를 적용할 클래스는 어노테이션으로 표시할 수 있다.](https://codeleeks.github.io/blog/posts/springboot/Spring%EC%97%90%EC%84%9C%20%EB%B6%80%EA%B0%80%20%EA%B8%B0%EB%8A%A5%EC%9D%84%20%EC%B6%94%EA%B0%80%ED%95%98%EB%8A%94%20%EB%B0%A9%EB%B2%95.md#:~:text=%EB%A7%A4%EC%B9%AD%ED%95%A0%20%EC%88%98%20%EC%9E%88%EB%8B%A4.-,%40target%2C%20%40within,-%EB%AA%85%EC%8B%9C%ED%95%9C%20%EC%96%B4%EB%85%B8%ED%85%8C%EC%9D%B4%EC%85%98%EC%9D%B4%20%EB%B6%99%EC%96%B4)

```java
    @ClassAop
    static class Child extends Parent {
        public void childMethod() {
        }
    }
```

그런데 어노테이션을 인터페이스에 붙이면 `@within`, `@target`이 작동하지 않는다.

대안은 추상클래스를 사용하는 것이다.

추상클래스에 어노테이션을 붙이고, 어노테이션에 `@Inherited`를 추가하면 추상클래스에 어노테이션만 붙여도 자식클래스에 AOP를 적용할 수 있다.

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
public @interface ClassAop {
}
```

## 테스트 코드

추상클래스와 인터페이스에 각각 어노테이션을 붙이고, `@within`과 `@target`으로 포인트컷이 가능한지 확인했다.

추상클래스만 AOP 적용이 가능했다.

```java
//포인트컷으로 활용할 어노테이션
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
public @interface ClassAop {
}

//테스트 코드드
package test.aop;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

import java.lang.annotation.Annotation;

@SpringBootTest
@Import(AopApplicationTests.Config.class)
class AopApplicationTests {
    @Autowired
    AbstractClass anInterface;

    @Autowired
    Interface parent;

    @Test
    void 추상클래스() {
        System.out.println("anInterface.getClass() = " + anInterface.getClass());

        anInterface.internal();
        anInterface.call();

        if (anInterface instanceof Child c) {
            c.childMethod();
        }

        Annotation[] annotations = anInterface.getClass().getAnnotations();
        for (Annotation annotation : annotations) {
            System.out.println("annotation = " + annotation);

        }
    }

    @Test
    void 인터페이스() {
        System.out.println("parent.getClass() = " + parent.getClass());
        parent.call();
        Annotation[] annotations1 = parent.getClass().getAnnotations();
        for (Annotation annotation : annotations1) {
            System.out.println("annotation = " + annotation);
        }
    }



    static class Config {
        @Bean
        public Parent parent() {
            return new Parent();
        }

        @Bean
        public Child child() {
            return new Child();
        }

        @Bean
        public ClassAspect classAspect() {
            return new ClassAspect();
        }
    }

    @ClassAop
    static abstract class AbstractClass {
        void internal() {
            System.out.println("AbstractClass.internal");
        }
        abstract void call();
    }

    @ClassAop
    interface Interface {
        void call();
    }
    
    static class Parent implements Interface{
        @Override
        public void call() {

        }
    }


    static class Child extends AbstractClass {
        public void childMethod() {
            System.out.println("Child.childMethod");
        }

        @Override
        public void call() {
            System.out.println("Child.call");
        }
    }

    @Aspect
    static class ClassAspect {

        //        @Around("@within(test.aop.ClassAop)")
        @Around("execution(* test.aop..*(..)) && @within(test.aop.ClassAop)")
        public Object atWithin(ProceedingJoinPoint joinPoint) throws Throwable {
            System.out.println("ClassAspect.atWithin");
            return joinPoint.proceed();
        }
        @Around("execution(* test.aop..*(..)) && @target(test.aop.ClassAop)")
        public Object atTarget(ProceedingJoinPoint joinPoint) throws Throwable {
            System.out.println("ClassAspect.atTarget");
            return joinPoint.proceed();
        }
    }

}
```

추상클래스 테스트함수 결과
```bash
anInterface.getClass() = class test.aop.AopApplicationTests$Child$$SpringCGLIB$$0
ClassAspect.atTarget
ClassAspect.atWithin
AbstractClass.internal
ClassAspect.atTarget
ClassAspect.atWithin
Child.call
ClassAspect.atTarget
ClassAspect.atWithin
Child.childMethod
annotation = @test.aop.ClassAop()
```

인터페이스 테스트함수 결과
```bash
parent.getClass() = class test.aop.AopApplicationTests$Parent$$SpringCGLIB$$0
```

인터페이스에 어노테이션을 붙여도 AOP가 적용되지 않았다.
