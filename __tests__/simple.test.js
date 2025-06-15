// Simple test to verify Jest is working
describe('Simple test suite', () => {
  test('basic math operations', () => {
    expect(2 + 2).toBe(4)
    expect(5 * 3).toBe(15)
  })

  test('string operations', () => {
    expect('hello').toBe('hello')
    expect('hello world'.length).toBe(11)
  })

  test('array operations', () => {
    const arr = [1, 2, 3]
    expect(arr.length).toBe(3)
    expect(arr[0]).toBe(1)
  })
})