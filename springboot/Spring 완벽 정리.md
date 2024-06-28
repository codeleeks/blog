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
