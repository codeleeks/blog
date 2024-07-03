## 개요

메인 기능은 비즈니스 로직 자체를 말한다.
부가 기능은 로깅, 트랜잭션 등 다양한 이유로 필요한 로직을 말한다.

부가 기능은 대체로 cross-concern 문제이다.
특정 도메인에 국한된 기능이 아니라 필요하면 모든 도메인에 적용할 수 있는 기능이라는 뜻이다.

메인 기능의 코드 파일에 부가 기능 코드를 작성하면 되면 끝나는 그런 간단한 문제가 아니다.
메인 기능의 코드 파일이 여러 개이며, 하나의 파일에도 여러 개의 메서드에 적용해야 할 수도 있기 때문이다.
부가 기능 코드를 단순히 추가하는 것은 유사 코드의 반복으로 유지보수를 어렵게 하고, 메인 기능의 코드와 부가 기능의 코드가 섞이기 때문에 코드 가독성도 떨어진다.

cross-concern 문제를 제대로 해결하기 여러 가지 디자인 패턴이 등장했다.
템플릿 콜백 패턴, 프록시 패턴이 대표적이다.

스프링에서는 주로 프록시 패턴을 사용한다.
템플릿 콜백 패턴은 결국 메인 기능의 코드 수정이 조금이나마 필요하다는 점에서 한계가 있기 때문이다.
개발자에게 기능을 노출할 때에는 프록시 패턴으로 메인 기능의 코드를 완전히 보존하고, 프레임워크 내부적으로 템플릿 콜백 패턴을 사용한다.

## 템플릿 콜백 패턴

템플릿 메서드 패턴 -> 전략 패턴 -> 템플릿 콜백 패턴 순으로 좀 더 유연해진다.

### 템플릿 메서드 패턴
템플릿이라는 알고리즘의 전체적인 흐름이 있고, 중간 중간에 변경이 필요한 부분을 자식클래스에게 위임하는 방법이다.
상속을 사용한다.

파워포인트 템플릿을 인터넷에서 찾아서 내 입맛에 맞게 수정하는 것이다.
파워포인트 템플릿은 모든 부분을 수정할 수 있지만, 템플릿 메서드 패턴은 템플릿 클래스가 허용한 부분만 수정 가능하다는 차이가 있다.

장점은 반복되는 코드를 템플릿으로 묶어내기 때문에 변경에 유리하다.
단점은 상속을 사용하는데 자식클래스에서 부모클래스의 기능을(메서드를) 사용하지 않는다는 점이다. 다시 말해, 자식클래스 입장에선 부모클래스는 불필요한 의존 관계이다.

```java
//템플릿 클래스 정의.
package hello.advanced.trace.template;

import hello.advanced.trace.TraceStatus;
import hello.advanced.trace.logtrace.LogTrace;

public abstract class AbstractTemplate<T> {
    private final LogTrace trace;

    protected AbstractTemplate(LogTrace trace) {
        this.trace = trace;
    }

    public T execute(String message) {
        TraceStatus status = null;
        try {
            status = trace.begin(message);
            T result = call();
            trace.end(status);
            return result;
        } catch (Exception e) {
            trace.exception(status, e);
            throw e;
        }
    }
    protected abstract T call();
}
```

```java
//템플릿 사용
package hello.advanced.app.v4;

import hello.advanced.trace.TraceStatus;
import hello.advanced.trace.logtrace.LogTrace;
import hello.advanced.trace.template.AbstractTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class OrderControllerV4 {
    private final OrderServiceV4 orderService;
    private final LogTrace trace;

    @GetMapping("/v4/request")
    public String request(String itemId) {
        AbstractTemplate<String> template = new AbstractTemplate<>(trace) {
            @Override
            protected String call() {
                orderService.orderItem(itemId);
                return "ok";
            }
        };

        return template.execute("OrderController.request()");
    }
}
```

### 전략 패턴
템플릿 메서드의 단점은 상속이다.
전략 패턴은 상속을 하지 않고, has-a 관계로 설정한다.
템플릿에 해당하는 클래스는 전략에 해당하는 인터페이스와 has-a 관계를 맺는다.
변경 로직은 전략 인터페이스를 구현하고, 템플릿 클래스에 의존성 주입을 함으로써 반영된다.

의존성을 주입하는 방법은 두 가지이다.

1. 템플릿 클래스 생성 시점에 주입.
2. 템플릿 메서드 호출 시점에 주입.

1번은 다른 변경 로직을 주입하고 싶을 때, 객체를 다시 만들어야 한다.
2번은 메서드 호출 시점에 다른 변경 로직을 주입하면 된다.

2번이 템플릿 콜백 패턴이다.

### 템플릿 콜백 패턴
변경 로직을 메서드 파라미터로 받는다. 로직인 파라미터를 콜백이라 한다.
인터페이스의 메서드가 한 개일 때, 익명 내부 클래스를 람다로 대체할 수 있다.
콜백은 인터페이스이며, 보통 메서드가 한 개이므로, 람다로 구현할 수 있다.

스프링에서 `JdbcTemplate`, `RestTemplate`, `TransactionTemplate` 등 `xxxTemplate` 클래스는 대부분 템플릿 콜백 패턴으로 만들어졌다.

```java
//콜백 정의
package hello.advanced.trace.callback;

public interface TraceCallback<T> {
    T call();
}
```

```java
//템플릿 클래스 정의
package hello.advanced.trace.callback;

import hello.advanced.trace.TraceStatus;
import hello.advanced.trace.logtrace.LogTrace;

public class TraceTemplate {
    private final LogTrace trace;

    public TraceTemplate(LogTrace trace) {
        this.trace = trace;
    }

    public <T> T execute(String message, TraceCallback<T> callback) {
        TraceStatus status = null;
        try {
            status = trace.begin(message);
            T result = callback.call();
            trace.end(status);
            return result;
        } catch (Exception e) {
            trace.exception(status, e);
            throw e;
        }
    }
}
```
```java
//템플릿 사용
package hello.advanced.app.v5;

import hello.advanced.trace.callback.TraceTemplate;
import hello.advanced.trace.logtrace.LogTrace;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OrderControllerV5 {
    private final OrderServiceV5 orderService;
    private final TraceTemplate template;

   // 템플릿 클래스는 한 번만 만들어놓으면 된다.
    public OrderControllerV5(OrderServiceV5 orderService, LogTrace trace) {
        this.orderService = orderService;
        this.template = new TraceTemplate(trace);
    }

    @GetMapping("/v5/request")
    public String request(String itemId) {
        return template.execute("OrderController.request()", () -> {
            orderService.orderItem(itemId);
            return "ok";
        });
    }
}
```

### 문제점

템플릿 메서드 패턴이나 전략 패턴(템플릿 콜백 패턴 포함) 모두 원본 코드를 수정해야 한다.

## 프록시 패턴

호출자와 피호출자 사이에 프록시를 두는 디자인이다.

프록시의 사전적 의미는 대리, 대신한다 이다.

프록시는 호출자의 호출을 받아 피호출자를 호출한다.

호출을 받고 피호출자를 바로 호출하는 게 아니라 무언가를 한다.

그 무언가는 프록시의 기능이다.

### 프록시 기능

- 접근 제어 (프록시 패턴)
  - 권한에 따른 접근 차단
  - 캐싱
  - 지연 로딩
- 부가 기능 추가 (데코레이터 패턴)
  - 요청/응답값 변형
  - 로깅

### 프록시 패턴과 데코레이터 패턴
둘은 코드로 보면 매우 유사하다.

둘의 차이는 목적이다.

프록시패턴은 피호출자에 대한 접근 제어이다.
예를 들어, 피호출자의 메서드가 오래 걸리는 경우 성능 향상을 목적으로 프록시가 캐싱을 할 수 있다.

데코레이터패턴은 메인 기능에 추가적으로 기능을 부여하는 것이다.
로깅이 좋은 예이다.

### 프록시 패턴 적용하기

스프링에서 클래스는 두 가지 방식으로 운용된다.

1. 인터페이스를 구현한 클래스
2. 일반 클래스

프록시 패턴도 클래스 운용 방식에 따라 구현 방법이 나뉜다.

||인터페이스 기반 프록시|클래스 기반 프록시|
|---|---|---|
|사용|`implements`|`extends`|
|장점|인터페이스를 구현하는 모든 클래스에 적용할 수 있다.|변경될 일 없는 구체 클래스의 경우 클래스 기반 프록시가 효율적이다.|
|단점|동일한 로직을 갖지만 대상 클래스만 다른 프록시 클래스가 여러 개 만들어진다. <br /> 변경될 일이 없는 클래스도 인터페이스를 만들어야 한다.| 동일한 로직을 갖지만 대상 클래스만 다른 프록시 클래스가 여러 개 만들어진다. <br /> 불필요한 코드(super() 호출)가 발생한다. <br /> 프록시는 해당 클래스에만 적용가능하다.|

프록시 객체를 만드는 방법은 프록시 패턴에 상관없이 두 가지이다.
- 정적 프록시: 프록시 객체를 일반적인 객체 생성 프로세스(new Object())를 따라 생성하는 방식
- 동적 프록시: 런타임에 클래스 정의, 로딩하여 객체를 생성하는 방식. (jdk 동적 프록시, cglib)

#### 인터페이스 기반 프록시 예제

```java
public class OrderRepositoryInterfaceProxy implements OrderRepositoryV1 {
    private final OrderRepositoryV1 target;
    private final LogTrace logTrace;

    public OrderRepositoryInterfaceProxy(OrderRepositoryV1 target, LogTrace logTrace) {
        this.target = target;
        this.logTrace = logTrace;
    }

    @Override
    public void save(String itemId) {
        TraceStatus status = null;
        try {
            status = logTrace.begin("OrderRepository.save()");
            //target 호출
            target.save(itemId);
            logTrace.end(status);
        } catch (Exception e) {
            logTrace.exception(status, e);
            throw e;
        }
    }
}
```

#### 클래스 기반 프록시 예제
```java
package hello.proxy.config.v1_proxy.concrete_proxy;

import hello.proxy.app.v2.OrderRepositoryV2;
import hello.proxy.trace.TraceStatus;
import hello.proxy.trace.logtrace.LogTrace;

public class OrderRepositoryConcreteProxy extends OrderRepositoryV2 {
    private final OrderRepositoryV2 target;
    private final LogTrace logTrace;

    public OrderRepositoryConcreteProxy(OrderRepositoryV2 target, LogTrace logTrace) {
        this.target = target;
        this.logTrace = logTrace;
    }

    @Override
    public void save(String itemId) {
        TraceStatus status = null;
        try {
            status = logTrace.begin("OrderRepository.save()");
            //target 호출
            target.save(itemId);
            logTrace.end(status);
        } catch (Exception e) {
            logTrace.exception(status, e);
            throw e;
        }
    }
}

```

#### 정적 프록시의 문제점 

유사한 로직을 갖는 프록시 클래스가 프록시를 적용할 클래스 수만큼 많아진다.

### 동적 프록시

동적 프록시는 런타임에 프록시 클래스를 정의하고, 로딩하며, 객체를 생성하는 방식이다.
따라서 정적 프록시와 달리 프록시 클래스를 미리 만들어 컴파일하지 않아도 된다.

jdk 동적 프록시와 cglib 프록시 방식으로 나뉜다.

||jdk 동적 프록시|cglib 프록시|
|---|---|---|
|사용|인터페이스를 구현한 클래스에 적용|일반 클래스에 적용|
|장점|인터페이스를 상속하기 때문에 불필요한 부모 생성자 호출이 없다|모든 클래스를 동적 생성시킬 수 있다|
|단점|인터페이스를 구현한 클래스만 동적 생성 가능|일반 클래스에 기본 생성자를 요구하고, 프록시 객체 생성시 타겟 객체의 기본생성자를 두 번 호출한다.|

#### jdk 동적 프록시

`invocationHandler`를 구현해야 한다.

```java
package java.lang.reflect;

public interface InvocationHandler {
    public Object invoke(Object proxy, Method method, Object[] args)
        throws Throwable;
}
```

java에서 지원하는 Proxy 클래스를 통해 프록시 객체를 생성한다.

```java
package hello.proxy.jdkdynamic.code;

import lombok.extern.slf4j.Slf4j;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;

@Slf4j
public class TimeInvocationHandler implements InvocationHandler {
    private final Object target;

    public TimeInvocationHandler(Object target) {
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        log.info("TimeProxy started");
        long startTIme = System.currentTimeMillis();
        Object result = method.invoke(target, args);
        long endTime = System.currentTimeMillis();
        long resultTime = endTime - startTIme;
        log.info("TimeProxy terminated resultTime={}", resultTime);
        return result;
    }
}

```

```java
      AInterface target = new AImpl();
        TimeInvocationHandler handler = new TimeInvocationHandler(target);
        AInterface proxy = (AInterface)Proxy.newProxyInstance(AInterface.class.getClassLoader(), new Class[]{AInterface.class}, handler);
        proxy.call();
```

#### cglib 프록시

cglib은 외부 프록시 객체 생성 라이브러리이다.

스프링에서 내부적으로 이 라이브러리를 사용하고 있기 때문에, 별도의 라이브러리 설치는 필요 없다.

`MethodInterceptor` 인터페이스를 구현해야 한다.

```java
package org.springframework.cglib.proxy;

import java.lang.reflect.Method;

public interface MethodInterceptor extends Callback {
    Object intercept(Object var1, Method var2, Object[] var3, MethodProxy var4) throws Throwable;
}

```

cglib의 `enhancer` 객체를 생성해서, 타겟 클래스 지정, 인터셉터 로직 지정하면 프록시 객체를 만들 수 있다.

```java
package hello.proxy.cglib.code;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cglib.proxy.MethodInterceptor;
import org.springframework.cglib.proxy.MethodProxy;

import java.lang.reflect.Method;

@Slf4j
public class TimeMethodInterceptor implements MethodInterceptor {
    private final Object target;

    public TimeMethodInterceptor(Object target) {
        this.target = target;
    }

    @Override
    public Object intercept(Object o, Method method, Object[] objects, MethodProxy methodProxy) throws Throwable {
        log.info("TimeProxy called");
        long startTime = System.currentTimeMillis();
        Object result = methodProxy.invoke(target, objects);
        long endTime = System.currentTimeMillis();
        long resultTime = endTime - startTime;
        log.info("TimeProxy terminated resultTime={}", resultTime);
        return result;
    }
}

```

```java
    void cglib() {
        ConcreteService target = new ConcreteService();
        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(ConcreteService.class);
        enhancer.setCallback(new TimeMethodInterceptor(target));
        ConcreteService proxy = (ConcreteService) enhancer.create();
        log.info("targetClass={}", target.getClass());
        log.info("proxyClass={}", proxy.getClass());

        proxy.call();
    }
```

### 스프링의 `ProxyFactory`

스프링이 제공하는 ProxyFactory와 MethodInterceptor를 사용하면 편리하게 프록시 객체를 만들 수 있다.

스프링은 두 가지 동적 프록시 방식을 추상화하고, 설정과 상황에 따라 다른 방식을 취하여 프록시 객체를 생성한다. (`ProxyFactory` 객체 사용)

내부적으로 타겟이 interface를 구현하고 있는지, 아니면 일반 클래스인지에 따라 jdk 동적 프록시, cglib을 선택하여 프록시 객체를 만든다. (`proxyFactory.setProxyTargetClass(true)`로 설정하면 인터페이스를 구현하는 클래스도 cglib 방식으로 프록시 객체를 만든다.)

프록시의 기능은 `MethodInterceptor`를 상속받고, `invoke()` 메서드에 작성하면 된다.

```java
package org.aopalliance.intercept;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

@FunctionalInterface
public interface MethodInterceptor extends Interceptor {
	@Nullable
	Object invoke(@Nonnull MethodInvocation invocation) throws Throwable;
}
```

`MethodInterceptor`를 상속받아 프록시 로직을 만들고, `proxyFactory` 객체에 프록시 로직을 넣어 프록시 객체를 생성한다.

- `Advice`: 프록시 로직이다.(부가 기능 그 자체) 스프링 ProxyFactory의 용어로서 jdk 동적 프록시의 invocationHandler, cglib의 methodInterceptor를 추상화한다.
- `Pointcut`: 필터링이다. 프록시 부가 기능을 어떤 클래스에 적용할지를 지정한다. 
`Advisor`: Advice와 Pointcut을 가지고 있는 것이다. 조언(Advice)를 어디에(Pointcut) 할지 알고 있다. 프록시 팩토리에서 Advisor 지정은 필수다.

프록시 팩토리는 생성시 타겟 객체를 받는다.
프록시 팩토리는 하나의 타겟에 여러 Advisor를 넣을 수 있다.

`addAdvisor()` 메서드를 통해 등록하는 순서대로 `advisor`의 `advice`가 호출된다.

```java
package hello.proxy.common;

import lombok.extern.slf4j.Slf4j;
import org.aopalliance.intercept.MethodInterceptor;
import org.aopalliance.intercept.MethodInvocation;

@Slf4j
public class TimeAdvice implements MethodInterceptor {
    @Override
    public Object invoke(MethodInvocation invocation) throws Throwable {
        log.info("TimeProxy called");
        long startTime = System.currentTimeMillis();
        Object result = invocation.proceed();
        long endTime = System.currentTimeMillis();
        long resultTime = endTime - startTime;
        log.info("TimeProxy terminated resultTime={}", resultTime);
        return result;
    }
}
```

```java
    void interfaceProxy() {
        ServiceImpl target = new ServiceImpl();
        ProxyFactory proxyFactory = new ProxyFactory(target);
        proxyFactory.addAdvice(new TimeAdvice());
        ServiceInterface proxy = (ServiceInterface)proxyFactory.getProxy();
        log.info("targetClass={}", target.getClass());
        log.info("proxyClass={}", proxy.getClass());

        proxy.save();

        assertThat(AopUtils.isAopProxy(proxy)).isTrue();
        assertThat(AopUtils.isJdkDynamicProxy(proxy)).isTrue();
        assertThat(AopUtils.isCglibProxy(proxy)).isFalse();
    }
```

스프링이 제공하는 포인트컷
- `NameMatchMethodPointcut`: 메서드 이름 기반으로 매칭한다.
- `AspectJExpressionPointcut`: aspectJ 표현식으로 매칭한다.

#### 문제점

프록시 팩토리를 통해 직접 프록시 객체를 빈으로 만드는 것은 문제가 있다.

1. 프록시 객체마다 빈을 만들어줘야 한다.
   - 프록시를 적용한 클래스가 많다면 프록시 객체로 만드는 메서드(빈 생성 메서드) 또한 많아진다.
2. 컴포넌트 스캔으로 등록된 클래스 처리 불가
   - 컴포넌트 스캔으로 자동 등록된 빈들은 의존성을 주입 받는데, 이 때 프록시 객체가 아니라 컴포넌트 스캔으로 등록된 빈으로 주입될 수 있다. 

이 두 가지 문제는 스프링이 제공하는 빈 후처리기를 통해 해결할 수 있다.

### 빈 후처리기
스프링 컨테이너가 빈을 생성하고 빈 이름과 객체를 매핑하는 과정이 있다.
스프링은 이 과정에서 후킹 포인트를 제공한다.

BeanPostProcessor 인터페이스를 구현하면 빈 생성 후 초기화 전 시점과 빈 생성 후 초기화 후 시점에 빈을 조작할 수 있다.
빈의 메서드를 호출하거나, 등록할 빈을 다른 객체로 교체할 수 있다는 뜻이다.

주의할 점은 모든 빈에 대해 조작할 수 있는 것은 아니라는 점이다.
따라서 우리가 조작할 빈의 범위를 조정하는 것이 필수이다.

```java
@Slf4j
public class PackageLogTraceProxyPostProcessor implements BeanPostProcessor {
    private final String basePackage;
    private final Advisor advisor;

    public PackageLogTraceProxyPostProcessor(String basePackage, Advisor advisor) {
        this.basePackage = basePackage;
        this.advisor = advisor;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        log.info("param beanName={} bean={}", beanName, bean.getClass());
        String packageName = bean.getClass().getPackageName();
        //패키지 이름으로 조작할 빈 범위 조정
        if (!packageName.startsWith(basePackage)) {
            return bean;
        }

        ProxyFactory proxyFactory = new ProxyFactory(bean);
        proxyFactory.addAdvisor(advisor);
        Object proxy = proxyFactory.getProxy();
        log.info("create proxy: target={} proxy={}", bean.getClass(), proxy.getClass());
        return proxy;
    }
}
```

빈 후처리기를 사용하면, 스프링 컨테이너가 생성한 빈들을 프록시 객체로 만들 수 있기 때문에
컴포넌트 스캔으로 등록된 빈도 프록시로 감쌀 수 있고, 클래스마다 별도의 프록시 객체를 만드는 코드를 다 적을 필요도 없다.
빈 후처리기에서 object 타입으로 들어오는 빈들을 프록시로 감싸는 코드 하나면 모든 클래스를 커버할 수 있다.

#### 스프링이 제공하는 프록시 객체 생성을 위한 빈 후처리기
스프링에서는 프록시 객체를 만드는 빈 후처리기(AnnotationAwareAspectJAutoProxyCreator)를 제공하고 있다.
우리는 Advisor를 빈으로 등록하기만 하면 된다.
AnnotationAwareAspectJAutoProxyCreator는 Advisor 안에 있는 포인트컷으로 적용할 빈을 걸러낸다.
하나의 빈에 여러 개의 advisor가 매칭된다면 하나의 프록시에 여러 개의 advisor가 매핑된다.

설치하려면
`implementation 'org.springframework.boot:spring-boot-starter-aop'`

```java
package hello.proxy.config.v5_autoproxy;

import hello.proxy.config.AppV1Config;
import hello.proxy.config.AppV2Config;
import hello.proxy.config.v3_proxyfactory.advice.LogTraceAdvice;
import hello.proxy.trace.logtrace.LogTrace;
import org.springframework.aop.Advisor;
import org.springframework.aop.aspectj.AspectJExpressionPointcut;
import org.springframework.aop.support.DefaultPointcutAdvisor;
import org.springframework.aop.support.NameMatchMethodPointcut;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

@Configuration
@Import({AppV1Config.class, AppV2Config.class})
public class AutoProxyConfig {

//    @Bean
    public Advisor advisor1(LogTrace logTrace) {
        NameMatchMethodPointcut pointcut = new NameMatchMethodPointcut();
        pointcut.setMappedNames("request*", "order*", "save*");
        LogTraceAdvice advice = new LogTraceAdvice(logTrace);
        return new DefaultPointcutAdvisor(pointcut, advice);
    }

//    @Bean
    public Advisor advisor2(LogTrace logTrace) {
        AspectJExpressionPointcut pointcut = new AspectJExpressionPointcut();
        pointcut.setExpression("execution(* hello.proxy.app..*(..))");
        LogTraceAdvice advice = new LogTraceAdvice(logTrace);
        return new DefaultPointcutAdvisor(pointcut, advice);
    }

    @Bean
    public Advisor advisor3(LogTrace logTrace) {
        AspectJExpressionPointcut pointcut = new AspectJExpressionPointcut();
        pointcut.setExpression("execution(* hello.proxy.app..*(..)) && !execution(* hello.proxy.app..noLog(..))");
        LogTraceAdvice advice = new LogTraceAdvice(logTrace);
        return new DefaultPointcutAdvisor(pointcut, advice);
    }
}
```

### AOP로 부가 기능 로직에 집중하기
AnnotationAwareAspectJAutoProxyCreator로 동적 프록시 생성 관련 문제가 해결되었지만, 스프링은 부가 기능 개발자가 부가 기능 로직에만 집중할 수 있도록 AOP(Aspect Oriented Programming)를 지원한다.

AnnotationAwareAspectJAutoProxyCreator는 @Aspect 어노테이션이 붙은 클래스를 보고 Advisor를 자동으로 만들어준다.
@Around 안에 적는 것은 포인트컷(aspectJ 표현식)이며, 메소드 내용은 Advice 이다.

```java
package hello.proxy.config.v6_aop.aspect;

import hello.proxy.trace.TraceStatus;
import hello.proxy.trace.logtrace.LogTrace;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;

@Slf4j
@Aspect
public class LogTraceAspect {
    private final LogTrace logTrace;

    public LogTraceAspect(LogTrace logTrace) {
        this.logTrace = logTrace;
    }

    @Around("execution(* hello.proxy.app..*(..))")
    public Object execute(ProceedingJoinPoint joinPoint) throws Throwable {
        TraceStatus status = null;

        log.info("target={}", joinPoint.getTarget());
        log.info("getArgs={}", joinPoint.getArgs());
        log.info("getSignature={}", joinPoint.getSignature());

        try {
            String message = joinPoint.getSignature().toShortString();
            status = logTrace.begin(message);

            Object result = joinPoint.proceed();

            logTrace.end(status);
            return result;
        } catch (Exception e) {
            logTrace.exception(status, e);
            throw e;
        }
    }
}
```

### Aspect oriented programming

cross-concern 문제를 해결하는 방법론이다.
부가 기능을 최대한 모듈화하여 유지보수에 유리한 코드로 만드는 것이 목적이다.
Aspect은 스프링의 Advisor라고 보면 된다.

부가 기능을 추가하는 방법으로 세 가지가 있다. (부가 기능 추가를 위빙(weaving)이라 한다)

1. 컴파일 타임 위빙: AspectJ 컴파일러가 타겟 클래스에 부가 기능 코드를 넣고 컴파일한다.
2. 클래스 로딩 타임 위빙: 클래스 로딩 과정에서 후킹 포인트가 있는데, 이 때 AspectJ 모듈이 클래스 코드를 조작한다.
3. 런타임 위빙: 프록시 패턴으로 부가 기능을 추가한다.

스프링은 3번 방법을 밀고 있다.
프록시 객체를 만드는 빈 후처리기(AnnotationAwareAspectJAutoProxyCreator)가 등록된 어드바이저 빈의 포인트컷을 참고하여 타겟 객체를 프록시 객체로 대체한다.
타겟 객체는 빈 후처리기가 호출되어야 하기 때문에 빈으로 등록되길 원해야 하며, 결과적으로 빈으로 등록되지 못하고 프록시 객체에 의해 감싸지게 된다. 

프록시 패턴은 메소드 오버라이딩을 이용하기 때문에 조인포인트(부가 기능 추가가 적용될 수 있는 지점)가 메서드 레벨로 제한된다. (컴파일 타임 위빙이나 클래스 로딩 타임은 결과적으로 바이트 코드를 조작하기 때문에 클래스의 모든 필드가 조인포인트라고 할 수 있다)


### 스프링 AOP

스프링은 @Aspect 키워드를 가진 빈을 어드바이저로 만들고, 포인트컷으로 타겟을 정한다.
@Aspect 키워드를 가진 클래스를 빈으로 등록해야 한다.

```java
@Slf4j
@Aspect
public class AspectV1 {

    @Around("execution(* hello.aop.order..*(..))")
    public Object doLog(ProceedingJoinPoint joinPoint) throws Throwable {
        log.info("[log] {}", joinPoint.getSignature());
        return joinPoint.proceed();
    }
}
```

```java
//import로 @Aspect을 가진 클래스를 빈으로 등록
@Import(AspectV1.class)
@SpringBootApplication
public class AopApplication {

	public static void main(String[] args) {
		SpringApplication.run(AopApplication.class, args);
	}
}
```

포인트컷은 @Pointcut 어노테이션으로 따로 빼서 지정할 수 있다.
메서드는 void 리턴 타입이고, 내용은 비어 있어야 한다.

```java
package hello.aop.order.aop;

import org.aspectj.lang.annotation.Pointcut;

public class Pointcuts {
    @Pointcut("execution(* hello.aop.order..*(..))")
    public void allOrder() {}

    @Pointcut("execution(* *..*Service.*(..))")
    public void allService() {}

    @Pointcut("allOrder() && allService()")
    public void orderAndService() {}
}
```
```java
package hello.aop.order.aop;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;

@Slf4j
@Aspect
public class AspectV4Pointcut {
    @Around("hello.aop.order.aop.Pointcuts.allOrder()")
    public Object doLog(ProceedingJoinPoint joinPoint) throws Throwable {
        log.info("[log] {}", joinPoint.getSignature());
        return joinPoint.proceed();
    }

    @Around("hello.aop.order.aop.Pointcuts.orderAndService()")
    public Object doTransaction(ProceedingJoinPoint joinPoint) throws Throwable {
        try {
            log.info("[트랜잭션 시작] {}", joinPoint.getSignature());
            Object result = joinPoint.proceed();
            log.info("[트랜잭션 커밋] {}", joinPoint.getSignature());
            return result;
        } catch (Exception e) {
            log.info("[트랜잭션 롤백] {}", joinPoint.getSignature());
            throw e;
        } finally {
            log.info("[리소스 릴리즈] {}", joinPoint.getSignature());
        }
    }
}
```

어드바이저는 여러 개의 어드바이스를 가질 수 있으며, 실행 순서는 기본적으로 보장되지 않는다.

어드바이스의 실행 순서가 중요하다면, 여러 개의 어드바이저로 쪼개고, @Order로 순서를 명시해야 한다.

```java
package hello.aop.order.aop;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.core.annotation.Order;

@Slf4j
public class AspectV5Order {

    @Aspect
    @Order(2)
    public static class LogAspect {
        @Around("hello.aop.order.aop.Pointcuts.allOrder()")
        public Object doLog(ProceedingJoinPoint joinPoint) throws Throwable {
            log.info("[log] {}", joinPoint.getSignature());
            return joinPoint.proceed();
        }
    }

    @Aspect
    @Order(1)
    public static class TxAspect {
        @Around("hello.aop.order.aop.Pointcuts.orderAndService()")
        public Object doTransaction(ProceedingJoinPoint joinPoint) throws Throwable {
            try {
                log.info("[트랜잭션 시작] {}", joinPoint.getSignature());
                Object result = joinPoint.proceed();
                log.info("[트랜잭션 커밋] {}", joinPoint.getSignature());
                return result;
            } catch (Exception e) {
                log.info("[트랜잭션 롤백] {}", joinPoint.getSignature());
                throw e;
            } finally {
                log.info("[리소스 릴리즈] {}", joinPoint.getSignature());
            }
        }
    }
}
```

어드바이스를 지정하는 어노테이션은 프록시 코드 호출 시점에 따라 여러 가지이다.

- @Around: 모든 경우를 커버한다. ProceedingJoinPoint를 파라미터로 받기 때문에 타겟 메서드의 코드 실행 전후에 부가 기능 로직을 추가할 수 있으며, try-catch-finally를 통한 예외 처리도 가능하다.
- @Before: 타겟 메서드 호출 전에 호출한다. JoinPoint를 파라미터로 받는다.
- @AfterReturning: 타겟 메서드 호출 후에 호출한다. JoinPoint를 파라미터로 받기 때문에 proceed()를 호출하지 않아도 이 메서드 종료 이후에 타겟 메서드가 실행된다. `returning`의 이름과 파라미터의 이름이 같아야 한다.
- @AfterThrowing: 타겟 메서드가 예외를 발생시키면 호출한다. try-catch-finally에서 catch와 같다. `throwing`의 이름과 파라미터의 이름이 같아야 한다.
- @After: 타겟 메서드가 정상 종료하거나 예외 발생하거나 관계 없이 호출한다. try-catch-finally에서 finally와 같다. 

```java
package hello.aop.order.aop;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.core.annotation.Order;

@Slf4j
@Aspect
public class AspectV6Advice {
    @Around("hello.aop.order.aop.Pointcuts.orderAndService()")
    public Object doTransaction(ProceedingJoinPoint joinPoint) throws Throwable {
        try {
            log.info("[트랜잭션 시작] {}", joinPoint.getSignature());
            Object result = joinPoint.proceed();
            log.info("[트랜잭션 커밋] {}", joinPoint.getSignature());
            return result;
        } catch (Exception e) {
            log.info("[트랜잭션 롤백] {}", joinPoint.getSignature());
            throw e;
        } finally {
            log.info("[리소스 릴리즈] {}", joinPoint.getSignature());
        }
    }

    @Before("hello.aop.order.aop.Pointcuts.orderAndService()")
    public void doBefore(JoinPoint joinPoint) {
        log.info("[before] {}", joinPoint.getSignature());
    }

    @AfterReturning(value = "hello.aop.order.aop.Pointcuts.orderAndService()", returning = "result")
    public void doAfterReturning(JoinPoint joinPoint, Object result) {
        log.info("[return] {} return={}", joinPoint.getSignature(), result);
    }

    @AfterThrowing(value = "hello.aop.order.aop.Pointcuts.orderAndService()", throwing = "ex")
    public void doAfterThrowing(JoinPoint joinPoint, Exception ex) {
        log.info("[ex] {} message={}", joinPoint.getSignature(),
                ex.getMessage());
    }

    @After(value = "hello.aop.order.aop.Pointcuts.orderAndService()")
    public void doAfter(JoinPoint joinPoint) {
        log.info("[after] {}", joinPoint.getSignature());
    }
}
```

#### AspectJ 포인트컷 표현식

포인트컷 지시자 (pointcut designator, PCD)
- execution: 메서드로 매칭
- within: 타입(클래스 혹은 인터페이스)으로 매칭. 매칭되면 해당 타입의 모든 메서드가 포인트컷이 된다.
- args: 타겟 객체의 메서드의 아규먼트로 매칭.
- this: 프록시 객체 타입으로 매칭.
- target: 타겟 객체 타입으로 매칭.
- @target: 객체에 붙어 있는 어노테이션으로 매칭.
- @wihtin: 클래스에 붙어 있는 어노테이션으로 매칭.
- @annotation: 메서드에 붙어 있는 어노테이션으로 매칭
- bean: 빈 이름으로 매칭

##### execution
메서드로 매칭.
?은 생략 가능하다는 뜻이다.

`execution(접근제어자? 반환타입 선언타입?메서드이름(파라미터) 예외?)

선언 타입에서 클래스는 부모 클래스(인터페이스 포함)로 명시해도 자식 클래스까지 매칭된다.

```java
pointcut.setExpression("execution(public String hello.aop.member.MemberServiceImpl.hello(String))");
```
접근제어자: public
반환타입: String
선언타입: hello.aop.member.MemberServiceImpl
메서드이름: hello
파라미터: (String)
예외: 생략

```java
pointcut.setExpression("execution(* *(..))");
```
접근제어자: 생략
반환타입: * (타입 상관 없음)
선언타입: 생략
메서드이름: * (이름 상관 없음)
파라미터: (..) (파라미터 갯수, 이름, 타입 상관 없음)
예외: 생략

```java
@Test
void packageExactMatch1() {
 pointcut.setExpression("execution(*
hello.aop.member.MemberServiceImpl.hello(..))");
 assertThat(pointcut.matches(helloMethod, MemberServiceImpl.class)).isTrue();
}
@Test
void packageExactMatch2() {
 pointcut.setExpression("execution(* hello.aop.member.*.*(..))");
 assertThat(pointcut.matches(helloMethod, MemberServiceImpl.class)).isTrue();
}
@Test
void packageExactMatchFalse() {
 pointcut.setExpression("execution(* hello.aop.*.*(..))");
 assertThat(pointcut.matches(helloMethod,
MemberServiceImpl.class)).isFalse();
}
@Test
void packageMatchSubPackage1() {
 pointcut.setExpression("execution(* hello.aop.member..*.*(..))");
 assertThat(pointcut.matches(helloMethod, MemberServiceImpl.class)).isTrue();
}
@Test
void packageMatchSubPackage2() {
 pointcut.setExpression("execution(* hello.aop..*.*(..))");
 assertThat(pointcut.matches(helloMethod, MemberServiceImpl.class)).isTrue();
}
```

선언타입에는 패키지 경로가 들어가는데, `.`과 `..`을 구분해야 한다.
- `.*`은 하위 패키지 포함하지 않음
- `..*`은 하위 패키지 포함


```java
@Test
void argsMatch() {
 pointcut.setExpression("execution(* *(String))");
 assertThat(pointcut.matches(helloMethod, MemberServiceImpl.class)).isTrue();
}
//파라미터가 없어야 함
//()
@Test
void argsMatchNoArgs() {
 pointcut.setExpression("execution(* *())");
 assertThat(pointcut.matches(helloMethod,
MemberServiceImpl.class)).isFalse();
}
//정확히 하나의 파라미터 허용, 모든 타입 허용
//(Xxx)
@Test
void argsMatchStar() {
 pointcut.setExpression("execution(* *(*))");
 assertThat(pointcut.matches(helloMethod, MemberServiceImpl.class)).isTrue();
}
//숫자와 무관하게 모든 파라미터, 모든 타입 허용
//파라미터가 없어도 됨
//(), (Xxx), (Xxx, Xxx)
@Test
void argsMatchAll() {
 pointcut.setExpression("execution(* *(..))");
 assertThat(pointcut.matches(helloMethod, MemberServiceImpl.class)).isTrue();
}
//String 타입으로 시작, 숫자와 무관하게 모든 파라미터, 모든 타입 허용
//(String), (String, Xxx), (String, Xxx, Xxx) 허용
@Test
void argsMatchComplex() {
 pointcut.setExpression("execution(* *(String, ..))");
 assertThat(pointcut.matches(helloMethod, MemberServiceImpl.class)).isTrue();
}
```
파라미터는 갯수도 중요하기 때문에 `..`과 같은 문법도 쓰인다.

##### within

타입(클래스 혹은 인터페이스)으로 매칭.

매칭되면 타입의 모든 메서드가 포인트컷이 됨.

within은 부모 타입 매칭을 허용하지 않는다.

```java
@Test
 void withinExact() {
 pointcut.setExpression("within(hello.aop.member.MemberServiceImpl)");
 assertThat(pointcut.matches(helloMethod,
MemberServiceImpl.class)).isTrue();
 }
 @Test
 void withinStar() {
 pointcut.setExpression("within(hello.aop.member.*Service*)");
 assertThat(pointcut.matches(helloMethod,
MemberServiceImpl.class)).isTrue();
 }
 @Test
 void withinSubPackage() {
 pointcut.setExpression("within(hello.aop..*)");
 assertThat(pointcut.matches(helloMethod,
MemberServiceImpl.class)).isTrue();
 }

@Test
@DisplayName("타켓의 타입에만 직접 적용, 인터페이스를 선정하면 안된다.")
void withinSuperTypeFalse() {
 pointcut.setExpression("within(hello.aop.member.MemberService)");
 assertThat(pointcut.matches(helloMethod,
MemberServiceImpl.class)).isFalse();
}
@Test
@DisplayName("execution은 타입 기반, 인터페이스를 선정 가능.")
void executionSuperTypeTrue() {
 pointcut.setExpression("execution(* hello.aop.member.MemberService.*(..))");
 assertThat(pointcut.matches(helloMethod, MemberServiceImpl.class)).isTrue();
}
```

##### args

타겟 메서드의 인자로 매칭.
execution의 인자는 부모 타입을 허용하지 않으나, args는 허용한다.

```java
 @Test
 void args() {
 //hello(String)과 매칭
 assertThat(pointcut("args(String)")
 .matches(helloMethod, MemberServiceImpl.class)).isTrue();
 assertThat(pointcut("args(Object)")
 .matches(helloMethod, MemberServiceImpl.class)).isTrue();
 assertThat(pointcut("args()")
 .matches(helloMethod, MemberServiceImpl.class)).isFalse();
 assertThat(pointcut("args(..)")
 .matches(helloMethod, MemberServiceImpl.class)).isTrue();
 assertThat(pointcut("args(*)")
 .matches(helloMethod, MemberServiceImpl.class)).isTrue();
 assertThat(pointcut("args(String,..)")
 .matches(helloMethod, MemberServiceImpl.class)).isTrue();
 }
 /**
 * execution(* *(java.io.Serializable)): 메서드의 시그니처로 판단 (정적)
 * args(java.io.Serializable): 런타임에 전달된 인수로 판단 (동적)
 */
 @Test
 void argsVsExecution() {
 //Args
 assertThat(pointcut("args(String)")
 .matches(helloMethod, MemberServiceImpl.class)).isTrue();
 assertThat(pointcut("args(java.io.Serializable)")
 .matches(helloMethod, MemberServiceImpl.class)).isTrue();
 assertThat(pointcut("args(Object)")
 .matches(helloMethod, MemberServiceImpl.class)).isTrue();
 //Execution
 assertThat(pointcut("execution(* *(String))")
 .matches(helloMethod, MemberServiceImpl.class)).isTrue();
 assertThat(pointcut("execution(* *(java.io.Serializable))") //매칭 실패
 .matches(helloMethod, MemberServiceImpl.class)).isFalse();
 assertThat(pointcut("execution(* *(Object))") //매칭 실패
 .matches(helloMethod, MemberServiceImpl.class)).isFalse();
 }
```

String은 Object, java.io.Serializable를 상속하고 있다.
arg는 부모 타입으로 매칭할 수 있기 때문에, Object, java.io.Serializable으로 String 인자를 갖는 메서드를 매칭할 수 있다.


##### @target, @within
명시한 어노테이션이 붙어 있는 클래스를 매칭한다.

`@target(hello.aop.member.annotation.ClassAop)`

```java
@ClassAop
class Target {}
```

@target은 객체 내의 모든 메서드가 포인트컷이다. 부모 클래스의 메서드도 포함된다.
@within은 객체 내에 있는 메서드만 포인트컷이다. 부모 클래스의 메서드는 포함되지 않는다.

```java
package hello.aop.pointcut;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Slf4j
@Import({AtTargetAtWithinTest.Config.class})
@SpringBootTest
public class AtTargetAtWithinTest {
    @Autowired
    Child child;

    @Test
    void success() {
        log.info("child Proxy={}", child.getClass());
        child.childMethod(); //부모, 자식 모두 있는 메서드
        child.parentMethod(); //부모 클래스만 있는 메서드
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
        public AtTargetAtWithinAspect atTargetAtWithinAspect() {
            return new AtTargetAtWithinAspect();
        }
    }

    @Target(ElementType.TYPE)
    @Retention(RetentionPolicy.RUNTIME)
    @interface ClassAop {

    }

    static class Parent {
        public void parentMethod() {
        } //부모에만 있는 메서드
    }

    @ClassAop
    static class Child extends Parent {
        public void childMethod() {
        }
    }

    @Slf4j
    @Aspect
    static class AtTargetAtWithinAspect {
        //@target: 인스턴스 기준으로 모든 메서드의 조인 포인트를 선정, 부모 타입의 메서드도 적용
//        @Around("@target(hello.aop.pointcut.AtTargetAtWithinTest.ClassAop)")
        @Around("execution(* hello.aop..*(..)) && @target(hello.aop.pointcut.AtTargetAtWithinTest.ClassAop)")
        public Object atTarget(ProceedingJoinPoint joinPoint) throws Throwable {
            log.info("[@target] {}", joinPoint.getSignature());
            return joinPoint.proceed();
        }

        @Around("@within(hello.aop.pointcut.AtTargetAtWithinTest.ClassAop)")
//        @Around("execution(* hello.aop..*(..)) && @within(hello.aop.pointcut.AtTargetAtWithinTest.ClassAop)")
        public Object atWithin(ProceedingJoinPoint joinPoint) throws Throwable {
            log.info("[@within] {}", joinPoint.getSignature());
            return joinPoint.proceed();
        }
    }
}
```

<MessageBox title='단독으로 사용하면 안 되는 포인트컷 지시자' level='warning'>
  args, @args, @target는 단독으로 사용하면 안 된다.
  모든 스프링 빈을 프록시로 만드려고 시도하기 때문이다. (스프링 내부에서 사용되는 빈까지도. 그중에는 final 등의 프록시 처리가 안되는 케이스도 존재한다.)
</MessageBox >


##### @annotation

annotation이 달린 메서드를 매칭한다.
부모 메서드에 매핑되어 있으면 매칭하지 않는다.

```java
package hello.aop.member;

import hello.aop.annotation.MethodAop;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class MemberServiceImpl implements MemberService {

    @MethodAop(value = "hello")
    @Override
    public void hello(String msg) {
        log.info("memberServiceImpl {}", msg);
    }
}
```

```java
 @Aspect
    static class AtAnnotationAspect {
        @Around("@annotation(hello.aop.annotation.MethodAop)")
        public Object doAtAnnotation(ProceedingJoinPoint joinPoint) throws Throwable {
            log.info("[@annotation] {}", joinPoint.getSignature());
            return joinPoint.proceed();
        }
    }
```

##### this, target

타입으로 매칭한다.
부모 타입으로 매칭할 수 있다.

- `this()`: 프록시 객체 타입으로 매칭. 
- `target()`: 타겟 객체 타입으로 매칭.


<MessageBox title='동적 프록시 기술에 따라 this 매칭이 안 될 수도 있다' level='warning'
jdk 동적 프록시 기술을 쓰면 this로 자식 타입 매칭이 안 된다.
jdk 동적 프록시는 인터페이스를 상속받아 프록시 객체를 생성한다.
프록시 객체는 개발자가 작성한 자식 타입의 일종의 형제이다.
this는 형제 타입 매칭이 아니라 자기 자신과 부모 타입 매칭이기 때문에 this(자식 타입)으로 적었을 때 jdk 프록시 객체를 매칭하지 못한다.

반면에 cglib 방식은 구체 클래스를 상속받아 프록시 객체를 생성한다.
개발자가 작성한 자식 타입을 상속받는 것이다.
cglib의 프록시는 자식 타입의 자식이기 때문에, this(자식 타입)으로 적었을 때 부모 타입 매칭이 적용된다.
</MessageBox>


##### 파라미터 전달

매칭 과정에서 사용된 객체(어노테이션, 타겟 객체, 프록시 객체 등)를 어드바이스 로직에서 사용해야 하는 경우도 있다.
이 때는 포인트컷 표현식에서 명시한 이름과 동일하게 파라미터로 정의하면 된다.

매칭 과정에서 사용된 객체를 가져오려면, 객체 종류에 따라 다른 포인트컷 표현식을 사용한다.
- `target()`: 타겟 객체
- `this()`: 프록시 객체
- `@target()`: 타입에 붙은 어노테이션
` `@within()`: 타입에 붙은 어노테이션
- `@annotation()`: 메서드에 붙은 어노테이션
- `args()`: 타겟 객체의 메서드의 아규먼트. (전체 args를 가져올 때는 args()보다는 joinPoint.getArgs()를 사용한다.)

그리고 파라미터의 타입으로 매칭할 타입을 정한다.
달리 말해, 포인트컷을 정의한다.

```java
package hello.aop.pointcut;
import hello.aop.member.MemberService;
import hello.aop.member.annotation.ClassAop;
import hello.aop.member.annotation.MethodAop;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
@Slf4j
@Import(ParameterTest.ParameterAspect.class)
@SpringBootTest
public class ParameterTest {
 @Autowired
 MemberService memberService;
 @Test
 void success() {
 log.info("memberService Proxy={}", memberService.getClass());
 memberService.hello("helloA");
 }
 @Slf4j
 @Aspect
 static class ParameterAspect {
 @Pointcut("execution(* hello.aop.member..*.*(..))")
 private void allMember() {}
 @Around("allMember()")
 public Object logArgs1(ProceedingJoinPoint joinPoint) throws Throwable {
 Object arg1 = joinPoint.getArgs()[0];
 log.info("[logArgs1]{}, arg={}", joinPoint.getSignature(), arg1);
 return joinPoint.proceed();
 }
 @Around("allMember() && args(arg,..)")
 public Object logArgs2(ProceedingJoinPoint joinPoint, Object arg) throws
Throwable {
 log.info("[logArgs2]{}, arg={}", joinPoint.getSignature(), arg);
 return joinPoint.proceed();
 }
 @Before("allMember() && args(arg,..)")
 public void logArgs3(String arg) {
 log.info("[logArgs3] arg={}", arg);
 }
 @Before("allMember() && this(obj)")
 public void thisArgs(JoinPoint joinPoint, MemberService obj) {
 log.info("[this]{}, obj={}", joinPoint.getSignature(),
obj.getClass());
 }
 @Before("allMember() && target(obj)")
 public void targetArgs(JoinPoint joinPoint, MemberService obj) {
 log.info("[target]{}, obj={}", joinPoint.getSignature(),
obj.getClass());
 }
 @Before("allMember() && @target(annotation)")
 public void atTarget(JoinPoint joinPoint, ClassAop annotation) {
 log.info("[@target]{}, obj={}", joinPoint.getSignature(),
annotation);
 }
 @Before("allMember() && @within(annotation)")
 public void atWithin(JoinPoint joinPoint, ClassAop annotation) {
 log.info("[@within]{}, obj={}", joinPoint.getSignature(),
annotation);
 }
 @Before("allMember() && @annotation(annotation)")
 public void atAnnotation(JoinPoint joinPoint, MethodAop annotation) {
 log.info("[@annotation]{}, annotationValue={}",
joinPoint.getSignature(), annotation.value());
 }
 }
}
```
