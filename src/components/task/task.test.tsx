import {render} from '@testing-library/react'
import Task from './task'

describe('Task', () => {
  it('should work', () => {
    const {debug} = render(<Task />)
    console.log(debug())
  })
})
