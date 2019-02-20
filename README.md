# dynamicBufferCount
dynamicBufferCount is RxJs operator that takes Observable for buffer size


``` TypeScript
function testDynamicBuffer() {
  const source = interval(50)

  // initial buffer size is 4
  const bufferSource = new BehaviorSubject<number>(4)

  const bufferedSource = source
    .pipe(dynamicBufferCount(bufferSource))
    .subscribe(x => console.log(x))

  setTimeout(() => bufferSource.next(2), 1000)
  setTimeout(() => bufferSource.next(3), 1500)
  setTimeout(() => bufferSource.next(40), 1873)
  setTimeout(() => bufferSource.next(2), 4593)
  setTimeout(() => bufferSource.next(9), 8764)

  setTimeout(() => bufferedSource.unsubscribe(), 10764)
}

testDynamicBuffer()
```
