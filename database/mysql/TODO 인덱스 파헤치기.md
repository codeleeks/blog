## 인덱스

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
