## 스레드 로컬

스레드 고유의 저장소를 갖는다.
자바 언어 차원에서 제공한다.

동시성 문제를 해결한다.

### 핵심 메서드
- `get()`: 스레드에 저장된 값을 가져온다. 없으면 null을 반환.
- `set(data)`: 스레드에 값을 저장한다.
- `remove()`: 스레드에 저장된 값을 지운다.

```java
  package hello.advanced.trace.logtrace;

import hello.advanced.trace.TraceId;
import hello.advanced.trace.TraceStatus;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ThreadLocalLogService implements LogTrace{
    private static final String START_PREFIX = "-->";
    private static final String COMPLETE_PREFIX = "<--";
    private static final String EX_PREFIX = "<X-";

    private ThreadLocal<TraceId> traceIdHolder = new ThreadLocal<>();

    @Override
    public TraceStatus begin(String message) {
        syncTraceId();
        TraceId traceId = traceIdHolder.get();
        long startTimeMs = System.currentTimeMillis();
        log.info("[{}] {}{}", traceId.getId(), addSpace(START_PREFIX, traceId.getLevel()), message);

        return new TraceStatus(traceId, startTimeMs, message);
    }

    @Override
    public void end(TraceStatus status) {
        complete(status, null);
    }
    @Override
    public void exception(TraceStatus status, Exception e) {
        complete(status, e);
    }
    private void complete(TraceStatus status, Exception e) {
        Long stopTimeMs = System.currentTimeMillis();
        long resultTimeMs = stopTimeMs - status.getStartTimeMs();
        TraceId traceId = status.getTraceId();
        if (e == null) {
            log.info("[{}] {}{} time={}ms", traceId.getId(),
                    addSpace(COMPLETE_PREFIX, traceId.getLevel()), status.getMessage(),
                    resultTimeMs);
        } else {
            log.info("[{}] {}{} time={}ms ex={}", traceId.getId(),
                    addSpace(EX_PREFIX, traceId.getLevel()), status.getMessage(), resultTimeMs,
                    e.toString());
        }
        releaseTraceId();
    }
    private void syncTraceId() {
        TraceId traceId = traceIdHolder.get();
        if (traceId == null) {
            traceIdHolder.set(new TraceId());
        } else {
            traceIdHolder.set(traceId.createNextId());
        }
    }
    private void releaseTraceId() {
        TraceId traceId = traceIdHolder.get();
        if (traceId.isFirstLevel()) {
            traceIdHolder.remove();//destroy
        } else {
            traceIdHolder.set(traceId.createPreviousId());
        }
    }
    private static String addSpace(String prefix, int level) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < level; i++) {
            sb.append( (i == level - 1) ? "|" + prefix : "| ");
        }
        return sb.toString();
    }
}

```

### 동작 원리

`Thread` 클래스에 `ThreadLocalMap`을 갖고 있다.
`ThreadLocal` 객체의 `get` 메서드를 호출하면, 현재 스레드에 저장된 `ThreadLocalMap`의 엔트리 중 키값이 `ThreadLocal` 해시코드와 동일한 밸류를 얻어온다.
`set` 메서드는 동일한 과정을 거쳐 밸류를 덮어쓴다.

![image](https://github.com/codeleeks/blog/assets/166087781/bde5f704-0456-4329-a026-e8ccdb5514de)

출처: https://junhyunny.github.io/java/thread-local-class-in-java/

#### 참고

https://hongchangsub.com/java-threadlocal/

https://junhyunny.github.io/java/thread-local-class-in-java/

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

스프링에서 클래스는 세 가지 방식으로 운용된다.

1. 인터페이스를 구현한 클래스
2. 일반 클래스
3. 자동등록된 빈

프록시 패턴도 운용 방식에 따라 구현 방법이 나뉜다.

||인터페이스 기반 프록시|클래스 기반 프록시|동적 프록시|
|---|---|---|---|
|사용|`implements`|`extends`||
|장점|인터페이스를 구현하는 모든 클래스에 적용할 수 있다.|변경될 일 없는 구체 클래스의 경우 클래스 기반 프록시가 효율적이다.||
|단점|동일한 로직을 갖지만 대상 클래스만 다른 프록시 클래스가 여러 개 만들어진다. <br /> 변경될 일이 없는 클래스도 인터페이스를 만들어야 한다.| 동일한 로직을 갖지만 대상 클래스만 다른 프록시 클래스가 여러 개 만들어진다. <br /> 불필요한 코드(super() 호출)가 발생한다. <br /> 프록시는 해당 클래스에만 적용가능하다.||

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
