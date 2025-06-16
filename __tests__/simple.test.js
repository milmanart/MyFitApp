// Basic test to verify Jest is working
describe('App Setup', () => {
  test('Jest configuration works', () => {
    expect(true).toBe(true)
  })

  test('basic JavaScript functionality', () => {
    expect(2 + 2).toBe(4)
    expect('MyFitApp'.length).toBe(8)
    expect([1, 2, 3]).toHaveLength(3)
  })
})