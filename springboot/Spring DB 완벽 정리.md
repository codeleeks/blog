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
- 일관성(Consistency): 
- 격리성(Isolation): 서로 다른 트랜잭션이 같은 데이터를 동시에 수정할 수 없게 한다.
- 지속성(Durability): 트랜잭션이 실패했을 때 롤백을 위해 이전 성공 트랙잭션을 저장해둬야 한다.

성능상 문제가 되는 부분은 격리성이다. 동시처리를 가능하게 하기 위해서 표준에서는 격리 수준을 나눴다.

트랜잭션 격리 수준
- READ UNCOMMITED
- READ COMMITED (일반적으로 많이 사용)
- REPETABLE READ
- SERIALIZABLE
