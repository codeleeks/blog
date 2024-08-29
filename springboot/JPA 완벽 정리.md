---
summary: Spring의 JPA 기능을 정리합니다.
date: 2024-07-01
title-image: 'https://raw.githubusercontent.com/codeleeks/blog/codeleeks-images/springboot/JPA%20%EC%99%84%EB%B2%BD%20%EC%A0%95%EB%A6%AC/title.png'
---


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

## 엔티티 간 연관 관계

테이블 간의 연관을 맺으려면 조인을 사용한다.

다대일 관계에서 '다'쪽에 해당하는 테이블의 외래키와 '일'쪽에 해당하는 테이블의 기본키를 매핑한다.

객체 간의 연관을 맺으려면 필드로 정의한다.

JPA는 객체 지향에서의 연관 관계를 관계형 데이터베이스에서의 연관 관계로 바꿔준다.

엔티티가 테이블처럼 상대방의 id를 알고 있어야 하는 게 아니라, 일반적인 객체 관계처럼 상대방 엔티티를 필드로 갖고 있으면 된다.

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;
}

@Entity
public class Team {
    @Id
    @GeneratedValue
    private Long id;
    private String name;
```

DDL을 실행하면서 team 필드를 외래키로 만들고, Team 테이블의 기본키와 매핑한다.

```bash
Hibernate: 
    create table Member (
        id bigint not null,
        team_id bigint,
        name varchar(255),
        primary key (id)
    )
Hibernate: 
    create table Team (
        id bigint not null,
        name varchar(255),
        primary key (id)
    )
Hibernate: 
    alter table if exists Member 
       add constraint FK5nt1mnqvskefwe0nj9yjm4eav 
       foreign key (team_id) 
       references Team
Hibernate: 
    select
        next value for Team_SEQ
```

### 단방향 연관 관계

A 엔티티가 B 엔티티를 필드로 갖고 있다.

이 경우 단방향 연관 관계라고 한다.

엔티티 필드는 테이블에서 외래키로 바뀌고, 외래키는 엔티티 필드에 매핑되는 테이블을 참조한다.

### 양방향 연관 관계

문제는 양방향 연관 관계이다.

A 엔티티가 B 엔티티를 필드로 갖고 있는데, B 엔티티도 A 엔티티를 필드로 갖고 있는 경우이다.

멤버 엔티티가 팀 엔티티를 갖고 있고, 팀 엔티티가 멤버 리스트를 갖고 있는 상황이다.

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;
}

@Entity
public class Team {
    @Id
    @GeneratedValue
    private Long id;
    private String name;
    @OneToMany
    @MappedBy("team")
    private List<Member> members;
```

객체 간 양방향 연관관계는 실은 단방향 연관 관계 2개이다.
멤버가 팀 엔티티를 필드로 갖고(단방향 1), 팀 엔티티가 멤버 엔티티 리스트를 필드로 갖는다.(단방향 2)

테이블의 경우 외래키-기본키 매핑이라는 하나의 연관 관계로 양방향을 구현한다.

```sql
select * from member as m
join team as t on m.team_id = t.id;

select * from team as t
join member as m on t.id = m.team_id;
```

JPA는 객체의 연관 관계를 테이블의 연관 관계로 풀어내기 위해서 두 객체 중 하나를 주인으로 지정한다.
외래키가 있는 테이블과 매핑되는 객체가 주인이다. 
주인 객체는 외래키값을 삽입하고 수정하고 삭제할 수 있다.

```java
//엔티티 필드를 삽입/수정하는 행위는 외래키를 삽입/수정하는 행위이다.
member.setTeam(team);
```

주인이 아닌 객체는 외래키를 읽기만 할 수 있다.
`mappedBy`로 누가 주인인지를 지정한다. (The field that owns the relationship. (https://docs.oracle.com/javaee%2F6%2Fapi%2F%2F/javax/persistence/OneToMany.html))


#### 연관 관계의 주인

사실 연관 관계 주인을 정하는 것은 개발자의 몫이다.
연관 관계 주인은 객체의 엔티티 필드를 수정하면 외래키가 수정된다.
@JoinColumn을 어느 쪽에 붙이느냐에 따라 연관 관계 주인은 바뀐다.

##### '일'쪽 엔티티가 연관 관계 주인일 경우
'일'쪽에 @JoinColumn을 붙이고, 엔티티 필드를 수정하면 외래키가 수정된다.

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ManyToOne
//    @JoinColumn(name = "team_id")
    private Team team;
}

@Entity
public class Team {
    @Id
    @GeneratedValue
    private Long id;
    private String name;

    @OneToMany
    @JoinColumn(name = "team_id")
    private List<Member> members = new ArrayList<>();
}
```

```java
   public static void main(String[] args) {

        EntityManagerFactory emf = Persistence.createEntityManagerFactory("hello");
        EntityManager em = emf.createEntityManager();
        //code

        EntityTransaction tx = em.getTransaction();
        tx.begin();

        try {
            Team team = new Team();
            team.setName("teamA");

            Member member = new Member();
            member.setName("helloA");
            System.out.println("member.getTeam() = " + member.getTeam());
            System.out.println("=====");
//            member.setTeam(team);
            System.out.println("=====");

            System.out.println("=====");
            team.getMembers().add(member);
            System.out.println("=====");

            System.out.println("=====");
            em.persist(team);
            System.out.println("=====");

            System.out.println("=====");
            em.persist(member);
            System.out.println("=====");

            System.out.println("=====");
            em.flush();
            System.out.println("=====");
            System.out.println("=====");
            em.clear();
            System.out.println("=====");
            System.out.println("=====");
            Team foundTeam = em.find(Team.class, team.getId());
            System.out.println("=====");
            Member member1 = new Member();
            member1.setName("helloB");
            System.out.println("=====");
//            member1.setTeam(foundTeam);
            System.out.println("=====");
            System.out.println("=====");
            foundTeam.getMembers().add(member1);
            em.persist(foundTeam);
            em.persist(member1);
            System.out.println("=====");
            System.out.println("=====");
            tx.commit();
            System.out.println("=====");

            List<Member> foundMembers = foundTeam.getMembers();
            for (Member foundMember : foundMembers) {
                System.out.println("foundMember = " + foundMember.getTeam() + ", member = " + foundMember.getName());
            }

            System.out.println("member.getTeam() = " + member.getTeam());
            System.out.println("member1 = " + member1.getTeam());
        } catch (Exception e) {
            System.out.println("e.getMessage() = " + e.getMessage());
            tx.rollback();
        } finally {
            em.close();
        }

        emf.close();
    }
```

팀(team) 엔티티가 멤버(member) 리스트를 수정하고 있고, 멤버 엔티티는 팀 필드를 수정하지 않는다.

'일' 쪽 엔티티가 연관 관계 주인인 상황이다.

이 경우, 멤버 엔티티, 팀 엔티티에 대한 insert 쿼리와 팀 엔티티의 외래키를 수정하는 update 쿼리가 실행된다.

```bash
Hibernate: 
    /* insert for
        hellojpa.Team */insert 
    into
        Team (name, id) 
    values
        (?, ?)
Hibernate: 
    /* insert for
        hellojpa.Member */insert 
    into
        Member (name, team_id, id) 
    values
        (?, ?, ?)
Hibernate: 
    update
        Member 
    set
        team_id=? 
    where
        id=?
```

디비에 반영된 팀 엔티티를 가져와 `getMembers()`를 해보면, 디비에 저장된 멤버 엔티티(helloA)를 찾을 수 있다.
또한, 해당 멤버는 외래키를 갖고 있기 때문에 팀 엔티티에 접근할 수 있다.(null이 아니다.)

```bash
foundMember = hellojpa.Team@1980a3f, member = helloA
foundMember = null, member = helloB
```

트랜잭션이 끝난 후 디비를 조회하면 두 멤버 엔티티 모두 외래키가 잘 들어갔음을 확인할 수 있다.

![image](https://github.com/codeleeks/blog/assets/166087781/577df0be-b27e-4f93-bae4-6a2fd9892ea3)

##### `다`쪽이 연관 관계 주인일 경우

외래키를 갖는 테이블에 매핑된 엔티티가 연관 관계 주인인 경우로, 외래키를 업데이트하는 쿼리가 필요 없어진다.

```java
@Entity
public class Team {
    @Id
    @GeneratedValue
    private Long id;
    private String name;

    @OneToMany(mappedBy = "team")
//    @JoinColumn(name = "team_id")
    private List<Member> members = new ArrayList<>();
}

@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;
```

```bash
Hibernate: 
    /* insert for
        hellojpa.Team */insert 
    into
        Team (name, id) 
    values
        (?, ?)
Hibernate: 
    /* insert for
        hellojpa.Member */insert 
    into
        Member (name, team_id, id) 
    values
        (?, ?, ?)
```

멤버가 연관 관계 주인이기 때문에, 엔티티 필드를 수정해야 한다.

```java
public static void main(String[] args) {

        EntityManagerFactory emf = Persistence.createEntityManagerFactory("hello");
        EntityManager em = emf.createEntityManager();
        //code

        EntityTransaction tx = em.getTransaction();
        tx.begin();

        try {
            Team team = new Team();
            team.setName("teamA");

            Member member = new Member();
            member.setName("helloA");
            System.out.println("member.getTeam() = " + member.getTeam());
            System.out.println("=====");
            member.setTeam(team);
            System.out.println("=====");

            System.out.println("=====");
            team.getMembers().add(member);
            System.out.println("=====");

            System.out.println("=====");
            em.persist(team);
            System.out.println("=====");

            System.out.println("=====");
            em.persist(member);
            System.out.println("=====");

            System.out.println("=====");
            em.flush();
            System.out.println("=====");
            System.out.println("=====");
            em.clear();
            System.out.println("=====");
            System.out.println("=====");
            Team foundTeam = em.find(Team.class, team.getId());
            System.out.println("=====");
            Member member1 = new Member();
            member1.setName("helloB");
            System.out.println("=====");
            member1.setTeam(foundTeam);
            System.out.println("=====");
            System.out.println("=====");
            foundTeam.getMembers().add(member1);
            em.persist(foundTeam);
            em.persist(member1);
            System.out.println("=====");
            System.out.println("=====");
            tx.commit();
            System.out.println("=====");

            List<Member> foundMembers = foundTeam.getMembers();
            for (Member foundMember : foundMembers) {
                System.out.println("foundMember = " + foundMember.getTeam() + ", member = " + foundMember.getName());
            }

            System.out.println("member.getTeam() = " + member.getTeam());
            System.out.println("member1 = " + member1.getTeam());
        } catch (Exception e) {
            System.out.println("e.getMessage() = " + e.getMessage());
            tx.rollback();
        } finally {
            em.close();
        }

        emf.close();
    }
```

팀 엔티티에는 팀에 속해 있는 멤버 리스트를 들고 있다.
`getMembers()`로 멤버 리스트를 조회할 수 있다.
여기서는 지연 로딩으로 `getMembers()` 호출할 때 select 쿼리가 실행된다.

```bash
Hibernate: 
    select
        m1_0.team_id,
        m1_0.id,
        m1_0.name 
    from
        Member m1_0 
    where
        m1_0.team_id=?
```

select 쿼리로 디비에서 가져오기 때문에 멤버 엔티티들은 정상적으로 값이 셋팅되어 있음을 확인할 수 있다.

```bash
foundMember = hellojpa.Team@4130a648, member = helloA
foundMember = hellojpa.Team@4130a648, member = helloB
```

##### 비교하기

'일' 쪽 엔티티가 연관 관계 주인이면, 외래키 수정을 위한 update 쿼리가 추가적으로 나간다.

개념적으로도 외래키를 설정한다는 의미로 `team.getMembers().add(member)`보다는 `member.setTeam(team)`이 더 직관적으로 느껴진다.

그래서 외래키를 갖는 테이블에 매핑되는 '다'쪽 엔티티가 연관 관계의 주인이 되어야 한다.

##### 개발 팁

- 양방향 필드 수정: 엔티티 필드를 수정할 때 상대방의 필드도 같이 수정한다.

```java
    public void setTeam(Team team) {
        this.team = team;
        team.getMembers().add(this);
    }
```

### 일대일 연관 관계

다대일, 일대다 관계처럼 단방향은 직관적이며, 양방향은 `@JoinColumn`과 `mappedBy`로 연관 관계의 주인을 명시해야 한다.

```java
@Entity
public class Locker {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;

    @OneToOne(mappedBy = "locker")
    private Member member;
}

@Entity
public class Member {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;

    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;

    @OneToOne
    @JoinColumn(name = "locker_id")
    private Locker locker;
}
```

- 1) 주 엔티티 `->` 대상 엔티티 단방향, 외래키는 주 테이블에 있는 경우
- 2) 주 엔티티 `<->` 대상 엔티티 양방향, 외래키는 주 테이블에 있는 경우
- 3) 주 엔티티 `->` 대상 엔티티 단방향, 외래키는 대상 테이블에 있는 경우 (JPA가 지원하지 않음)
- 4) 주 엔티티 `<->` 대상 엔티티 양방향, 외래키는 대상 테이블에 있는 경우

2번과 4번은 코드로 풀면 같은 내용이다.
외래키가 있는 테이블에 매핑된 엔티티가 연관 관계의 주인이 되어야 하기 때문이다.
2번의 경우에 주 엔티티가 연관 관계의 주인이 되고, 4번의 경우에는 대상 엔티티가 연관 관계의 주인이 된다.

### 다대다 연관 관계

두 개의 테이블이 다대다 관계를 맺는 것은 불가능하다.
연결 테이블을 도입해서 세 개의 테이블이 관계를 가져야 한다.

그런데 두 개의 객체는 다대다 관계를 가질 수 있기 때문에,
JPA는 이러한 간극을 메꿔야 했다.

그래서 JPA는 두 개의 엔티티가 다대다 관계를 맺을 때(`@ManyToMany`) 세 개의 테이블이 나오도록 변환한다. (각 엔티티에 매핑되는 테이블과 연결테이블)
연결테이블은 `@JoinTable` 어노테이션으로 이름, 컬럼명 등을 지정할 수 있다.

그러나 `@JoinTable`을 사용해서는 연결테이블에 컬럼을 추가할 수 없다.

그래서 다대다 관계는 엔티티 레벨에서 @OneToMany, @ManyToOne으로 풀어낸다.
연결테이블에 해당하는 엔티티를 추가하는 격이다.

```java
@Entity
public class Member {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;

    @OneToMany(mappedBy = "member")
    private List<Order> orders = new ArrayList<>();
}

@Entity
public class Product {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @OneToMany(mappedBy = "product")
    private List<Order> orders = new ArrayList<>();
}

@Entity
public class Order {
    @Id @GeneratedValue
    private Long id;

    @ManyToOne
    @JoinColumn(name = "MEMBER_ID")
    private Member member;

    @ManyToOne
    @JoinColumn(name = "PRODUCT_ID")
    private Product product;
}
```

### 컬렉션 엔티티

일대다, 다대다의 연관관계인 경우 필드는 컬렉션으로 정의한다.
하이버네이트는 컬렉션 필드를 자체 컬렉션으로 래핑한다.

|컬렉션|내장 컬렉션|중복 허용|순서 보관|요소 추가시 초기화 유무|
|---|---|---|---|---|
|Collection, List|PersistenceBag|O|X|X|
|Set|PersistenceSet|X|X|O|
|List + @OrderColumn|PersistenceList|X|O|X|

중복을 허용하는 컬렉션은 `add()`시 중복된 데이터가 있는지 확인하지 않아도 된다.
반대로 중복을 허용하지 않는 컬렉션은 `add()`시 중복된 데이터가 있는지 확인해야 한다.

확인하는 과정은 프록시 입장에선 초기화가 필요하다.
그래서 중복을 허용하지 않는 `Set`은 `add()` 호출시 프록시를 초기화한다.(쿼리 발생)

<MessageBox title='`@OrderColumn`과 `@OrderBy`' level='info'>
	`@OrderColumn`은 순서를 저장하는 컬럼을 두는 것이다.
	해당 컬럼을 채우지 않고 insert하면 null로 채워진다.

 	컬럼으로 순서를 저장하는 것은 문제가 있다.
  	레코드가 삭제될 때 나머지 레코드의 순서를 업데이트해줘야 한다.
   	그래서 여러 개의 update 쿼리가 나갈 수 있다.
    
	순서가 필요한 경우에는 `@OrderBy`를 사용한다.
 	```java
  		@Entity
		public class Team {
  			@OneToMany(mappedBy = "team")
     			@OrderBy("username desc, id asc")
  			private Set<Member> members = new HashSet<Member>();
  		}
  	```

   	`@OrderBy`는 컬렉션 조회시 order by 키워드가 추가되어 쿼리가 실행된다.
</MessageBox>


## 상속 관계 매핑

엔티티 간 상속 관계는 테이블에서 어떻게 표현될까?

테이블에는 슈퍼타입-서브타입 개념이 있다.

추상화된 타입인 슈퍼타입과 구체화된 타입인 서브 타입의 관계는 세 가지 전략으로 설계된다.

- Identity(각 테이블로 분리): 서브 타입은 슈퍼타입을 외래키로 걸고, 슈퍼타입은 서브 타입을 지칭하는 컬럼(type)으로 구분한다.
- Rollup(하나의 테이블로 처리): 슈퍼 타입에 서브 타입 컬럼을 다 넣는다. 다른 서브 타입의 컬럼값은 null이 된다.
- Rolldown(서브 타입으로만 처리): 슈퍼 타입의 컬럼을 각각의 서브타입에 넣는다.

고려할 만한 전략은 Identity와 Rollup이다.
Rolldown은 변경에 취약하기 때문이다.

JPA에선 Identity는 InheritanceType.JOINNED로(조인전략), Rollup은 InheritanceType.SINGLE_TABLE(싱글 테이블 전략)으로 설정한다.
싱글테이블 전략은 디폴트 설정으로서, `@Inheritance`를 적지 않으면 자동으로 설정된다.

```java
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "type")
public abstract class Item {
    @Id @GeneratedValue
    private Long id;
    private String name;
    private int price;
}

@Entity
@DiscriminatorValue("AlbumType")
public class Album extends Item {
    private String artist;

    public String getArtist() {
        return artist;
    }

    public void setArtist(String artist) {
        this.artist = artist;
    }
}
```

- `@DiscriminatorColumn`: 서브 타입을 구분하기 위해 사용되는 슈퍼 타입의 컬럼.
- `@DiscriminatorValue`: `@DiscriminatorColumn`으로 지정한 슈퍼 타입의 컬럼에 들어갈 서브 타입의 타입값.(기본값은 서브 타입의 엔티티 이름)

### 조인 전략과 싱글테이블 전략 비교

||조인전략|싱글테이블전략|
|---|---|---|
|장점|정규화가 되어 있음|조회, 삽입 쿼리가 단순함|
|단점|테이블이 여러 개라 관리가 복잡할 수 있음. 또한, 조회시 조인, 삽입은 슈퍼타입, 서브타입에 각각 실행됨.|레코드의 무결성이 깨짐.(컬럼값이 null인 경우가 많음)|

## @MappedSuperclass

부모 클래스의 필드를 자식 엔티티가 상속받을 수 있게 해준다.
엔티티는 엔티티나 `@MappedSuperClass` 어노테이션이 붙은 클래스만 상속받을 수 있다.

여러 엔티티에서 공통적으로 사용할 필드를 한 곳에 정의하여 관리할 수 있다.

```java
package hellojpa;

import jakarta.persistence.MappedSuperclass;

import java.time.LocalDateTime;

@MappedSuperclass
public abstract class BaseEntity {
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

package hellojpa;

import jakarta.persistence.*;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "type")
public class Item extends BaseEntity {
    @Id @GeneratedValue
    private Long id;
    private String name;
    private int price;
}

void main() {
  Album album = new Album();
  album.setArtist("zico");
  album.setCreatedAt(LocalDateTime.now());
  album.setCreatedBy("zico");
  album.setUpdatedAt(LocalDateTime.now());
}
```

##  프록시

하이버네이트는 성능 이점을 갖기 위해, 필요한 테이블만 조회하도록 지연 로딩 기능을 제공한다.
지연 로딩은 가짜 엔티티를 만들어서, 비즈니스 로직에서 실제로 필드를 사용할 때 데이터베이스에 조회를 하는 방식으로 구현되었다.
필드에 최초로 접근할 때에만 데이터베이스에서 조회한다.

가짜 엔티티는 다른 말로 프록시라고 한다.
프록시는 엔티티를 상속해서 만든다. 프록시 안에 엔티티 객체를 갖고 있고, 프록시 메서드를 호출하면 해당하는 엔티티 메서드를 호출한다.

![image](https://github.com/user-attachments/assets/fd818f80-7e79-46d7-ad84-65249e8f4a39)

필드에 최초로 접근할 때 프록시는 초기화된다.
초기화 과정에서 영속성 컨텍스트에게 엔티티 조회 요청을 하고, 결과를 1차 캐시에 저장한다.

![image](https://github.com/user-attachments/assets/fdcd1677-102b-40cb-95d9-e87ec76585ea)

`em.find()`는 영속성 객체가 없는 경우 실제 엔티티를 반환하며, `em.getReference()`는 영속성 객체가 없는 경우 프록시를 반환한다.

```java
Album album1 = em.getReference(Album.class, 1L);
```

<MessageBox title='REPEATABLE_READ와 프록시' level='warning'>
	`em.getReference()`는 "영속성 객체가 없는 경우" 프록시 객체를 만든다.
	이미 `em.find()`를 통해 데이터베이스를 조회해서 실제 엔티티를 1차 캐시에 넣어놨다면 이후의 `em.getReference()`도 프록시가 아니라 엔티티를 반환한다.
	이렇게 함으로써, 같은 트랜잭션 내의 REPEATABLE_READ 격리성을 제공하는 효과가 있기 때문이다.

	반대로 `em.getReference()`로 프록시 객체를 생성해서 1차 캐시에 넣어놨다면 이후의 `em.find()`도 엔티티가 아니라 프록시를 반환한다.	
</MessageBox>

<MessageBox title='준영속과 프록시' level='warning'>
	영속성 컨텍스트에서 제외된 프록시는 초기화를 할 수 없다.
	프록시의 초기화 과정에서 영속성컨텍스트를 사용하여 엔티티를 만드는데, 영속성 컨텍스트에서 프록시를 제외했기 때문이다. (`LazyInitializationException`이 발생한다)
	준영속된 이후에 프록시에서 엔티티 필드를 가져오는 작업은 이러한 이유로 실패한다.
 	```java
            Album album1 = em.getReference(Album.class, 1L);
            em.detach(album1);
            System.out.println("album1.getArtist() = " + album1.getArtist());
  	```
</MessageBox>


## 지연 로딩과 즉시 로딩

비즈니스 로직에서 연관된 두 엔티티가 대부분 같이 쓰일 때는 당장 모두 가져오는 것이 유리할 것이고, 반대로 아주 가끔 같이 쓰일 때는 매번 가져오지 않고 사용될 때만 연관된 엔티티를 가져오는 게 나을 것이다.

JPA는 이러한 상황을 커버하기 위해 즉시 로딩과 지연 로딩을 지원한다.

즉시 로딩은 엔티티 간의 연관 관계가 있을 때, 연관된 엔티티까지 모두 가져온다. (조인 사용. 그 연관된 엔티티가 또 다른 엔티티와 연관되어 있는 경우라면 또 다른 엔티티도 가져온다)
지연 로딩은 연관된 엔티티가 사용될 때 그제서야 가져온다.

### 즉시 로딩의 단점

즉시 로딩은 성능상 위험한 선택지일 가능성이 높다.

즉시 로딩은 한 번의 쿼리로 연관 관계에 있는 테이블을 다 가져오기 때문에 여러 개의 조인으로 엮은 쿼리가 발생할 수 있다.
또한, 직접 쿼리를 작성하는 경우에 연관된 테이블의 레코드를 조회하기 위해 N+1 문제를 일으킬 수 있다.

```java
Team team = new Team();
team.setName("teamA");

Team team1 = new Team();
team1.setName("teamB");

Member member = new Member();
member.setName("memberA");

Member member1 = new Member();
member1.setName("memberB");

team.getMembers().add(member);
team1.getMembers().add(member1);

em.persist(team);
em.persist(team1);
em.persist(member);
em.persist(member1);

em.flush();
em.clear();

List<Team> teams = em.createQuery("select t from Team t", Team.class)
    .getResultList();
```

Team 엔티티 리스트를 조회하는데, 멤버 엔티티의 레코드를 가져올 때 조인이 아니라 각 팀에 속한 멤버 리스트를 구하는 방식으로 실행된다. 
다시 말해, 각 team_id로 member 테이블을 여러 번 조회한다.
하나의 쿼리(팀 테이블 조회 쿼리)가 여러 개의 쿼리(team_id별 멤버 테이블 조회 쿼리 여러 개)를 유발하는 것이다.

```bash
Hibernate: 
    /* select
        t 
    from
        Team t */ select
            t1_0.id,
            t1_0.name 
        from
            Team t1_0
Hibernate: 
    select
        m1_0.team_id,
        m1_0.id,
        m1_0.name 
    from
        Member m1_0 
    where
        m1_0.team_id=?
Hibernate: 
    select
        m1_0.team_id,
        m1_0.id,
        m1_0.name 
    from
        Member m1_0 
    where
        m1_0.team_id=?
```

### 연관 관계별 FetchType 기본 설정

- `@ManyToOne`: FetchType.EAGER (즉시로딩)
- `@OneToOne`: FetchType.EAGER (즉시로딩)
- `@OneToMany`: FetchType.LAZY (지연로딩)
- `@ManyToMany`: FetchType.LAZY (지연로딩)


## 영속성 전이

어떤 엔티티를 영속성 컨텍스트에 넣을 때, 연관된 엔티티도 같이 영속화할 것인지 아닐지를 설정한다.

엔티티 간의 관계가 종속 관계일 때 쓴다.

종속 관계란 두 가지 조건을 만족한다. 

- A가 B에서만 쓰인다.
- B가 있어야 A를 추가할 수 있고, B를 삭제하면 A도 삭제해야 한다.

```java
@Entity
public class Team {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;

    //default는 {}.
    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinColumn(name = "team_id")
    private List<Member> members = new ArrayList<>();
}
```

### 고아 객체

종속 관계에서 연관 관계가 없는 자식 엔티티는 삭제하는 기능이다.

예를 들어, `team.getMembers().remove(0)` 코드를 실행하면 0번째 멤버 엔티티의 연관 관계가 끊어지는데,
이 때 멤버 테이블에서 해당하는 레코드도 삭제하는 기능이다.

```java

@Entity
public class Team {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;

    //default는 false
    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "team_id")
    private List<Member> members = new ArrayList<>();
}
```

## 값 타입

JPA에서 취급하는 타입은 크게 두 가지이다.

- 엔티티: 일반적으로 pk를 두기 때문에(식별자) JPA가 추적이 가능하다. (추적이 가능하다는 것은 엔티티의 필드가 변하면 테이블에 있는 레코드를 모두 지우고 새 값들로 다시 넣는게 아니라 update 쿼리를 날릴 수 있다는 뜻이다.)
- 값 타입: JPA가 추적이 불가능하다. 값 자체는 변경 이력을 추적할 수 있는 식별자가 없다. 엔티티에 종속적인 관계이다.(그러므로 라이플사이클을 같이 가져간다. 마치 `Cascade.ALL, OrphanRemoval=true` 처럼)


값 타입은 세 가지로 나뉜다.

- 기본값타입: 자바 기본 타입, Integer, String 등의 객체 타입.
- 임베디드타입: `@Embeddable`이 붙은 클래스
- 값타입컬렉션: 기본값타입이나 임베디드타입의 컬렉션

### 임베디드 타입

기본값 타입의 필드들을 별도의 클래스로 분리하여 사용한다.
`@Column` 등 엔티티에서 사용하는 어노테이션을 사용할 수 있다.

```java
@Embeddable
public class Address {
    private String city;
    private String street;
    private String zipcode;
}

@Entity
public class Member {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;

    @Embedded
    private Period workPeriod;
    @Embedded
    private Address homeAddress;
```

임베디드 타입의 필드는 객체이기 때문에 엔티티 객체 간의 공유가 가능하다.
이는 부수효과(side effect)를 발생하기 때문에 임베디드 타입을 정의할 때 불변 객체로 만들어야 한다.
빌더 패턴은 대표적인 불변 객체이다.

<MessageBox title='불변 객체 정의시 주의 사항' level='warning'>
	엔티티나 임베디드 타입은 기본생성자를 만들어줘야 한다.
</MessageBox>

```java
package hellojpa;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class Address {
    private String city;
    private String street;
    private String zipcode;

    private Address() {

    }

    protected Address(String city, String street, String zipcode) {
        this.city = city;
        this.street = street;
        this.zipcode = zipcode;
    }

    //값 비교를 위한 재정
    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        } else if (obj == null) {
            return false;
        } else if (obj instanceof Address) {
            Address target = (Address) obj;
            return Objects.equals(this.city, target.city) && Objects.equals(this.street, target.street)
                    && Objects.equals(this.zipcode, target.zipcode);
        } else {
            return false;
        }
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String city;
        private String street;
        private String zipcode;

        public Builder city(String city) {
            this.city = city;
            return this;
        }
        public Builder street(String street) {
            this.street = street;
            return this;
        }
        public Builder zipcode(String zipcode) {
            this.zipcode = zipcode;
            return this;
        }

        public Address build() {
            return new Address(city, street, zipcode);
        }
    }
}
```

### 값 타입 컬렉션

관계형 데이터베이스에서는 테이블 내에 컬렉션을 두는 방법이 없다.
값 타입 컬렉션도 별도의 테이블로 만들어지고, 외래키로 엔티티에 연결하는 방식으로 구현되었다. (디폴트로 지연 로딩)

`@ElementCollection`과 `@CollectionTable` 조합으로 정의한다.

```java
@Entity
public class Member {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;

    @ElementCollection
    @CollectionTable(
            name = "roles",
            joinColumns = @JoinColumn(name = "member_id")
    )
    private List<String> roles;
    @ElementCollection
    @CollectionTable(
            name = "addresses",
            joinColumns = @JoinColumn(name = "member_id")
    )
    private List<Address> addresses;
}
```

값 타입 컬렉션을 수정할 때 치명적인 문제가 있다.
값 타입은 식별자가 없어 추적이 불가능하다.
그래서 컬렉션에서 수정이 발생하면 컬렉션 테이블에서 관련된 레코드를 싹 지우고, 다시 넣을 수밖에 없다.

```java
Member member = new Member();
member.setName("memberA");

ArrayList<Address> addresses = new ArrayList<>();
Address address = Address.builder()
    .city("seoul")
//                    .street("gangnam")
    .zipcode("123456")
    .build();
Address address1 = Address.builder()
    .city("busan")
    .street("haeundae")
    .zipcode("1234")
    .build();


addresses.add(address);
addresses.add(address1);

member.setAddresses(addresses);

em.persist(member);

em.flush();
em.clear();

//컬렉션을 수정한다.
Member foundMember = em.find(Member.class, 1L);
foundMember.getAddresses().remove(address);
foundMember.getAddresses().add(Address.builder()
    .city("sa")
    .street("1st")
    .zipcode("5555")
    .build());
```

```bash
Hibernate: 
    /* one-shot delete for hellojpa.Member.addresses */delete 
    from
        addresses 
    where
        member_id=?
Hibernate: 
    /* insert for
        hellojpa.Member.addresses */insert 
    into
        addresses (member_id, city, street, zipcode) 
    values
        (?, ?, ?, ?)
Hibernate: 
    /* insert for
        hellojpa.Member.addresses */insert 
    into
        addresses (member_id, city, street, zipcode) 
    values
        (?, ?, ?, ?)
```

#### 값 타입 컬렉션의 대안

엔티티로 만들고, 엔티티가 값 타입을 갖게 한다.
부모 엔티티와 일대다 연관 관계를 맺는다.

```java
@Entity
@Table(name = "Address")
public class AddressEntity {
    @Id @GeneratedValue
    private Long id;
    private Address address;

    public AddressEntity(String city, String street, String zipcode) {
        this.address = Address.builder()
                .zipcode(zipcode)
                .street(street)
                .city(city)
                .build();
    }
}

@Entity
public class Member {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;

    @ElementCollection
    @CollectionTable(
            name = "roles",
            joinColumns = @JoinColumn(name = "member_id")
    )
    private List<String> roles;
//    @ElementCollection
//    @CollectionTable(
//            name = "addresses",
//            joinColumns = @JoinColumn(name = "member_id")
//    )
    //private List<Address> addresses;
    @OneToMany
    @JoinColumn(name = "member_id")
    private List<AddressEntity> addresses;
}
```

```java
Member member = new Member();
member.setName("memberA");

ArrayList<AddressEntity> addresses = new ArrayList<>();
addresses.add(new AddressEntity("seoul", "gangnam", "123456"));
addresses.add(new AddressEntity("busan", "haeundae", "1234"));

member.setAddresses(addresses);

em.persist(member);

em.flush();
em.clear();


Member foundMember = em.find(Member.class, 1L);
foundMember.getAddresses().remove(new AddressEntity("seoul", "gangnam", "123456"));
foundMember.getAddresses().add(new AddressEntity("sa", "1st", "555"));

```

## 객체향 쿼리 언어

객체 세계에서 복잡한 조건 조회는 타겟 객체 무리가 제공하는 여러 메서드로 처리한다.

객체 간 협력으로 필요한 내용을 전달하는 것이다.

JPA가 이러한 메서드들의 코드를 다 분석해 쿼리를 만드는 것보다, SQL와 같은 객체향 쿼리 언어를 제공하는 것이 효율적이다.

객체향 쿼리 언어는 문법에 따라 SQL로 변환되어 데이터베이스에서 실행된다.

따라서 조건에 맞는 필요한 레코드만 얻어올 수 있다. (어플리케이션에 레코드를 모두 얻어온 뒤 조건에 따라 필터링하지 않아도 된다)

### JPQL

정적 쿼리.
JPA가 SQL로 변환한다.

```java
// like 검색
String jpql = "select m from Member m where m.name like '%member1%'";
List<Member> foundMembers = em.createQuery(jpql, Member.class)
    .getResultList();
```

동적으로 변경되는 조건인 경우에 대응이 어렵다.
이 경우에는 동적 쿼리 솔루션을 사용한다.


### CriteriaQuery

동적 쿼리.

JPA에서 공식 지원하는 JPQL 빌더.

```java
CriteriaBuilder cb = em.getCriteriaBuilder();
CriteriaQuery<Member> query = cb.createQuery(Member.class);

Root<Member> m = query.from(Member.class);

CriteriaQuery<Member> cq = query.select(m)
    .where(cb.like(m.get("name"), "%member1%"));

List<Member> foundMembers = em.createQuery(cq).getResultList();
```

동적 쿼리를 작성하기 복잡하다.

### QueryDSL

동적 쿼리.

서드파티 라이브러리이다.

```java
```

## 네이티브 SQL

JPA에서 제공하는 네이티브 SQL을 사용할 수도 있고, 

```java
List<Member> foundMembers = em.createNativeQuery("select * from Member as m where m.name like '%member1%'", Member.class)
    .getResultList();
```

SQL 매퍼를 사용할 수 있다.
SQL 매퍼는 JdbcTemplate, MyBatis 등을 사용한다.

[관련 포스팅] (https://codeleeks.github.io/blog/posts/springboot/Spring%20DB%20%EC%99%84%EB%B2%BD%20%EC%A0%95%EB%A6%AC.md)


## JPQL

정적 쿼리.

```java
// like 검색
String jpql = "select m from Member m where m.name like '%member1%'";
List<Member> foundMembers = em.createQuery(jpql, Member.class)
    .getResultList();

// aggregation
String jpql = "select sum(m.age) from Member m";
Long singleResult = em.createQuery(jpql, Long.class)
    .getSingleResult();

//파라미터 바인딩
String jpql = "select m from Member m where m.name=:name";
TypedQuery<Member> query = em.createQuery(jpql, Member.class);
Member result = query.setParameter("name", "member12")
    .getSingleResult();

//프로젝션
//엔티티 프로젝션 (조인 사용)
String jpql = "select m.team from Member m";
List<Team> teams = em.createQuery(jpql, Team.class)
    .getResultList();

//임베디드 타입 프로젝션
String jpql = "select m.address from Member m";
List<Address> resultList = em.createQuery(jpql, Address.class)
    .getResultList();

//스칼라 타입 프로젝션
String jpql = "select new hellojpa.Aggregate(sum(m.age), count(m)) from Member m";
Aggregate singleResult = em.createQuery(jpql, Aggregate.class)
    .getSingleResult();


//조인
//이너 조인. (SELECT m FROM Member m [INNER] JOIN m.team t)
String jpql = "select m from Member m join m.team";
List<Member> resultList = em.createQuery(jpql, Member.class)
    .getResultList();

//아우터 조인. (SELECT m FROM Member m LEFT [OUTER] JOIN m.team t)
String jpql = "select m from Member m left join m.team";
List<Member> resultList = em.createQuery(jpql, Member.class)
    .getResultList();

//on을 통한 조건 적용
String jpql = "select m from Member m join Team t on t.name = 'A'";
List<Member> resultList = em.createQuery(jpql, Member.class)
    .getResultList();
//on을 통한 연관 관계 없는 엔티티 간 조인
String jpql = "select m, t from Member m left join Team t on m.name = t.name";
List<Object[]> resultList = em.createQuery(jpql, Object[].class)
    .getResultList();

//서브쿼리
//평균 나이보다 많은 회원 조회
String jpql = "select m from Member m where m.age > (select avg(m2.age) from Member m2)";
List<Member> resultList = em.createQuery(jpql, Member.class)
    .getResultList();

//팀 member1에 속한 멤버 조회
String jpql = "select m from Member m where exists (select t from m.team t where t.name = 'member1')";
List<Member> resultList = em.createQuery(jpql, Member.class)
    .getResultList();

//어떤 팀이든 속해 있는 멤버 조회
String jpql = "select m from Member m where m.team = ANY (select t from Team t)";
List<Member> resultList = em.createQuery(jpql, Member.class)
    .getResultList();

//제공 함수
// coalesce, is null 
String jpql = "select coalesce(m.name, '이름 없는 회원') from Member m where m.name is null";
List<String> resultList = em.createQuery(jpql, String.class)
    .getResultList();
```

<MessageBox title='on과 외부 조인' level='warning'>
	`on`을 통한 필터링과 `where`을 통한 필터링은 유사해보이지만 다르다.
	`on`은 조인할 때 가져올 레코드에 조건을 걸고, `where`은 SQL 실행 결과로 반환될 레코드에 대해 필터링을 한다.

 	차이는 외부 조인(left join, right join)할 때 나타난다.
  	외부 조인은 매칭되지 않는 레코드도 포함하기 때문에 where 절에서 조건을 걸면 매칭되지 않는 레코드는 제외된다.
   	그러나 on에서 조건을 걸면 매칭되지 않아도 포함한다.

	`where` 절에서 조건을 걸 때.
    	```bash
	    /* select
	        member1,
	        team 
	    from
	        Member member1   
	    left join
	        member1.team as team 
	    where
	        team.name = ?1 */ select
	            m1_0.member_id,
	            m1_0.age,
	            m1_0.team_id,
	            m1_0.username,
	            t1_0.team_id,
	            t1_0.name 
	        from
	            member m1_0 
	        left join
	            team t1_0 
	                on t1_0.team_id=m1_0.team_id 
	        where
	            t1_0.name=?
     	```
      	```bash
       	tuple = [Member(id=1, username=member1, age=10), Team(id=1, name=teamA)]
	tuple = [Member(id=2, username=member2, age=20), Team(id=1, name=teamA)]
       	```

	`on` 절에서 조건을 걸 때
 	```bash
  	    /* select
        	member1,
	        team 
	    from
	        Member member1   
	    left join
	        member1.team as team with team.name = ?1 */ select
	            m1_0.member_id,
	            m1_0.age,
	            m1_0.team_id,
	            m1_0.username,
	            t1_0.team_id,
	            t1_0.name 
	        from
	            member m1_0 
	        left join
	            team t1_0 
	                on t1_0.team_id=m1_0.team_id 
	                and t1_0.name=?

  	```
   	```bash
	tuple = [Member(id=1, username=member1, age=10), Team(id=1, name=teamA)]
	tuple = [Member(id=2, username=member2, age=20), Team(id=1, name=teamA)]
	tuple = [Member(id=3, username=member3, age=30), null]
	tuple = [Member(id=4, username=member4, age=40), null]
    	```
 	
</MessageBox>


### JPQL에서 제공되는 기본 함수

- concat
- substring
- trim
- lower, upper
- length
- abs, sqrt, mod
- size, index
- coalesce
- nullif: `nullif(m.username, '관리자')`일 때 m.username가 관리자면 null을, 아니면 m.username을 반환.
- exists, in
- and, or, not
- between, like, is null
- `type(m) = Member`: 상속 관계 확인.


### 경로 표현식

`.`을 통해 엔티티 필드를 접근할 수 있다.
필드는 상태 필드, 연관 필드로 나뉜다.

상태 필드는 단순히 값을 저장하기 위한 필드이다. (m.name)
연관 필드는 다른 엔티티와 연관 관계에 놓인 필드이다. 단일값 연관 필드와 컬렉션 연관 필드로 나뉜다.

단일값 연관 필드는 `@ManyToOne`, `@OneToOne` 관계처럼 대상이 엔티티 하나다.
반면, 컬렉션 연관 필드는 `@OneToMany`, `@ManyToMany` 관계처럼 대상이 컬렉션이다.

필드의 구분에 따라 특징이 있다.

||상태필드|단일값 연관 필드|컬렉션 연관 필드|
|---|---|---|---|
|경로 탐색|경로 탐색의 끝|경로 탐색을 이어감|**경로 탐색의 끝**|
|묵시적 이너 조인|X|O|O|

"경로 탐색의 끝"은 `.`으로 다음 필드로 이어갈 수 없다는 뜻이다.

```bash
# 성공 - 묵시적 조인 발생
select o.member.team from Order o
# 성공 - 묵시적 조인 발생
select t.members from Team
# 실패 - 컬렉션 연관 필드에서 그 다음 필드로 탐색을 이어나갈 수 없다.
select t.members.username from Team t
# 성공 - 명시적 조인
select m.username from Team t join t.members m
```

묵시적 조인은 지양하고, 명시적 조인으로 코드 가독성을 높여야 한다.

### fetch join

JPQL만의 특별한 기능. (SQL에는 fetch join이 없다)

연관된 필드를 SQL 한 번에 조회하는 기능이다.

단일 값 필드, 컬렉션 필드 모두 한 번에 가져와 성능 최적화를 꾀한다.

```java
String jpql = "select t from Team t join fetch t.members";
List<Team> teams = em.createQuery(jpql, Team.class)
    .getResultList();
```

```sql
-- 팀 레코드, 멤버 레코드 모두 가져온다.
SELECT T.*, M.*
FROM TEAM T
INNER JOIN MEMBER M ON T.ID=M.TEAM_ID
```

<MessageBox title='페치 조인과 일대다 관계' level='warning'>
	일대다 연관 관계 필드를 가져올 때는 조인된 테이블의 레코드가 원래 갯수보다 늘어날 수 있기 때문에 중복 데이터가 발생한다.

 	![image](https://github.com/user-attachments/assets/57a7fe0a-3f14-4e90-b111-47868113c531)

	`distinct` 키워드를 사용해서 데이터베이스 차원에서 중복 데이터를 걸러내고, 어플리케이션 차원에서 중복 데이터를 걸러낸다.
	하이버네이트6부터는 `distinct`를 적지 않아도 중복 데이터를 자동으로 없애준다.
</MessageBox>


#### 페치 조인 사용시 주의 사항

- 페치 조인 대상에 대한 필터링(`select t from Team t join fetch t.members m on m.name = :memberName`)은 피해야 한다.
  - `on`으로 페치 조인 대상에 대해 필터링하면 부트 타임 오류(`Fetch join has a 'with' clause (use a filter instead)`)가 발생한다.
  - 페치 조인 대상, 즉 컬렉션의 요소를 삭제하다가 전체 컬렉션이 삭제되는 경우가 발생할 수 있다.
  - `where`로 해결할 수 있지만, `xToMany` 관계에서는 여전히 문제가 된다.
  - `outer join`을 쓰면 `xToOne`도 문제가 생길 수 있다???
- 한 엔티티의 여러 개의 컬렉션 필드를 한 번에 페치 조인하면 안 된다.
  - 일대다대다의 상황으로 레코드가 폭증할 수 있다.
- 일대다 연관 관계일 때 페이징 API가 동작하지 않는다.(어플리케이션 메모리에서 페이징한다)
  - 데이터베이스 차원에서 일대다 관계의 조인테이블은 레코드가 기존 테이블의 레코드 갯수보다 증가하기 때문에 페이징의 의미가 없어진다. [관련 포스팅](https://codeleeks.github.io/blog/posts/springboot/N+1%20%EB%AC%B8%EC%A0%9C.md)

<MessageBox title='페치 조인 대상으로 필터링해서 가져올 때 조심해야 하는 이유' level='warning'>
	```java
	String jpql = "select t from Team t join fetch t.members m where m.id < 2";
	List<Team> teams = em.createQuery(jpql, Team.class)
	    .getResultList();
	
	for (Team team : teams) {
	  for (Member member : team.getMembers()) {
	    System.out.println("member.getName() = " + member.getName());
	  }
	}
	
	teams.get(0).getMembers().remove(0);
	
	List<Team> fountTeams = findAll(em);
	for (Team fountTeam : fountTeams) {
	  for (Member member : fountTeam.getMembers()) {
	    System.out.println("member.getName() = " + member.getName());
	  }
	}

	private static List<Team> findAll(EntityManager em) {
	  String jpql = "select t from Team t join fetch t.members";
	  return em.createQuery(jpql, Team.class)
		.getResultList();
	}
 	```

	팀은 3명의 멤버를 가진다.
 	쿼리는 멤버에 필터링을 걸어서 멤버 1명만 반환된다. (`select t from Team t join fetch t.members m where m.id < 2`)
 	반환된 1명의 멤버를 컬렉션에서 삭제한다. (`teams.get(0).getMembers().remove(0);`)
   	JPA는 컬렉션이 비었다고 판단하고(1명의 멤버를 갖는 리스트에서 한 명을 삭제했으니 컬렉션은 비어있다), 아래의 쿼리를 실행한다.
  	
   	```bash
	Hibernate: 
    	/* one-shot delete for hellojpa.Team.members */update Member 
    	set
        	team_id=null 
    	where
	        team_id=?
   	```

     	그런데 데이터베이스에는 3명의 멤버가 있었다. (id가 1,2,3인 멤버)
      	JPA의 update 쿼리로 3명의 멤버 모두 팀을 잃게 된다.

       ![image](https://github.com/user-attachments/assets/1157eb56-7ca1-489b-8e36-5a1be4b15192)

      	페치 조인 대상이 컬렉션이라면 이를 필터링해서 가져온 후 수정 및 삭제 작업을 하면 데이터베이스에 저장된 데이터와 달라질 수 있다.
</MessageBox>

### Named 쿼리

쿼리를 재사용하기 위해 이름을 붙인다.

```java
@Entity
@NamedQuery(
        name = "Member.findMemberByName",
        query = "select m from Member m where m.name = :memberName"
)
public class Member {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private Integer age;
}

List<Member> resultList = em.createNamedQuery("Member.findMemberByName", Member.class)
    .setParameter("memberName", "member1")
    .getResultList();
```

네임드 쿼리는 어플리케이션 로딩 시점에 JPA가 jpql를 SQL로 변환하고 캐싱해놓는다.
쿼리를 사용할 때마다 매번 jpql을 SQL로 변환하는 비용을 줄일 수 있으며, 쿼리의 문법 오류를 로딩 시점에 파악할 수 있다.

네임드 쿼리는 Spring Data에서 `@Query` 어노테이션으로 제공된다.

### 벌크 연산

JPA에서는 `update`, `delete`, `insert into select`와 같은 벌크 연산도 지원한다.

```java
String qlString = "update Member m set m.age = m.age * 2";
int count = em.createQuery(qlString)
    .executeUpdate();
```

벌크 연산 이후에는 영속성 컨텍스트를 초기화해야 한다.
벌크 연산은 영속성 컨텍스트를 무시하고 바로 데이터베이스에 반영하기 때문이다.

```java
String qlString = "update Member m set m.age = m.age * 2";
int count = em.createQuery(qlString)
    .executeUpdate();
em.clear();
Member foundMember = em.find(Member.class, 1L);
System.out.println("foundMember.getAge() = " + foundMember.getAge()); // 2. em.clear()가 없었다면 1.(1차 캐시에 저장된 값을 가져오기 때문)
```

## OSIV

Open Session In View. (하이버네이트 용어)
JPA 표준에는 Open EntityManager In View (OEIV)라고 한다.

영속성 엔티티를 View 영역(프레젠테이션)에서도 사용할 수 있게 한다.

```bash
# 기본값은 true
spring.jpa.open-in-view=true 
```

기본적으로 영속성 컨텍스트는 트랜잭션과 라이브사이클을 같이 한다.

### 트랜잭션당 영속성 컨텍스트 전략

![image](https://github.com/user-attachments/assets/d6e9f1b7-9f01-47f7-a2b5-8dc825cff581)

- OSIV를 false로 설정하면 선택되는 전략
- 트랜잭션마다 영속성컨텍스트를 새로 만들고, 트랜잭션이 종료되면서 영속성컨텍스트도 종료된다.
- 프레젠테이션에서 엔티티는 준영속 상태라 지연로딩이 안 된다. (예외 발생)

```bash
spring.jpa.open-in-view=false
```

<MessageBox title='트랜잭션당 영속성 컨텍스트 전략에서의 EntityManager' level='info'>
	한 서비스가 여러 레포지토리로 작업할 수 있다.
	각 레포지토리는 EntityManager를 주입받아 사용한다.
	이 경우에도 트랜잭션으로는 하나이기 때문에, 각 EntityManager는 영속성 컨텍스트를 공유한다.

 	![image](https://github.com/user-attachments/assets/d8edc88e-e8c9-4595-918a-2a68cb062f5a)
	출처: 자바 ORM 표준 JPA 프로그래밍
 
 	반대로 여러 트랜잭션에서 같은 레포지토리를 사용할 때에는 같은 EntityManager를 사용해도 다른 영속성 컨텍스트를 사용한다.

  	![image](https://github.com/user-attachments/assets/8cf95df3-2572-4aa8-9d2e-218bba5317ff)
	출처: 자바 ORM 표준 JPA 프로그래밍
</MessageBox>



프레젠테이션에서 필요한 데이터가 지연 로딩을 통해 얻을 수 없는 경우 쓸 수 있는 전략은 두 가지이다.
- DTO 전략
- OSIV

### DTO 전략.

- 서비스에서 엔티티를 DTO로 변경하여 프레젠테이션에 전달한다.
- 성능 최적화 포인트가 서비스 레이어로 집중된다. 
  - 간단하게 지연로딩을 사용하든, 성능을 위해 페치 조인이나 DTO 전략을 사용할 수 있다.
- 지루하고 귀찮은 DTO 클래스를 만들어야 한다.

### OSIV

- 프레젠테이션에서 영속화된 엔티티를 사용한다.

OSIV는 요청당 트랜잭션 방식의 OSIV와 스프링의 OSIV로 나뉜다.


#### 요청당 트랜잭션 방식의 OSIV (초기 방법)
- 요청 하나에 트랜잭션 하나, 트랜잭션 하나에 영속성 컨텍스트 하나가 매핑된다.
	- 요청이 발생하면 서블릿 필터나 스프링 인터셉터에서 트랜잭션과 영속성 컨텍스트를 초기화한다. 
	- 요청이 끝나기 직전에 호출되는 서블릿 필터 혹은 스프링 인터셉터의 메서드에서 영속성 컨텍스트를 플러시하고 트랜잭션을 종료한다.
- 프레젠테이션에서 엔티티를 수정하면 데이터베이스에 반영된다.

#### 스프링 OSIV

![image](https://github.com/user-attachments/assets/d9c34cf4-9d00-432e-8b94-ae6ba2ba57c7)


- 트랜잭션은 서비스에서, 영속성 컨텍스트는 프레젠테이션에서 시작하고 끝낸다.
- 하나의 영속성 컨텍스트를 여러 트랜잭션에서 공유한다.
- 프레젠테이션에서는 영속성 엔티티를 읽기만 한다. 수정해도 데이터베이스에 반영이 안 된다.(서비스 종료 이후에만 해당)
  - 트랜잭션 범위가 아니므로 수정해도 데이터베이스에 반영이 안 된다.
  - `EntityManager`로 강제로 flush해도 트랜잭션 범위가 아니라서 예외가 발생한다.
- 서비스에서는 영속성 엔티티를 읽고 수정한다.

<MessageBox title='롤백과 OSIV' level='info'>
	트랜잭션 도중 오류가 나면 롤백을 한다.
	그런데 롤백은 데이터베이스만 롤백하는 것이지 영속성컨텍스트가 롤백되지 않는다.
	
	OSIV처럼 영속성 컨텍스트의 범위가 트랜잭션 범위보다 넓은 경우, 트랜잭션의 롤백으로 비정상 데이터가 영속성 컨텍스트에 남아있을 수 있다.

	스프링은 영속성 컨텍스트의 범위가 트랜잭션 범위보다 넓으면 트랜잭션 롤백시 영속성 컨텍스트를 초기화한다.
</MessageBox>


## 프록시

지연 로딩으로 걸린 연관 관계 엔티티는 실제 엔티티 클래스가 아니라 프록시 클래스이다.
프록시 클래스의 메서드가 호출될 때 그제서야 영속성 컨텍스트의 도움을 받아 엔티티를 초기화하고 실제 엔티티의 메서드를 호출한다.

프록시 클래스는 지연 로딩을 제공하지만, 프록시 클래스를 사용하기 때문에 발생하는 몇 가지 문제들이 있다.

### 동등성 비교
- 객체는 equals() 메서드롤 통해 동등성을 비교한다.
- 일반적인 라이브러리는 프록시를 고려하지 않기 때문에 프록시 클래스와 일반 엔티티 간 비교를 할 때 문제가 발생한다.

```java
public boolean equals(Object obj) {
	if (this == obj) return true;
	if (obj == null) return false;
	//문제 발생1
	if (this.getClass() != obj.getClass()) return false;

	Member member = (Member) obj;
	//문제 발생 2
	if (name != null ? !name.equals(member.name) : member.name != null) {
		return false;
	}
	return true;
}
```

`if (this.getClass() != obj.getClass()) return false;`는 클래스를 비교하는데, 프록시 클래스와 일반 엔티티는 클래스가 다르다.
`if (name != null ? !name.equals(member.name) : member.name != null)`는 멤버변수 간 비교를 수행하는데, 프록시는 초기화되어 있지 않기 때문에 null이다.

equals를 직접 구현해야 한다.

```java
public boolean equals(Object obj) {
	if (this == obj) return true;
	if (obj == null) return false;
	//문제 발생1
	if (!(obj instanceof Member)) return false;

	Member member = (Member) obj;
	//문제 발생 2
	if (name != null ? !name.equals(member.getName()) : member.getName() != null) {
		return false;
	}
	return true;
}
```

### 상속관계

프록시는 엔티티를 상속해서 만들어진다.
엔티티가 다형성을 가진다면 어떨까?

```java
Book book = new Book();
book.setName("jpa");

em.persist(book);
em.flush();
em.clear();

Item foundItem = em.getReference(Item.class, 1L);
assertTrue(foundItem instanceof Book); //테스트 실패
```

`em.getReference()`가 반환하는 프록시는 Item을 상속받는다. 
`Item.class`라고 지정했기 때문이다.
그리고 프록시는 Book 객체를 갖고 있다.

![image](https://github.com/user-attachments/assets/d2f8f754-3045-4fa8-8aee-3c44511ce766)
출처: 자바 ORM 표준 JPA 프로그래밍

Book을 직접 쓰고 싶다면 `em.getReference()`시 `Book.class`로 지정해야 한다.
다형성을 살리고 싶다면 Item을 상속받는 프록시 또한 추상화 범위에 포함해야 한다.
다시 말해, Item 레이어에서 추상화 메서드를 추가하거나, Item 레이어 위의 또 다른 추상화 레이어를 붙이는 것이다.(Item에 abstract 메서드를 추가하거나, Item이 인터페이스를 상속받으면 된다.)

![image](https://github.com/user-attachments/assets/ab834d97-02a0-48b2-89f1-25c0896b1045)
출처: 자바 ORM 표준 JPA 프로그래밍
![image](https://github.com/user-attachments/assets/2ea4534b-38c2-43bd-9569-eb004476fa81)
출처: 자바 ORM 표준 JPA 프로그래밍

## 두 번의 갱신 분실 문제 (second lost updates problem)

사용자 A가 게시물 1을 수정하는 중이다. (트랜잭션 A 생성) 
사용자 B도 게시물 1을 수정하는 중이다. (트랜잭션 B 생성)

사용자 B가 수정을 마치고 완료 버튼을 눌렀다. (트랜잭션 B 커밋)
이후에 사용자 A도 수정을 마치고 완료 버튼을 눌렀다. (트랜잭션 A 커밋)

시간이 좀 지난 후 사용자 B가 새로고침해서 게시물1을 확인해보니, 자신이 수정한 내용이 반영되어 있지 않았다.
마지막으로 게시물1을 수정한 사용자A가 수정한 내용이 반영되어 있었다.
B의 수정 이력이 날라간 것이다.

이후의 수정이 이전의 수정을 덮어썼다.

이 문제는 사실 비즈니스 도메인의 정책 문제로서, 선택지는 3가지이다.
- 마지막 커밋만 인정하기
- 최초 커밋만 인정하기
- 충돌되는 내용을 병합하기

세 가지 선택지를 기술적으로 구현하는 방법은 락을 사용하는 것이다.

락은 두 가지 종류가 있다.

- 낙관적 락: 커밋해보고 안 되면 예외를 발생한다.
- 비관적 락: 수정 전에 락을 걸고 시작한다.

### 낙관적 락

낙관적 락은 최초 커밋만 인정한다.
낙관적 락은 데이터베이스 락을 사용하지 않는다.
JPA에서 제공하는 유사 락 기법이다.

낙관적 락에는 세 가지 종류가 있다.

- `@Version`: 버전 컬럼을 추가하고, 엔티티를 수정했다면 트랜잭션 커밋 시점에 버전을 업데이트해본다.
- `LockModeType.OPTIMISTIC`: 버전 컬럼을 추가하고, 엔티티를 수정하지 않아도 트랜잭션 커밋 시점에 버전을 조회해본다.
- `LockModeType.OPTIMISTIC_FORCE_INCREMENT`: 버전 컬럼을 추가하고, 엔티티를 수정하지 않아도 트랜잭션 커밋 시점에 버전을 업데이트해본다.

#### 버전 (`@Version`)

버전 컬럼으로 다른 트랜잭션에서 수정했는지 여부를 판단한다.

엔티티를 변경했다면 트랜잭션 커밋할 때 레코드의 버전을 업데이트한다.
업데이트 쿼리는 `where` 절 조건에 엔티티의 버전 필드가 추가로 들어간다.
다른 트랜잭션에서 레코드를 먼저 수정했다면 엔티티의 버전 필드값보다 높은 값이 들어있으므로 조건에 맞는 레코드를 찾지 못해 업데이트 쿼리가 실패한다.

```java
@Entity
public class Board {
  @Id
  private Long id;

  @Version
  private Integer version;
}
```
```bash
update BOARD
SET
  TITLE=?
  VERSION=?
WHERE
  ID=?
  VERSION=?
```
![image](https://github.com/user-attachments/assets/67113a60-b045-4988-96c1-ce3ad4c6830e)
출처: 자바 ORM 표준 JPA 프로그래밍

#### `LockType.OPTIMISTIC`

엔티티에 `@Version` 필드가 있어야 한다.

엔티티 수정 여부와 상관없이 트랜잭션 커밋 시점에 `SELECT` 쿼리를 사용해서 테이블 레코드의 버전 컬럼값을 확인한다.
엔티티의 버전값과 일치하지 않으면 예외가 발생한다.

```java
Board board = em.find(Board.class, id, LockModeType.OPTIMISTIC);
```

#### `LockModeType.OPTIMISTIC_FORCE_INCREMENT`

엔티티에 `@Version` 필드가 있어야 한다.

엔티티를 수정하지 않았어도 트랜잭션 커밋 시점에 `UPDATE` 쿼리를 사용해서 테이블 레코드의 버전 컬럼값을 갱신 시도한다.
레코드가 없으면(이미 레코드를 수정했다면) 예외가 발생한다.

### 비관적 락

데이터베이스가 제공하는 락에 의존한다.

주로 `select for update`를 사용한다.

세 가지 종류가 있다.

- `LockModeType.PESSIMISTIC_WRITE`: 쓰기 락을 건다. (`select for update`)
- `LockModeType.PESSIMISTIC_READ`: 읽기 락을 건다.
- `LockModeType.PESSIMISTIC_FORCE_UPDATE`: 버전 정보를 증가시킨다.

비관적 락은 타임아웃을 줄 수 있다.

#### 엔티티 연관 관계에서의 비관적 락

엔티티가 다른 엔티티 필드를 갖고 있을 때(연관 관계) 엔티티에 락을 거면 다른 엔티티 필드를 가져올 때에도 락을 걸까?
락은 엔티티 간에 전파되지 않는다.

단순히 지연 로딩을 이용해서 필드를 가져오면 락을 걸지 않는다.

```java
Member member = em.find(Member.class, 2L, LockModeType.PESSIMISTIC_WRITE);

Team team = member.getTeam();
team.incrementAge();
```

```bash
Hibernate: 
    select
        m1_0.id,
        m1_0.city,
        m1_0.street,
        m1_0.zipcode,
        m1_0.age,
        m1_0.name,
        m1_0.team_id 
    from
        Member m1_0 
    where
        m1_0.id=? for update
Hibernate: 
    select
        t1_0.id,
        t1_0.age,
        t1_0.name 
    from
        Team t1_0 
    where
        t1_0.id=?
```

멤버를 통해서만 팀을 접근할 수 있다면 이 방법이 간단하다.
그러나 멤버를 직접 조회하고 수정하는 케이스가 있다면 동시성 이슈가 발생할 수 있다.

이를 해결하려면 한 번의 쿼리로 가져와야 한다.
조인을 사용한다.
```java
String jpql = "select t from Member m join m.team t where t.id = :teamId";
List<Team> teams = em.createQuery(jpql, Team.class)
    .setParameter("teamId", 1L)
    .setLockMode(LockModeType.PESSIMISTIC_WRITE)
    .getResultList();

teams.get(0).incrementAge();
```

```bash
Hibernate: 
    /* select
        t 
    from
        Member m 
    join
        m.team t 
    where
        t.id = :teamId */ select
            t1_0.id,
            t1_0.age,
            t1_0.name 
        from
            Member m1_0 
        join
            Team t1_0 
                on t1_0.id=m1_0.team_id 
        where
            t1_0.id=? for update
```

위의 케이스는 일대다이지만, 다대일이든 일대다든 마찬가지이다.

``java
Team team = em.find(Team.class, 1L, LockModeType.PESSIMISTIC_WRITE);
team.getMembers().get(1).incrementAge(); // 지연로딩 (락x)
```
```bash
Hibernate: 
    select
        t1_0.id,
        t1_0.name 
    from
        Team t1_0 
    where
        t1_0.id=? for update
Hibernate: 
    select
        m1_0.team_id,
        m1_0.id,
        m1_0.city,
        m1_0.street,
        m1_0.zipcode,
        m1_0.age,
        m1_0.name 
    from
        Member m1_0 
    where
        m1_0.team_id=?
```

참고로, 쿼리에서 조인을 쓰지 않고 컬렉션을 조회하면 문제가 더 심각해진다.

```java
            String jpql = "select distinct t.members from Team t where t.id = :teamId";
            List<Member> members = em.createQuery(jpql)
                    .setParameter("teamId", 1L)
                    .setLockMode(LockModeType.PESSIMISTIC_WRITE)
                    .getResultList();
	    members.get(1).incrementAge();
```
```bash
Hibernate: 
    /* select
        distinct t.members 
    from
        Team t 
    where
        t.id = :teamId */ select
            distinct m1_0.id,
            m1_0.city,
            m1_0.street,
            m1_0.zipcode,
            m1_0.age,
            m1_0.name,
            m1_0.team_id 
        from
            Team t1_0 
        join
            Member m1_0 
                on t1_0.id=m1_0.team_id 
        where
            t1_0.id=?
Hibernate: 
    /* PESSIMISTIC_WRITE lock hellojpa.Member */ select
        id 
    from
        Member 
    where
        id=? for update
Hibernate: 
    /* PESSIMISTIC_WRITE lock hellojpa.Member */ select
        id 
    from
        Member 
    where
        id=? for update
Hibernate: 
    /* PESSIMISTIC_WRITE lock hellojpa.Member */ select
        id 
    from
        Member 
    where
        id=? for update
```

멤버별로 쿼리가 나가기 때문에 지연 로딩보다 쿼리수가 많아진다.

## 2차 캐시

![image](https://github.com/user-attachments/assets/212f408b-ec0f-4c52-81ff-274d39ebc681)

어플리케이션 범위의 캐시.

1차캐시는 영속성 컨텍스트 범위이다. 
2차 캐시는 여러 영속성 컨텍스트가 공유하는 캐시다.
동시성 보장을 위해 데이터베이스에서 얻어온 엔티티의 복사본을 만들어서 1차 캐시에게 전한다.

JPA 구현체가 사용하는 캐시 라이브러리를 직접 사용해야 한다.
하이버네이트는 hibernate-ehcache를 사용한다.

캐시할 대상은 세 가지이다.

- 엔티티
- 쿼리
- 컬렉션(연관 관계)

### 엔티티 캐싱

엔티티에 `@Cache` 어노테이션(하이버네이트가 제공하는 어노테이션)을 붙인다. 
`@Cacheable`(JPA가 제공하는 어노테이션)은 일종의 컨벤션이다.

2차 캐시에 엔티티가 저장된다. (id를 키값으로 함)

```java
@Entity
@Cacheable
@org.hibernate.annotations.Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class Foo {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "ID")
    private long id;

    @Column(name = "NAME")
    private String name;
    
    // getters and setters
}
```

### 쿼리 캐싱

쿼리 힌트를 통해 캐싱을 설정한다.

쿼리는 엔티티 id와 파라미터를 저장한다.
쿼리 캐시 영역에는 두 가지가 있다.
- StandardQueryCache: 쿼리가 실행된 시각, 쿼리 등을 저장한다.
- UpdateTimestampsCache: 데이터베이스에서 테이블의 최근 변경 시각을 가져와 저장한다.

<MessageBox title='쿼리 캐싱과 엔티티 캐싱' level='warning'>
	캐싱된 쿼리가 실행되면 엔티티 캐시에서 하나씩 가져와 반환한다.
	엔티티가 캐싱 설정되어 있지 않다면 데이터베이스에서 하나씩 가져온다. 
	이 때 여러 개의 SQL 실행이 되어서 성능이 오히려 저하될 수 있다.
</MessageBox>


```bash
hibernate.cache.use_query_cache=true
```
```java
entityManager.createQuery("select f from Foo f")
  .setHint("org.hibernate.cacheable", true)
  .getResultList();
```

### 컬렉션 캐싱

엔티티 컬렉션은 2차 캐시에 각 요소의 id만 저장된다.
실제 엔티티는 엔티티 캐시 영역에 저장된다. (그래서 해당 엔티티도 `@Cache` 설정이 되어 있어야 한다.)

```java
@Entity
@Cacheable
@org.hibernate.annotations.Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class Foo {

    ...

    @Cacheable
    @org.hibernate.annotations.Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @OneToMany
    private Collection<Bar> bars;

    // getters and setters
```

## 읽기 전용 쿼리

읽기 전용 쿼리를 사용하면 영속성 컨텍스트에서 스냅샷 관리를 하지 않기 때문에 성능을 좀 더 최적화할 수 있다.

- 값 타입 조회: `select o.id, o.name, o.price from Order o`
- 하이버네이트 전용 힌트 설정: `query.setHint("org.hibernate.readOnly", true)`. 엔티티에 대한 스냅샷 관리를 하지 않게 한다.
- 읽기 전용 트랜잭션 사용: `@Transactional(readonly = true)`. 플러시를 일으키지 않는다.

값 타입 조회는 엔티티의 필드가 많을 때 작성할 게 많아진다.
하이버네이트 전용 힌트 설정과 읽기 전용 트랜잭션 사용은 상대적으로 간편하게 설정할 수 있으므로, 읽기만 필요한 요청은 이 두 가지를 모두 사용해서 최적화한다.

```java
@Transactional(readonly= true)
public List<Order> orders() {
	return em.createQuery("select o from Order o", Order.class)
		.setHint("org.hibernate.readOnly", true)
		.getResultList();
}
```
