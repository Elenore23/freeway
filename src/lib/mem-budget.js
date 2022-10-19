import defer from 'p-defer'

export class MemoryBudget {
  /** @type {Array<{ size: number, deferred: import('p-defer').DeferredPromise<void> }>} */
  #requests = []

  /**
   * Allocated bytes.
   * @type {number}
   */
  #allocated = 0

  /**
   * Maximum number of bytes that can be allocated.
   * @type {number}
   */
  #max

  /**
   * @param {number} max
   */
  constructor (max) {
    this.#max = max
  }

  /**
   * @param {number} size
   */
  async request (size) {
    if (size > this.#max) {
      throw new Error('requested allocation is greater than maximum')
    }
    if (!this.#requests.length && this.#allocated + size <= this.#max) {
      this.#allocated += size
      return
    }
    console.warn(`cannot allocate ${size} bytes, ${Math.floor(this.#allocated / this.#max * 100)}% allocated`)
    const deferred = defer()
    this.#requests.push({ size, deferred })
    return deferred.promise
  }

  /**
   * @param {number} size
   */
  release (size) {
    this.#allocated = Math.max(0, this.#allocated - size)
    while (this.#requests.length) {
      const req = this.#requests[0]
      if (this.#allocated + req.size > this.#max) break
      this.#allocated += req.size
      req.deferred.resolve()
      this.#requests.shift()
    }
  }
}
