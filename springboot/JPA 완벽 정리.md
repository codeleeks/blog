## JPA

자바 ORM 표준

인터페이스이며, 구현 라이브러리는 대표적으로 hibernate(하이버네이트)를 사용한다.

데이터베이스 테이블을 객체처럼 사용한다.

객체 대상 SQL인 JSQL도 지원한다.

## JPA 구동 방식

`persistence.xml -> EntityManagerFactory -> EntityManager`


```java
EntityManagerFactory factory = Persistence.createEntityManagerFactory("hello");
EntityManager em = factory.createEntityManager();

em.close();
factory.close();
```

## JPQL

객체 대상 SQL

SQL 문법과 유사하다.

```java
         List<Member> result = em.createQuery("select m from Member as m", Member.class)
                    .getResultList();

            for (Member member : result) {
                System.out.println("member.getName() = " + member.getName());
            }
```

## 영속성 컨텍스트(PersistenceContext)

엔티티를 영구 저장하는 환경

EntityManager를 통해 영속성 컨텍스트에 접근한다.


### Entity 생명 주기

- new/transient (비영속): 새로운 상태
- managed (영속): 영속성 컨텍스트에 의해 관리되는 상태
- detached (준영속): 영속성 컨텍스트에 저장되었다가 분리된 상태
- removed (삭제): 삭제된 상태

![image](https://github.com/codeleeks/blog/assets/166087781/d2b2f564-5558-4edc-9688-90d5753b6a18)
출처: [자바 ORM 표준 JPA 프로그래밍](https://www.inflearn.com/course/ORM-JPA-Basic)

### 영속성 컨텍스트의 장점

- 캐싱 (1차 캐시)
- 동일성 보장
- 트랜잭션을 지원하는 쓰기 지연 (transactional write behind)
- 변경 감지 (dirty checking)
- 지연 로딩 (lazy loading)


#### 캐싱 (1차 캐시)

![image](https://github.com/codeleeks/blog/assets/166087781/d84f06f0-18e1-4c85-b88f-f978f059042a)
출처: [자바 ORM 표준 JPA 프로그래밍](https://www.inflearn.com/course/ORM-JPA-Basic)


영속된 객체(엔티티)는 내부적으로 id - 엔티티 매핑의 테이블(캐시)에서 관리된다.

`em.find()`로 조회하면 이 테이블에서 엔티티가 있는지 확인한다.
엔티티가 없는 경우 SQL를 실행하여 DB에서 조회하고, 조회된 데이터를 테이블에 저장한다.


#### 동일성 보장

엔티티를 1차 캐시로 저장하면서 엔티티의 동일성을 보장할 수 있게 되었다.
동일성 보장이란 같은 트랜잭션 내에서 여러 번 조회를 해도 동일한 결과를 얻는다는 뜻이다.
동일한 결과란 객체 수준에서도 동일하다는 뜻이다.

```java
Member a = em.find(Member.class, 1L);
Member b = em.find(Member.class, 1L);
System.out.println(a == b); //true
```

다르게 말하면, 어플리케이션 수준에서 REPEATABLE READ를 가능하게 한다.
REPEATABLE READ란 같은 트랜잭션 내의 반복 조회 결과가 같다는 뜻이다.
다른 트랜잭션에서 동일한 레코드를 수정하고 커밋을 해도, 현재 트랜잭션에서 해당 레코드의 조회 결과에 영향을 끼치지 않는다.

```java
package hellojpa;

import jakarta.persistence.*;

import java.util.List;

public class JpaMain {

    public static void main(String[] args) {

        EntityManagerFactory emf = Persistence.createEntityManagerFactory("hello");
        EntityManager em = emf.createEntityManager();
        //code

        Member foundMember = findMemberOnAnotherTx(emf);
        EntityTransaction tx = em.getTransaction();
        tx.begin();

        try {
            Member member = em.find(Member.class, 1L);
            member.setName("helloFromMain");

            System.out.println("member.getName() = " + member.getName()); //member.getName() = helloFromMain
            System.out.println("foundMember.getName() = " + foundMember.getName()); //foundMember.getName() = helloFromAnotherTx
            System.out.println("em.find(Member.class, 1L).getName() = " + em.find(Member.class, 1L).getName()); // em.find(Member.class, 1L).getName() = helloFromMain
            System.out.println("foundMember == member = " + (foundMember == member)); // false

            tx.commit();
        } catch (Exception e) {
            tx.rollback();
        } finally {
            em.close();
        }

        emf.close();
    }

    private static Member findMemberOnAnotherTx(EntityManagerFactory emf) {
        EntityManager em = emf.createEntityManager();
        EntityTransaction tx = em.getTransaction();
        tx.begin();

        Member member = em.find(Member.class, 1L);
        member.setName("helloFromAnotherTx");

        tx.commit();

        return member;
    }
}
```

#### 트랜잭션을 지원하는 쓰기 지연 (transactional write behind)

쓰기(insert, update)를 바로 실행하지 않고, commit이 호출될 때 실행된다.
다시 말해, commit이 호출될 때까지 쓰기 작업을 미룬다.

`em.persist()`를 통해서 혹은 객체 필드를 변경하면, 1차 캐시에 반영한다.
commit을 호출하기 전에 진행되었던 `em.persist()` 혹은 객체 필드 변경 등이 내부적으로 기록되며, commit을 호출하면 이 기록들을 참고하여 효율적인 쿼리를 만들어 실행한다. (쿼리를 실행하는 작업을 `flush`라고 한다.)
이후 commit을 하여 트랜잭션을 종료한다.

![image](https://github.com/codeleeks/blog/assets/166087781/27c6c8a7-2b48-4fcd-904e-69c61ba78b00)
출처: [자바 ORM 표준 JPA 프로그래밍](https://www.inflearn.com/course/ORM-JPA-Basic)

<MessageBox title='flush에 대해서' level='info'>
  플러시(flush)는 캐시와 DB 내용을 동기화하는 것이다.
  플러시한다고해서 캐시를 비우지 않는다.

  플러시는 아래와 같은 상황에서 발생한다.
  - `flush()` 직접 호출
  - 트랜잭션 커밋
  - JPQL 쿼리 실행 (옵션으로 비활성화 가능)
</MessageBox>

#### 변경 감지 (dirty checking)

객체 필드를 수정하면 `flush()` 호출시 스냅샷과 현재 엔티티를 비교한다.
변경된 내용이 있으면 쓰기 지연 SQL 저장소에 update sql을 저장한다.
그 후 저장소에 저장된 update sql을 실행한다.

`flush()`는 commit 함수에서 내부적으로 호출되는 함수이다.

![image](https://github.com/codeleeks/blog/assets/166087781/73fa1558-9702-446d-8cc2-aaa7d74e8137)
출처: [자바 ORM 표준 JPA 프로그래밍](https://www.inflearn.com/course/ORM-JPA-Basic)

## 엔티티
@Entity: 클래스를 JPA 엔티티로 지정.
@Table: JPA 엔티티를 매핑할 데이터베이스 테이블 지정.
 - name: 매핑할 테이블 이름
- catalog: 매핑할 카탈로그
- schema: 매핑할 스키마
- uniqueConstraints: 매핑할 제약 조건

<MessageBox title='catalog, schema, database, table' level='info'>
	ASNI 표준에서 카탈로그(catalog) > 스키마(schema) > 데이터베이스(database) > 테이블(table) 순으로 계층을 이룬다.
	다시 말해, 카탈로그는 여러 개의 스키마를 갖으며, 스키마는 여러 개의 데이터베이스를, 데이터베이스는 여러 개의 테이블을 갖는다.
	
	그러나 벤더에 따라 이러한 구분이 엄밀하지 않을 수 있다.
	예를 들어, MySQL에서는 카탈로그 = 스키마 = 데이터베이스로 보기도 한다. (https://junhyunny.github.io/database/database-schema-and-catalog/#google_vignette)
</MessageBox>


## DDL

엔티티로 테이블 자동 생성한다.

`hibernate.hbm2ddl.auto` 옵션 지정에 따라 동작한다.

- create: 기존 테이블 삭제 후 다시 생성(drop and create)
- create-drop: create와 동일하나 종료 시점에 테이블 drop
- update: 변경분만 반영
- validate: 엔티티와 테이블 간 매핑이 정상적으로 이루어졌는지만 확인
- none: 사용하지 않음. (기본값)

### DDL 생성 관련 어노테이션

클래스에 어노테이션을 붙여서, 컬럼 이름, 제약 조건 등 DDL 생성을 제어할 수 있다.

- @Table의 uniqueConstraints: 유니크 제약 조건 설정
- @Column(name = 'username', nullable = false, lentgh = 10): `username varchar(10) NOT NULL`
	- name: 컬럼 이름 지정
	- insertable, updatable: 등록, 변경 가능 여부
	- nullable: NULL 허용 여부 지정
	- unique: 유니크 제약 조건 지정
	- columnDefinition: SQL로 컬럼 정의.
	- length: 최대 길이 지정.
	- precision, scale: BigDecimal, BigInteger에서만 사용. (precision은 소수점 포함 전체 자리수, scale은 소수 자리수)
- @Temporal: 날짜 타입 매핑
	- TemporalType.DATE: 2013-10-11
	- TemporalType.TIME: 11:12:14
	- TmporalType.TIMESTAMP: 2013-10-11 11:12:14
- @Enumerated(EnumType.STRING) : enum 타입 매핑. 
	- EnumType.ORDINAL: enum 순서가 레코드에 들어감.
	- EnumType.STRING: enum 이름이 레코드에 들어감.
- @Lob: 대용량 데이터 저장. 타입에 따라 CLOB 매핑이나 BLOB 매핑 사용
	- CLOB: String, char[], java.sql.CLOB
	- BLOB: byte[], java.sql.BLOB
- @Transient: 컬럼 매핑에서 제외
- @Id: 기본키 매핑
	- @GeneratedValue(strategy = GenerateType.AUTO): 키 자동 생성 옵션 지정
		- GenerateType.IDENTITY: 데이터베이스에 위임.
		- GenerateType.SEQUENCE: 데이터베이스 시퀀스 오브젝트 사용. @SequenceGenerator 필요.
		- GenerateType.TABLE: 키 생성용 테이블 사용. @TableGenerator 필요.
		- GenerateType.AUTO: 데이터베이스에 위임.

#### GenerateType.IDENTITY 전략

키 생성 로직을 데이터베이스에 위임한다. 

데이터베이스의 기본 키 생성 전략을 사용한다.

데이터베이스의 기본 키 생성 전략이 AUTO_INCREMENT인 경우 `em.persist()` 시점에 insert 쿼리를 실행한다.


```java
@Entity
public class Member {
 @Id
 @GeneratedValue(strategy = GenerationType.IDENTITY)
 private Long id; 
```


#### GenerateType.SEQUENCE 전략

데이터베이스 시퀀스 객체를 사용하여 키를 생성한다.

```java
@Entity
public class Member {
    // 시퀀스 로직을 별도로 지정하지 않았기 때문에 하이버네이트의 시퀀스 로직으로 데이터베이스의 시퀀스 객체를 생성한다.
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;
```

시퀀스 로직을 테이블마다 다르게 가져가기 위해서 @SequenceGenerator 를 통해 로직을 부여해야 한다.

```java
@Entity
// 1(initialValue)부터 시작하여, 1(allocationSize)씩 증가한다.
@SequenceGenerator(
        name = "MEMBER_SEQ_GENERATOR",
        sequenceName = "MEMBER_SEQ",
        initialValue = 1, allocationSize = 1
)
public class Member {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "MEMBER_SEQ_GENERATOR")
    private Long id;
```

allocationSize는 기본값이 50인데, 성능과 관련이 있다.

키 생성 전략이 sequence인 엔티티는 영속 상태가 될 때(`em.persist()`) 키 값을 데이터베이스에서 가져온다.
1차 캐시는 기본키값과 객체 매핑으로 저장하기 때문에, 키 값이 필요하다.
그래서 `select next value for 시퀀스객체` 쿼리를 실행하여 시퀀스값을 가져온다.

그런데 이렇게 되면 쓰기 지연의 이점을 누리지 못한다.
객체를 영속성 컨텍스트에 넣을 때마다(영속 상태가 될 때마다) 어쨌든 쿼리가 나가기 때문이다.
allocationSize를 크게 가져감으로써 이를 해결했다.

allocationSize가 50이면, 한 번의 `select next value for 시퀀스객체` 쿼리로 시퀀스값이 50만큼 증가하고 데이터베이스에 저장된다.
하지만 JPA는 엔티티 키값을 50만큼 증가시키는 게 아니라 1씩 증가시킨다.
그러면 엔티티 키값이 50번 증가할 때까지 시퀀스 증가 쿼리를 실행하지 않을 수 있다.

여러 서비스 간의 동시성 문제도 걱정 없다.
한 서비스가 시퀀스 장가 쿼리로 시퀀스값을 받아서 1부터 50까지 사용한다면, 다른 서비스가 시퀀스 증가 쿼리를 실행할 때에는 시퀀스값이 51부터 100까지 사용한다.
부여 받는 키값이 겹치지 않기 때문에 동시성 문제가 없는 것이다.


#### GenerateType.TABLE 전략

데이터베이스 테이블을 만들어 시퀀스 객체처럼 사용한다.
시퀀스 객체 역할을 하는 테이블을 자동으로 생성하고, 키 발급시 테이블에서 조회하고 allocationSize 만큼 증가시킨 후 update한다.

시퀀스 객체를 지원하지 않은 데이터베이스에서도 사용할 수 있다.
그러나 시퀀스 객체보다는 성능이 떨어질 수 있다.

```java
@Entity
@TableGenerator(
        name = "MEMBER_SEQ_GENERATOR",
        table = "MY_SEQUENCES",
        pkColumnValue = "MEMBER_SEQ", allocationSize = 1
)
public class Member {
    @Id @GeneratedValue(strategy = GenerationType.TABLE, generator = "MEMBER_SEQ_GENERATOR")
    private Long id;
```


