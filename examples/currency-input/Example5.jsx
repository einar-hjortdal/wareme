import { component, useState } from '@dark-engine/core'
import { formatValue } from '@wareme/currency-input'

const Example5 = component(() => {
  const [value, setValue] = useState("123456789.999")
  const [prefix, setPrefix] = useState("$")
  const [groupSeparator, setGroupSeparator] = useState(",")
  const [decimalSeparator, setDecimalSeparator] = useState(".")
  const [disableGroupSeparators, setdisableGroupSeparators] = useState(false)

  const getValueFromEvent = (event) => {
    return event.target.value
  }

  const handleValueChange = (event) => {
    const value = getValueFromEvent(event)
    setValue(value)
  }

  const handlePrefixChange = (event) => {
    const value = getValueFromEvent(event)
    setPrefix(value)
  }

  const handleGroupSeparatorChange = (event) => {
    const value = getValueFromEvent(event)
    setGroupSeparator(value)
  }

  const handleDecimalSeparatorChange = (event) => {
    const value = getValueFromEvent(event)
    setDecimalSeparator(value)
  }

  const handleTurnOffSeparatorChange = (event) => {
    const value = getValueFromEvent(event)
    if (value === 'true') {
      return setdisableGroupSeparators(true)
    }
    return setdisableGroupSeparators(false)
  }

  const formattedValue = formatValue({
    value,
    groupSeparator,
    decimalSeparator,
    disableGroupSeparators,
    prefix
  })

  return (
    <div>
      <h2>Format values example</h2>
      <ul>
        <li>
          Use the `formatValue` function convert a value to a user friendly string
        </li>
      </ul>
      <div >
        <div >
          <div >
            <label>Value (Number only)</label>
            <input
              type="number"
              value={value}
              onChange={handleValueChange}
            />
          </div>
          <div >
            <label>Prefix</label>
            <input
              type="text"
              value={prefix}
              onChange={handlePrefixChange}
            />
          </div>
          <div >
            <label>Group Separator</label>
            <input
              type="text"
              value={groupSeparator}
              onChange={handleGroupSeparatorChange}
            />
          </div>
          <div >
            <label>Decimal Separator</label>
            <input
              type="text"
              value={decimalSeparator}
              onChange={handleDecimalSeparatorChange}
            />
          </div>
        </div>
        <div >
          <div >
            Turn off separators:
            <div>
              <input
                type="radio"
                id="disableGroupSeparatorsTrue"
                value="true"
                onChange={handleTurnOffSeparatorChange}
                checked={disableGroupSeparators}
              />
              <label
                htmlFor="disableGroupSeparatorsTrue"
              >
                True
              </label>
            </div>
            <div>
              <input
                type="radio"
                id="disableGroupSeparatorsFalse"
                value="false"
                onChange={handleTurnOffSeparatorChange}
                checked={disableGroupSeparators === false}
              />
              <label
                htmlFor="disableGroupSeparatorsFalse"
              >
                False
              </label>
            </div>
          </div>
        </div>
        <div >
          Formatted value:
          <div >
            {formattedValue}
          </div>
        </div>
      </div>
    </div>
  )
})

export default Example5
