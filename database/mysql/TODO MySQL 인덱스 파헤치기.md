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

https://cheese10yun.github.io/mysql-explian/

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
