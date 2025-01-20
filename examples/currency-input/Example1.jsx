import { component, useState, stringify } from '@dark-engine/core'
import { CurrencyInput } from '@wareme/currency-input'

import { ErrorMessage, HalfWidth, Pre } from './styles'

export const Example1 = component(() => {
  const limit = 1000
  const prefix = '£'

  const [errorMessage, setErrorMessage] = useState('')
  const [className, setClassName] = useState('')
  const [value, setValue] = useState('123.22')
  const [values, setValues] = useState()

  /**
   * Handle validation
   */
  const handleOnValueChange = (_value, name, _values) => {
    // _values is only for demo purposes in this example
    setValues(_values)

    if (!_value) {
      setClassName('')
      setValue('')
      return
    }

    // value is over limit
    if (Number(_value) > limit) {
      setErrorMessage(`Max: ${prefix}${limit}`)
      setClassName('is-invalid')
      setValue(_value)
      return
    }

    // clear error message
    if (errorMessage) {
      setErrorMessage('')
    }

    setClassName('is-valid')
    setValue(_value)
  }

  return (
    <div>
      <h2>Example 1</h2>
      <ul>
        <li>{'\'£\''} prefix</li>
        <li>Allows decimals (up to 2 decimal places)</li>
        <li>Value is set programmatically (passed in via props)</li>
      </ul>

      <form>
        <HalfWidth>
          <label htmlFor='validationCustom01'>Please enter a value (max £1,000)</label>
          <CurrencyInput
            id='validationCustom01'
            name='input-1'
            className={className}
            value={value}
            onValueChange={handleOnValueChange}
            placeholder='Please enter a number'
            prefix={prefix}
            step={1}
          />
          <ErrorMessage>{errorMessage}</ErrorMessage>
        </HalfWidth>
        <HalfWidth>
          <Pre>
            <div>
              <div>onValueChange:</div>
              {value}
            </div>
            <div>
              <div>Values:</div>
              {stringify(values, undefined, ' ')}
            </div>
          </Pre>
        </HalfWidth>
      </form>
    </div>
  )
})

export default Example1
