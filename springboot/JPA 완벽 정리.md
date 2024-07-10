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


