## 엔티티 자기 참조(entity self reference)

### `@OneToMany` 방식
카테고리는 서브 카테고리를 가질 수 있다.

엔티티로 구현하면 다음과 같다.

```java
package blog.main.domain;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EqualsAndHashCode
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(length = 50)
    private String name;

    @Builder
    public Category(Long id, String name) {
        this.id = id;
        this.name = name;
    }

    @OneToMany
    private List<Category> children = new ArrayList<>();

    public void updateName(String name) {
        this.name = name;
    }

    public void addChild(Category category) {
        children.add(category);
    }
}
```

`@OneToMany`를 써서 서브 카테고리를 리스트로 저장한다.

이렇게 하면 테이블은 `category`와 `category_children`로 잡힌다.

문제는 서브 카테고리 조회가 안 된다.
```java
 @Transactional
    @PostConstruct
    public void init() {
        Category p1 = Category.builder()
                .name("p1")
                .build();

        categoryRepository.save(p1);

        Category c1 = Category.builder()
                .name("c1")
                .build();

        categoryRepository.save(c1);

        Category c2 = Category.builder()
                .name("c2")
                .build();

        categoryRepository.save(c2);

        Category c3 = Category.builder()
                .name("c3")
                .build();

        categoryRepository.save(c3);

        p1.addChild(c1);
        p1.addChild(c2);
        p1.addChild(c3);

    }
```

인서트는 가능한 것처럼 보이지만, 실제 `category_children` 테이블에 레코드가 들어가지 않는다.
`category` 테이블에는 레코드가 보인다.

![image](https://github.com/user-attachments/assets/45da79c8-338e-424e-baed-ead279a3f606)

그런데 아래와 같이 코드를 작성하면 `category_children` 테이블과 조인해서 `children` 필드를 채우기 때문에 서브 카테고리 조회가 안 된다.

```java
    public Category findOne(Long id) {
        List<Category> children = categoryRepository.findById(id)
                .get()
                .getChildren();

        for (Category child : children) {
            System.out.println("child.getName() = " + child.getName());
        }

        return categoryRepository.findById(id)
                .orElseThrow(IllegalArgumentException::new);
    }
```
```bash
Hibernate: select c1_0.category_id,c1_1.id,c1_1.name from category_children c1_0 join category c1_1 on c1_1.id=c1_0.children_id where c1_0.category_id=?
```

이를 가능케 하는 다른 옵션이나 방법이 있을 수 있다.

그러나 나는 `@ManyToOne` 방식으로 문제를 해결하려 한다.

### `@ManyToOne` 방식

부모가 없는 경우는 자기 자신을 부모로 선정한다.
이 경우 외래키에 자기 id를 넣어야 하는데, 자기 id는 save한 이후에야 얻을 수 있다.
그래서 추가로 외래키 필드에 대한 업데이트 쿼리가 나간다.

```java
    @Transactional
    @PostConstruct
    public void init() {
        Category p1 = Category.builder()
                .name("p1")
                .build();
        p1.setParent(p1);

        categoryRepository.save(p1);
```
```bash
Hibernate: insert into category (name,parent_id) values (?,?) returning id
Hibernate: update category set name=?,parent_id=? where id=?
Hibernate: insert into category (name,parent_id) values (?,?) returning id
```

조회는 자기 참조이기 때문에 엔티티에 참조 정보까지 들어 있다.
그래서 하나의 select만 나간다.

```java
    public List<CategoryResponse> findAll() {
        return categoryRepository.findAll()
                .stream().map(CategoryResponse::from)
                .toList();
    }
```
```bash
Hibernate: select c1_0.id,c1_0.name,c1_0.parent_id from category c1_0
```

## `@OneToMany`와 `@JoinColumn`

일대다 연관 관계로 가져가려면 `@OneToMany`를 사용한다.

이 때, `@JoinColumn`을 적지 않으면 JPA는 연결 테이블을 만든다.

예를 들어, Post가 Comment 리스트를 가질 때 테이블은 POST, COMMENT, POST_COMMENT 이렇게 3개가 생긴다.
POST_COMMNENT가 연결테이블이다.
특별한 이유가 없다면 보통 연결테이블은 불필요하다.

`@JoinColumn`을 쓰면 연결테이블 없이 대상 테이블에 외래키가 생성된다.

```java
@Entity
@Getter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Lob
    private String contents;

    @ManyToOne
    private Category category;

    private Long likes;

    @Builder.Default
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "comments")
    private List<Comment> comments = new ArrayList<>();
}
```
