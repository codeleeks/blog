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

기본적인 CRUD 메서드, 페이징, 배치 메서드를 제공한다.
`PagingAndSortingRepository<T, ID>, CrudRepository<T, ID>`를 상속받았다.

엔티티타입, 식별자 타입으로 설정한다.

```java
public interface MemberRepository extends JpaRepository<Member, Long> {
}
```

![image](https://github.com/user-attachments/assets/fd4027b2-4b4d-45be-b6e8-ef5ac558a103)
