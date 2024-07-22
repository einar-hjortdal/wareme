import {
  component,
  useState,
  useEffect,
  useRef,
  useMemo,
  detectIsEmpty,
  detectIsString,
  detectIsNumber,
  detectIsNull,
} from '@dark-engine/core'
import {
  throwError,
  isNumber,
  cleanValue,
  fixedDecimalValue,
  formatValue,
  getLocaleConfig,
  padTrimValue,
  getSuffix,
  repositionCursor
} from './utils'
import { detectIsNaN } from '@wareme/utils/src'

const CurrencyInput = component(({
  allowDecimals = true,
  allowNegativeValue = true,
  id,
  name,
  className,
  customInput,
  decimalsLimit,
  defaultValue/*: string  */,
  disabled = false,
  maxLength: userMaxLength,
  value: userValue/*: string  */,
  onValueChange,
  fixedDecimalLength,
  placeholder,
  decimalScale/*: number  */,
  prefix,
  suffix,
  intlConfig,
  step,
  min/*: number | undefined */,
  max/*: number | undefined */,
  disableGroupSeparators = false,
  disableAbbreviations = false,
  decimalSeparator: _decimalSeparator,
  groupSeparator: _groupSeparator,
  onInput,
  onFocus,
  onBlur,
  onKeyDown,
  onKeyUp,
  transformRawValue,
  formatValueOnBlur = true,
  ...props
}) => {
  if (_decimalSeparator && isNumber(_decimalSeparator)) {
    throwError('decimalSeparator cannot be a number')
  }

  if (_groupSeparator && isNumber(_groupSeparator)) {
    throwError('groupSeparator cannot be a number')
  }

  const localeConfig = useMemo(() => getLocaleConfig(intlConfig), [intlConfig])
  const decimalSeparator = _decimalSeparator || localeConfig.decimalSeparator || ''
  const groupSeparator = _groupSeparator || localeConfig.groupSeparator || ''

  if (
    decimalSeparator &&
    groupSeparator &&
    decimalSeparator === groupSeparator &&
    disableGroupSeparators === false
  ) {
    throwError('decimalSeparator cannot be the same as groupSeparator')
  }

  const formatValueOptions = {
    decimalSeparator,
    groupSeparator,
    disableGroupSeparators,
    intlConfig,
    prefix: prefix || localeConfig.prefix,
    suffix
  }

  const cleanValueOptions = {
    decimalSeparator,
    groupSeparator,
    allowDecimals,
    decimalsLimit: decimalsLimit || fixedDecimalLength || 2,
    allowNegativeValue,
    disableAbbreviations,
    prefix: prefix || localeConfig.prefix,
    transformRawValue
  }

  const getInitialStateValue = () => {
    if (detectIsString(defaultValue)) {
      return formatValue({ ...formatValueOptions, decimalScale, value: defaultValue })
    }
    if (detectIsString(userValue)) {
      return formatValue({ ...formatValueOptions, decimalScale, value: userValue })
    }
    return ''
  }

  const [stateValue, setStateValue] = useState(getInitialStateValue())
  const [dirty, setDirty] = useState(false)
  const [cursor, setCursor] = useState(0)
  const [changeCount, setChangeCount] = useState(0)
  const [lastKeyStroke, setLastKeyStroke] = useState(null)
  const inputRef = useRef(null)

  const processChange = (value, selectionStart) => {
    setDirty(true)

    const { modifiedValue, cursorPosition } = repositionCursor({
      selectionStart,
      value,
      lastKeyStroke,
      stateValue,
      groupSeparator
    })

    const stringValue = cleanValue({ value: modifiedValue, ...cleanValueOptions })

    if (userMaxLength && stringValue.replace(/-/g, '').length > userMaxLength) {
      return
    }

    if (stringValue === '' || stringValue === '-' || stringValue === decimalSeparator) {
      onValueChange && onValueChange(undefined, name, { float: null, formatted: '', value: '' })
      setStateValue(stringValue)
      // Always sets cursor after '-' or decimalSeparator input
      setCursor(1)
      return
    }

    const getStringValueWithoutSeparator = () => {
      if (decimalSeparator) {
        return stringValue.replace(decimalSeparator, '.')
      }
      return stringValue
    }

    const stringValueWithoutSeparator = getStringValueWithoutSeparator()

    const numberValue = parseFloat(stringValueWithoutSeparator)

    const formattedValue = formatValue({
      value: stringValue,
      ...formatValueOptions
    })

    if (detectIsNumber(cursorPosition)) {
      // Prevent cursor jumping
      const getNewCursor = () => {
        const newCursor = cursorPosition + (formattedValue.length - value.length)
        if (newCursor <= 0) {
          if (prefix) {
            return prefix.length
          }
          return 0
        }
        return newCursor
      }

      const newCursor = getNewCursor()

      setCursor(newCursor)
      setChangeCount(changeCount + 1)
    }

    setStateValue(formattedValue)

    if (onValueChange) {
      const values = {
        float: numberValue,
        formatted: formattedValue,
        value: stringValue
      }
      onValueChange(stringValue, name, values)
    }
  }

  const handleOnInput = (event) => {
    const { value, selectionStart } = event.target

    processChange(value, selectionStart)

    onInput && onInput(event)
  }

  const handleOnFocus = (event) => {
    if (onFocus) {
      onFocus(event)
    }

    if (stateValue) {
      return stateValue.length
    }
    return 0
  }

  const handleOnBlur = (event) => {
    const { value } = event.target

    const valueOnly = cleanValue({ value, ...cleanValueOptions })

    if (valueOnly === '-' || valueOnly === decimalSeparator || !valueOnly) {
      setStateValue('')
      onBlur && onBlur(event)
      return
    }

    const fixedDecimals = fixedDecimalValue(valueOnly, decimalSeparator, fixedDecimalLength)

    const getDecimalScale = () => {
      if (detectIsNumber(decimalScale)) {
        return decimalScale
      }
      return fixedDecimalLength
    }

    const newValue = padTrimValue(
      fixedDecimals,
      decimalSeparator,
      getDecimalScale()
    )

    const numberValue = parseFloat(newValue.replace(decimalSeparator, '.'))

    const formattedValue = formatValue({
      ...formatValueOptions,
      value: newValue
    })

    if (onValueChange && formatValueOnBlur) {
      onValueChange(newValue, name, {
        float: numberValue,
        formatted: formattedValue,
        value: newValue
      })
    }

    setStateValue(formattedValue)

    if (onBlur) {
      onBlur(event)
    }
  }

  const handleOnKeyDown = (event) => {
    const { key } = event.sourceEvent

    setLastKeyStroke(key)

    if (step && (key === 'ArrowUp' || key === 'ArrowDown')) {
      event.preventDefault()
      setCursor(stateValue.length)

      const getCurrentValue = () => {
        if (detectIsString(userValue)) {
          return userValue.replace(decimalSeparator, '.')
        }
        return cleanValue({ value: stateValue, ...cleanValueOptions })
      }

      const getParsedCurrentValue = () => {
        const parsed = parseFloat(getCurrentValue())
        if (detectIsNaN(parsed)) {
          return 0
        }
        return parsed
      }

      const currentValue = getParsedCurrentValue()

      const getNewValue = () => {
        if (key === 'ArrowUp') {
          return currentValue + step
        }
        return currentValue - step
      }

      const newValue = getNewValue()

      if (detectIsNumber(min) && newValue < min) {
        return
      }

      if (detectIsNumber(max) && newValue > max) {
        return
      }

      const getFixedLength = () => {
        if (String(step).includes('.')) {
          return Number(String(step).split('.')[1].length)
        }
        return null
      }

      const fixedLength = getFixedLength()

      const getValueToProcess = () => {
        if (detectIsNull(fixedLength)) {
          return newValue
        }
        return newValue.toFixed(fixedLength)
      }

      processChange(String(getValueToProcess()).replace('.', decimalSeparator))
    }

    if (onKeyDown) {
      onKeyDown(event)
    }
  }

  const handleOnKeyUp = (event) => {
    const { key } = event.sourceEvent
    const { selectionStart } = event.target

    if (key !== 'ArrowUp' && key !== 'ArrowDown' && stateValue !== '-') {
      const suffix = getSuffix(stateValue, { groupSeparator, decimalSeparator })

      if (suffix && selectionStart && selectionStart > stateValue.length - suffix.length) {
        if (inputRef.current) {
          const newCursor = stateValue.length - suffix.length
          inputRef.current.setSelectionRange(newCursor, newCursor)
        }
      }
    }

    onKeyUp && onKeyUp(event)
  }

  useEffect(() => {
    if (detectIsEmpty(userValue) && detectIsEmpty(defaultValue)) {
      setStateValue('')
    }
  }, [defaultValue, userValue])

  useEffect(() => {
    // prevent cursor jumping if editing value
    if (
      dirty &&
      stateValue !== '-' &&
      inputRef.current &&
      document.activeElement === inputRef.current
    ) {
      inputRef.current.setSelectionRange(cursor, cursor)
    }
  }, [stateValue, cursor, inputRef, dirty, changeCount])

  /**
   * If user has only entered "-" or decimal separator,
   * keep the char to allow them to enter next value
   */
  const getRenderValue = () => {
    if (
      detectIsString(userValue) &&
      stateValue !== '-' &&
      (!decimalSeparator || stateValue !== decimalSeparator)
    ) {
      const getDecimalScale = () => {
        if (dirty) {
          return null
        }
        return decimalScale
      }

      return formatValue({
        ...formatValueOptions,
        decimalScale: getDecimalScale(),
        value: userValue
      })
    }

    return stateValue
  }

  const inputProps = {
    type: 'text',
    inputMode: 'decimal',
    id,
    name,
    className,
    onInput: handleOnInput,
    onBlur: handleOnBlur,
    onFocus: handleOnFocus,
    onKeyDown: handleOnKeyDown,
    onKeyUp: handleOnKeyUp,
    placeholder,
    disabled,
    value: getRenderValue(),
    ref: inputRef,
    ...props
  }

  if (customInput) {
    const CustomInput = customInput
    return <CustomInput {...inputProps} />
  }

  return <input {...inputProps} />
})

export default CurrencyInput
