---
summary: react의 기본적인 기술에 대해 정리한다.
date: 2024-05-08
title-image: ''
---

## 모달 다루기

[코드로 보기](https://codepen.io/kasong-lee/pen/oNRNXvE)

### 컴포넌트 만들기

- `<dialog>` 요소 사용.
- `forwardRef`로 ref를 외부에서 주입 받을 수 있게 준비하기.
- `createPortals`로 root가 아닌 modal 루트에 요소가 주입될 수 있게 준비하기.
- `useImperativeHandle`을 통해 제한된 메서드만 노출하기.

### 스타일링

스타일링을 쉽게 하기 위해 속성을 초기화한다.

```scss
dialog {
  display: block; //open, close 애니메이션을 다르게 적용할 때 사용.
  padding: 0;
}
```

### 배경 클릭시 모달창 종료

- 초기화 목록에서 `padding: 0` 필요.
- `dialog`를 내부 요소(대부분 form 요소)로 채워버린다.
- `e.target.nodeName === 'DIALOG'`이면 close한다.

### 애니메이션 적용

예시로, open할 때에 slide-up 애니메이션을, close할 때는 scale-down 애니메이션을 적용했다.

///message-box --level=warning
title: dialog transform 애니메이션 적용시 주의사항.
body:
dialog[open]은 display 속성이 none에서 block으로 되는 것이기 때문에, transition이 먹지 않는다.

display를 block으로 미리 설정하거나, keyframes를 사용해야 한다.
///

```scss
dialog {
  display: block;

  visibility: hidden;
  opacity: 0;
  transition: opacity 0.4s;

  animation: scale-down 0.4s;

  &[open] {
    visibility: visible;
    opacity: 1;
    animation: slide-up 0.4s;
  }

  @keyframes slide-up {
    0% {
      transform: translate(0, 100px);
    }
    100% {
      transform: translate(0, 0);
    }
  }
  @keyframes scale-down {
    0% {
      transform: scale(1);
    }
    100% {
      transform: scale(0.7);
    }
  }
}
```

### 참고

https://codepen.io/fmontes/pen/yLveywJ?editors=1111

## 폼 다루기

[코드로 보기](https://codepen.io/kasong-lee/pen/MWdWygK)

### `<form>` 태그

| 속성         | 설명                                                                                                                                                                                                                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| method       | Form을 제출할 때 사용할 HTTP 메서드. <br /> - `post`: Form data를 request의 body로 전송. <br /> - `get`: Form data를 `action` URL과 `?` 구분자 뒤에 붙여서 전송. <br /> `dialog`: `<dialog>` 태그 안에 존재하는 경우이며, 제출과 함께 대화상자를 닫음.                                                                                |
| id           | Form의 id.                                                                                                                                                                                                                                                                                                                            |
| action       | Form data를 처리할 서버의 URI. `<button>`, `<input type='submit' />`, `<input type='image'>` 요소의 `formaction`으로 덮어쓸 수 있음.                                                                                                                                                                                                  |
| target       | Form 제출 결과를 표시할 위치.(브라우징 맥락 - 탭, 창, `<iframe>`). <br /> - `_self`: 응답을 현재 브라우징 맥락에 표시. 기본값. <br /> - `_blank`: 응답을 새로운 브라우징 맥락에 표시. 보통 새 탭.                                                                                                                                     |
| autocomplete | Form 안의 인풋 요소에 브라우저가 저장한 자동완성값을 기본값으로 채울지를 결정. <br /> - `off`: 채우지 않음. 기본값. <br /> - `on`: 채움.                                                                                                                                                                                              |
| enctype      | `method: 'post'`일 때, 데이터의 MIME 유형을 나타냄. <br /> - `application/x-www-form-urlencoded`: url encoded 방식으로 제출. 기본값. <br /> - `multipart/form-data`: Form 내부에 `<input type='file'>`이 존재하는 경우 사용. <br /> `<button>`, `<input type='submit'>`, `<input type='image'>` 요소의 `formenctype`으로 재정의 가능. |
| novalidate   | Form 내부 인풋의 validation을 할지 말지 지정. <br /> 지정하지 않아도 내부의 `<button>`, `<input type='submit'>`, `<input type='image'>` 요소의 `formnovalidate`로 재정의 가능.                                                                                                                                                        |

제출을 하면 form 안에서 입력된 값(input의 텍스트, 선택된 option 등)이 method에 명시된 방식으로 action에 명시된 서버 측 처리 로직에 전달된다.

///message-box --level=info
title: 한 페이지에 중복하여 form 사용할 수 없다.
body: form 내부에 form을 사용하는 것은 불가하며, 한 페이지에 중복하는 것조차 안 된다.
///

### `<input>` 태그

| input 태그 속성 | 유효 타입                                                            | 설명                                                               |
| --------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| accept          | `file`                                                               | file upload시 어떤 유형의 파일을 받아줄지 지정.                    |
| alt             | `image`                                                              | 이미지가 유효하지 않을 때 대체 텍스트                              |
| autocapitalize  | `url`, `email`, `password`가 아니면 유효.                            | 입력된 텍스트를 대문자로 변환.                                     |
| autocomplete    | `checkbox`, `radio`가 아니면 유효. `name`이 같으면 저장된 값 공유.   | 자동완성 설정.                                                     |
| disabled        | 모든 type                                                            | disabled 지정                                                      |
| formaction      | `image`, `submit`                                                    | 제출시 사용할 URL                                                  |
| formenctype     | `image`, `submit`                                                    | 제출시 사용할 form data 인코딩 타입.(url-encoded 등)               |
| formmethod      | `image`, `submit`                                                    | 제출시 사용할 HTTP method                                          |
| formnovalidate  | `image`, `submit`                                                    | 제출시 validate할지 말지 여부                                      |
| name            | 모든 type                                                            | formData에서 name-value 페어로 저장                                |
| pattern         | `text`, `search`, `url`, `tel`, `email`, `password`                  | 입력값의 valid 패턴(정규표현식)                                    |
| title           | 모든 type                                                            | 툴팁으로 제공되는 도움말                                           |
| readonly        | `hidden`, `range`, `color`, `checkbox`, `radio`가 아니면 유효.       | 입력된 값을 수정할 수 없게 설정.                                   |
| placeholder     | `text`, `search`, `url`, `tel`, `email`, `password`, `number`        | 입력된 값이 없을 때 보여주는 값.                                   |
| autofocus       | `hidden`가 아니면 유효                                               | 페이지가 로딩되거나 `<dialog>`가 displayed될 때 포커스를 가져간다. |
| max / min       | `date`, `month`, `week`, `time`, `datetime-local`, `number`, `range` | 최댓값, 최솟값 지정                                                |
| maxLength       | `text`, `search`, `url`, `tel`, `email`, `password`                  | 최대 입력 길이 지정                                                |
| step            | `date`, `month`, `week`, `time`, `datetime-local`, `number`, `range` | 유효한 증가 값 지정                                                |
| required        | 모든 type                                                            | 필수 입력                                                          |
| value           | `image`가 아니면 유효                                                | 초기값 지정                                                        |
| list            | `hidden`, `password`, `checkbox`, `radio`, `button`가 아니면 유효    | `<datalist>`의 자동완성                                            |
| **type**        | 모든 type                                                            | 요소의 type을 지정. 기본값은 `text`                                |

| input type 속성 | 설명                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| hidden          | 보이지는 않지만 제출시 값이 함께 제출됨.                                                                                        |
| text            | 텍스트 컨트롤                                                                                                                   |
| search          | 검색 컨트롤. 삭제 아이콘이 포함될 수 있음. 지원하는 디바이스에서 키보드에 엔터 대신 search가 써짐.                              |
| tel             | 전화. 클릭시 지원하는 디바이스에서는 다이얼 키보드가 표시됨.                                                                    |
| url             | URL 입력 컨트롤. 지원하는 브라우저에서 validation을 자동으로 제공하고, 또한 지원하는 디바이스에서 URL에 맞는 키보드가 표시됨.   |
| email           | email 입력 컨트롤. 지원하는 브라우저에서 validation을 자동으로 제공하고, 또한 지원하는 디바이스에서 URL에 맞는 키보드가 표시됨. |
| password        | password 입력 컨트롤. 입력값이 별표처리 됨.                                                                                     |
| number          | 숫자 입력 컨트롤. 우측에 스피너가 출력되며, 지원하는 브라우저, 디바이스에서 각각 validation, 다이얼 키보드가 표시됨.            |
| range           | 정확한 값이 중요하지 않은 숫자를 입력할 때 사용되는 범위 컨트롤. `min`, `max` 속성을 통해 값의 범위를 지정.                     |
| color           | 색 선택 컨트롤.                                                                                                                 |
| checkbox        | 체크박스 컨트롤.                                                                                                                |
| radio           | 라디오 컨트롤. 같은 `name`을 갖는 라디오 컨트롤 중에 고를 수 있도록 제공.                                                       |
| datetime-local  | `datetime` 타입은 deprecated됨. 날짜 및 시간 선택할 수 있는 컨트롤 (타임존 선택 X)                                              |
| date            | 날짜 선택 컨트롤.                                                                                                               |
| month           | 연, 달 선택 컨트롤.                                                                                                             |
| week            | 연 기준으로 몇 번째 주인지 선택하는 컨트롤.                                                                                     |
| time            | 시, 분 선택 컨트롤                                                                                                              |
| button          | 기본 동작이 없는 푸시 버튼. `value`가 버튼의 텍스트로 들어감.                                                                   |
| file            | 사용자 컴퓨터에 있는 파일을 선택할 수 있는 버튼. `accept` 속성으로 허용 가능한 파일 타입 지정.                                  |
| submit          | Form을 제출하는 버튼.                                                                                                           |
| image           | Form을 제출하는 이미지 버튼.                                                                                                    |
| reset           | Form에 입력한 값을 모두 초기화하는 버튼. 권장하지 않음.                                                                         |

### `<textarea>` 태그

여러 줄 입력이 가능한 텍스트 필드이다.

| 속성        | 설명                                                                                                                                                                                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| autofocus   | 페이지 갱신시 자동으로 포커스를 잡음                                                                                                                                                                                  |
| cols        | 입력 영역의 너비 명시                                                                                                                                                                                                 |
| dirname     | 제출시 서버에게 text directionality를 알려주는 키값을 명시.                                                                                                                                                           |
| disabled    | disabled로 지정                                                                                                                                                                                                       |
| form        | 연관된 Form 지정. 지정하지 않으면 가장 가까운 조상이 지정됨.                                                                                                                                                          |
| maxlength   | 허용 최대 글자수                                                                                                                                                                                                      |
| name        | formData에서 key값으로 사용                                                                                                                                                                                           |
| placeholder | 힌트 표시                                                                                                                                                                                                             |
| readonly    | 입력 불가로 지정                                                                                                                                                                                                      |
| required    | 필수 입력으로 지정                                                                                                                                                                                                    |
| rows        | 보이는 영역의 라인 수를 명시                                                                                                                                                                                          |
| wrap        | 제출시 입력된 글자들의 줄바꿈을 어떻게 전처리할 건지 지정. <br /> - `hard`: `cols`가 지정되어야 하고, 한 줄이 control의 width보다 길어질 수 없게 강제로 개행문자 삽입. <br /> - `soft`: 기본값. 별도로 건드리지 않음. |

///message-box --level=info
title: text directionality
body: '텍스트를 왼쪽에서 오른쪽으로 읽어야 하는지, 아니면 그 반대인지 지정'

예시)
```html
<textarea name='comment' dirname='comment-direction' dir='auto'>왼쪽에서 오른쪽으로 읽는 한글</textarea>
```
👉 https://www.example.com/submit?comment=[인코딩된 innerText]&comment-direction=ltr

- rtl: 오른쪽에서 왼쪽으로 읽음
- ltr: 왼쪽에서 오른쪽으로 읽음
///

### `<label>` 태그

`<label>` 태그로 `<input>` 태그를 감싸면 텍스트를 클릭해도 `<input>`이 클릭되는 효과를 줄 수 있다.

스타일링의 이유로 label 안에 input을 둘 수 없다면, `for` - `id`로 매핑하여 같은 효과를 줄 수 있다.

```html
<form>
  <label for="orange">오렌지</label>
  <input type="checkbox" id="orange" />
  <label> <input type="checkbox" /> 바나나 </label>
</form>
```

### `<select>` 태그와 `<option>` 태그

드랍다운 메뉴 컨트롤.

///message-box --level=warning
title: value가 다른 의미로 사용.
body:
select 태그 안의 option 태그의 value는 formData로 보낼 값을 의미하고, 사용자에게 보여질 값은 innerText에 넣어야 한다.

예시) 
```html
<option value='서버에 보낼 값'>사용자에게 보이는 값</option>
```
///

| 속성      | 설명                                                              |
| --------- | ----------------------------------------------------------------- |
| autofocus | 페이지가 로드될 때 자동으로 포커스 잡음.                          |
| disabled  | disabled로 설정                                                   |
| form      | 연관된 Form 요소 지정. 지정하지 않으면 가장 가까운 조상이 지정됨. |
| multiple  | 여러 option 선택 가능하도록 지정.                                 |
| name      | formData에서 사용될 key값.                                        |
| required  | 필수값으로 지정.                                                  |
| size      |                                                                   |

### `<datalist>` 태그

`<select>`처럼 선택할 수도 있고, 입력값을 받을 수도 있는 컨트롤.

### `<fieldset>` 태그와 `<legend>` 태그

`<fieldset>`은 입력 컨트롤을 그룹화할 때 사용.

`<legend>`는 그룹의 제목.

### `<button>` 태그

| button type 속성 | 설명               |
| ---------------- | ------------------ |
| submit           | form 제출          |
| reset            | form 리셋          |
| button           | 일반적인 푸시 버튼 |

### 리액트에서 폼 다루기.

#### 폼 제출하기

[코드로 보기](https://codepen.io/kasong-lee/pen/eYaYVrR)

- `<form>`의 `onSubmit` 속성으로 제출 핸들러를 단다.
- `FormData`를 사용하여 제출된 입력값을 가져온다.
- `event.target.reset`을 이용하여 필요하면 입력값을 초기화한다.

> form 객체(event.target) ➡️ `FormData` ➡️ `Object.fromEntries(fd.entries())`

```javascript
const submitHandler = (e) => {
  e.preventDefault()
  const fd = new FormData(e.target)
  const data = Object.fromEntries(fd.entries())
  data.aquisition = fd.getAll('aquisition') //fieldset 안의 체크박스들.
  console.log(data)
  // 결과
  // {aquisition: ['naver', 'kakao', 'google'],
  // email: "codeleeks@naver.com",
  // password: "asd",
  // password-retype: "asd"}
}
```

///message-box --level=warning
title: unchecked된 checkbox는 FormData에 포함되지 않음.
body:
unchecked된 checkbox는 FormData에 포함되지 않는다.
checkbox에는 uncheck시 기본값을 지정해주는 속성은 없다.
방법은 hidden 타입 input 태그를 추가하고, 동일한 name을 준다.

```html
<label>
  <input type='hidden' name='hello' value='false'/>
  IP 보안
  <input type='checkbox' name='ip-security' value='true'>
</label>
```

참고: <a href='https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox#:~:text=subscribe%3Don.-,Note%3A,-If%20a%20checkbox' target='_blank'>MDN 관련 문서 링크</a>
///

#### 입력값 검증하기(validation)

[코드로 보기](https://codepen.io/kasong-lee/pen/PovwoYo)

- blur일 때 입력값 검증 & 타이핑을 시작할 때 에러 메시지 제거
- Form 제출시 입력값 검증

인풋 검증은 common case이기 때문에 나만의 라이브러리로 만들어뒀다.

`blur일 때 입력값 검증 & 타이핑을 시작할 때 에러 메시지 제거` 방식으로 검증하고 에러를 표시한다.

```javascript
// 커스텀 hook
export function useInputValidation(inputValue, validateFunctions) {
  const [inputErrors, setInputErrors] = useState([])
  const changeHandler = (e) => {
    setInputErrors([])
  }

  const blurHandler = (e) => {
    setInputErrors(
      validateFunctions
        .map((fn) => fn(inputValue))
        .filter((result) => result !== undefined)
    )
  }

  return {
    inputErrors,
    changeHandler,
    blurHandler,
  }
}

// 메인 컴포넌트
const inputRefs = {
  email: useRef(),
  password: useRef(),
}

const {
  inputErrors: emailInputErrors,
  changeHandler: emailChangeHandler,
  blurHandler: emailBlurHandler,
} = useInputValidation(inputRefs.email?.current?.value ?? '', [
  (value) => {
    if (value !== '' && !value.match('[0-9a-z]+@[0-9a-z.]+')) {
      return {
        key: 'email-error',
        message: '이메일 형식이 아닙니다.',
      }
    }
  },
])

const {
  inputErrors: passwordInputErrors,
  changeHandler: passwordChangeHandler,
  blurHandler: passwordBlurHandler,
} = useInputValidation(inputRefs.password?.current?.value ?? '', [
  (value) => {
    if (value !== '' && !value.match('[0-9a-z]{3,}')) {
      return {
        key: 'password-error',
        message: '비밀번호 형식 아닙니다. 적어도 세 자 이상 적어주세요',
      }
    }
  },
])

const inputErrors = [...emailInputErrors, ...passwordInputErrors]

let error = (
  <p className='signin__error'>
    {inputErrors.map((error) => {
      return <li key={error.key}>{error.message}</li>
    })}
  </p>
)
```
