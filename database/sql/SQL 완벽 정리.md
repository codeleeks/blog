## 테이블 설계 방법론
- what kind of thing are we storing?
  - ➡️ we are storing a list of cities
  - ➡️ `table`
- what properties does this thing have?
  - ➡️ Each city has a name, country, population and area
  - ➡️ `columns`
- what type of data does each of those properties contain?
  - ➡️ the type of name, country, population, area is string, string, number, number
  - ➡️ `type of each column`

테이블 디자인할 땐
1. 기능별로 테이블을 나눈다.
2. 기능 간의 관계를 분석하고, 테이블 간의 관계를 형성한다.

테이블 간의 관계를 어떻게 형성하느냐?

테이블 간의 관계는 네 가지로 정리한다.

## 테이블 간의 관계
- One-to-Many
  - User has many photos
- Many-to-One
  - A Photo has one user
- One-to-One
  - team has one captain.
- Many-to-Many
  - students has many classes.

관계 형성시 `foreign key`를 이용한다.

`foreign key`는 다른 테이블의 레코드를 식별(매핑)한다. 실질적으로 다른 테이블의 `primary key`와 매핑한다.

`primary key`는 레코드 식별자이다.

테이블 관계에서 `Many` 쪽이 `foreign key`를 갖는다.
같은 `foreign key`를 갖는 레코드는 많아도 되지만, 같은 `primary key`를 갖는 레코드는 유일해야 하기 때문이다.

### 테이블 간 관계 설정하기

```sql
--   serial은 incremental intger
CREATE table users (
 	id serial PRIMARY key,
  username VARCHAR(50)
  
 );

CREATE table photos (
  	id serial PRIMARY key,
  	url varchar(200),
  	user_id integer REFERENCES users(id)
  );
```

### 여러 테이블에서 필요한 컬럼을 조합하기
List all photos with details about the associated user for each 

```sql
select * FROM photos
JOIN users on users.id = photos.user_id;
```

### foreign key와 삽입

- User has the photo : works ok.
- User doesn't have the photo: error 
- The photo isn't tied to any user: works ok. (putting in 'null' for the user_id)

### primary key와 삭제 (`foreign key constraint`)

foreign key가 primary key에 연결되어 있는 테이블이 있는 경우에 

primary key를 갖는 레코드를 삭제할 경우 foreign key 레코드를 어떻게 처리할지가 애매하다.

예를 들어, 사용자를 삭제했는데, 사용자가 갖고 있던 사진들을 어떻게 처리할 것인가?

데이터베이스는 5가지 옵션을 제공한다.

- ON DELETE RESTRICT: 에러 발생 (기본 옵션)
- ON DELETE NO ACTION: 에러 발생
- ON DELETE CASCADE: 사진들도 삭제한다
- ON DELETE SET NULL: foreign key 값을 NULL로 수정한다.
- ON DELETE SET DEFAULT: foreign key 값을 디폴트값으로 수정한다.

```sql
CREATE TABLE photos (
id SERIAL PRIMARY KEY,
url VARCHAR(200),
user_id INTEGER REFERENCES users(id) on DELETE CASCADE
);
```

### joins and aggregation

- joins: 여러 테이블에서 컬럼을 합치는 것.
- aggregation: 특정 컬럼의 여러 레코드에 대한 통계를 내는 것(합계, 평균 등)

#### join
join이 등장하면 가상의 테이블을 만든다 생각하자.
가상의 테이블은 여러 테이블을 합쳐서 만든다.

만드는 순서는 from절 테이블을 복사하고, join절 테이블을 가져오는데, on에 부합하는 레코드만 남긴다.

```sql
select contents, username 
FROM COMMENTS
JOIN users on users.id = comments.user_id;
```

세 개 이상의 테이블을 조인할 때에는 join를 한 번 더 사용한다.

```sql
select url, contents, username
FROM COMMENTS
JOIN photos on photos.id = comments.photo_id
JOIN users on users.id = comments.user_id AND users.id = photos.user_id;
```

#### join의 종류

![image](https://github.com/codeleeks/blog/assets/166087781/040bf778-41fd-41a7-966e-41847b7e5412)
ref: https://www.udemy.com/course/sql-and-postgresql/

- inner join: 교집합. (디폴트 설정)
  - foreign key 매칭이 안 되면 레코드를 버린다.
  - primary key 매칭이 안 되면 레코드를 버린다.

```sql 
select url, username from photos join users on users.id = photos.user_id
```

![image](https://github.com/codeleeks/blog/assets/166087781/155bc987-98a1-491f-bca8-f8dd91997e35)
ref: https://www.udemy.com/course/sql-and-postgresql/

- left outer join (from절 테이블꺼는 다 가져간다)
  - foreign key 매칭이 안 되어도 레코드를 버리지 않는다. empty 값으로 채워서 추가한다.
  - primary key 매칭이 안 되면 레코드를 버린다.

```sql
select url, username from photos left join users on users.id = photos.user_id
```

![image](https://github.com/codeleeks/blog/assets/166087781/05ebc9da-9480-4c07-bf69-1f7621664af9)
ref: https://www.udemy.com/course/sql-and-postgresql/

- right outer join (조인 테이블꺼는 다 가져간다)
  - foreign key 매칭이 안 되면 레코드를 버린다.
  - primary key 매칭이 안 되어도 레코드를 버리지 않는다. empty 값으로 채워서 추가한다.

```sql
select url, username from photos right join users on users.id = photos.user_id
```

![image](https://github.com/codeleeks/blog/assets/166087781/ccaa0827-37be-4bdf-b7c4-c7dd4ad26960)
ref: https://www.udemy.com/course/sql-and-postgresql/

- full join: 합집합
  - foreign key 매칭이 안 되어도 레코드를 버리지 않는다. empty 값으로 채워서 추가한다.
  - primary key 매칭이 안 되어도 레코드를 버리지 않는다. empty 값으로 채워서 추가한다.

```sql
select url, username from photos full join users on users.id = photos.user_id
```

#### aggregation
- grouping: 여러 레코드를 더 적은 여러 레코드로 줄인다.
- aggregates: 동일한 컬럼의 여러 레코드 값을 하나의 값으로 줄인다.

##### grouping (group by)

grouping은 특정 컬럼을 기준으로 레코드를 그룹핑한다.

![image](https://github.com/codeleeks/blog/assets/166087781/1bc93f72-e71a-41df-8dd8-88d884495401)

grouping된 레코드는 기존의 컬럼값을 조회할 수 없다.
기존의 컬럼은 그룹의 서브 컬럼이 되었기 때문이다.
그룹핑된 레코드들은 aggregates 함수를 사용해서 컬럼값을 가져와야 한다.

##### aggregates

컬럼을 선택하면서 aggregates 함수를 동시에 사용할 수 없다.

```sql
-- 에러 발생
-- select sum(id), id   
-- from comments;

-- 정상 동작
select sum(id)
from comments;
```

`group by`로 그룹핑된 레코드들을 aggregate 할 수 있다.

```sql
select photo_id, count(*)
FROM comments
group BY comments.photo_id;
```

주요 aggregates 함수는,

- `count()`: 갯수를 센다
- `sum()`: 값을 더한다
- `avg()`: 평균을 낸다

### having

그룹을 필터링한다.

`group by`로 그룹핑한 뒤에 `having` 절 조건으로 그룹을 필터링한다.

`having`절 조건은 aggregates 함수가 사용될 수 있다.

```sql
select photo_id, count(*)
from photos
where photo_id < 3
group by photo_id
having count(*) > 2;
```

### Sorting

레코드를 정렬한다.

첫 번째 정렬 조건에서 같은 것이 나오면, 두 번째 정렬 조건을 따진다.

ASC는 디폴트이다.

```sql
select *
FROM products
order BY price, weight desc;
```

### Offset and Limit

- offset: skip할 레코드 갯수
- limit: 결과 레코드 갯수

```sql
  select *
	FROM products
	order BY price desc
  offset 9
	LIMIT 10;
```

### union

`select` 절의 결과를 합친다. (합집합)

중복 레코드는 디폴트로 제외한다.

포함하려면 `union all`을 사용한다.

```sql
(
  select *
	FROM products
	order BY price desc
	LIMIT 4
)
UNION
(
	SELECT *
  FROM products
  order BY price / weight DESC
  LIMIT 4
);
```

<MessageBox title='union과 괄호' level='warning`>
  union 적용할 때는 select 절에 order by, limit 등이 union에 영향을 미치기 때문에 괄호를 잘 써줘야 한다.
</MessageBox>

<MessageBox title='union과 타입' level='warning`>
  union은 레코드를 합치는 것이라, select 결과의 컬럼 타입이 맞지 않으면 오류가 난다.

  ```sql
  -- name과 price 컬럼의 타입 미스매치로 오류 발생
  select name from products
  union
  select price from products;
  ```
</MessageBox>

### intersect

`select` 절의 결과에서 공통 레코드를 구한다. (교집합)

### except

`select` 절의 결과에서 첫 번째 결과에만 있는 레코드만 남는다. (차집합)

```sql
(
  select *
	FROM products
	order BY price desc
	LIMIT 4
)
except
(
	SELECT *
  FROM products
  order BY price / weight DESC
  LIMIT 4
);
```


## subquery

쿼리 안에 쿼리를 또 쓰는 것.

쿼리의 결과를 소스로 사용하기 위해 쓴다.
(order의 user_id별 count를 구하고, user 당 평균 order 갯수를 구한다. -> group by와 count로 user 별 order count를 구하고, order 테이블에서 count의 avg를 구한다.)

- source of a value
- source of rows
- source of a column

![스크린샷 2024-07-05 112504](https://github.com/codeleeks/blog/assets/166087781/a8a8607a-4537-447a-967c-c42ee6ac5ddb)


### select 절에서 subquery

source of a value를 반환하는 subquery를 사용한다.

### from 절에서 subquery

compatible한 결과를 반환하는 subquery를 사용한다.

subquery의 결과는 `as`로 이름을 주어야 한다.

```sql
select name, price_weight_ratio
FROM (
  select name, price / weight as price_weight_ratio
  FROM products
) as p
WHERE price_weight_ratio > 5;
```

```sql
select *
from (select max(price) from products) as p
```

### join 절에서 subquery

compatible한 결과를 반환하는 subquery를 사용한다. (on 절에서 사용할 컬럼과 compatible해야 함)

subquery의 결과는 `as`로 이름을 주어야 한다.

```sql
select first_name
FROM users
JOIN (
  	select user_id FROM orders WHERE product_id = 3
  ) as o
  ON o.user_id = users.id
```

### where절에서 subquery

compatible한 결과를 반환하는 subquery를 사용한다.

subquery의 결과는 `as`로 이름을 주지 않아도 된다.

```sql
select id
FROM orders
WHERE product_id in (
  	select id FROM products WHERE price / weight > 50
  )
```

where 절에서 subquery의 결과를 비교하는 특별한 연산자를 제공한다.
- ALL: 모든 레코드가 만족해야 한다.
- SOME: 적어도 하나의 레코드만 만족하면 된다.


#### `ALL`

모든 레코드가 만족해야 한다.

```sql
-- Industrial 부서의 모든 products의 price보다 큰 price를 갖는 product을 찾는다.
select name, department, price
FROM products
WHERE price > ALL (
   select price FROM products WHERE department = 'Industrial'
  )
```

#### `SOME`

subquery의 결과 중에 적어도 하나의 레코드만 만족하면 된다.

```sql
-- Industrial 부서의 모든 products 중에 적어도 하나의 price보다 큰 price를 갖는 product을 찾는다.
select name, department, price
FROM products
WHERE price > some (
   select price FROM products WHERE department = 'Industrial'
  )
```

### correlated subqueries

subquery에서 바깥 쿼리의 레코드에 접근할 수 있다.

이중 for-loop으로 생각하면 된다.
바깥 쿼리는 바깥 루프, 서브 쿼리는 안쪽 루프이다.

```sql
select name, department, price
FROM products as p1
WHERE p1.price = (
 	select max(price) 
  FROM products as p2
  WHERE p2.department = p1.department
 );
```

```sql
select
(
  select max(price) from phones
),
(
  select avg(price) from phones
);
```


## distinct

중복을 제거한다.

```sql
-- 여러 컬럼에 대한 count는 허용하지 않음.
-- select count(DISTINCT department, name)
-- FROM products;

select count(DISTINCT department)
FROM products;

select count(DISTINCT department, name)
FROM products;
```

## greatest

여러 값 중 가장 큰 값을 선택한다.

```sql
select name, weight, GREATEST(30, 2 * weight)
FROM products;
```

## least

여러 값 중 가장 작은 값을 선택한다.

```sql
select name, price, LEAST(price * 0.5, 400)
FROM products;

select least(30, 40, 50, 60);
```

## case

switch 문처럼 사용한다.

```sql
SELECT
  name,
  price,
  CASE
    when price > 600 THEN 'high'
    when price > 300 THEN 'medium'
    ELSE 'cheap'
  END
 FROM products;
```
