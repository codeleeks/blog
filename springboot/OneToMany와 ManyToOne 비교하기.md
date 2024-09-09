## 삭제하기

포스트와 코멘트 관계를 보자.
ManyToOne 관계로 개발했다면, 코멘트가 포스트를 레퍼런스하고 있는 상황이다. 

코멘트를 삭제하려면 코멘트 테이블에서 레코드를 삭제하면 된다.
포스트를 알 필요가 없다.

그런데 포스트를 삭제하려면 포스트와 연관된 코멘트들을 모두 삭제해야 한다.
외래키 무결성 제약 조건이 걸려 있다면 코멘트를 먼저 삭제하지 않아 에러가 발생하기도 한다.
그래서 포스트를 삭제하는 서비스 객체는 코멘트 테이블에서 해당 포스트에 레퍼런스하고 있는 코멘트 리스트를 얻고, 이들을 먼저 삭제해야 한다.

만약 코멘트 또한 어떤 테이블에 의해 레퍼런스를 받고 있는 상황이라면? 
예를 들어 코멘트에 대한 대댓글이 달릴 때 알림을 줄 수 있도록 코멘트알림 테이블이라는 게 있고, 이 코멘트알림 테이블이 코멘트를 레퍼런스하고 있다고 하자.
그러면 포스트를 삭제하면 연관된 코멘트를 삭제해야 하고, 연관된 코멘트를 삭제하려면 이 코멘트와 연관된 코멘트알림 테이블의 레코드들을 먼저 삭제해야 한다.

> 코멘트알림 -> 코멘트 -> 포스트 순으로 삭제해야 한다.

결국 테이블 간 디펜던시 트리를 파악하고 리프에 해당하는 테이블의 레코드들부터 삭제하기 시작하여 루트에 해당하는 테이블의 레코드까지 순차적으로 삭제해야 한다.
이러한 로직을 코드로 구현해야 한다.

```java

public class PostService {
  private final PostRepository postRepository;
  private final CommentRepository commentRepository;
  private final CommentAlarmRepository commentAlarmRepository;

  public void deleteById(Long id) {
    commentRepository.findByPostId(id)
        .forEach(c -> {
          commentAlarmRepository.findByCommentId(c.getId())
            .forEach(ca -> {
              commentAlarmRepository.deleteById(ca.getId());
            });
          commentRepository.deleteById(c.getId());
        });
    postRepository.deleteById(id);
  }
}

```

코드가 좀 복잡해보인다.

만약 OneToMany 관계였다면 어떨까? cascade와 orphanRemoval 옵션을 주면 연관관계에 있는 엔티티와 생명주기를 같이 가져갈 수 있다.
그래서 코드는 깔끔해진다.

```java
public class PostService {
  private final PostRepository postRepository;

  public void deleteById(Long id) {
    postRepository.deleteById(id);
  }
}
```

하지만 N+1 문제가 발생한다.
fetch의 경우는 batch size 설정으로 어느 정도 해결할 수 있지만, 삭제의 경우 삭제할 id 기반으로 하나씩 실행된다.

```bash
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from commentv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from commentv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from commentv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from commentv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from comment_alarmv2 where id=?
Hibernate: delete from commentv2 where id=?
Hibernate: delete from postv2 where id=?
```
postv2 레코드 하나를 지우기 위해 연관된 commentv2 레코드 5개와 각 commentv2 레코드와 연관된 comment_alarmv2 레코드 5개를 하나 하나 지우고 있다.

삭제 성능이 중요하다면 jpql로 작성하든 native query를 사용하든 엔티티 간 디펜던시를 파악해서 정교한 삭제 코드를 작성해야 한다.
그런데 이렇게 하려고 하면 ManyToOne에서 발생했던 문제와 같은 문제가 된다.

## ManyToOne 관계에서 `@OnDelete` 사용하기

ManyToOne에서 삭제할 때는 코드의 복잡성이 늘어난다. 자신을 레퍼런스하고 있는 엔티티를 파악하고 해당 엔티티부터 먼저 삭제해야 하기 때문이다.
이 문제를 해결하는 방법은 몇 가지가 있는데, 그 중 하나는 `@OnDelete`이다.

`@OnDelete`는 외래키 제약 조건에 delete 정책을 설정하는 어노테이션이다. 이 정책을 cascade로 설정하면 레퍼런스하고 있는 엔티티가 삭제되면 자기 엔티티도 삭제된다.
이렇게 하면 심지어 연관된 엔티티에 대한 삭제 쿼리 조차도 나가지 않는다. 나갈 필요가 없다. 디비 자체적으로 처리하기 때문이다.

```bash
Hibernate: delete from postv1 where id=?
```
postv1만 지우면 연관된 테이블의 레코드가 모두 지워진다.

## 결론

삭제의 경우 ManyToOne은 자신을 레퍼런스하고 있는 엔티티를 알아야 하기 때문에 코드가 복잡해질 수 있다.
OneToMany는 코드가 깔끔해지지만, N+1 문제가 발생한다. 연관된 엔티티 디펜던시 트리가 깊어질 수록 N+1 문제는 더 심각해진다.



