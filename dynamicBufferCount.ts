import {
  Subscriber,
  Operator,
  Observable,
  OperatorFunction,
  TeardownLogic,
  Subscription
} from 'rxjs'

export function dynamicBufferCount<T>(bufferSize: Observable<number>): OperatorFunction<T, T[]> {
  return function bufferCountOperatorFunction(source: Observable<T>) {
    return source.lift(new BufferCountOperator<T>(bufferSize))
  }
}

class BufferCountOperator<T> implements Operator<T, T[]> {
  constructor(private bufferSize: Observable<number>) {}

  call(subscriber: Subscriber<T[]>, source: any): TeardownLogic {
    return source.subscribe(new BufferCountSubscriber(subscriber, this.bufferSize))
  }
}

class BufferCountSubscriber<T> extends Subscriber<T> {
  private buffer: T[] = []
  private currentSize: number | undefined
  private bufferSizeSubscription: Subscription

  constructor(destination: Subscriber<T[]>, bufferSize: Observable<number>) {
    super(destination)
    this.bufferSizeSubscription = bufferSize.subscribe(x => {
      if (this.currentSize == x) return
      const isShrink = x < (this.currentSize || 0)

      // not initialized
      if (!this.currentSize) {
        this.currentSize = x
        return
      }

      this.currentSize = x

      // shrink current buffer and send remainder
      if (isShrink && this.buffer.length > x) {
        this.sendBuffer()
      }
    })
  }

  protected _next(value: T): void {
    this.buffer.push(value)
    if (this.currentSize !== undefined && this.buffer.length >= this.currentSize) {
      this.sendBuffer()
    }
  }

  private sendBuffer() {
    if (this.buffer.length > 0 && this.destination.next && this.currentSize !== undefined) {
      // shrinking
      if (this.buffer.length > this.currentSize) {
        const remainder = this.buffer.slice(this.currentSize)
        this.buffer = this.buffer.slice(0, this.currentSize)
        // send
        this.destination.next(this.buffer)
        // and keep remainder
        this.buffer = remainder

        // recursive call in case when remainder is still big
        if (this.buffer.length > this.currentSize) {
          this.sendBuffer()
        }

        return
      }

      this.destination.next(this.buffer)
      this.buffer = []
    }
  }

  protected _complete(): void {
    this.sendBuffer()
    this.bufferSizeSubscription.unsubscribe()
    super._complete()
  }
}
