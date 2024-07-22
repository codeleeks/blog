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


## 레포지토리 인터페이스의 메서드

레포지토리 인터페이스가 제공하는 추상 메서드 외에도 사용자가 정의하는 메서드를 프록시에서 사용할 수 있게 한다.

스프링 데이터 JPA는 메서드 이름으로 쿼리를 생성하거나, `@Query` 어노테이션을 통해 명시된 JPQL을 실행한다.

### 메서드 이름으로 쿼리 생성

메서드 이름으로 쿼리를 간접적으로 명시할 수 있다.

- 조회: `find...By`, `read...By`, `query...By`, `get...By`
- 집계(Aggregation): `count...By` 반환 타입 `long`
- 존재 유무: `exists...By` 반환 타입 `boolean`
- 삭제: `delete...By`, `remove...By` 반환 타입 `long`
- 중복 제거: `findDistinct`, `findMemberDistinctBy`
- 갯수 제한: `findFirst3`, `findFirst`, `findTop`, `findTop3`

[관련 레퍼런스 참고](https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html)

<MessageBox title='`find...by`와 엔티티 필드' level='warning'>
 `...`은 메서드의 동작을 설명하는 주석 정도가 들어가야 한다. 
 엔티티의 필드가 들어간다고 엔티티의 필드가 반환되는 게 아니다.

 ```java
    @Query("select m.id from Member m where m.username = :username")
    Long findIdByUsername(@Param("username") String username);
 ```

 `@Query`가 없다면 `Id`라고 적었어도 `Long` 타입이 아니라 `Member` 타입이 리턴된다.
</MessageBox>

메서드 이름 안에 정의한 필드가 엔티티에 없으면 부트 타임에 오류가 발생한다.

```java
public interface MemberRepository extends JpaRepository<Member, Long> {
 List<Member> findByUsernameAndAgeGreaterThan(String username, int age);
}
```

#### 치트시트

```java
interface PersonRepository extends Repository<Person, Long> {

  List<Person> findByEmailAddressAndLastname(EmailAddress emailAddress, String lastname);

  // Enables the distinct flag for the query
  List<Person> findDistinctPeopleByLastnameOrFirstname(String lastname, String firstname);
  List<Person> findPeopleDistinctByLastnameOrFirstname(String lastname, String firstname);

  // Enabling ignoring case for an individual property
  List<Person> findByLastnameIgnoreCase(String lastname);
  // Enabling ignoring case for all suitable properties
  List<Person> findByLastnameAndFirstnameAllIgnoreCase(String lastname, String firstname);

  // Enabling static ORDER BY for a query
  List<Person> findByLastnameOrderByFirstnameAsc(String lastname);
  List<Person> findByLastnameOrderByFirstnameDesc(String lastname);

  //person.address.zipcode일 때 zipcode로 person을 조회
  List<Person> findByAddress_ZipCode(ZipCode zipCode);
}
```

[공식 예약 키워드](https://docs.spring.io/spring-data/jpa/reference/repositories/query-keywords-reference.html#appendix.query.method.subject)


### Named Query

엔티티에 정의한 네임드쿼리를 인터페이스에 적용한다.

```java
@Entity
@NamedQuery(
 name="Member.findByUsername",
 query="select m from Member m where m.username = :username")
public class Member {
 ...
}


public interface MemberRepository
 extends JpaRepository<Member, Long> {
 @Query(name = "Member.findByUsername") //생략 가능. 생략하면 "엔티티.메서드 이름"으로 네임드쿼리가 있는지 확인한다. 없으면 메서드 이름 쿼리 생성 전략으로 진행된다.
 List<Member> findByUsername(@Param("username") String username);
}
```

### `@Query`에 JPQL 명시하기

Named 쿼리와 유사하다.
Named 쿼리처럼 부트 타임에 문법 오류를 체크한다.

```java
public interface MemberRepository extends JpaRepository<Member, Long> {
  @Query("select m from Member m where m.username= :username and m.age = :age")
  List<Member> findUser(@Param("username") String username, @Param("age") int
age);

  @Query("select m from Member m where m.username in :names")
  List<Member> findByNames(@Param("names") List<String> names);
}
```



### 반환 타입

스프링 데이터 JPA는 사용자가 적은 메서드 반환 타입을 보고 내부적으로 `getSingleResult()`나 `getResultList()`를 호출한다.

그런데 실제 결과가 명시한 반환 타입보다 많거나 없을 수 있다.
예를 들어 반환 타입을 단일 타입으로 명시했는데, 여러 개의 데이터가 반환될 수 있다.

이 경우에는 `NonUniqueResultException` 예외가 발생한다.
단일 반환 타입의 경우 내부적으로 `getSingleResult()`를 호출하기 때문이다.

결과가 없는 경우에는 null을 리턴한다. 
스프링 데이터 JPA가 `getSingleResult()`가 발생시키는 `NoResultException` 예외를 잡아 null로 리턴하기 때문이다.

### 페이징과 정렬

페이징 기능을 위한 반환 타입은 세 가지가 있다.

- `Slice<T>`: 다음 페이지, 이전 페이지 등 전체 페이지 갯수가 필요없는 페이징.
  - `한 페이지의 레코드 갯수 + 1`만큼 가져온다. `+1`은 '더보기'와 같이 다음 페이징을 위한 UI로 사용될 수 있다.

```java
public interface MemberRepository extends JpaRepository<Member, Long> {
    Slice<Member> findByAge(int age, Pageable pageable);
}

//페이지 사이즈는 3. 그러나 쿼리는 4개를 요청한다.
PageRequest pageRequest = PageRequest.of(0, 3, Sort.by(Sort.Direction.DESC, "username"));
Slice<Member> slice = repositorySlice.findByAge(10, pageRequest);
```
```bash
select m1_0.id,m1_0.age,m1_0.team_id,m1_0.username from member m1_0 where m1_0.age=10 order by m1_0.username desc fetch first 4 rows only
```

- `Page<T>`: 전체 레코드 갯수, 전체 페이지 갯수 등 조회 가능한 일반적인 게시판 페이징.
  - `Slice<T>`의 자식 클래스이기 때문에 `Slice<T>`의 기능을 모두 사용할 수 있다.
  - 전체 페이지를 얻기 위해 count 쿼리도 실행된다.
    - 페이징 레코드가 0보다 클 때에만 실행된다.
    - 페이징 레코드 조회 쿼리가 조인이라면 조인된 테이블에 대한 count 쿼리가 실행된다.
      - count 쿼리 최적화를 위해 `@Query` 어노테이션은 `countQuery` 속성을 제공한다.

```java
@Query(value = "select m from Member m join m.team",
 countQuery = "select count(m.username) from Member m")
Page<Member> findMemberAllCountBy(Pageable pageable);
```

<MessageBox title='left join과 count 쿼리' level='info'>
  하이버네이트 6부터 `left join`일 때 연관 관계 테이블을 쓰지 않는 경우 조인된 테이블이 아니라 원본 테이블에 대한 count 쿼리가 실행된다.

  ```java
  public interface MemberRepository extends JpaRepository<Member, Long> {
    @Query(value = "select m from Member m left join m.team t")
    Page<Member> find(int age, Pageable pageable);
  }
  ```
  쿼리 내에서 t를 쓰고 있지 않기 때문에 스프링 데이터 JPA는 최적화된 count 쿼리로 변환해서 실행한다.
  ```bash
  select count(m1_0.id) from member m1_0;
  ```

  그러나 이너 조인이나 t를 사용하는 경우 조인 테이블에 대한 count 쿼리로 실행된다.
  ```java
  public interface MemberRepository extends JpaRepository<Member, Long> {
      @Query(value = "select m from Member m join m.team t")
      Page<Member> find(int age, Pageable pageable);
  }
  ```
  ```bash
  select count(m1_0.id) from member m1_0 join team t1_0 on t1_0.id=m1_0.team_id;
  ```
</MessageBox>

```java
public interface MemberRepository extends JpaRepository<Member, Long> {
    Page<Member> findByAge(int age, Pageable pageable);
}

PageRequest pageRequest = PageRequest.of(0, 3, Sort.by(Sort.Direction.DESC, "username"));
Page<Member> page = repository.findByAge(10, pageRequest);
```
```bash
select m1_0.id,m1_0.age,m1_0.team_id,m1_0.username from member m1_0 where m1_0.age=10 order by m1_0.username desc fetch first 3 rows only;
select count(m1_0.id) from member m1_0 where m1_0.age=10;
```

<MessageBox title='`Page<T>`의 count 쿼리와 조인' level='warning'>
  
</MessageBox>

- `List<T>`: 레코드 정보만 반환.

```java
public interface MemberRepository extends JpaRepository<Member, Long> {
    Page<Member> findByAge(int age, Pageable pageable);
}

public interface MemberRepository extends JpaRepository<Member, Long> {
    Slice<Member> findByAge(int age, Pageable pageable);
}

public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByAge(int age, Pageable pageable);
}
```

#### 페이징 제공 메서드

page는 slice를 상속받고 있기 때문에 slice가 제공하는 기능은 page도 제공한다.

- `page.getTotalElements()`: 전체 레코드 갯수
- `page.getTotalPages()`: 전체 페이지 수
- `slice.getNumber()`: 현재 페이지
- `slice.isFirst()`: 현재 페이지가 첫 번째 페이지인지 확인
- `slice.isLast()`: 현재 페이지가 마지막 페이지인지 확인
- `slice.hasNext()`: 다음 페이지가 있는지 확인
- `slice.hasPrevious()`: 이전 페이지가 있는지 확인
- `slice.getContent()`: 가져온 레코드 조회


#### 페이지 리퀘스트 생성

페이징을 지원하는 레포지토리 인터페이스는 파라미터로 `Pageable`을 받는다.
`Pageable`을 통해 현재 페이지를 확인하고 레코드를 가져온다.

`Pageable`에 넣을 대표적인 구현체는 `PageRequest` 클래스이다.

```java
//0번째 페이지(첫 번째 페이지), 페이지 크기는 3, username으로 정렬된 레코드를 기준으로 페이징.
PageRequest pageRequest = PageRequest.of(0, 3, Sort.by(Sort.Direction.DESC, "username"));
Page<Member> page = repository.findByAge(10, pageRequest);
```

#### 복잡한 정렬 케이스

정렬이 복잡하거나 다른 엔티티의 필드로 정렬을 해야 하는 경우에는 어떻게 할까?

`PageRequest`를 만들 때 Sort 객체를 빼고, JPQL에 정렬 조건을 작성한다.

```java
public interface MemberRepository extends JpaRepository<Member, Long> {
    @Query(value = "select m from Member m join m.team t order by t.name")
    Page<Member> find(int age, Pageable pageable);
}

PageRequest pageRequest = PageRequest.of(0, 3);
Page<Member> page = repository.find(10, pageRequest);
```
```bash
2024-07-21T16:59:27.234+09:00 DEBUG 20600 --- [data-jpa] [    Test worker] org.hibernate.SQL                        : 
    select
        m1_0.id,
        m1_0.age,
        m1_0.team_id,
        m1_0.username 
    from
        member m1_0 
    join
        team t1_0 
            on t1_0.id=m1_0.team_id 
    order by
        t1_0.name 
    fetch
        first ? rows only
```

#### 페이지 엔티티를 DTO로 반환하기

`Page<T>`의 `map` 메서드를 사용한다.

```java
PageRequest pageRequest = PageRequest.of(0, 3);
Page<Member> page = repository.find(10, pageRequest);
Page<MemberDto> dto = page.map(m -> new MemberDto(m.getUsername(), m.getAge()));
```


## 배치 연산

`@Query`에 JPQL로 배치 쿼리를 적는다.
`@Query`는 기본적으로 `select`문을 기대한다.

```bash
org.springframework.dao.InvalidDataAccessApiUsageException: Query executed via 'getResultList()' or 'getSingleResult()' must be a 'select' query [update Member m set m.age = m.age + 1 where m.age >= :age]
```

`@Modifying`을 붙여서 조회 쿼리가 아니라 변경 쿼리임을 명시해야 한다.

```java
public interface MemberRepository extends JpaRepository<Member, Long> {
    @Modifying
    @Query("update Member m set m.age = m.age + 1 where m.age >= :age")
    int updateAllAges(@Param("age") int age);
}
```

`@Modifying`은 쿼리 실행 후 영속성 초기화 여부를 설정할 수 있다.
배치 쿼리는 영속성 컨텍스트와 상관없이 데이터베이스에 직접 영향을 끼치기 때문에 영속성 컨텍스트와 데이터베이스와의 데이터 정합성의 문제가 발생할 수 있다.

배치 쿼리 후에 영속성 컨텍스트를 사용한다면 먼저 영속성 컨텍스트를 초기화를 해야 한다.

```java
public interface MemberRepository extends JpaRepository<Member, Long> {
    @Modifying(clearAutomatically = true)
    @Query("update Member m set m.age = m.age + 1 where m.age >= :age")
    int updateAllAges(@Param("age") int age);
}
```

## `@EntityGraph`

페치 조인을 간편하게 사용한다.

```java
public interface MemberRepository extends JpaRepository<Member, Long> {
    @Override
    @EntityGraph(attributePaths = {"team"})
    List<Member> findAll();
}
```
```bash
2024-07-21T22:14:22.057+09:00 DEBUG 16628 --- [data-jpa] [    Test worker] org.hibernate.SQL                        : 
    select
        m1_0.id,
        m1_0.age,
        t1_0.id,
        t1_0.name,
        m1_0.username 
    from
        member m1_0 
    left join
        team t1_0 
            on t1_0.id=m1_0.team_id
```

## JPA Hint

JPA 구현체에게 힌트를 설정할 수 있다.

```java
@QueryHints(value = @QueryHint(name = "org.hibernate.readOnly", value = "true"))
Member findReadOnlyByUsername(String username);
```

readonly 힌트는 변경 감지를 하지 않는다.
필드를 변경해도 update 쿼리가 실행되지 않는다.

## Lock

데이터베이스 락을 걸 수 있다.

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
List<Member> findByUsername(String name);
```

## 커스텀 레포지토리

JPQL 쿼리로는 해결하지 못하고, 자바 로직이 필요한 기능의 경우를 위해 스프링 데이터는 커스텀 레포지토리 기능을 제공한다.

인터페이스(fragment interface)를 정의하고, 그 구현체(fragment)를 만들어 구현한다.
레포지토리 인터페이스가 프래그먼트 인터페이스를 상속받게 한다.
구현체의 이름은 `레포지토리 인터페이스 이름 + Impl` 혹은 `프래그먼트 인터페이스 이름 + Impl`여야 한다.

이러면 스프링 데이터는 프래그먼트를 빈으로 등록하고, 레포지토리 인터페이스를 통해 프래그먼트의 구현 로직을 호출할 수 있게 제공한다.

```java
public interface MemberRepository extends JpaRepository<Member, Long>, MemberRepositoryCustom {
    @Query(value = "select m from Member m join m.team t order by t.name")
    Page<Member> find(int age, Pageable pageable);

    @Modifying
    @Query("update Member m set m.age = m.age + 1 where m.age >= :age")
    int updateAllAges(@Param("age") int age);

    @Override
    @EntityGraph(attributePaths = {"team"})
    List<Member> findAll();

    @QueryHints(value = @QueryHint(name = "org.hibernate.readOnly", value = "true"))
    Member findReadOnlyByUsername(String username);
}

public interface MemberRepositoryCustom {
    List<Member> findMemberCustom();
}

@RequiredArgsConstructor
public class MemberRepositoryCustomImpl implements MemberRepositoryCustom {
 private final EntityManager em;
 @Override
 public List<Member> findMemberCustom() {
   return em.createQuery("select m from Member m")
          .getResultList();
 }
}
```

### 동작 원리

스프링 jdk 프록시(`JdkDynamicAopProxy`) 내부에 `interceptorsAndDynamicMethodMatchers`에서 인터셉터 체이닝 처리를 한다.
호출된 메서드의 실제 타겟 객체를 갖고 처리할 수 있는 인터셉터를 찾는 것 같다.

커스텀 레포지토리의 경우, `RepositoryFactorySupport$ImplementationMethodExecutionInterceptor` 인터셉터가 처리한다.
이 인터셉터는 `RepositoryComposition` 객체를 통해 `fragments`를 관리한다.
이 fragments 배열에 `SimpleJpaRepository`(jpaRepository 인터페이스를 상속받고 사용되는 기본 구현체)와 우리가 정의한 커스텀 레포지토리 구현체가 들어 있다.

결국 이 `ImplementationMethodExecutionInterceptor`에서 커스텀 레포지토리 구현체의 메서드가 호출된다. 

간단하게 말하자면, jdk 프록시에서 프래그먼트(커스텀 인터페이스의 구현체)를 들고 있다고 보면 될 것 같다.

## Auditing

엔티티가 저장된 시각, 수정된 시각, 생성자, 수정자 등 정보를 엔티티에 같이 기록할 수 있다.

순수 JPA만 사용한다면 JPA가 제공하는 Event를 사용하면 된다.

![image](https://github.com/user-attachments/assets/a396b8ac-a4fb-496a-b5e8-21513b662cfd)
출처: 김영한의 자바 ORM의 표준 JPA 프로그래밍

```java
@MappedSuperclass
@Getter
public class JpaBaseEntity {
    @Column(updatable = false)
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdDate = now;
        updatedDate = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedDate = LocalDateTime.now();
    }
}
```

스프링 데이터에서는 조금 더 편리하게 제공한다.

- `@CreatedDate`: 엔티티 저장 시각을 저장하는 필드 지정
- `@LastModifiedDate`: 엔티티 수정 시각을 저장하는 필드 지정
- `@CreatedBy`: 엔티티 생성자를 저장하는 필드 지정. 
- `@LastModifiedBy`: 엔티티 수정자를 저장하는 필드 지정.
- `@EntityListeners(AuditingEntityListener.class)`: 엔티티를 Auditing 한다.

`@EnableJpaAuditing`을 메인 클래스에 꼭 달아줘야 한다.
그렇지 않으면 필드에 값이 채워지지 않는다.

```java
@EntityListeners(AuditingEntityListener.class)
@MappedSuperclass
@Getter
public class BaseEntity {

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdDate;

    @LastModifiedDate
    private LocalDateTime lastModifiedDate;

    @CreatedBy
    @Column(updatable = false)
    private String createdBy;

    @LastModifiedBy
    private String lastModifiedBy;
}

@EnableJpaAuditing
@SpringBootApplication
public class DataJpaApplication {

	public static void main(String[] args) {
		SpringApplication.run(DataJpaApplication.class, args);
	}
}
```

