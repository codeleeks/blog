---
summary: JDBC부터 JPA까지 데이터 접근 기술을 정리합니다.
date: 2024-06-27
title-image: 'https://raw.githubusercontent.com/codeleeks/blog/codeleeks-images/springboot/Spring%20DB%20%EC%99%84%EB%B2%BD%20%EC%A0%95%EB%A6%AC/title.png'
---

## JDBC

과거에는 DB마다 Connection 맺는 법, SQL 전달하는 법, 결과를 받는 법이 달랐기 때문에, 어플리케이션에서 DB 벤더에 맞는 로직을 작성해야 했다.

JDBC는 이를 java API 차원에서 공통화했다. (물론 완벽히 공통화하지 못했다. paging과 같이 필수적이지만 공통화시키지 못한 부분도 존재한다.)

- `Connection`: DB와의 연결을 담당
- `Statement`: SQL 전달을 담당
- `ResultSet`: SQL 결과 조회를 담당.

### CRUD

- save(create): `insert` 쿼리 사용. `pstmt.executeUpdate()` 사용.
- findById(read): `select` 쿼리 사용. `pstmt.executeQuery()` 사용하여 `ResultSet` 객체 획득. `rs.next()`로 레코드 이동.
- update: `update` 쿼리 사용. `pstmt.executeUpdate()` 사용.
- delete: `delete` 쿼리 사용. `pstmt.executeUpdate()` 사용.

<MessageBox title='SQL 쿼리 인젝션과 PreparedStatement' level='info'>
  SQL 쿼리 인젝션 공격은 쿼리 밸류로 들어가는 자리에 조회 쿼리를 넣어 DB 정보를 탈취해 가는 공격이다.

  `PreparedStatement`를 사용하면 쿼리 밸류로 들어가는 자리에 쿼리가 들어가도 문자열로 인식되기 때문에 공격을 막을 수 있다.
</MessageBox>

```java
package hello.jdbc.repository;

import hello.jdbc.connection.DBConnectionUtil;
import hello.jdbc.domain.Member;
import lombok.extern.slf4j.Slf4j;

import java.sql.*;
import java.util.NoSuchElementException;

// JDBC - DriverManager 사용.
@Slf4j
public class MemberRepositoryV0 {
    public Member save(Member member) throws SQLException {
        String sql = "insert into member(member_id, money) values (?, ?)";
        Connection con = null;
        PreparedStatement pstmt = null;
        try {
            con = getConnection();
            pstmt = con.prepareStatement(sql);
            pstmt.setString(1, member.getMemberId());
            pstmt.setInt(2, member.getMoney());
            pstmt.executeUpdate();
            return member;
        } catch (SQLException e) {
            log.error("db error", e);
            throw e;
        } finally {
            close(con, pstmt, null);
        }
    }

    public Member findById(String memberId) throws SQLException {
        String sql = "select * from member where member_id = ?";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;

        try {
            con = getConnection();
            pstmt = con.prepareStatement(sql);
            pstmt.setString(1, memberId);

            rs = pstmt.executeQuery();

            if (rs.next()) {
                Member member = new Member();
                member.setMemberId(rs.getString("member_id"));
                member.setMoney(rs.getInt("money"));
                return member;
            } else {
                throw new NoSuchElementException("member not found memberId=" + memberId);
            }

        } catch (SQLException e) {
            log.error("db error ", e);
            throw e;
        } finally {
            close(con, pstmt, rs);
        }
    }

    public void update(String memberId, int money) throws SQLException {
        String sql = "update member set money=? where member_id=?";

        Connection con;
        PreparedStatement pstmt;


        try {
            con = getConnection();
            pstmt = con.prepareStatement(sql);
            pstmt.setInt(1, money);
            pstmt.setString(2, memberId);

            int count = pstmt.executeUpdate();
            log.info("resultSize={}", count);

        } catch (SQLException e) {
            log.info("db error ", e);
            throw e;
        }
    }

    public void delete(String memberId) throws SQLException {
        String sql = "delete from member where member_id=?";
        Connection con;
        PreparedStatement pstmt;

        try {
            con = getConnection();
            pstmt = con.prepareStatement(sql);
            pstmt.setString(1, memberId);
            int count = pstmt.executeUpdate();
            log.info("resultSize:{}", count);
        } catch (SQLException e) {
            log.info("db error ", e);
            throw e;
        }
    }

    private void close(Connection con, Statement stmt, ResultSet rs) {
        if (rs != null) {
            try {
                rs.close();
            } catch (SQLException e) {
                log.info("error ", e);
            }
        }

        if (stmt != null) {
            try {
                stmt.close();
            } catch (SQLException e) {
                log.info("error ", e);
            }
        }

        if (con != null ) {
            try {
                con.close();
            } catch (SQLException e) {
                log.info("error ", e);
            }
        }
    }

    private Connection getConnection() {
        return DBConnectionUtil.getConnection();
    }
}

```

### 동작 원리

JDBC는 등록된 드라이버들을 읽고, URL과 추가 정보(아이디, 비밀번호)를 각 드라이버에게 순서대로 전달한다.

각 드라이버는 URL을 보고 자신이 처리할 수 있는 요청인지 확인하고, 처리할 수 있다면 DB에 연결 시도한다. (예를 들어, `jdbc:h2:localhost:/~/test`에서 `h2`를 보고 `h2` 드라이버는 자신이 처리할 수 있는 요청이라고 생각한다.)

`DriverManager.getConnection(URL)`은 등록된 드라이버에게 URL을 처리할 수 있는지 순서대로 물어본다.
DB 연결을 성공한 드라이버의 Connection 객체를 반환한다.


```java
package hello.jdbc.connection;

import lombok.extern.slf4j.Slf4j;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

import static hello.jdbc.connection.ConnectionConst.*;

@Slf4j
public class DBConnectionUtil {

    public static Connection getConnection() {
        try {
            Connection connection = DriverManager.getConnection(URL, USERNAME, PASSWORD);
            log.info("get connection: {},class: {}", connection, connection.getClass());
            return connection;
        } catch (SQLException e) {
            throw new IllegalStateException(e.getMessage());
        }

    }
}

```

### JDBC를 편리하게 사용하기 위한 새로운 기술들
JDBC는 로레벨 기술로서, 이를 좀 더 편리하게 사용하기 위한 기술들이 등장했다.

SQL Mapper와 ORM 기술이다.

||SQL Mapper|ORM|
|---|---|---|
|정의|SQL을 편리하게 만들어 준다.|객체에 대해 CRUD를 하면 내부적으로 쿼리를 생성하여 테이블 정보를 제어(조회/수정)한다.|
|대표 기술|JdbcTemplate, MyBatis|JPA(JPA의 구현체는 하이버네이트)|

## 커넥션풀

connection을 맺는데 수십밀리세컨드가 걸리는 DB도 있다.

DriverManager.getConnection()은 매번 connection을 새로 맺기 때문에 DB 데이터 접근할 때마다 많게는 수십밀리세컨드의 오버헤드가 발생한다.

그래서 connection pool 개념이 등장했다.

어플리케이션 부트 시점에 connection을 맺어 놓고, DB 접근이 필요할 때 커넥션 객체에 접근해서 쓰는 것이다.

connection pool을 구현한 대표적인 오픈소스 프로젝트는 hikariCP와 DBCP이다.

스프링의 기본 커넥션풀은 hikariCP이다.

### DataSource
커넥션 풀과 매번 커넥션 맺는 기술들을 어플리케이션 측면에서 추상화하기 위해 자바에서는 DataSource 인터페이스를 제공한다.

DriverManager 자체는 DataSource를 구현하지 않지만, 스프링에서 DriverManagerDataSource 클래스로 구현했다.

덕분에 어플리케이션은 DataSource 인터페이스만 의존할 수 있게 되었다.

```java
package hello.jdbc.repository;

import hello.jdbc.domain.Member;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.support.JdbcUtils;

import javax.sql.DataSource;
import java.sql.*;
import java.util.NoSuchElementException;

@Slf4j
public class MemberRepositoryV1 {
    private final DataSource dataSource;

    public MemberRepositoryV1(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public Member save(Member member) throws SQLException {
        String sql = "insert into member(member_id, money) values (?, ?)";
        Connection con = null;
        PreparedStatement pstmt = null;
        try {
            con = getConnection();
            pstmt = con.prepareStatement(sql);
            pstmt.setString(1, member.getMemberId());
            pstmt.setInt(2, member.getMoney());
            pstmt.executeUpdate();
            return member;
        } catch (SQLException e) {
            log.error("db error", e);
            throw e;
        } finally {
            close(con, pstmt, null);
        }
    }

    public Member findById(String memberId) throws SQLException {
        String sql = "select * from member where member_id = ?";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;

        try {
            con = getConnection();
            pstmt = con.prepareStatement(sql);
            pstmt.setString(1, memberId);

            rs = pstmt.executeQuery();

            if (rs.next()) {
                Member member = new Member();
                member.setMemberId(rs.getString("member_id"));
                member.setMoney(rs.getInt("money"));
                return member;
            } else {
                throw new NoSuchElementException("member not found memberId=" + memberId);
            }

        } catch (SQLException e) {
            log.error("db error ", e);
            throw e;
        } finally {
            close(con, pstmt, rs);
        }
    }

    public void update(String memberId, int money) throws SQLException {
        String sql = "update member set money=? where member_id=?";

        Connection con;
        PreparedStatement pstmt;


        try {
            con = getConnection();
            pstmt = con.prepareStatement(sql);
            pstmt.setInt(1, money);
            pstmt.setString(2, memberId);

            int count = pstmt.executeUpdate();
            log.info("resultSize={}", count);

        } catch (SQLException e) {
            log.info("db error ", e);
            throw e;
        }
    }

    public void delete(String memberId) throws SQLException {
        String sql = "delete from member where member_id=?";
        Connection con;
        PreparedStatement pstmt;

        try {
            con = getConnection();
            pstmt = con.prepareStatement(sql);
            pstmt.setString(1, memberId);
            int count = pstmt.executeUpdate();
            log.info("resultSize:{}", count);
        } catch (SQLException e) {
            log.info("db error ", e);
            throw e;
        }
    }

    private void close(Connection con, Statement stmt, ResultSet rs) {
        JdbcUtils.closeResultSet(rs);
        JdbcUtils.closeStatement(stmt);
        JdbcUtils.closeConnection(con);
    }

    private Connection getConnection() throws SQLException {
        Connection con = dataSource.getConnection();
        log.info("get connection:{}, class={}", con, con.getClass());
        return con;
    }
}

```

## 트랜잭션
트랜잭션이란 거래를 안전하게 완료하도록 보장하는 것이다.
디비 작업 중에 오류가 발생했을 때 이전 작업을 취소하고, 이전 상태로 돌아간다.(롤백)
디비 작업 내 모든 작업이 완료되면 실제로 작업들을 반영한다.(커밋)

더 엄밀히 말해 트랜잭션은 ACID를 보장해야 한다.
- 원자성(Atomicity): 트랜잭션 내 작업들은 마치 하나의 작업처럼 같이 취소되고 같이 반영된다.
- 일관성(Consistency): 트랜잭션이 데이터베이스의 일관성을 해쳐선 안 된다. 무결성 제약 조건을 따라야 한다.
- 격리성(Isolation): 서로 다른 트랜잭션이 같은 데이터를 동시에 수정할 수 없게 한다.
- 지속성(Durability): 트랜잭션이 실패했을 때 롤백을 위해 이전 성공 트랙잭션을 저장해둬야 한다.

성능상 문제가 되는 부분은 격리성이다. 동시처리를 가능하게 하기 위해서 표준에서는 격리 수준을 나눴다.

트랜잭션 격리 수준
- READ UNCOMMITED
- READ COMMITED (일반적으로 많이 사용)
- REPETABLE READ
- SERIALIZABLE

[관련 포스팅](https://codeleeks.github.io/blog/posts/database/%ED%8A%B8%EB%9E%9C%EC%9E%AD%EC%85%98%20%EA%B2%A9%EB%A6%AC%20%EC%88%98%EC%A4%80.md)

### 트랜잭션과 커넥션

트랜잭션은 한 커넥션에서 이뤄지는 일련의 DB 작업이다.
DB 관점에서 보면, 하나의 커넥션은 하나의 세션이다.
어플리케이션에서 트랜잭션 처리를 할 때, 여러 관련 메서드가 하나의 커넥션을 통해 DB 작업을 수행해야 한다.

다르게 말하면, 새롭게 생성된 세션에서는 커밋된 내용만 확인할 수 있고, 커밋되지 않은 작업 내역은 작업을 행한 해당 세션에서만 확인할 수 있다.
커밋과 롤백은 하나의 세션에 대해 행해지는 작업이다.

#### 계좌 이체 예제

계좌 이체시 오류가 발생할 경우 롤백을 해서 원래 상태로 되돌려야 한다.

롤백을 사용하려면 DB 작업시 같은 `Connection` 객체를 사용해야 한다. (같은 커넥션은 같은 세션을 의미하고, 같은 트랜잭션 내에 있음을 의미하므로)

출처: <a href='https://inf.run/AomUA' target='_blank'>김영한 스프링 DB1</a>

```java
package hello.jdbc.repository;

import hello.jdbc.domain.Member;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.support.JdbcUtils;

import javax.sql.DataSource;
import java.sql.*;
import java.util.NoSuchElementException;

@Slf4j
public class MemberRepositoryV2 {
    private final DataSource dataSource;

    public MemberRepositoryV2(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public Member save(Member member) throws SQLException {
        String sql = "insert into member(member_id, money) values (?, ?)";
        Connection con = null;
        PreparedStatement pstmt = null;
        try {
            con = getConnection();
            pstmt = con.prepareStatement(sql);
            pstmt.setString(1, member.getMemberId());
            pstmt.setInt(2, member.getMoney());
            pstmt.executeUpdate();
            return member;
        } catch (SQLException e) {
            log.error("db error", e);
            throw e;
        } finally {
            close(con, pstmt, null);
        }
    }

    public Member findById(String memberId) throws SQLException {
        String sql = "select * from member where member_id = ?";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;

        try {
            con = getConnection();
            pstmt = con.prepareStatement(sql);
            pstmt.setString(1, memberId);

            rs = pstmt.executeQuery();

            if (rs.next()) {
                Member member = new Member();
                member.setMemberId(rs.getString("member_id"));
                member.setMoney(rs.getInt("money"));
                return member;
            } else {
                throw new NoSuchElementException("member not found memberId=" + memberId);
            }

        } catch (SQLException e) {
            log.error("db error ", e);
            throw e;
        } finally {
            close(con, pstmt, rs);
        }
    }

    public Member findById(Connection con, String memberId) throws SQLException {
        String sql = "select * from member where member_id = ?";
        PreparedStatement pstmt = null;
        ResultSet rs = null;

        try {
            pstmt = con.prepareStatement(sql);
            pstmt.setString(1, memberId);

            rs = pstmt.executeQuery();

            if (rs.next()) {
                Member member = new Member();
                member.setMemberId(rs.getString("member_id"));
                member.setMoney(rs.getInt("money"));
                return member;
            } else {
                throw new NoSuchElementException("member not found memberId=" + memberId);
            }

        } catch (SQLException e) {
            log.error("db error ", e);
            throw e;
        } finally {
            JdbcUtils.closeResultSet(rs);
            JdbcUtils.closeStatement(pstmt);
        }
    }

    public void update(String memberId, int money) throws SQLException {
        String sql = "update member set money=? where member_id=?";

        Connection con = null;
        PreparedStatement pstmt = null;


        try {
            con = getConnection();
            pstmt = con.prepareStatement(sql);
            pstmt.setInt(1, money);
            pstmt.setString(2, memberId);

            int count = pstmt.executeUpdate();
            log.info("resultSize={}", count);

        } catch (SQLException e) {
            log.info("db error ", e);
            throw e;
        } finally {
            close(con, pstmt, null);
        }
    }

    public void update(Connection con, String memberId, int money) throws SQLException {
        String sql = "update member set money=? where member_id=?";

        PreparedStatement pstmt = null;

        try {
            pstmt = con.prepareStatement(sql);
            pstmt.setInt(1, money);
            pstmt.setString(2, memberId);

            int count = pstmt.executeUpdate();
            log.info("resultSize={}", count);

        } catch (SQLException e) {
            log.info("db error ", e);
            throw e;
        } finally {
            JdbcUtils.closeStatement(pstmt);
        }
    }
    public void delete(String memberId) throws SQLException {
        String sql = "delete from member where member_id=?";
        Connection con = null;
        PreparedStatement pstmt = null;

        try {
            con = getConnection();
            pstmt = con.prepareStatement(sql);
            pstmt.setString(1, memberId);
            int count = pstmt.executeUpdate();
            log.info("resultSize:{}", count);
        } catch (SQLException e) {
            log.info("db error ", e);
            throw e;
        } finally {
            close(con, pstmt, null);
        }
    }

    private void close(Connection con, Statement stmt, ResultSet rs) {
        JdbcUtils.closeResultSet(rs);
        JdbcUtils.closeStatement(stmt);
        JdbcUtils.closeConnection(con);
    }

    private Connection getConnection() throws SQLException {
        Connection con = dataSource.getConnection();
        log.info("get connection:{}, class={}", con, con.getClass());
        return con;
    }

}

```

```java
package hello.jdbc.service;

import hello.jdbc.domain.Member;
import hello.jdbc.repository.MemberRepositoryV2;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

@Slf4j
@RequiredArgsConstructor
public class MemberServiceV2 {
    private final DataSource dataSource;
    private final MemberRepositoryV2 repository;

    public void accountTransfer(String fromId, String toId, int money) throws SQLException {
        Connection con = dataSource.getConnection();
        try {
            con.setAutoCommit(false);
            bizLogic(con, fromId, toId, money);
            con.commit();
        } catch (Exception e) {
            con.rollback();
            throw new IllegalStateException(e);
        } finally {
            release(con);
        }

    }

    private void bizLogic(Connection con, String fromId, String toId, int money) throws SQLException {
        Member fromMember = repository.findById(con, fromId);
        Member toMember = repository.findById(con, toId);

        repository.update(con, fromId, fromMember.getMoney() - money);
        validation(toMember);
        repository.update(con, toId, toMember.getMoney() + money);
    }

    private void validation(Member toMember) {
        if (toMember.getMemberId().equals("ex")) {
            throw new IllegalStateException("이체중 예외 발생");
        }
    }

    private void release(Connection con) {
        try {
            if (con != null) {
                con.setAutoCommit(true);
                con.close();
            }
        } catch (Exception e) {
            log.info("error ", e);
        }
    }
}

```

### 커넥션과 락

어플리케이션이 커넥션을 얻고, 레코드를 수정하는 작업을 시도할 때 다른 로직에서(다른 스레드 혹은 다른 어플리케이션) 다른 커넥션을 얻어 동일한 레코드를 수정하는 경우가 있을 수 있다.
DB는 이러한 동시성 문제를 처리하기 위해 락을 도입했다.

레코드 별로 락이 존재하며, 수정 작업하려면 락을 먼저 획득해야 한다.
락 획득에 실패하면 지정된 타임아웃만큼 대기한다.
락을 획득한 세션은 커밋이나 롤백을 통해 락을 다시 DB에게 넘겨준다.(락 해제)

<MessageBox title='락을 걸고 조회하고 싶을 때' level='info'>
  조회는 보통 락을 획득하지 않고 수행된다.

  그러나 어떤 경우에는 비즈니스 로직이 완료될 때까지 다른 로직에서 레코드를 건드리지 않아야 할 때가 있다.
  이런 경우에 락을 걸고 조회해야 하는데, 이럴 땐 `select for update;`를 사용하면 된다.
</MessageBox>


### 서비스 레이어와 트랜잭션

서비스 레이어의 순수성을 지켜야 유지보수하기 유리하다.

트랜잭션을 도입하면 비즈니스 로직의 시작점인 서비스 레이어에서 트랜잭션을 시작해야 하기 때문에 서비스 레이어에서 데이터 접근 라이브러리 관련 객체가 사용될 수밖에 없다.(예를 들어, JDBC의 경우 Connection 객체)

스프링은 `PlatformTransactionManager` 인터페이스를 도입하고, 각 데이터 접근 라이브러리에 맞는 트랜잭션 처리 구현체를 제공한다.
(JDBC: `DataSourceTransactionManager`, JPA: `JpaTransactionManager`)

서비스 레이어에서는 `PlatformTransactionManager`만 의존할 수 있게 되었다.

```java
package hello.jdbc.service;

import hello.jdbc.domain.Member;
import hello.jdbc.repository.MemberRepositoryV3;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.DefaultTransactionDefinition;

import java.sql.SQLException;

@Slf4j
@RequiredArgsConstructor
public class MemberServiceV3_1 {
    private final PlatformTransactionManager transactionManager;
    private final MemberRepositoryV3 repository;

    public void accountTransfer(String fromId, String toId, int money) {
        //transaction을 시작한다. 커넥션을 맺고 저장한다.
        TransactionStatus status = transactionManager.getTransaction(new DefaultTransactionDefinition());

        try {
            bizLogic(fromId, toId, money);
            transactionManager.commit(status);
        } catch (Exception e) {
            transactionManager.rollback(status);
            throw new IllegalStateException(e);
        }
    }

    private void bizLogic(String fromId, String toId, int money) throws
            SQLException {
        Member fromMember = repository.findById(fromId);
        Member toMember = repository.findById(toId);
        repository.update(fromId, fromMember.getMoney() - money);
        validation(toMember);
        repository.update(toId, toMember.getMoney() + money);
    }

    private void validation(Member toMember) {
        if (toMember.getMemberId().equals("ex")) {
            throw new IllegalStateException("이체중 예외 발생");
        }
    }
}

```

#### `PlatformTransactionManager`의 동작 원리

`PlatformTransactionManager`의 구현체 내부에서 `TransactionSynchronizationManager`이 커넥션을 저장하고 관리한다.

`TransactionSynchronizationManager`은 `static` 필드인 `ThreadLocal` 자료구조에 커넥션을 저장한다.

`DataSourceUtils.getConnection()`은 `TransactionSynchronizationManager`의 `static` 필드에 접근하여 트랜잭션 중인 커넥션을 조회한다.


#### `TransactionTemplate`
트랜잭션이 필요한 비즈니스 로직을 콜백 함수로 받는다.
콜백 함수가 정상 종료하면 commit을, 예외가 발생하면 rollback을 한다.

트랜잭션 처리하는 비즈니스 로직 메서드에서는 `try / catch` 구조가 거의 동일하게 사용된다.
비즈니스 로직이 완료되면 `commit`하고, 예외가 발생하면 `rollback`을 하는 식이다.

`TransactionTemplate`을 사용하면 직접 commit, rollback 코드를 작성할 필요가 없어서 코드 반복을 줄일 수 있다.

```java
package hello.jdbc.service;

import hello.jdbc.domain.Member;
import hello.jdbc.repository.MemberRepositoryV3;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.sql.SQLException;

@Slf4j
public class MemberServiceV3_2 {
    private final TransactionTemplate txTemplate;
    private final MemberRepositoryV3 repository;


    public MemberServiceV3_2(PlatformTransactionManager transactionManager, MemberRepositoryV3 repository) {
        this.txTemplate = new TransactionTemplate(transactionManager);
        this.repository = repository;
    }

    public void accountTransfer(String fromId, String toId, int money) {
        txTemplate.executeWithoutResult((status) -> {
            try {
                bizLogic(fromId, toId, money);
            } catch (SQLException e) {
                throw new IllegalStateException(e);
            }
        });
    }

    private void bizLogic(String fromId, String toId, int money) throws
            SQLException {
        Member fromMember = repository.findById(fromId);
        Member toMember = repository.findById(toId);
        repository.update(fromId, fromMember.getMoney() - money);
        validation(toMember);
        repository.update(toId, toMember.getMoney() + money);
    }

    private void validation(Member toMember) {
        if (toMember.getMemberId().equals("ex")) {
            throw new IllegalStateException("이체중 예외 발생");
        }
    }
}

```

#### @Transactional
트랜잭션 시작, 커밋, 롤백 등의 트랜잭션 로직을 Proxy 객체에서 처리한다.

```java
public class TransactionProxy {
  private MemberService target;
  public void logic() {
    //트랜잭션 시작
    TransactionStatus status = transactionManager.getTransaction(..);
    try {
      //실제 대상 호출
      target.logic();
      transactionManager.commit(status); //성공시 커밋
    } catch (Exception e) {
      transactionManager.rollback(status); //실패시 롤백
      throw new IllegalStateException(e);
    }
  }
}
```

스프링 컨테이너는 프록시 객체를 빈으로 생성하고, 트랜잭션 관련 객체들(`DataSource`, `PlatformTransactionManager`)도 빈으로 등록하여 프록시 객체에 주입한다.
`DataSource`는 디폴트로 `HikariCP`를 사용하고, `PlatformTransactionManager`는 등록된 라이브러리 중에 `JpaTransactionManager`를 먼저 선택하고 없으면 `DataSourceTransactionManager`를 선택한다.
물론 개발자가 `DataSource`, `PlatformTransactionManager` 빈을 만들어 커스터마이징을 할 수 있다.

db url 등 관련 설정은 `application.properties`에 작성한다.

```
spring.datasource.url=jdbc:h2:tcp://localhost/~/test
spring.datasource.username=sa
spring.datasource.password=
```


```java
package hello.jdbc.service;

import hello.jdbc.domain.Member;
import hello.jdbc.repository.MemberRepositoryV3;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;

@Slf4j
public class MemberServiceV3_3 {
    private final MemberRepositoryV3 repository;

    public MemberServiceV3_3(MemberRepositoryV3 repository) {
        this.repository = repository;
    }

    //단순히 @Transactional 어노테이션만 선언하면 이 객체는 프록시로 감싸지게 된다.
    @Transactional
    public void accountTransfer(String fromId, String toId, int money) throws SQLException {
        bizLogic(fromId, toId, money);
    }

    private void bizLogic(String fromId, String toId, int money) throws
            SQLException {
        Member fromMember = repository.findById(fromId);
        Member toMember = repository.findById(toId);
        repository.update(fromId, fromMember.getMoney() - money);
        validation(toMember);
        repository.update(toId, toMember.getMoney() + money);
    }

    private void validation(Member toMember) {
        if (toMember.getMemberId().equals("ex")) {
            throw new IllegalStateException("이체중 예외 발생");
        }
    }
}

```

## 예외

### 체크 예외와 언체크예외

여기서 체크는 컴파일러의 체크이다.

예외를 try-catch로 처리했거나 throws로 넘겼는지를 체크한다.

Exception - SQLException, IOException 등 시스템 예외가 체크 예외다. (자바 초기 설계 당시 체크 예외가 더 바람직한 방법이라 생각했다)

체크예외는 보통 복구 불가능한 시스템 예외가 많다.

현실적으로 어플리케이션 단에서(서비스레이어나 컨트롤러 레이어) 체크 예외를 잡아 복구할 방법이 없다.

또한, 컴파일 단계에서 예외 처리를 강요하기 때문에 자칫 잘못하다가는 각 레이어의 순수성을 해치고 유지보수가 어려워지는 길로 갈 수 있다.
서비스 레이어든 컨트롤러 레이어든 throws 시스템예외 가 덕지덕지 생길 수 있다. 
이는 시스템 자체를 변경할 때 같이 바꿔줘야 하기 때문에 유지보수가 어려워진다.

그래서 보통은 언체크예외를 기본으로 사용한다. 체크 예외를 잡아 언체크 예외로 다시 던지는 것이다.

언체크 예외의 단점은 개발자가 해당 메서드가 일으킬 수 있는 예외를 한눈에 알기 어렵다는 점이다.
그래서 중요한 언체크 예외의 경우 메서드를 만들 때 설명을 잘 작성해야 한다.(문서화)

```java
catch (SQLException e) {
 throw new MyDbException(e);
}
```

### 스프링 제공 예외

DB에서 발생하는 예외는 한 두 개가 아니다. 이를 하나 하나 다 언체크예외로 만드는 것은 수고스러운 일이 아닐 수 없다.

스프링은 DB에서 발생하는 모든 예외를 커버하는 언체크 예외 클래스들을 만들어두었다.

스프링 위에서 개발하는 우리는 이 클래스들을 사용하면 된다.

![image](https://github.com/codeleeks/blog/assets/166087781/e362023e-836f-485b-8b51-ae7a24963095)

DataAccessException은 언체크 예외이며, 최상위 클래스이다.

`Transient`는 일시적이라는 의미이며, `Transient` 예외는 재시도하면 복구될 수 있는 예외를 말한다.
반대로 `NonTransient` 예외는 재시도하더라도 동일한 에러가 발생하는 예외를 말한다.

이제, DB의 에러 코드를 확인하여 적절한 예외 클래스를 던지면 되는데, 이 또한 스프링에서 제공하는 `SQLExceptionTranslator` 객체를 사용하면 편리하다.

`sql-error-codes.xml` 파일에 DB 오류 코드와 매핑하는 예외 클래스가 정의되어 있다. 

`SQLExceptionTranslator`는 이 파일을 읽어 적절한 예외 클래스를 찾는다.


```java
package hello.jdbc.repository;

import hello.jdbc.domain.Member;
import hello.jdbc.repository.ex.MyDBException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.datasource.DataSourceUtils;
import org.springframework.jdbc.support.JdbcUtils;
import org.springframework.jdbc.support.SQLExceptionTranslator;

import javax.sql.DataSource;
import java.sql.*;
import java.util.NoSuchElementException;

@RequiredArgsConstructor
public class MemberRepositoryV4_2 implements MemberRepository{
    private final DataSource dataSource;
    private final SQLExceptionTranslator exTranslator;
    @Override
    public Member save(Member member) {
        String sql = "insert into member(member_id, money) values(?,?)";
        Connection con = null;
        PreparedStatement pstmt = null;

        try {
            con = getConnection();
            pstmt = con.prepareStatement(sql);
            pstmt.setString(1, member.getMemberId());
            pstmt.setInt(2, member.getMoney());
            pstmt.executeUpdate();
            return member;
        } catch (SQLException e) {
            throw exTranslator.translate("save", sql, e);
        } finally {
            close(con, pstmt, null);
        }
    }

    @Override
    public Member findById(String memberId) {
        String sql = "select * from member where member_id=?";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;

        try {
            con = getConnection();
            pstmt = con.prepareStatement(sql);
            pstmt.setString(1, memberId);
            rs = pstmt.executeQuery();
            if (rs.next()) {
                Member member = new Member();
                member.setMemberId(rs.getString("member_id"));
                member.setMoney(rs.getInt("money"));
                return member;
            } else {
                throw new NoSuchElementException("member not found memberId=" + memberId);
            }
        } catch (SQLException e) {
            throw exTranslator.translate("select", sql, e);
        } finally {
            close(con, pstmt, rs);
        }
    }

    @Override
    public void update(String memberId, int money) {
        String sql = "update member set money=? where member_id=?";
        Connection con = null;
        PreparedStatement pstmt = null;

        try {
            con = getConnection();
            pstmt = con.prepareStatement(sql);
            pstmt.setInt(1, money);
            pstmt.setString(2, memberId);
            pstmt.executeUpdate();
        } catch (SQLException e) {
            throw exTranslator.translate("update", sql, e);
        } finally {
            close(con, pstmt, null);
        }
    }

    @Override
    public void delete(String memberId) {
        String sql = "delete from member where member_id=?";
        Connection con = null;
        PreparedStatement pstmt = null;

        try {
            con = getConnection();
            pstmt = con.prepareStatement(sql);
            pstmt.setString(1, memberId);
            pstmt.executeUpdate();
        } catch (SQLException e) {
            throw exTranslator.translate("delete", sql, e);
        } finally {
            close(con, pstmt, null);
        }
    }

    private void close(Connection con, Statement stmt, ResultSet rs) {
        JdbcUtils.closeResultSet(rs);
        JdbcUtils.closeStatement(stmt);
        DataSourceUtils.releaseConnection(con, dataSource);
    }

    private Connection getConnection() {
        return DataSourceUtils.getConnection(dataSource);
    }
}

```

## SQL Mapper와 ORM

SQL Mapper 방식의 대표 주자는 jdbcTemplate과 MyBatis이다.
ORM은 JPA가 표준이며, 구현체인 하이버네이트와 SpringData JPA, queryDSL을 활용한다.

## JdbcTemplate

```try-catch``` 안에서 ```conection``` 얻어서 ```statement``` 만들고 실행해서 결과값 받아오고 객체로 만드는 작업을 다 하지 않고, 개발자의 코드 작성을 줄여준다.

```jdbcTemplate.update(sql, ...)```처럼 **순서대로** 메서드의 파라미터에 값을 넣어주는 방식이다.

단점은 특히 파라미터가 많을 때 버그가 생길 확률이 높다.

### ```NamedParameterJdbcTemplate```
jdbcTemplate에서 확장하면서 순서 기반 파라미터 바인딩의 단점을 보완한다.

```SqlParameterSource```의 도움을 받아서 컬럼 이름과 값의 매핑으로 파라미터 바인딩을 한다.

```SqlParameterSource```의 종류는 두 가지이다.
- BeanPropertySqlParameterSource
- MapSqlParameterSource

자바 컬렉션의 ```Map``` 객체도 ```SqlParameterSource```처럼 동작하도록 지원한다.

```java
//자바빈 프로퍼티 기반으로 컬럼 이름을 추정한다.
//실제 컬럼 이름이 테이블의 기본 포맷인 스네이크 케이스 포맷이더라도 자바빈에 맞게 카멜케이스로 자동으로 변환한다.
NamedSqlParameterSource source = new BeanPropertySqlParameterSource(item)
jdbcTemplate.update(sql, source)
```

### 인서트시 auto generated 키 조회
여기서 조금 더 Advanced되는 측면은 auto generated되는 키값을 가져올 때이다.
auto generated되는 key는 인서트시 생성이 되는데, 이를 가져오려면 두 가지 방법이 있다.

1. keyHolder 사용

```java
KeyHolder keyHolder = new GeneratedKeyHolder();
NamedSqlParameterSource source = new BeanPropertySqlParameterSource(item);
jdbcTemplate.update(sql, source, keyHolder);
item.setId(keyHolder.getKey().longValue());
```

<MessageBox title='auto generated 키 조회하기' level='info'>
  ```BeanPropertySqlParameterSource```는 어떤 게 key인지 알고 ```keyHolder```에 값을 넣을 수 있는가?

  내부 코드를 보다보면 아래의 코드를 발견할 수 있다.
  
  ```java
    ps = con.prepareStatement(this.actualSql, PreparedStatement.RETURN_GENERATED_KEYS);
  ```
  결국 JDBC에 있는 ```prepareStatement``` 메서드의 기능을 활용하여 자동 생성되는 컬럼값을 모두 가져온다.

  자동 생성되는 컬럼이 여러 개라면 여러 개 가져온다. (가져온 각각의 값은 ```keyHolder.getKeys()```로 조회 가능하다.)
</MessageBox>

2. jdbcInsert 객체 사용

```SimpleJdbcInsert``` 객체가 생성될 때 테이블에서 메타데이터를 얻어 모든 컬럼의 이름을 획득한다.

이 방법이 1번 방법을 포함한 개념이다.

```jdbcInsert.executeAndReturnKeyHolder()```라는 메서드로 ```keyHolder``` 객체를 얻을 수 있기 때문이다.

```java
      //객체 생성 시점에 dataSource를 이용하여 테이블의 메타데이터를 얻어 모든 컬럼의 이름을 획득함.
        this.jdbcInsert = new SimpleJdbcInsert(dataSource)
                .withTableName("item")
                .usingGeneratedKeyColumns("id");

        BeanPropertySqlParameterSource sqlParameterSource = new BeanPropertySqlParameterSource(item);
        Number key = jdbcInsert.executeAndReturnKey(sqlParameterSource);
        item.setId(key.longValue());
```

## MyBatis
sql를 xml로 관리한다.
동적 쿼리를 위한 편의 기능을 xml 태그로 지원한다.
대표적으로 where 이하절 동적 쿼리를 위해 ```<where>, <if>``` 키워드를 제공한다.
```<where>``` 태그는 처음 발견한 and를 where로 치환한다.
```<if>``` 태그는 조건에 따라 sql 문에 추가되거나 무시된다.

xml로 작성한 내용이 자바 인터페이스(매퍼)에 매핑되며, 레포지토리는 매퍼 인터페이스를 사용한다.

매퍼 인터페이스의 메서드가 호출되면 매핑된 xml에 작성된 sql이 실행된다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="hello.itemservice.repository.mybatis.ItemMapper">
    <insert id="save" useGeneratedKeys="true" keyProperty="id">
        insert into item(item_name, price, quantity)
        values (#{itemName}, #{price}, #{quantity})
    </insert>

    <update id="update">
        update item
        set item_name = #{updateParam.itemName},
            price = #{updateParam.price},
            quantity = #{updateParam.quantity}
        where id = #{id}
    </update>

    <select id="findById" resultType="Item">
        select * from item
        where id = #{id}
    </select>


    <select id="findAll" resultType="Item">
        select * from item
        <where>
            <if test="itemName != null and itemName != ''">
                and item_name like concat('%', #{itemName}, '%')
            </if>
            <if test="maxPrice != null">
                and price &lt;= #{maxPrice}
            </if>
        </where>
    </select>

</mapper>
```
```java
package hello.itemservice.repository.mybatis;

import hello.itemservice.domain.Item;
import hello.itemservice.repository.ItemSearchCond;
import hello.itemservice.repository.ItemUpdateDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface ItemMapper {
    void save(Item item);
    Optional<Item> findById(Long id);
    List<Item> findAll(ItemSearchCond cond);
    void update(@Param("id") Long id, @Param("updateParam") ItemUpdateDto updateParam);
}
```

```java
package hello.itemservice.repository.mybatis;

import hello.itemservice.domain.Item;
import hello.itemservice.repository.ItemRepository;
import hello.itemservice.repository.ItemSearchCond;
import hello.itemservice.repository.ItemUpdateDto;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
public class MyBatisItemRepository implements ItemRepository {
    private final ItemMapper mapper;
    @Override
    public Item save(Item item) {
        mapper.save(item);
        return item;
    }

    @Override
    public void update(Long itemId, ItemUpdateDto updateParam) {
        mapper.update(itemId, updateParam);
    }

    @Override
    public Optional<Item> findById(Long id) {
        return mapper.findById(id);
    }

    @Override
    public List<Item> findAll(ItemSearchCond cond) {
        return mapper.findAll(cond);
    }
}
```

자바 코드에서 매퍼는 인터페이스만 정의하고 있다.
마이바티스 스프링 연동 모듈이 매퍼 구현체를 빈으로 등록하기 때문이다.
스프링 예외도 내부적으로 사용하고 있어서 예외 처리시 별도의 클래스를 정의할 필요가 없다.

### TODO -> MybatisAutoConfiguration가 어떻게 매퍼 구현체를 만드는가?

### 동적 SQL를 위한 태그
마이바티스를 쓰는 이유는 동적 SQL을 편리하게 사용하기 위해서이다.

#### if
조건에 따라 추가할지 말지 판단한다.
조건 문법은 ```OGNL```을 사용한다.

```xml
<select id="findActiveBlogWithTitleLike"
 resultType="Blog">
 SELECT * FROM BLOG
 WHERE state = ‘ACTIVE’
 <if test="title != null">
 AND title like #{title}
 </if>
</select>
```

#### choose
자바의 switch 문법과 유사한 구문도 있다.

```xml
<select id="findActiveBlogLike"
 resultType="Blog">
 SELECT * FROM BLOG WHERE state = ‘ACTIVE’
 <choose>
 <when test="title != null">
 AND title like #{title}
 </when>
 <when test="author != null and author.name != null">
 AND author_name like #{author.name}
 </when>
 <otherwise>
 AND featured = 1
 </otherwise>
 </choose>
</select>
```

#### where
where 절을 정의한다.
and나 or가 붙는지 아닌지를 처리하기에 용이하다.

```xml
<select id="findActiveBlogLike"
 resultType="Blog">
 SELECT * FROM BLOG
 <where>
 <if test="state != null">
 state = #{state}
 </if>
 <if test="title != null">
 AND title like #{title}
 </if>
 <if test="author != null and author.name != null">
 AND author_name like #{author.name}
 </if>
 </where>
</select>
```

#### trim
where처럼 특정 구문을 대체할 수 있는 일반적인 방법이다.
```xml
<trim prefix="WHERE" prefixOverrides="AND |OR ">
 ...
</trim>
```

#### foreach
컬렉션을 파라미터 바인딩할 때 사용한다.

```xml
<select id="selectPostIn" resultType="domain.blog.Post">
 SELECT *
 FROM POST P
 <where>
 <foreach item="item" index="index" collection="list"
 open="ID in (" separator="," close=")" nullable="true">
 #{item}
 </foreach>
 </where>
</select>
```

### 문자열 대체(string substitution)
문자 그대로를 넣을 때 사용한다. 
파라미터 바인딩은 sql 절에서 값이 들어가는 자리에 값을 넣는 것이지만, 문자열 대체는 단순히 문자열을 sql 구문에 복사붙여넣기 하는 것이다.

```java
@Select("select * from user where ${column} = #{value}")
User findByColumn(@Param("column") String column, @Param("value") String value);
```

#### ```<sql>```
SQL 코드를 재사용한다.

```xml
<sql id="userColumns"> ${alias}.id,${alias}.username,${alias}.password </sql> 
```

```xml
<select id="selectUsers" resultType="map">
 select
 <include refid="userColumns"><property name="alias" value="t1"/></include>,
 <include refid="userColumns"><property name="alias" value="t2"/></include>
 from some_table t1
 cross join some_table t2
</select>
```

include는 id를 통해 sql을 찾는다.

```xml
<sql id="sometable">
 ${prefix}Table
</sql>
<sql id="someinclude">
 from
 <include refid="${include_target}"/>
</sql>
<select id="select" resultType="map">
 select
 field1, field2, field3
 <include refid="someinclude">
 <property name="prefix" value="Some"/>
 <property name="include_target" value="sometable"/>
 </include>
</select>
```

#### resultMap
sql 실행 결과를 xml 차원에서 매핑할 수 있다.
아래는 컬럼 이름을 변경한다.

```xml
<resultMap id="userResultMap" type="User">
 <id property="id" column="user_id" />
 <result property="userName" column="user_name"/>
 <result property="password" column="hashed_password"/>
</resultMap>
<select id="selectUsers" resultMap="userResultMap">
 select user_id, user_name, hashed_password
 from some_table
 where id = #{id}
</select>
```

### 참고
동적 쿼리 관련 자세한 부분은 매뉴얼을 참고한다.

<a href='https://mybatis.org/mybatis-3/ko/index.html' target='_blank'>MyBatis 공식 메뉴얼</a>
<br />
<a href='https://mybatis.org/spring/ko/index.html' target='_blank'>MyBatis 스프링 공식 메뉴얼</a>


## JPA

자바 객체를 테이블과 매핑시킨다.
기본적인 CRUD를 하는데 SQL이 전혀 사용되지 않는다.
엔티티를 정의함으로써 DDL도 포함할 수 있다.

그러나 JPA만 가지고선 여전히 동적 쿼리를 만들어내는 데 어려움이 있다.
JSQL을 만들어 내야 하는데, SQL을 만드는 것과 거의 비슷한 상황이다.

```java
package hello.itemservice.domain;

import lombok.Data;

import javax.persistence.*;

@Entity
@Data
public class Item {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String itemName;
    private Integer price;
    private Integer quantity;

    public Item() {
    }

    public Item(String itemName, Integer price, Integer quantity) {
        this.itemName = itemName;
        this.price = price;
        this.quantity = quantity;
    }
}

```

```java
package hello.itemservice.repository.jpa;

import hello.itemservice.domain.Item;
import hello.itemservice.repository.ItemRepository;
import hello.itemservice.repository.ItemSearchCond;
import hello.itemservice.repository.ItemUpdateDto;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import java.util.List;
import java.util.Optional;

@Transactional
public class JpaItemRepositoryV1 implements ItemRepository {
    private final EntityManager em;

    public JpaItemRepositoryV1(EntityManager em) {
        this.em = em;
    }

    @Override
    public Item save(Item item) {
        em.persist(item);
        return item;
    }

    @Override
    public void update(Long itemId, ItemUpdateDto updateParam) {
        Item item = em.find(Item.class, itemId);
        item.setItemName(updateParam.getItemName());
        item.setPrice(updateParam.getPrice());
        item.setQuantity(updateParam.getQuantity());
    }

    @Override
    public Optional<Item> findById(Long id) {
        return Optional.ofNullable(em.find(Item.class, id));
    }

    @Override
    public List<Item> findAll(ItemSearchCond cond) {
        String jpql = "select i from Item i";
        Integer maxPrice = cond.getMaxPrice();
        String itemName = cond.getItemName();
        if (StringUtils.hasText(itemName) || maxPrice != null) {
            jpql += " where";
        }
        boolean andFlag = false;
        if (StringUtils.hasText(itemName)) {
            jpql += " i.itemName like concat('%',:itemName,'%')";
            andFlag = true;
        }
        if (maxPrice != null) {
            if (andFlag) {
                jpql += " and";
            }
            jpql += " i.price <= :maxPrice";
        }

        TypedQuery<Item> query = em.createQuery(jpql, Item.class);
        if (StringUtils.hasText(itemName)) {
            query.setParameter("itemName", itemName);
        }
        if (maxPrice != null) {
            query.setParameter("maxPrice", maxPrice);
        }
        return query.getResultList();
    }
}

```


### 예외

JPA가 내뱉은 예외는 스프링 제공 예외가 아니다. (사실 당연한 것)
@Repository 빈은 JPA 예외를 스프링 제공 예외로 변환하는 프록시로 감싸진다. (AOP)
PersistenceExceptionTranslationPostProcessor에서 @Repository를 AOP 프록시로 감싼다.


## Spring Data JPA

||jpa|spring data jpa|
|---|---|---|
|기능|ORM 표준|JPA를 스프링에서 쉽게 사용할 수 있도록 돕는다|
|repository|우리가 클래스를 정의한다. ```EntityManager```를 사용한다.|인터페이스만 만들면 스프링이 빈으로 등록해준다. <br /> ```jpaRepository```는 메서드 이름을 보고 쿼리를 만들어내는 기능을 제공한다.|

Spring Data JPA는 ```@Query``` 어노테이션으로 ```jpql```이나 ```sql```을 직접 작성하는 기능도 제공한다.

메서드 이름 기반 쿼리 방식은 조건이 많아지면 메서드 이름도 길어지기 때문에 가독성이 안좋아진다.
이 때는 @Query로 직접 쿼리를 작성하는 것이 방법이다.

```java
package hello.itemservice.repository.jpa;

import hello.itemservice.domain.Item;
import org.apache.ibatis.annotations.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SpringDataJpaItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByItemNameContains(String itemName);
    List<Item> findByPriceLessThanEqual(Integer price);
    @Query("select i from Item i where i.itemName like %:itemName% and i.price <= :price")
    List<Item> findByCond(@Param("itemName") String itemName, @Param("price") Integer price);
}
```

```java
package hello.itemservice.repository.jpa;

import hello.itemservice.domain.Item;
import hello.itemservice.repository.ItemRepository;
import hello.itemservice.repository.ItemSearchCond;
import hello.itemservice.repository.ItemUpdateDto;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import javax.persistence.TypedQuery;
import java.util.List;
import java.util.Optional;

@Transactional
public class JpaItemRepositoryV2 implements ItemRepository {
    private final SpringDataJpaItemRepository repository;

    public JpaItemRepositoryV2(SpringDataJpaItemRepository repository) {
        this.repository = repository;
    }

    @Override
    public Item save(Item item) {
        return repository.save(item);
    }

    @Override
    public void update(Long itemId, ItemUpdateDto updateParam) {
        Item item = repository.findById(itemId).get();
        item.setItemName(updateParam.getItemName());
        item.setPrice(updateParam.getPrice());
        item.setQuantity(updateParam.getQuantity());
    }

    @Override
    public Optional<Item> findById(Long id) {
        return repository.findById(id);
    }

    @Override
    public List<Item> findAll(ItemSearchCond cond) {
        Integer maxPrice = cond.getMaxPrice();
        String itemName = cond.getItemName();

        if (maxPrice != null && StringUtils.hasText(itemName)) {
            return repository.findByCond(itemName, maxPrice);
        } else if (maxPrice != null) {
            return repository.findByPriceLessThanEqual(maxPrice);
        } else if (StringUtils.hasText(itemName)) {
            return repository.findByItemNameContains(itemName);
        }

        return repository.findAll();
    }
}
```

## QueryDSL
```jpql``` 빌더이다.
동적 쿼리(조건 조회)만들 때 유용하다.

```java
package hello.itemservice.repository.v2;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import hello.itemservice.domain.Item;
import hello.itemservice.domain.QItem;
import hello.itemservice.repository.ItemSearchCond;
import org.springframework.util.StringUtils;

import javax.persistence.EntityManager;
import java.util.List;

public class ItemQueryRepositoryV2 {
    private final JPAQueryFactory queryFactory;

    public ItemQueryRepositoryV2(EntityManager em) {
        this.queryFactory = new JPAQueryFactory(em);
    }

    public List<Item> findAll(ItemSearchCond cond) {
        String itemName = cond.getItemName();
        Integer maxPrice = cond.getMaxPrice();

        return queryFactory.select(QItem.item)
                .from(QItem.item)
                .where(likeItemName(itemName), loePrice(maxPrice))
                .fetch();
    }

    private BooleanExpression likeItemName(String itemName) {
        if (StringUtils.hasText(itemName)) {
            return QItem.item.itemName.like("%" + itemName + "%");
        }
        return null;
    }

    private BooleanExpression loePrice(Integer maxPrice) {
        if (maxPrice != null) {
            return QItem.item.price.loe(maxPrice);
        }
        return null;
    }
}
```

## 추천하는 조합
기본적으로 JPA, Spring Data JPA, queryDsl이고, 복잡한 쿼리일 경우 jdbcTemplate이나 myBatis를 쓴다.
