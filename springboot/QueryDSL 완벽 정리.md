## 환경 설정

빌드 테스트를 위해 엔티티 생성.

```java
@Entity
@Getter @Setter
public class Hello {
    @Id @GeneratedValue
    private Long id;
}
```

```gradle
plugins {
	id 'java'
	id 'org.springframework.boot' version '3.3.2'
	id 'io.spring.dependency-management' version '1.1.6'
}

group = 'study'
version = '0.0.1-SNAPSHOT'

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(17)
	}
}

configurations {
	compileOnly {
		extendsFrom annotationProcessor
	}
}

repositories {
	mavenCentral()
}

dependencies {
	implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
	implementation 'org.springframework.boot:spring-boot-starter-web'
	implementation 'com.github.gavlyukovskiy:p6spy-spring-boot-starter:1.9.0'
	compileOnly 'org.projectlombok:lombok'
	runtimeOnly 'com.h2database:h2'
	annotationProcessor 'org.projectlombok:lombok'
	testImplementation 'org.springframework.boot:spring-boot-starter-test'
	testRuntimeOnly 'org.junit.platform:junit-platform-launcher'

	//test 롬복 사용
	testCompileOnly 'org.projectlombok:lombok'
	testAnnotationProcessor 'org.projectlombok:lombok'

	//Querydsl 추가
	implementation 'com.querydsl:querydsl-jpa:5.0.0:jakarta'
	annotationProcessor "com.querydsl:querydsl-apt:${dependencyManagement.importedProperties['querydsl.version']}:jakarta"
	annotationProcessor "jakarta.annotation:jakarta.annotation-api"
	annotationProcessor "jakarta.persistence:jakarta.persistence-api"

}

tasks.named('test') {
	useJUnitPlatform()
}

/**
 * QueryDSL Build Options
 */
def querydslDir = "src/main/generated"

sourceSets {
	main.java.srcDirs += [ querydslDir ]
}

tasks.withType(JavaCompile) {
	options.getGeneratedSourceOutputDirectory().set(file(querydslDir))
}

clean.doLast {
	file(querydslDir).deleteDir()
}
```

- `gradle > build > clean`: QueryDSL 빌드 파일 삭제
- `gradle > build > build`: QueryDSL 빌드


엔티티 이름 앞에 Q가 붙은 클래스가 생성되면 성공.
![image](https://github.com/user-attachments/assets/9048f848-6e13-42a7-82a8-b4e540d92350)

## QueryDSL

QueryDSL은 JPQL 빌더이다.
동적 쿼리를 만들어낼 때 유용하다.

`JPAQueryFactory`는 쿼리 빌더이다. `EntityManager`를 주입 받아서 생성된다.
EntityManager는 여러 쓰레드가 접근해도 트랜잭션마다 별도의 영속성컨텍스트를 제공하기 때문에 thread-safe 하다.

```java
@Test
public void startQuerydsl() {
    JPAQueryFactory queryFactory = new JPAQueryFactory(em);
    QMember m = new QMember("m");

    Member foundMember = this.queryFactory.select(m)
            .from(m)
            .where(m.username.eq("member1"))
            .fetchOne();

    assertThat(foundMember.getUsername()).isEqualTo("member1");
}
```
```bash
    select
        m1_0.member_id,
        m1_0.age,
        m1_0.team_id,
        m1_0.username 
    from
        member m1_0 
    where
        m1_0.username=?
```

## 기본 문법

- Q엔티티를 만들 때 별칭을 적을 수 있다.
```java
public void startQuerydsl2() {
	//m은 별칭.
	QMember m = new QMember("m");
	Member foundMember = queryFactory
		.select(m)
		.from(m)
		.where(m.username.eq("member1"))
		.fetchOne();
	assertThat(foundMember.getUsername()).isEqualTo("member1");
}
```
```bash
2024-07-24T13:00:23.070+09:00 DEBUG 10204 --- [querydsl] [    Test worker] org.hibernate.SQL                        : 
    /* select
        m 
    from
        Member m 
    where
        m.username = ?1 */ select
            m1_0.member_id,
            m1_0.age,
            m1_0.team_id,
            m1_0.username 
        from
            member m1_0 
        where
            m1_0.username=?
```

- `and`, `or` 등의 조건문을 적을 수 있다.

```java
    @Test
    public void search() {
        Member foundMember = queryFactory
                .selectFrom(member)
                .where(
                        member.username.eq("member1")
                                .and(member.age.eq(10))
                ).fetchOne();

        assertThat(foundMember.getUsername()).isEqualTo("member1");
    }
```
```bash
2024-07-24T13:00:22.270+09:00 DEBUG 10204 --- [querydsl] [    Test worker] org.hibernate.SQL                        : 
    /* select
        member1 
    from
        Member member1 
    where
        member1.username = ?1 
        and member1.age = ?2 */ select
            m1_0.member_id,
            m1_0.age,
            m1_0.team_id,
            m1_0.username 
        from
            member m1_0 
        where
            m1_0.username=? 
            and m1_0.age=?
```

- 조건문은 쉼표로 나눠서 적을 수 있다. `and`로 동작한다.

```java
    @Test
    public void searchAndParam() {
        List<Member> member1 = queryFactory
                .selectFrom(member)
                .where(member.username.eq("member1"), member.age.eq(10))
                .fetch();
        assertThat(member1.size()).isEqualTo(1);
    }
```
```bash
2024-07-24T13:00:23.020+09:00 DEBUG 10204 --- [querydsl] [    Test worker] org.hibernate.SQL                        : 
    /* select
        member1 
    from
        Member member1 
    where
        member1.username = ?1 
        and member1.age = ?2 */ select
            m1_0.member_id,
            m1_0.age,
            m1_0.team_id,
            m1_0.username 
        from
            member m1_0 
        where
            m1_0.username=? 
            and m1_0.age=?
```

- `orderby`를 사용할 수 있고, null의 순서를 지정할 수 있다.

```java
@Test
    public void sort() {
        em.persist(new Member(null, 100));
        em.persist(new Member("member5", 100));
        em.persist(new Member("member6", 100));

        List<Member> result = queryFactory
                .selectFrom(member)
                .where(member.age.eq(100))
                .orderBy(member.age.desc(), member.username.asc().nullsLast())
                .fetch();

        assertThat(result.get(0).getUsername()).isEqualTo("member5");
        assertThat(result.get(1).getUsername()).isEqualTo("member6");
        assertThat(result.get(2).getUsername()).isNull();
    }
```
```bash
2024-07-24T13:00:22.811+09:00 DEBUG 10204 --- [querydsl] [    Test worker] org.hibernate.SQL                        : 
    /* select
        member1 
    from
        Member member1 
    where
        member1.age = ?1 
    order by
        member1.age desc,
        member1.username asc nulls last */ select
            m1_0.member_id,
            m1_0.age,
            m1_0.team_id,
            m1_0.username 
        from
            member m1_0 
        where
            m1_0.age=? 
        order by
            m1_0.age desc,
            m1_0.username asc nulls last
```

- 페이징 처리를 할 수 있다. `fetchResult()`는 deprecated되었다. 카운트 쿼리를 따로 실행해야 한다.
```java
 @Test
    public void paging1() {
        List<Member> result = queryFactory
                .selectFrom(member)
                .orderBy(member.username.desc())
                .offset(1)
                .limit(2)
                .fetch();

        assertThat(result.size()).isEqualTo(2);
        assertThat(result.get(0).getUsername()).isEqualTo("member3");
    }
```
```bash
2024-07-24T13:00:22.577+09:00 DEBUG 10204 --- [querydsl] [    Test worker] org.hibernate.SQL                        : 
    /* select
        member1 
    from
        Member member1 
    order by
        member1.username desc */ select
            m1_0.member_id,
            m1_0.age,
            m1_0.team_id,
            m1_0.username 
        from
            member m1_0 
        order by
            m1_0.username desc 
        offset
            ? rows 
        fetch
            first ? rows only
```

- 집계 함수를 사용할 수 있다.

```java
@Test
    public void aggregation() {
        List<Tuple> result = queryFactory
                .select(member.count(),
                        member.age.sum(),
                        member.age.avg(),
                        member.age.max(),
                        member.age.min())
                .from(member)
                .fetch();

        Tuple tuple = result.get(0);
        assertThat(tuple.get(member.count())).isEqualTo(4);
        assertThat(tuple.get(member.age.sum())).isEqualTo(100);
        assertThat(tuple.get(member.age.avg())).isEqualTo(25);
        assertThat(tuple.get(member.age.max())).isEqualTo(40);
        assertThat(tuple.get(member.age.min())).isEqualTo(10);
    }
```
```bash
2024-07-24T13:00:22.995+09:00 DEBUG 10204 --- [querydsl] [    Test worker] org.hibernate.SQL                        : 
    /* select
        count(member1),
        sum(member1.age),
        avg(member1.age),
        max(member1.age),
        min(member1.age) 
    from
        Member member1 */ select
            count(m1_0.member_id),
            sum(m1_0.age),
            avg(cast(m1_0.age as float(53))),
            max(m1_0.age),
            min(m1_0.age) 
        from
            member m1_0
```

- `group by`를 쓸 수 있다. `having`도 물론 가능하다.

```java
@Test
    public void group() throws Exception {
        List<Tuple> result = queryFactory
                .select(team.name, member.age.avg())
                .from(member)
                .join(member.team, team)
                .groupBy(team.name)
                .having(team.name.like("%team%"))
                .fetch();

        Tuple teamA = result.get(0);
        Tuple teamB = result.get(1);

        assertThat(teamA.get(team.name)).isEqualTo("teamA");
        assertThat(teamA.get(member.age.avg())).isEqualTo(15);

        assertThat(teamB.get(team.name)).isEqualTo("teamB");
        assertThat(teamB.get(member.age.avg())).isEqualTo(35);
    }
```
```bash
2024-07-24T13:00:22.851+09:00 DEBUG 10204 --- [querydsl] [    Test worker] org.hibernate.SQL                        : 
    /* select
        team.name,
        avg(member1.age) 
    from
        Member member1   
    inner join
        member1.team as team 
    group by
        team.name 
    having
        team.name like ?1 escape '!' */ select
            t1_0.name,
            avg(cast(m1_0.age as float(53))) 
        from
            member m1_0 
        join
            team t1_0 
                on t1_0.team_id=m1_0.team_id 
        group by
            t1_0.name 
        having
            t1_0.name like ? escape '!'
```

- 조인을 쓸 수 있다. inner join, left outer join, right outer join, theta join, fetch join이 가능하다.

일반 조인
```java
@Test
    public void join() throws Exception {
        List<Member> result = queryFactory
                .select(member)
                .from(member)
                .join(member.team, team)
                .where(team.name.eq("teamA"))
                .fetch();

        assertThat(result)
                .extracting("username")
                .containsExactly("member1", "member2");
    }
```
```bash
2024-07-24T13:00:22.777+09:00 DEBUG 10204 --- [querydsl] [    Test worker] org.hibernate.SQL                        : 
    /* select
        member1 
    from
        Member member1   
    inner join
        member1.team as team 
    where
        team.name = ?1 */ select
            m1_0.member_id,
            m1_0.age,
            m1_0.team_id,
            m1_0.username 
        from
            member m1_0 
        join
            team t1_0 
                on t1_0.team_id=m1_0.team_id 
        where
            t1_0.name=?
```

세타 조인
```java
    //세타 조인. 연관 관계 없는 엔티티 간의 조인.
    @Test
    public void theta_join() throws Exception {
        //given
        em.persist(new Member("teamA"));
        em.persist(new Member("teamB"));
        em.persist(new Member("teamC"));
        //when
        List<Member> result = queryFactory
                .select(member)
                .from(member, team)
                .where(member.username.eq(team.name))
                .fetch();
        //then
        assertThat(result)
                .extracting("username")
                .containsExactly("teamA", "teamB");
    }
```
```bash
2024-07-24T13:00:22.198+09:00 DEBUG 10204 --- [querydsl] [    Test worker] org.hibernate.SQL                        : 
    /* select
        member1 
    from
        Member member1,
        Team team 
    where
        member1.username = team.name */ select
            m1_0.member_id,
            m1_0.age,
            m1_0.team_id,
            m1_0.username 
        from
            member m1_0,
            team t1_0 
        where
            m1_0.username=t1_0.name
```

조인할 때 조건을 걸어 필요한 레코드만 조인할 때 `on`을 사용한다.
```java
@Test
    public void join_on_filtering() {
        List<Tuple> result = queryFactory
                .select(member, team)
                .from(member)
                .leftJoin(member.team, team)
                .on(team.name.eq("teamA"))
//                .where(team.name.eq("teamA"))
                .fetch();

        for (Tuple tuple : result) {
            System.out.println("tuple = " + tuple);
        }
    }
```
```bash
2024-07-24T13:00:23.044+09:00 DEBUG 10204 --- [querydsl] [    Test worker] org.hibernate.SQL                        : 
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

연관 관계 없는 엔티티 간 조인을 할 때 `on`을 사용한다.
```java
@Test
    public void join_on_no_relation() throws Exception {
        //given
        em.persist(new Member("teamA"));
        em.persist(new Member("teamB"));
        em.persist(new Member("teamC"));

        List<Tuple> result = queryFactory
                .select(member, team)
                .from(member)
                .leftJoin(team).on(member.username.eq(team.name))
                .fetch();

        for (Tuple tuple : result) {
            System.out.println("tuple = " + tuple);
        }
    }
```
```bash
2024-07-24T13:00:22.541+09:00 DEBUG 10204 --- [querydsl] [    Test worker] org.hibernate.SQL                        : 
    /* select
        member1,
        team 
    from
        Member member1   
    left join
        Team team with member1.username = team.name */ select
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
                on m1_0.username=t1_0.name
```

페치 조인
```java
    @Test
    public void fetchJoinUse() throws Exception {
        //given
        em.flush();
        em.clear();
        //when
        Member foundMember = queryFactory
                .selectFrom(member)
                .join(member.team, team).fetchJoin()
                .where(member.username.eq("member1"))
                .fetchOne();

        //then
        boolean loaded = emf.getPersistenceUnitUtil().isLoaded(foundMember.getTeam());
        assertThat(loaded).as("페치 조인 적용").isTrue();
    }
```
```bash
2024-07-24T13:00:22.958+09:00 DEBUG 10204 --- [querydsl] [    Test worker] org.hibernate.SQL                        : 
    /* select
        member1 
    from
        Member member1   
    inner join
        
    fetch
        member1.team as team 
    where
        member1.username = ?1 */ select
            m1_0.member_id,
            m1_0.age,
            t1_0.team_id,
            t1_0.name,
            m1_0.username 
        from
            member m1_0 
        join
            team t1_0 
                on t1_0.team_id=m1_0.team_id 
        where
            m1_0.username=?
```

- 서브 쿼리는 select, where 절에만 가능하다. from 절은 hibernate6.1부터는 가능하나 queryDSL에서 지원하는지는 미지수이다.

where 절에서 서브쿼리
```java
//    나이가 가장 많은 회원 조회
    @Test
    public void subQuery() throws Exception {
        //given
        QMember memberSub = new QMember("memberSub");
        //when
        List<Member> result = queryFactory
                .select(member)
                .from(member)
                .where(member.age.eq(
                        JPAExpressions
                                .select(memberSub.age.max())
                                .from(memberSub)
                ))
                .fetch();
        //then
        assertThat(result).extracting("age")
                .containsExactly(40);
    }
```
```bash
2024-07-24T13:00:22.144+09:00 DEBUG 10204 --- [querydsl] [    Test worker] org.hibernate.SQL                        : 
    /* select
        member1 
    from
        Member member1 
    where
        member1.age = (
            select
                max(memberSub.age) 
            from
                Member memberSub
        ) */ select
            m1_0.member_id,
            m1_0.age,
            m1_0.team_id,
            m1_0.username 
        from
            member m1_0 
        where
            m1_0.age=(
                select
                    max(m2_0.age) 
                from
                    member m2_0
            )
```

where 절과 in 키워드를 사용한 서브쿼리
```java
    @Test
    public void subQueryIn() throws Exception {
        //given
        QMember m = new QMember("m");
        //when
        List<Member> result = queryFactory
                .selectFrom(member)
                .where(member.age.in(
                        JPAExpressions
                                .select(m.age)
                                .from(m)
                                .where(m.age.gt(10))
                ))
                .fetch();

        //then
        assertThat(result).extracting("age")
                .containsExactly(20, 30, 40);
    }
```
```bash
2024-07-24T13:00:22.499+09:00 DEBUG 10204 --- [querydsl] [    Test worker] org.hibernate.SQL                        : 
    /* select
        member1 
    from
        Member member1 
    where
        member1.age in (select
            m.age 
        from
            Member m 
        where
            m.age > ?1) */ select
            m1_0.member_id,
            m1_0.age,
            m1_0.team_id,
            m1_0.username 
        from
            member m1_0 
        where
            m1_0.age in (select
                m2_0.age 
            from
                member m2_0 
            where
                m2_0.age>?)
```

select 절에서 서브쿼리
```java
//    select 절에서 subquery
    @Test
    public void subQuerySelect() throws Exception {
        //given
        QMember memberSub = new QMember("memberSub");
        //when
        List<Tuple> result = queryFactory
                .select(member.username,
                        JPAExpressions
                                .select(memberSub.age.avg())
                                .from(memberSub)
                )
                .from(member)
                .fetch();

        //then
        for (Tuple tuple : result) {
            System.out.println("tuple.get(member.username) = " + tuple.get(member.username));
            System.out.println("tuple.get(JPAExpressions.select(memberSub.age.avg()).from(memberSub)) = " + tuple.get(JPAExpressions.select(memberSub.age.avg()).from(memberSub)));
        }
    }
```
```bash
2024-07-24T13:00:22.092+09:00 DEBUG 10204 --- [querydsl] [    Test worker] org.hibernate.SQL                        : 
    /* select
        member1.username,
        (select
            avg(memberSub.age) 
        from
            Member memberSub) 
    from
        Member member1 */ select
            m1_0.username,
            (select
                avg(cast(m2_0.age as float(53))) 
            from
                member m2_0) 
        from
            member m1_0
```

- case 문을 사용할 수 있다.

```java

    @Test
    public void useCase() throws Exception {
        //given

        //when
        List<String> result = queryFactory
                .select(member.age
                        .when(10).then("열살")
                        .when(20).then("스무살")
                        .otherwise("기타")
                )
                .from(member)
                .fetch();

        //then
        for (String s : result) {
            System.out.println("s = " + s);
        }
    }
```
```bash
2024-07-24T13:00:22.734+09:00 DEBUG 10204 --- [querydsl] [    Test worker] org.hibernate.SQL                        : 
    /* select
        case 
            when member1.age = ?1 
                then ?2 
            when member1.age = ?3 
                then ?4 
            else '기타' 
    end 
from
    Member member1 */ select
        case 
            when m1_0.age=? 
                then cast(? as varchar) 
            when m1_0.age=? 
                then cast(? as varchar) 
            else '기타' 
    end 
from
    member m1_0
```

case에 따라 정렬을 할 수 있다.

```java
//    0~30살이 아닌 회원을 가장 먼저 출력, 그 다음 0~20살 회원, 마지막은 21~30살 회원 출력.
    @Test
    public void caseWithOrderBy() throws Exception {
        //given
        NumberExpression<Integer> rank = new CaseBuilder()
                .when(member.age.between(0, 20)).then(2)
                .when(member.age.between(21, 30)).then(1)
                .otherwise(3);
        //when
        List<Tuple> result = queryFactory
                .select(member.username, member.age, rank)
                .from(member)
                .orderBy(rank.desc())
                .fetch();

        //then
        for (Tuple tuple : result) {
            String username = tuple.get(member.username);
            Integer age = tuple.get(member.age);
            Integer rankValue = tuple.get(rank);

            System.out.println("username = " + username);
            System.out.println("age = " + age);
            System.out.println("rankValue = " + rankValue);
        }
    }
```
```bash
2024-07-24T13:00:22.457+09:00 DEBUG 10204 --- [querydsl] [    Test worker] org.hibernate.SQL                        : 
    /* select
        member1.username,
        member1.age,
        case 
            when (member1.age between ?1 and ?2) 
                then ?3 
            when (member1.age between ?4 and ?5) 
                then ?6 
            else 3 
    end 
from
    Member member1 
order by
    case 
        when (member1.age between ?7 and ?8) 
            then ?9 
        when (member1.age between ?10 and ?11) 
            then ?12 
        else 3 
end desc */ select
    m1_0.username,
    m1_0.age,
    case 
        when (m1_0.age between ? and ?) 
            then cast(? as integer) 
        when (m1_0.age between ? and ?) 
            then cast(? as integer) 
        else 3 
end 
from
    member m1_0 
order by
    case 
        when (m1_0.age between ? and ?) 
            then ? 
        when (m1_0.age between ? and ?) 
            then ? 
        else 3 
end desc
```

- 상수를 쓸 수 있다. 불필요한 경우 최적화하여 쿼리에 안 보일 수도 있다.

```java

    @Test
    public void constant() throws Exception {
        //given

        //when
        Tuple result = queryFactory
                .select(member.username, Expressions.constant("A"))
                .from(member)
                .fetchFirst();

        //then
        System.out.println("result.get(Expressions.constant(\"A\")) = " + result.get(Expressions.constant("A")));


        String foundMemberName = queryFactory
                .select(member.username.concat("_").concat(member.age.stringValue()))
                .from(member)
                .where(member.username.eq("member1"))
                .fetchOne();

        System.out.println("foundMemberName = " + foundMemberName);
    }
```
```bash
2024-07-24T13:00:22.644+09:00 DEBUG 10204 --- [querydsl] [    Test worker] org.hibernate.SQL                        : 
    /* select
        member1.username 
    from
        Member member1 */ select
            m1_0.username 
        from
            member m1_0 
        fetch
            first ? rows only

2024-07-24T13:00:22.684+09:00 DEBUG 10204 --- [querydsl] [    Test worker] org.hibernate.SQL                        : 
    /* select
        concat(concat(member1.username, ?1), str(member1.age)) 
    from
        Member member1 
    where
        member1.username = ?2 */ select
            ((m1_0.username||?)||cast(m1_0.age as varchar)) 
        from
            member m1_0 
        where
            m1_0.username=?
```
