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
