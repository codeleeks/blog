---
summary: 타입스크립트의 기본을 완벽하게 정리합니다.
date: 2024-05-25
title-image: ''
---

타입스크립트는 자바스크립트로 컴파일되는 언어로서, 컴파일 타임에 타입 체크를 통해 사전에 에러를 잡아보자는 목표를 갖는다.

이 목표를 최대한 코드에서 활용해야 타입스크립트를 쓰는 의미가 있다고 생각한다.

## get started

```bash
npm install -g typescript
tsc --init
tsc -w
```

## types

| 타입        | 의미                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------- |
| `number`    | 수                                                                                              |
| `string`    | 문자열                                                                                          |
| `boolean`   | 참거짓                                                                                          |
| `object`    | 객체                                                                                            |
| `array`     | 배열                                                                                            |
| `union`     | 타입 간의 조합                                                                                  |
| `tuple`     | fixed 배열. 배열 요소에 각각 들어갈 데이터 타입이 정해져 있는 경우에 사용                       |
| `Enum`      | 열거형                                                                                          |
| `literal`   | 문자열로 타입을 지정                                                                            |
| `any`       | 타입스크립트가 타입체크를 포기하겠다는 뜻. 어느 타입이든 가능. javascript랜드로의 회귀          |
| 커스텀 타입 | `type` 키워드로 사용자 정의 타입 지정.                                                          |
| `unknown`   | 타입이 정해지지 않음. 다른 타입 변수에 assign할 때 any는 에러 발생하지 않지만, unknown은 발생함 |
| 함수 타입   | `Function`으로 단순 함수 지정하거나 `()=>{}`로 함수 파라미터 및 반환값 타입을 지정.             |
| `void`      | 함수의 반환값이 없음을 의미. 반환값은 undefined로 할당됨.                                       |
| `never`     | 함수의 반환이 일어나지 않음을 의미. 반환값은 아예 표시되지 않음.                                |

### 예제

```typescript

function throwError(message: string, code: string) :never {
  thorw new Error(message, code)
}

// void 반환 타입
function printMessage(message: string) {
  console.log(message)
}

// 타입 추론하여 사용하는 편이 편리
// 필드에 튜플이 포함되면 튜플 타입을 작성해줘야 하기 때문에, 다른 필드도 다 타입을 정해줘야 함.
let person = {
  name: "John",
  age: 33,
  location: {
    nation: 'US',
    city: 'Washington'
  }
}

// 튜플
const roles: [number, string] = [2, 'developer']

// enum은 여러 타입으로 묶을 수 있긴 함.
Enum DAYS = [SUNDAY=0, MONDAY=1, TUESDAY='2', WEDNESDAY=false]

// 사용자 정의 타입
type User {name: string, age: number}

// 유니온 타입(a, b)와 리터럴 타입(mode) 정의
function combine(a :number|string, b: number|string, mode: 'as-text' | 'as-number') {

}

combine(1,2,'as-text')
combine(2,5,'as-number')
combine('50', '20', 'as-text')
```

## class

타입스크립트는 자바스크립트에서 제공하지 않는 기능을 컴파일 타임에서 제공할 수 있다.

자바와 같이, 접근 제어자(`public`, `private`, `protected`), 정적 키워드(`static`), 추상클래스(`abstract`), 인터페이스(`interface`)를 제공한다.

`interface`는 자바와는 달리 필드도 정의 가능하다.

### 접근 제한자

필드, 메서드에 대해 `private`, `public`, `protected`, 필드에 대해 추가적으로 `readonly`를 제공한다.

```typescript
class Department {
  private employees: string[] = []
  constructor(private readonly id: string, private name: string) {}
}
```

### 인터페이스

```typescript
interface Greetable {
  name: string

  greet(pharse: string): void
}

class Person implements Greetable {
  name: string
  age = 30
  constructor(n: string) {
    this.name = n
  }

  greet(pharse: string) {
    console.log(pharse + ' ' + this.name)
  }
}
```

## advanced types

```typescript
// 유니온 타입
type Cominable = number | string

// 인터섹션 타입
type Dad = { name: string }
type HouseWife = { works: string[] }

type Me = Dad & HouseWife

// 타입 가드

function whoAreYou(me: Me) {
  if ('name' in me) {
    // print the field as a Dad type
    console.log(me.name)
  } else if ('works' in me) {
    // print the field as a HouseWife
    console.log(me.works)
  }
}

// 형 변환 & null 아님 확정
const modalEl = document.getElementById('modal')! as HTMLDialogElement

// 인덱스 속성
interface ErrorContainer {
  [prop: string]: string
}

class EmailError implements ErrorContainer {
  email: string
  msg: string
}

// 오버로드
function add(a: number, b: number)
function add(a: string, b: string): string
function add(a: Combinable, b: Combinable) {}
```

## 제네릭

```typescript
// 타입 제한하기
interface Lengthy {
  length: number
}

function countAndDescribe<T extends Lengthy>(element: T): [T, string] {
  let descriptionText = 'Got no value'
  if (element.length === 1) {
    descriptionText = 'Got 1 element'
  } else if (element.length > 1) {
    descriptionText = 'Got' + element.length + ' elements'
  }
  return [element, descriptionText]
}

console.log(countAndDescribe(['strong', 'healthy'])) // Array 객체는 length 필드를 갖고 있으므로 타입 제한 통과

// keyof
// object의 키로 존재하는지 컴파일 타입에 체크한다.
function extractAndConvert<T, K>(obj: T extends object, key: K keyof T) {
  return obj[key]
}

console.log(extractAndConvert({}, 'name')) //obj에 name 필드가 없으므로 컴파일 에러 발생.


// 빌트인 제네릭 타입 - Partial
type CourseGoal = {
  title: string,
  description: string,
  completeUntil: Date
}

function createCourseGoal(title: string, description: string, date: Date) {
  let courseGoal: Partial<CourseGoal> = {} // typescript는 객체 생성시에 필드 정의도 넣길 원함. 그러지 않고 싶을 때에는 Partial을 쓴다.
  courseGoal.title = title
  courseGoal.description = description
  courseGoal.completeUntil = date
  return courseGoal as CourseGoal
}


// 빌트인 제네릭 타입 - Readonly
const names: Readonly<string[]> = ['Max', 'Anna']
names.push('Manu') // readonly 배열에 대한 수정 오퍼레이션은 컴파일 에러.
names.pop() // readonly 배열에 대한 수정 오퍼레이션은 컴파일 에러.
```

## 데코레이터

자바의 annotation과 비슷한 느낌을 준다.

클래스 initiate 전에 수행된다.

하나 이상의 파라미터를 갖는 `function`으로 정의한다.

```typescript
function Logger(msg: string) {
  console.log('logger factory initialized')
  return function (constructor: Function) {
    console.log(msg)
  }
}

function WithTemplate(template: string, hookId: string) {
  console.log('template factory initialized')
  return function (constructor: any) {
    const hookEl = document.getElementById(hookId)
    const p = new constructor()
    if (hookEl) {
      hookEl.innerHTML = template
      hookEl.querySelector('h1')!.textContent = p.name
    }
  }
}

// 팩토리는 top-down, 데코레이터는 bottom-up으로 실행
@Logger('Person class initiating...')
@WithTemplate('<h1>My Person Object</h1>', 'app')
class Person {
  name = 'Max'

  constructor() {
    console.log('Creating person object...')
  }
}

const pers = new Person()

// 클래스 데코레이터에서 반환하기
function withTemplate(template: string, hookId: string) {
  return function <T extends { new (...args: any[]): { name: string } }>(
    originalConstructor: T
  ) {
    return class extends originalConstructor {
      constructor(..._: any[]) {
        super()
        const hookEl = document.getElementById(hookId)
        if (hookEl) {
          hookEl.innerHTML = template
          hookEl.querySelector('h1')!.textContent = this.name
        }
      }
    }
  }
}

// 프로퍼티, 프로토타입 데코레이터
function log(
  target: any,
  name: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  return {
    ...descriptor,
    get() {
      console.log('called')
    },
  }
}

function Autobind(target: any, name: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value
  const newDescriptor = {
    ...descriptor,
    get() {
      const boundFn = originalMethod.bind(this)
      return boundFn
    },
  }
}

class Printer {
  message = 'This works!'

  @Autobind
  showMessage() {
    console.log(this.message)
  }
}

document.querySelector('button').addEventListener('click', new Printer().showMessage)
```

## 자바스크립트 라이브러리 사용

(types 레포)[https://github.com/DefinitelyTyped/DefinitelyTyped]를 활용한다.

`react-router`와 같이 react 프로젝트에서 자주 사용되는 자바스크립트 라이브러리들 중 공식 독스에 typescript에 대한 내용이 없는 경우가 있다.

이런 경우에는 위의 레포에서 npm 패키지를 제공하여 사용해보자.