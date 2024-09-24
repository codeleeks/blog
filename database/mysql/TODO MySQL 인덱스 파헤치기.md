## 인덱스

- B-Tree 구조
  - root node, branch node, leaf node로 구성.
  - 키를 기반으로 항상 정렬되어 있다.
 
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

https://tech.kakao.com/posts/351

## 인덱스가 안 타는 경우 (or 등)

https://jaehoney.tistory.com/139
