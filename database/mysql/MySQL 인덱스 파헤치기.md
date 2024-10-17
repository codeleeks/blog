---
summary: MySQL 인덱스에 대해서 정리합니다.
date: 2024-09-26
title-image: 'https://github.com/user-attachments/assets/53f119aa-323d-4945-bd2a-e9e0cece3068'

---

## 인덱스

- B+ Tree 구조
  - 루트 레벨, 인터널 레벨, 리프 레벨로 구분.
  - 부모 페이지는 자식 페이지들의 최소값 키를 리스트로 갖는다. 리스트는 키값으로 정렬되어 있는 단방향 연결리스트이다.
    - 그래서 이 자료구조는 키를 기반으로 항상 정렬되어 있다.
    - Infinum은 링크드 리스트의 헤드 역할(해당 페이지의 어떤 키값보다 작은 값), Supremum은 링크드 리스트의 테일 역할(해당 페이지의 어떤 키값보다 큰 값)이다.
  - 페이지 간에는 이중연결리스트로 구성되어 있어 양방향으로 이동이 가능하다.
    - B-Tree에는 없는 페이지 간 연결리스트, 페이지 내부의 키값(자식 최소값 키값. 리프 페이지의 경우 레코드 키값) 리스트도 연결리스트로 구성되어 있어서 순차 탐색에 유리하다.

![image](https://github.com/user-attachments/assets/788f3676-de89-4016-ba3a-55832dae3e7f)

출처: https://mangkyu.tistory.com/96

- 탐색
  - 수직적 탐색: B+ Tree 상에서 수평적 탐색을 위한 시작 지점을 찾는 과정.
  - 수평적 탐색: 인덱스 리프 페이지 간 연결리스트를 활용하여 수평적으로 스캔하는 과정.

## 인덱스 스캔 방식

- 인덱스 레인지 스캔: 수직적 탐색으로 필요한 범위만 스캔하는 방식.
- 인덱스 풀 스캔: 수평적 탐색으로 페이지의 처음부터 끝까지 탐색.
  - 일부 레코드만 반환하는 경우, order by 연산을 대체할 수 있는 경우에 index full scan이 효과적일 수 있다.
- 인덱스 유니크 스캔: 수직적 탐색만으로 데이터를 찾는다.
- 인덱스 스킵 스캔: 결합 인덱스(멀티 컬럼 인덱스)에서 선두 컬럼을 조건절에 사용하지 않았더라도 인덱스 스캔을 탈 수 있다.
  - 동작방식: 선두 컬럼의 유니크값을 모두 조회한 후 사용자의 쿼리에 선두 컬럼에 대한 조건을 추가하는 형태로 처리한다.
  - 쿼리가 인덱스에 존재하는 컬럼만으로 처리가 가능해야 한다. (커버링인덱스)
  - 선두 컬럼의 카디널리티가 높으면 효율적이지 않다. 
- 인덱스 레인지 스캔 디센딩: 맨 뒤쪽부터 앞쪽으로 스캔. 내림차순으로 정렬된 결과를 얻는다.
  - `max()`를 처리할 때 맨 뒤 값을 읽고 끝낸다.
- 루스 인덱스 스캔: 인덱스 스캔시 필요 없는 곳은 스킵한다.
  - 멀티 컬럼 인덱스에서 선두 컬럼의 정렬 덕분에 다음 컬럼에 대한 탐색이 최소화될 수 있다.(스킵 발생)
  - index(dept_no, emp_no)인 상황에서 `SELECT dept_no, MIN(emp_no) FROM dept_emp WHERE dept_no BETWEEN 'D002' AND 'D004' GROUP BY dept_no;`와 같은 쿼리 실행시.

## 어떤 컬럼이 인덱스가 되면 좋은가?

- 카디널리티가 높아야 한다: 중복이 적다는 뜻이다.
  - 인덱스를 쓴다는 것은 페이지 로딩을 최대한 줄이겠다는 뜻이다.
  - 중복이 많은 컬럼은 레코드가 그만큼 많기 때문에 로딩해야 하는 페이지도 많아질 확률이 높다.
  - 중복이 적은 컬럼은 레코드를 그만큼 특정지을 수 있기 때문에 로딩해야 하는 페이지도 적을 것이다.
- 변경이 적어야 한다.
  - B-Tree 구조의 인덱스에 레코드를 삽입하고, 삭제하고, 수정하는 것은 페이지에 곧바로 작업하는 것에 비해 오래 걸린다.
    - 정렬된 상태와 트리 구조를 유지하기 위한 작업이 추가적으로 수행된다.
    - 삽입 과정에서 리프 노드의 분할로 새로운 페이지를 위한 메모리 혹은 디스크 작업이 필요할 수 있다.
    - 삭제 과정에서 노드의 최소 키 갯수를 만족시키기 위해 형제 노드와 부모 노드에 대한 키 삭제/삽입 과정이 일어난다.
- 실제로 빈번하게 조회되어야 한다.
  - 특정 범위의 조건 검색일 경우에 해당한다. 모든 레코드 조회는 오히려 테이블 스캔이 더 나을 수 있다.
  - 쓰기 성능이 좋지 않음에도 인덱스를 쓰는 이유는 읽기 성능이 좋기 때문이다.
  - 실전에서 조회 로직이 쓰기 로직보다 훨씬 많은 경우라면 해당 컬럼을 인덱스로 사용할 수 있다.

## 인덱스와 락

MySQL은 레코드가 아니라 인덱스에 락을 건다.

[관련 포스팅](https://codeleeks.github.io/blog/posts/database/mysql/MySQL%20%EB%9D%BD%20%ED%8C%8C%ED%97%A4%EC%B9%98%EA%B8%B0.md)

인덱스 컬럼값이 중복이 많다면 그 중복 레코드만큼 락을 건다.

```sql
-- 300건의 레코드가 잠긴다.

update employees set updated_at = now()
where first_name = 'Amily' -- 300건
and
last_name = 'Swift'; -- 1건
```

## 클러스터 인덱스와 논클러스터 인덱스

기본키는 디폴트로 인덱스로 생성된다. 이 인덱스는 클러스터 인덱스로 생성된다.

우리가 인덱스를 고려할 때는 기본키가 아닌 다른 컬럼에 해당한다.
이 다른 컬럼을 인덱스로 만들면 논클러스터 인덱스로 생성된다.

그래서 인덱스를 추가로 도입하는 경우 대부분의 테이블은 논클러스터인덱스(우리가 추가한 인덱스) + 클러스터인덱스(기본키 인덱스)로 구성된다.
이를 혼합 인덱스라고 한다.

혼합 인덱스 구조에서는 조회 쿼리시 논클러스터인덱스부터 접근한다.
혼합 인덱스 구조에서 논클러스터인덱스는 리프 노드에서 클러스터인덱스의 키값(즉, 기본키값)을 들고 있다.
그래서 `인덱스 컬럼 조회 쿼리 -> 논클러스터인덱스 -> 클러스터인덱스 -> 페이지 -> 레코드` 순으로 조회 로직이 진행된다.

![image](https://github.com/user-attachments/assets/9423fbaf-a94e-4b56-8ef4-359d363a9bce)

출처: https://mangkyu.tistory.com/286

<MessageBox title='프라이머리 인덱스와 세컨더리 인덱스' level='info'>
  프라이머리 인덱스 = 클러스터인덱스이며, 세컨더리 인덱스 = 논클러스터인덱스이다.
  참고로, 프라이머리키(기본키)를 클러스터키라고 말하기도 한다.
</MessageBox>

## 다중 컬럼 인덱스

다중 컬럼으로 인덱스를 만드는 경우 컬럼의 순서가 중요하다.
앞선 컬럼부터 정렬하며 순서가 같으면 그 다음 컬럼의 순서로 정렬한다.

예를 들어, `(A, 100) -> (B, 50) -> (C, 70) -> (C, 71) -> (C, 80) -> (D, 30)`순으로 정렬된다.

조회 쿼리로 인덱스를 스캔할 때에도 이러한 정렬 규칙에 따라 탐색 로직이 진행된다.

예를 들어, (dept_no, emp_no)로 인덱스를 만들었을 때 아래의 쿼리는 효율적으로 수행된다.
```sql
SELECT 
    dept_no, MIN(emp_no)
FROM
    dept_emp 
WHERE
    dept_no BETWEEN 'D002' AND 'D004'
GROUP BY 
    dept_no;
```

dept_no로 그루핑된 부분에서 첫 번째 emp_no를 뽑으면 된다.

만약 컬럼의 순서를 바꿔서 (emp_no, dept_no)로 인덱스를 만들었다면 쿼리는 조금 더 비효율적으로 수행될 것이다.
emp_no에 따라 먼저 정렬되기 때문에 dept_no는 B-Tree 상에서 여러 노드에 걸쳐 있을 수 있다.
이를 group by와 between 연산으로 묶기 위해 여러 노드에 분산된 dept_no를 찾아야 할 수도 있다.

인덱스를 타는 케이스는 선두 컬럼이 사용될 때, 그리고 모든 컬럼이 사용될 때이다.
그러나 MySQL 8.0부터 인덱스 스킵 스캔이 들어오면서 선두 컬럼이 사용되지 않아도 인덱스를 타는 것이 가능해졌다.

```sql
-- index - (first_name, last_name)인 경우
-- first_name은 선두 컬럼이므로 인덱스를 탄다.
select first_name, last_name from employees where first_name = 'Amily';

-- last_name만 사용하면 선두 컬럼이 사용되지 않았으므로 인덱스를 타지 않는다. (인덱스 스킵 스캔이 없는 경우)
-- 인덱스 스킵 스캔이 있으면 인덱스를 탄다.
select last_name from employees where last_name = 'swift';
```


## 다중 컬럼 인덱스 vs 인덱스 여러 개

다중 컬럼 인덱스는 인덱스 하나이며, 키는 다중 컬럼을 포함하는 객체라고 이해해도 될 것 같다.

![image](https://github.com/user-attachments/assets/fdba3991-f903-4d39-9d64-ba6e2d7ec417)


반대로 컬럼별로 인덱스를 만드는 방식이 있을 수 있다.
이 방식은 쿼리에 컬럼이 사용될 때 각 컬럼의 인덱스를 타는 방식이다.

https://velog.io/@iamtaehoon/%EB%A9%80%ED%8B%B0-%EC%BB%AC%EB%9F%BC-%EC%9D%B8%EB%8D%B1%EC%8A%A4

뭐가 더 좋을까??


## 실행 계획 파헤치기

실행 계획은 SQL문의 최적화 정도를 파악하기 위해 사용한다.
인덱스를 만들어두었다면 SQL문이 인덱스를 잘 타는지 등을 볼 수 있다.

`explain` 키워드로 SQL 실행 계획을 살펴볼 수 있다.

```sql
explain select *, concat(e.first_name, lpad(e.emp_no, 10, '0')) as `cursor` from employees as e where concat(e.first_name, lpad(e.emp_no, 10, '0')) > 'Aamer9999508371' order by e.first_name, e.emp_no limit 10;
```

![image](https://github.com/user-attachments/assets/175d2d4f-b063-4b93-8231-3554c38fe0f1)


- id: `select`에 붙은 번호이다. join의 경우 하나의 select에 포함되므로 같은 id를 갖는다. 반대로 union이나 서브 쿼리 등은 select를 또 쓰기 때문에 다른 id를 갖는다.
- select_type: 대개 SIMPLE로 표시된다. union이나 서브쿼리가 있다면 다른 값으로 표시된다.
- table: 어떤 테이블에 접근하고 있는지를 표시한다. 사용자가 정의한 alias로 표시된다.
- partitions: 파티셔닝이 되어 있는 테이블이 있는 경우 표시된다.
- type: 접근 방식을 의미한다. 접근 방식은 레코드를 어떻게 가져올지에 대한 내용이다. **인덱스를 타는지 안타는지를 알 수 있기 때문에 최적화 정도를 파악하는 중요 지표이다.**

|type|설명|최적화 필요 유무|
|---|---|---|
|const|단건 조회. PK나 UNIQUE 컬럼을 이용하는 WHERE 조건절을 가지며, 반드시 1건을 반환하는 쿼리 처리 방식을 의미한다.|최적화 필요X|
|eq_ref|조인되는 상황에서 표시. 조인에서 처음 읽은 테이블의 컬럼값을 두 번째 테이블의 PK나 UNIQUE 컬럼의 검색 조건으로 사용함을 의미한다.|최적화 필요X|
|ref|eq_ref와 달리 조인의 순서와 관계없으며 PK나 UNIQUE 제약도 없다. 인덱스의 종류와 관계없이 동등 조건으로 검색함을 의미한다.|최적화 필요X|
|fulltext|MYSQL 서버의 전문 검색 인덱스를 사용해 인덱스를 읽는 접근 방법을 의미한다.|확인 필요|
|ref_or_null|ref와 같은 비교 방법이면서 NULL 비교만 추가된 형태|나쁘지 않음|
|unique_subquery|WHERE 조건절에서 사용될 수 있는 IN 형태의 서브쿼리를 의미한다. 서브쿼리는 유니크한 값만 반환한다.|나쁘지 않음|
|index_subquery|IN 사용시 중복된 값을 인덱스를 통해 제거할 수 있을 때 index subquery 방법이 사용된다.|나쁘지 않음|
|range|인덱스 레인지 스캔|나쁘지 않음|
|index_merge|2개 이상의 인덱스를 이용해 각 결과를 만들고, 그 결과들을 병합하여 처리한다.|효율적이지 않음|
|index|인덱스 풀 스캔. 테이블의 특정 인덱스의 전체 엔트리에 접근한다|효율적이지 않음|
|ALL|전체 행 스캔. 전체 레코드에 접근한다|제일 느림|


```sql
-- eq_ref
explain select * from dept_emp de, employees e where e.emp_no = de.emp_no and de.dept_no = 'd005'; 
```

![image](https://github.com/user-attachments/assets/9d265370-1864-498b-b26b-9e45dc963676)


- key: 쿼리 수행에 사용된 인덱스를 의미한다. 인덱스를 사용하지 않았다면 NULL로 표시된다.
- key_len: 다중 컬럼 인덱스에서 몇 개의 컬럼까지 사용했는지를 알려준다.
- ref: 접근 방법이 ref인 경우 참조 조건(동등 비교 조건)으로 어떤 값이 제공됐는지를 보여준다. 상수면 const, 다른 테이블 컬럼값이면 테이블명과 컬럼명이 표시된다.
- rows: 옵티마이저가 예측하는 레코드 체크 갯수. 옵티마이저의 비용 산정 지표가 된다.
- filtered: 필터링되고 남은 레코드의 비율. 옵티마이저가 이 비율이 적은(남은 레코드수가 적은) 테이블을 드라이빙 테이블로 선정한다.
- extra: 쿼리의 실행 계획에서 성능 관련 내용이 자주 표시된다.

|extra|설명|
|---|---|
|const row not found|const로 접근했지만 실제 레코드는 0인 상황.|
|Deleting all rows|테이블의 모든 레코드를 삭제하는 기능을 제공하는 스토리지 엔진 테이블인 경우 제공|
|Distinct|테이블 조인시 특정 컬럼값을 중복없이 가져오는 경우|
|FirstMatch|세미조인 최적화 중 FirstMatch 전략이 사용되는 경우|
|Full sacn on NULL key|`col1 in (select co2 from ...)` 상황에서 `col1`이 NULL이면 서브쿼리에서 테이블 풀 스캔이 발생. col1 is not null과 같은 제약 조건이나 조건절로 최적화 가능하다.|
|Impossible HAVING|HAVING절을 만족하는 레코드가 없을 때 표시된다.|
|Impossible WHERE|WHERE절을 만족하는 레코드가 없을 때 표시된다.|
|LooseScan|세미조인 최적화 중에서 LooseScan 최적화 전략이 사용될 때 표시된다.|
|No mathcing min/max row|`min()`, `max()`가 포함된 쿼리에서 조건절을 만족하는 레코드가 없을 경우 표시된다.|
|no matching row in const table|조인에서 const 방법으로 접근할 때 일치하는 레코드가 없으면 표시된다.|
|No matching rows after partition pruning|파티션된 테이블에 대한 UPDATE 또는 DELETE 수행시 대상 파티션이 없을 경우 표시된다.|
|No table used|FROM 절이 없거나 FROM DURAL 형태의 쿼리가 사용될 때 표시된다.|
|Not exists|아우터 조인을 이용해 안티조인을 수행하는 쿼리에서 표시된다.|
|Start / End Temporary|중복 제거(Duplicated Weed-out) 세미조인 최적화를 사용할 때 표시된다.|
|Using Filesort|ORDER BY를 처리하기 위해 인덱스를 이용할 수 있지만 적절한 인덱스를 찾지 못할 때는 MYSQL 서버가 재정렬해야 한다. 이 때 표시된다. 서버의 재정렬은 많은 부하를 일으키므로 가능하면 쿼리를 튜닝해야 한다.|
|Using index|커버링 인덱스. 데이터 파일을 전혀 읽지 않고 인덱스만 읽어서 쿼리를 모두 처리할 수 있을 때 표시된다.|
|Using index conditions|인덱스 푸시 다운 최적화를 사용할 때 표시된다.|
|Using index for group-by|GROUP BY 처리를 위해 MySQL 서버는 그루핑 기준 컬럼을 정렬하고 결과를 그루핑한다. 이러한 작업은 많은 부하를 일으키므로 그루핑 기준 컬럼을 인덱스로 사용하는 방법을 고려해볼 수 있다.(루스 인덱스 스캔) 이 경우에 해당 문구가 표시된다.|
|Using index for skip scan|옵티마이저가 인덱스 스킵 스캔 최적화를 사용하면 해당 문구가 표시된다.|
|Using join buffer|조인시 드리븐 테이블에 설정된 컬럼에 인덱스가 없는 경우 블록 네스티드 루프 조인, 해시 조인 등을 사용하는데 이 때 
 해당 문구가 표시된다.|
 |Using MRR|MRR 최적화가 사용될 때 표시된다.|
 |Using where|MySQL 엔진에서 스토리지 엔진으로부터 받은 레코드를 필터링해서 처리함을 의미한다. 보통 인덱스에 포함되지 않는 컬럼을 조건문으로 사용할 때 표시된다.|


https://cheese10yun.github.io/mysql-explian/

https://velog.io/@ddongh1122/MySQL-%EC%8B%A4%ED%96%89%EA%B3%84%ED%9A%8D2-EXPLAIN

## 인덱스를 언제 타는가?

- 인덱스와 동일한 정렬의 쿼리이면 -> 인덱스 탄다.
  - 멀티 컬럼 인덱스를 만든 경우 컬럼의 정렬 우선순위와 정렬 기준이 동일해야 한다.
- 컬럼별로 인덱스를 만든 경우에,
  - 인덱스로 만든 컬럼 하나로 정렬하는 쿼리 -> 인덱스 탄다.
  - 인덱스로 만든 컬럼 여러 개로 정렬하는 쿼리
    - 여러 개의 컬럼을 전부 같은 정렬 기준으로 정렬하는 쿼리(ASC면 ASC로 통일, DESC면 DESC로 통일)일 경우 -> 인덱스 탄다.
    - 여러 개의 컬럼을 다른 정렬 기준으로 정렬하는 쿼리(ASC와 DESC가 섞여 있는 쿼리)일 경우 -> **인덱스를 타지 않는다.**
      - 이 경우에는 멀티 컬럼 인덱스를 만들되, 각 컬럼이 쿼리의 정렬 방법과 동일해야 한다.

<hr />

#### 싱글 컬럼 인덱스

- 여러 개의 컬럼을 전부 같은 정렬 기준으로 정렬하는 쿼리
```sql
explain select *, concat(e.first_name, lpad(e.emp_no, 10, '0')) as `cursor` from employees as e order by e.first_name, e.emp_no limit 10;
explain select *, concat(e.first_name, lpad(e.emp_no, 10, '0')) as `cursor` from employees as e order by e.first_name DESC, e.emp_no DESC limit 10;
```

인덱스를 탄다.

![image](https://github.com/user-attachments/assets/ec0d08a2-e5c0-46d3-a56f-8b9d7806f1c7)


- 여러 개의 컬럼을 다른 정렬 기준으로 정렬하는 쿼리
```sql
explain select *, concat(e.first_name, lpad(e.emp_no, 10, '0')) as `cursor` from employees as e order by e.first_name, e.emp_no desc limit 10;
explain select *, concat(e.first_name, lpad(e.emp_no, 10, '0')) as `cursor` from employees as e order by e.emp_no desc, e.first_name limit 10;
```

인덱스를 타지 않는다.

![image](https://github.com/user-attachments/assets/4eb5dcf9-3c0d-4f5e-95cc-a1c1fb46f063)


#### 멀티 컬럼 인덱스

인덱스를 설정할 때 각 컬럼의 ordering을 어떻게 설정하느냐에 따라 인덱스를 탈 수도 있고 안 탈수도 있다.

테스트한 바로는 우선 설정한 인덱스의 ordering과 동일한 ordering을 갖는 쿼리는 인덱스를 탄다.

인덱스는 다음과 같이 멀티 컬럼 인덱스를 설정하였다. 
first_name부터 정렬한 뒤 같으면 emp_no를 따진다. emp_no는 PK이기 때문에 중복이 없다.
first_name은 ASC, emp_no(PK) DESC가 정렬 기준이다.

```sql
alter table employees add INDEX firstname_empno (first_name ASC, emp_no DESC) using btree;
```

그리고 인덱스 정렬 순서와 기준에 동일한 쿼리를 실행한다.

```sql
explain select *, concat(e.first_name, lpad(e.emp_no, 10, '0')) as `cursor` from employees as e order by e.first_name, e.emp_no desc limit 10;
```

결과는 인덱스를 타는 것으로 나온다.

![image](https://github.com/user-attachments/assets/c8823f68-f427-4904-9325-2135fdf446be)

그러나 컬럼 순서를 바꾸거나 컬럼의 정렬 기준을 바꾸면 인덱스를 타지 않는다.

- 컬럼의 순서를 바꾸는 경우

```sql
explain select *, concat(e.first_name, lpad(e.emp_no, 10, '0')) as `cursor` from employees as e order by e.emp_no desc, e.first_name limit 10;
```

![image](https://github.com/user-attachments/assets/06c2204e-780e-41d9-b397-f4b29fa6ef99)

- 컬럼의 정렬 기준을 바꾸는 경우

```sql
explain select *, concat(e.first_name, lpad(e.emp_no, 10, '0')) as `cursor` from employees as e order by e.first_name, e.emp_no limit 10;
explain select *, concat(e.first_name, lpad(e.emp_no, 10, '0')) as `cursor` from employees as e order by e.first_name DESC, e.emp_no DESC limit 10;
```

![image](https://github.com/user-attachments/assets/f70c3652-6e67-4611-84c5-a2107dcd68d8)


## 어센딩 인덱스와 디센딩 인덱스

[이 글](https://tech.kakao.com/posts/351)에 따르면, 역순 탐색이 특정한 경우에 느릴 수 있다고 한다.
(`select col from table order by col desc limit 1000`)

이는 스토리지 엔진 수준에서 정순 방향으로 잠금을 획득하도록 되어 있기 때문이다.
역순 방향으로 조회할 때 스토리지 내부적으로 페이지를 조회하기 위해 잠금 획득을 시도하는데, 동일한 페이지를 조회하는 쿼리가 동시에 많이 발생하면 페이지 잠금 획득 경쟁으로 인한 지연이 발생한다.

특히, 필요한 레코드 갯수가 한 페이지가 담는 레코드 갯수보다 많으면 잠금 획득 시도 또한 많아지므로 지연이 더 발생한다.

그래서 정순 방향의 인덱스를 만드는 것이 성능상 유리할 수 있다.
결국 어센딩 인덱스는 오름차순 데이터를 위해, 디센딩 인덱스는 내림차순 데이터를 위해 만드는 것이다.

## 인덱스가 안 타는 경우 (or 등)

- Like 검색: 문자열 앞부분에 `%`를 두면 인덱스를 탈 수 없음.
  - `INSTR`도 마찬가지.
- OR 조건식: OR에 걸린 조건들이 모두 인덱스로 만들어져 있지 않는 한, 인덱스를 타지 않는다.
  - 인덱스 + 테이블 풀 스캔보다 그냥 1번의 테이블 풀 스캔이 더 낫기 때문이다.
- 형변환: 인덱스 컬럼을 형변환해서 쿼리에 사용하면 인덱스가 걸리지 않는다. (조건식 오른편에 형변환을 하면 인덱스가 걸린다)
  - `select * from salaries where cast(salary as char) = "0";`: 인덱스 안 걸림.
  - `select * from salaries where salary = (0 as char);`: 인덱스 걸림.

계산식, 부정문, 문자열 처리 등은 MySQL 8.0에서는 인덱스가 잘 걸리는 것으로 테스트함.

https://jaehoney.tistory.com/139
