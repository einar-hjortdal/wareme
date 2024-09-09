import { component, useState, detectIsUndefined } from '@dark-engine/core'
import { CurrencyInput } from '@wareme/currency-input'
import { detectIsNaN } from '@wareme/utils/src'

import { ErrorMessage, HalfWidth, Pre } from './styles'

export const Example2 = component(() => {
  const [errorMessage, setErrorMessage] = useState('')
  const [className, setClassName] = useState('')
  const [rawValue, setRawValue] = useState(' ')

  const validateValue = (value) => {
    if (detectIsUndefined(value)) {
      setRawValue('undefined')
    } else {
      setRawValue(value)
    }

    if (detectIsUndefined(value)) {
      setErrorMessage('')
      setClassName('')
    } else if (detectIsNaN(Number(value))) {
      setErrorMessage('Please enter a valid number')
      setClassName('is-invalid')
    } else {
      setErrorMessage('')
      setClassName('is-valid')
    }
  }

  return (
    <div>
      <h2>Example 2</h2>
      <ul>
        <li>{'\'$\''} prefix</li>
        <li>Has placeholder</li>
        <li>Does not allow decimals</li>
        <li>Value is stored via component state</li>
      </ul>
      <form>
        <HalfWidth>
          <label htmlFor='validation-example-2-field'>Please enter a value:</label>
          <CurrencyInput
            id='validation-example-2-field'
            placeholder='$1,234,567'
            allowDecimals={false}
            className={className}
            onValueChange={validateValue}
            prefix='$'
            step={10}
          />
          <ErrorMessage>{errorMessage}</ErrorMessage>
        </HalfWidth>
        <HalfWidth>
          <Pre>
            <div>onValueChange:</div>
            {rawValue}
          </Pre>
        </HalfWidth>
      </form>
    </div>
  )
})

export default Example2
