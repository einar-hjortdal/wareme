import { component, useState } from '@dark-engine/core'
import { CurrencyInput } from '@wareme/currency-input'

const options = [
  {
    locale: 'de-DE',
    currency: 'EUR'
  },
  {
    locale: 'en-US',
    currency: 'USD'
  },
  {
    locale: 'en-GB',
    currency: 'GBP'
  },
  {
    locale: 'ja-JP',
    currency: 'JPY'
  },
  {
    locale: 'en-IN',
    currency: 'INR'
  }
]

export const Example3 = component(() => {
  const [intlConfig, setIntlConfig] = useState(options[0])
  const [value, setValue] = useState('123')

  const handleOnValueChange = (value) => {
    setValue(value)
  }

  const handleIntlSelect = (event) => {
    const config = options[Number(event.target.value)]
    if (config) {
      setIntlConfig(config)
      setValue('123')
    }
  }

  return (
    <div>
      <h2>Example 3</h2>
      <ul>
        <li>Intl config</li>
      </ul>

      <div>
        <div>
          <CurrencyInput
            id='validationCustom04'
            name='input-1'
            intlConfig={intlConfig}
            className='form-control'
            onValueChange={handleOnValueChange}
            decimalsLimit={6}
            value={value}
            step={1}
          />
        </div>
        <div>
          <label htmlFor='intlConfigSelect'>Intl option</label>
          <select id='intlConfigSelect' onChange={handleIntlSelect}>
            {options.map((config, i) => {
              if (config) {
                const { locale, currency } = config
                return (
                  <option key={`${locale}${currency}`} value={i}>
                    {locale}
                  </option>
                )
              }
            })}
          </select>
        </div>
        <div>
          <pre>
            <div>onValueChange:</div>
            {value}
            <div>intlConfig:</div>
            {JSON.stringify(intlConfig)}
          </pre>
        </div>
      </div>
    </div>
  )
})

export default Example3
