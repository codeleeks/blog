## 옵션

- value, transcationManager: 트랜잭션 매니저 클래스를 지정한다.
- rollbackFor: 롤백할 예외 클래스를 지정한다
- noRollbackFor: 롤백에서 제외할 예외 클래스를 지정한다
- propagation: 트랜잭션 전파 설정
- isolation: 트랜잭션 격리 수준 지정. DEFAULT가 디폴트이며, 데이터베이스 격리 수준을 따른다는 뜻이다.
- timeout: 트랜잭션 타임아웃 지정(초 단위)
- readOnly: 읽기만 가능한 트랜잭션 지정. false가 디폴트이며, 읽기 전용으로 설정하면 성능 최적화를 꾀할 수 있다.

## 주의 사항

### 내부 호출
프록시에서 트랜잭션 처리를 하는 것이기 때문에, 외부 객체에서 호출을 해야 한다.
객체 자체에서 내부 호출을 통해 @Transactional 어노테이션이 걸린 메서드를 호출한다면,
프록시를 타는 게 아니기 때문에 트랜잭션이 걸리지 않는다.

### 초기화 시점
@PostConsturct와 @Transactional을 같이 사용하면 안 된다.
AOP 프록시 처리 시점은 @PostConstruct 처리 이후이기 때문에, 프록시 객체가 아니라 실제 객체의 메서드가 직접 호출된다.

@EventListener(ApplicationReadyEvent.class)를 사용한다.


## 트랜잭션 예외와 롤백
디폴트는 언체크예외/Error 발생시 롤백, 체크예외 발생시 커밋이다.
체크예외는 왜 커밋인가?
비즈니스 예외 케이스를 고려한 선택이다.

비즈니스 유즈케이스에 따라 커밋을 하는 게 좋은 경우도 있다.
예를 들어, 주문을 할 때 결제 카드의 잔액이 부족해서 실패한 경우 주문 정보는 저장되어 사용자가 다시 적지 않게 하는 게 좋을 수 있다.


## 트랜잭션 전파
객체 간의 호출 흐름에서 하나의 트랜잭션을 공유할 것인가 따로 가져갈 것인가의 문제이다.
기본값은 `Propagation.REQUIRED`이며, 객체 간의 호출 흐름에서 하나의 트랜잭션을 공유한다.

```java
@Transactional(propagation = Propagation.REQUIRED)
public void save(Log logMessage)
```

![image](https://github.com/codeleeks/blog/assets/166087781/71fe8d46-6c99-41e1-b8ad-6cbabdeac6aa)
참조: 김영한의 스프링 DB2

개념상 물리 트랜잭션, 논리 트랜잭션으로 구분한다.

처음 트랜잭션을 시작한 메서드가 실제 트랜잭션을 위한 커넥션을 얻고, `manual commit` 모드로 설정한다.
그 이후의 피호출자에서 트랜잭션을 얻으려고 하면 새 커넥션을 얻는 게 아닌 호출자가 생성한 커넥션을 그대로 사용한다.

이 전체적인 호출 스택을 물리 트랜잭션이라고 하고, 각 호출되는 메서드를 논리 트랜잭션이라고 보면 된다.

![image](https://github.com/codeleeks/blog/assets/166087781/c88a18f0-6ffc-4b84-8462-ad4e3072f5fb)
참조: 김영한의 스프링 DB2

공유한 트랜잭션에서는 각 논리 트랜잭션은 마치 트랜잭션 안의 DB 작업처럼 **all or nothing** 정책을 가져간다.
논리트랜잭션 중 하나라도 예외가 발생하면 물리 트랜잭션이 롤백되고, 모든 논리 트랜잭션이 성공해야 물리 트랜잭션은 커밋을 한다.

주의할 점은 내부 트랜잭션에서 발생한 예외를 외부 트랜잭션이 `try-catch`로 잡아 정상적인 흐름으로 복구하더라도 `UnexpectedRollbackException`이 발생한다.
이는 내부적으로 플래그가 있어서, 외부 트랜잭션에서 커밋을 할 때 내부 트랜잭션에서 예외가 발생했는지를 알 수 있기 때문이다. 
(내부 트랜잭션에서 예외가 발생하면 트랜잭션 동기화 매니저(`TransactionSynchronizationManager`)에 `rollbackOnly` 플래그가 설정되는데, 외부 트랜잭션에서 커밋을 할 때 `rollbackOnly`가 설정되어 있는지 확인한다.)

피호출자에서 트랜잭션을 따로 가져가고 싶다면 `propagation = REQUIRES_NEW`로 설정한다.

![image](https://github.com/codeleeks/blog/assets/166087781/80dca50b-5f55-4602-bc63-40f2eac27fe7)
참조: 김영한의 스프링 DB2

```java
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void save(Log logMessage)
```

### 옵션
- `REQUIRED`: 기본값. 트랜잭션을 공유한다.
- `REQUIRES_NEW`: 새 트랜잭션을 생성한다.

### TODO 여러 스레드에서의 트랜잭션 처리는??
