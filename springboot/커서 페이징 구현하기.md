## 커서 페이징

offset paging은 offset 만큼 레코드를 이동한 뒤 limit 만큼의 레코드만 잘라서 반환한다.

```sql
-- 1페이지
select * from products limit 0, 10;

-- 2페이지
select * from products limit 10, 10;
```

전체 레코드의 중간 offset을 요청한다면 forward scan이든 backward scan이든 offset만큼 이동해야 한다.
이 쿼리를 많은 사용자가 호출한다면, 성능에 문제가 있을 수 있다.

또한, 단순히 레코드 offset으로 페이징하기 때문에 레코드가 삽입/삭제/수정이 잦은 테이블인 경우에 페이징 결과물에서 중복된 데이터가 보이거나 보여야할 데이터가 사라질 수 있다.
예를 들어, 1페이지에서 1번부터 20번까지 20개의 레코드를 가져오고 난 뒤 다음 페이지로 이동하려는데, 20번 레코드를 삭제했다면 2페이지에서 21번 레코드가 안 보이게 된다.
1페이지에 해당하는 레코드가 되어버렸기 때문이다.

이러한 문제를 해결하려면 커서 페이징을 사용해야 한다.

커서 페이징은 커서 역할을 하는 컬럼을 선택해서 where이나 having 절로 필터링하는 방법이다.
```sql
-- 1페이지
select * from products limit 10;

-- 2페이지
select * from products as p where p.id > 20 limit 10;
```

## 멀티 컬럼 커서 페이징

결국 or 연산 필요.
https://velog.io/@minsangk/%EC%BB%A4%EC%84%9C-%EA%B8%B0%EB%B0%98-%ED%8E%98%EC%9D%B4%EC%A7%80%EB%84%A4%EC%9D%B4%EC%85%98-Cursor-based-Pagination-%EA%B5%AC%ED%98%84%ED%95%98%EA%B8%B0#%EC%BC%80%EC%9D%B4%EC%8A%A4-price-desc-id-desc-%EC%BB%A4%EC%8A%A4%ED%85%80-cursor-%EC%83%9D%EC%84%B1

https://stackoverflow.com/questions/38017054/mysql-cursor-based-pagination-with-multiple-columns

https://velog.io/@znftm97/%EC%BB%A4%EC%84%9C-%EA%B8%B0%EB%B0%98-%ED%8E%98%EC%9D%B4%EC%A7%80%EB%84%A4%EC%9D%B4%EC%85%98Cursor-based-Pagination%EC%9D%B4%EB%9E%80-Querydsl%EB%A1%9C-%EA%B5%AC%ED%98%84%EA%B9%8C%EC%A7%80-so3v8mi2

## 인덱스와 커서 페이징

멀티 컬럼 커서 페이징할 때 문제는 OR가 인덱스를 타지 않는다는 점이다.

(테스트를 해보면, 인덱스를 타지 않는 것이 항상 문제가 되는 것은 아닌 것 같다.

실무에서는 요구 사항에 따라 정렬이 필요한 컬럼이 많을 수도 있고, join 등 좀 더 복잡한 쿼리가 필요할 때에는 성능이 다를 수 있다.
그래서 성능 최적화가 필요한 쿼리를 여러 가지 옵션으로 테스트해봐야 한다.
즉, 인덱스를 탈 경우와 안 탈 경우에 쿼리 성능이 어떻게 되는지 실제로 테스트해봐야 한다.

우리가 해볼 수 있는 옵션이 많다면 보다 많은 상황에 대처할 수 있기에 인덱스를 타게 하는 방법도 알아야 한다.
그래서 여기서는 인덱스를 안 타는 것이 문제라고 정의하겠다.)

이 때는 커스텀 커서를 만들어야 한다.

having도 인덱스를 타지 않으므로 where을 억지로라도 써야 한다.
where은 generated column을 조건으로 사용할 수 없다는 제약이 있어서 쿼리가 복잡해지긴 한다.

```sql
-- Aamer9999508371는 이전 페이지의 마지막 레코드의 커서값
select *, concat(e.first_name, lpad(pow(10, 10) - e.emp_no, 10, '0')) as `cursor` from employees as e where concat(e.first_name, lpad(pow(10, 10) - e.emp_no, 10, '0')) < 'Aamer9999508371' order by e.first_name, e.emp_no desc limit 10;
```
![image](https://github.com/user-attachments/assets/f6fe40a1-036e-4861-a497-4a7fce0eddba)

인덱스를 잘 탄다.


