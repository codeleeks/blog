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
