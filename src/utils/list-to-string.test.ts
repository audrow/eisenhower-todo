import listToString from './list-to-string'

test('lists on item', () => {
  expect(listToString(['one'])).toBe('one')
})
