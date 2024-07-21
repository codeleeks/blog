## 레포지토리 인터페이스

스프링 데이터가 제공하는 루트 인터페이스.
레포지토리 인터페이스를 상속받은 인터페이스가 지정된 경로 안에 있으면 스프링 데이터가 프록시 객체를 만들고, 추상 메서드들을 구현한다.

```java
package org.springframework.data.repository;

import org.springframework.stereotype.Indexed;

@Indexed
public interface Repository<T, ID> {

}
```

인터페이스를 상속받아 프록시를 만들기 때문에 jdk 프록시가 사용된다.

```bash
repository.getClass() = class jdk.proxy3.$Proxy125
```

또한, `@Repository`를 생략할 수 있다.
JPA 예외를 스프링 추상화 예외로 바꿔준다.

## `@EnableJpRepositories`

레포지토리 인터페이스를 스캔할 루트 패키지 지정
스프링부트는 생략 가능. `@SpringBootApplication`이 달린 클래스의 패키지가 루트 패키지로 선정.

```java
```java
@Configuration
@EnableJpaRepositories(basePackages = "jpabook.jpashop.repository")
public class AppConfig {}
```

## `JpaRepository<T, ID extends Serializable>`

기본적인 CRUD 메서드, 페이징/솔팅, 배치 메서드를 제공한다.
`PagingAndSortingRepository<T, ID>, CrudRepository<T, ID>`를 상속받았다.

![image](https://github.com/user-attachments/assets/77b0cb3c-f717-438a-bc6c-2dd4bb55486e)

엔티티타입, 식별자 타입으로 설정한다.

```java
public interface MemberRepository extends JpaRepository<Member, Long> {
}
```

### 주요 메서드
- `save(S)`: 새 엔티티를 저장하고, 이미 있는 엔티티는 병합한다.
- `delete(T)`: 엔티티를 삭제한다. (내부에서 `em.remove()` 호출)
- `findById(ID)`: 엔티티를 조회한다. (내부에서 `em.find()` 호출)
- `getReferenceById(ID)`: 엔티티를 프록시로 조회한다. (내부에서 `em.getReference()` 호출)
- `findAll(...)`: 모든 엔티티를 조회한다. 정렬이나 페이징 조건을 지정할 수 있다.



