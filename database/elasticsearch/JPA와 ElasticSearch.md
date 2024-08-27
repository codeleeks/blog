## Dirty Checking을 지원하지 않는다?

```java
@Service
@Transactional
@RequiredArgsConstructor
public class PostIndexService {
    private final PostIndexRepository postIndexRepository;

    public String save(Post post) {
        ArrayList<String> categories = new ArrayList<>();
        categories.add(post.getCategory().getName());

        PostIndex postIndex = PostIndex.builder()
                .title(post.getTitle())
                .contents(post.getContents())
                .categories(categories)
                .postId(post.getId())
                .build();

        PostIndex saved = postIndexRepository.save(postIndex);
        System.out.println("saved.getId() = " + saved.getId());
        return saved.getId();
    }

    public void update(Post post) {
        PostIndex postIndex = postIndexRepository.findByPostId(post.getId())
                .orElseThrow(IllegalArgumentException::new);

        postIndex.setTitle(post.getTitle());
        postIndex.setContents(post.getContents());

        if (post.getEvent().isCategoryMoved()) {
            postIndex.getCategories().remove(post.getEvent().getOldCategory());
            postIndex.getCategories().add(post.getEvent().getNewCategory());
        }

        postIndexRepository.save(postIndex);
    }
```

`update` 메서드에서도 레포지토리의 `save`가 필요하다.
그렇지 않으면 디비에 반영되지 않는다.
아예 쿼리(http 콜)이 나가지 않는다.

아마 RDB와는 달리 더티 체킹이 지원되지 않는 것으로 보인다.

## Save의 이상함

```java
@Service
@Transactional
@RequiredArgsConstructor
public class PostIndexService {
    private final PostIndexRepository postIndexRepository;

    public String save(Post post) {
        ArrayList<String> categories = new ArrayList<>();
        categories.add(post.getCategory().getName());

        PostIndex postIndex = PostIndex.builder()
                .title(post.getTitle())
                .contents(post.getContents())
                .categories(categories)
                .postId(post.getId())
                .build();

        PostIndex saved = postIndexRepository.save(postIndex);
        System.out.println("saved.getId() = " + saved.getId());
        return saved.getId();
    }
```

`save` 메서드를 호출하면 디비에 저장되면서 id를 획득한다.
이 id는 도큐먼트가 저장될 때 사용되는 내부 id이다.(`_id` 컬럼)

`save` 후에 `@Id`가 매겨진 필드에 `_id`의 값이 들어간다.
이후 업데이트와 같은 메서드에서 `save`를 하게 되면 `id` 필드가 새로 생긴다.

그래서 `_id`와 `id` 컬럼이 중복으로 생긴다.

![image](https://github.com/user-attachments/assets/096dce19-9aa6-41ba-b481-7f0735af23c0)
