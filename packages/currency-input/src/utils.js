import {
  detectIsArray,
  detectIsEmpty,
  detectIsNull,
  detectIsNumber,
  detectIsString,
  detectIsUndefined,
  illegal
} from '@dark-engine/core'

export const throwError = (msg) => illegal(msg, 'currency-input')

export const isNumber = (input) => /\d/gi.test(input)

export const addSeparators = (value/*: string */, separator = ',')/*: string */ => {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
}

// https://stackoverflow.com/questions/17885855/use-dynamic-variable-string-as-regex-pattern-in-javascript
export const escapeRegExp = (stringToGoIntoTheRegex/*: string */)/*: string */ => {
  return stringToGoIntoTheRegex.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
}

export const removeSeparators = (value/*: string */, separator = ',')/*: string */ => {
  const reg = new RegExp(escapeRegExp(separator), 'g')
  return value.replace(reg, '')
}

export const removeInvalidChars = (value/*: string */, validChars/*: Array<string> */)/*: string */ => {
  const chars = escapeRegExp(validChars.join(''))
  const reg = new RegExp(`[^\\d${chars}]`, 'gi')
  return value.replace(reg, '')
}

// https://stackoverflow.com/a/9345181
export const abbrValue = (value/*: number */, decimalSeparator = '.', _decimalPlaces = 10)/*: string */ => {
  if (value > 999) {
    let valueLength = ('' + value).length
    const p = Math.pow
    const d = p(10, _decimalPlaces)
    valueLength -= valueLength % 3

    const abbrValue = Math.round((value * d) / p(10, valueLength)) / d + ' kMGTPE'[valueLength / 3]
    return abbrValue.replace('.', decimalSeparator)
  }

  return String(value)
}

const abbreviationsMap = {
  k: 1_000,
  m: 1_000_000,
  b: 1_000_000_000
}

/**
 * Parse a value with abbreviation e.g 1k = 1000
 */
export const parseAbbrValue = (value/*: string */, decimalSeparator = '.')/*: string | null */ => {
  const reg = new RegExp(`(\\d+(${escapeRegExp(decimalSeparator)}\\d*)?)([kmb])$`, 'i')
  const match = value.match(reg)

  if (match) {
    const [, digits, , abbr] = match
    const multiplier = abbreviationsMap[abbr.toLowerCase()]
    const result = Number(digits.replace(decimalSeparator, '.')) * multiplier

    return String(result)
  }

  return null
}

/**
 * Remove prefix, separators and extra decimals from value
 */
export const cleanValue = ({
  value,
  groupSeparator = ',',
  decimalSeparator = '.',
  allowDecimals = true,
  decimalsLimit = 2,
  allowNegativeValue = true,
  disableAbbreviations = false,
  prefix = '',
  transformRawValue = (rawValue) => rawValue
}) => {
  const transformedValue = transformRawValue(value)

  if (transformedValue === '-') {
    return transformedValue
  }

  const getAbbreviations = () => {
    if (disableAbbreviations) {
      return []
    }
    return ['k', 'm', 'b']
  }

  const abbreviations = getAbbreviations()
  const reg = new RegExp(`((^|\\D)-\\d)|(-${escapeRegExp(prefix)})`)
  const isNegative = reg.test(transformedValue)

  // Is there a digit before the prefix? eg. 1$
  const [prefixWithValue, preValue] = RegExp(`(\\d+)-?${escapeRegExp(prefix)}`).exec(value) || []

  const getWithoutPrefix = () => {
    if (prefix) {
      if (prefixWithValue) {
        return transformedValue.replace(prefixWithValue, '').concat(preValue)
      }
      return transformedValue.replace(prefix, '')
    }
    return transformedValue
  }

  const withoutPrefix = getWithoutPrefix()
  const withoutSeparators = removeSeparators(withoutPrefix, groupSeparator)
  const withoutInvalidChars = removeInvalidChars(withoutSeparators, [
    groupSeparator,
    decimalSeparator,
    ...abbreviations
  ])

  let valueOnly = withoutInvalidChars

  if (!disableAbbreviations) {
    // disallow letter without number
    if (
      abbreviations.some(
        (letter) => letter === withoutInvalidChars.toLowerCase().replace(decimalSeparator, '')
      )
    ) {
      return ''
    }

    const parsed = parseAbbrValue(withoutInvalidChars, decimalSeparator)
    if (detectIsString(parsed)) {
      valueOnly = parsed
    }
  }

  const getIncludeNegative = () => {
    if (isNegative && allowNegativeValue) {
      return '-'
    }
    return ''
  }

  const includeNegative = getIncludeNegative()

  if (decimalSeparator && valueOnly.includes(decimalSeparator)) {
    const [int, decimals] = withoutInvalidChars.split(decimalSeparator)
    const trimmedDecimals = decimalsLimit && decimals ? decimals.slice(0, decimalsLimit) : decimals
    const includeDecimals = allowDecimals ? `${decimalSeparator}${trimmedDecimals}` : ''

    return `${includeNegative}${int}${includeDecimals}`
  }

  return `${includeNegative}${valueOnly}`
}

export const fixedDecimalValue = (
  value/*: string */,
  decimalSeparator/*: string */,
  fixedDecimalLength/*: number */
)/*: string */ => {
  if (detectIsNumber(fixedDecimalLength) && value.length > 1) {
    if (fixedDecimalLength === 0) {
      return value.replace(decimalSeparator, '')
    }

    if (value.includes(decimalSeparator)) {
      const [int, decimals] = value.split(decimalSeparator)

      if (decimals.length === fixedDecimalLength) {
        return value
      }

      if (decimals.length > fixedDecimalLength) {
        return `${int}${decimalSeparator}${decimals.slice(0, fixedDecimalLength)}`
      }
    }

    const getRegex = () => {
      if (value.length > fixedDecimalLength) {
        return new RegExp(`(\\d+)(\\d{${fixedDecimalLength}})`)
      }
      return /(\d)(\d+)/
    }

    const regex = getRegex()

    const match = value.match(regex)
    if (match) {
      const [, int, decimals] = match
      return `${int}${decimalSeparator}${decimals}`
    }
  }

  return value
}

export const getSuffix = (
  value/*: string */,
  { groupSeparator = ',', decimalSeparator = '.' }
) => {
  const suffixRegex = new RegExp(
    `\\d([^${escapeRegExp(groupSeparator)}${escapeRegExp(decimalSeparator)}0-9]+)`
  )
  const suffixMatch = value.match(suffixRegex)
  if (detectIsArray(suffixMatch)) {
    return suffixMatch[1]
  }
  return null
}

const defaultConfig = {
  currencySymbol: '',
  groupSeparator: '',
  decimalSeparator: '',
  prefix: '',
  suffix: ''
}

/**
 * Get locale config from input or default
 */
export const getLocaleConfig = (intlConfig) => {
  const { locale, currency } = intlConfig || {}
  const getNumberFormatter = () => {
    if (locale) {
      if (currency) {
        return new Intl.NumberFormat(locale, { currency, style: 'currency' })
      }
      return new Intl.NumberFormat(locale)
    }
    return new Intl.NumberFormat()
  }

  const numberFormatter = getNumberFormatter()

  return numberFormatter.formatToParts(1000.1).reduce((prev, curr, i) => {
    if (curr.type === 'currency') {
      if (i === 0) {
        return { ...prev, currencySymbol: curr.value, prefix: curr.value }
      } else {
        return { ...prev, currencySymbol: curr.value, suffix: curr.value }
      }
    }
    if (curr.type === 'group') {
      return { ...prev, groupSeparator: curr.value }
    }
    if (curr.type === 'decimal') {
      return { ...prev, decimalSeparator: curr.value }
    }

    return prev
  }, defaultConfig)
}

/**
 * Format value with decimal separator, group separator and prefix
 */
export const formatValue = (options)/*: string */ => {
  const {
    value: _value,
    decimalSeparator,
    intlConfig,
    decimalScale,
    prefix,
    suffix = ''
  } = options

  if (_value === '' || detectIsUndefined(_value)) {
    return ''
  }

  if (_value === '-') {
    return '-'
  }

  const getPrefix = () => {
    if (detectIsEmpty(prefix)) {
      return ''
    }
    return `${escapeRegExp(prefix)}?`
  }
  const isNegative = new RegExp(`^\\d?-${getPrefix()}\\d`).test(_value)

  // replace custom decimal separator if needed
  const getValueWithoutDecimalSeparator = () => {
    if (decimalSeparator !== '.') {
      return replaceDecimalSeparator(_value, decimalSeparator, isNegative)
    }
    return _value
  }
  const valueWithoutDecimalSeparator = getValueWithoutDecimalSeparator()

  // add leading zero if needed
  const getValueWithLeadingZero = () => {
    if (decimalSeparator && decimalSeparator !== '-' && valueWithoutDecimalSeparator.startsWith(decimalSeparator)) {
      return `0${valueWithoutDecimalSeparator}`
    }
    return valueWithoutDecimalSeparator
  }
  const value = getValueWithLeadingZero()

  const defaultNumberFormatOptions = {
    minimumFractionDigits: decimalScale || 0,
    maximumFractionDigits: 20
  }

  const numberFormatter = intlConfig
    ? new Intl.NumberFormat(
      intlConfig.locale,
      intlConfig.currency
        ? {
            ...defaultNumberFormatOptions,
            style: 'currency',
            currency: intlConfig.currency
          }
        : defaultNumberFormatOptions
    )
    : new Intl.NumberFormat(undefined, defaultNumberFormatOptions)

  const parts = numberFormatter.formatToParts(Number(value))

  let formatted = replaceParts(parts, options)

  // Does intl formatting add a suffix?
  const intlSuffix = getSuffix(formatted, { ...options })

  // Include decimal separator if user input ends with decimal separator
  const includeDecimalSeparator = _value.slice(-1) === decimalSeparator ? decimalSeparator : ''

  const getDecimals = () => {
    const regex = /\d+\.(\d+)/
    const matches = value.match(regex)
    if (detectIsArray(matches) && matches.length > 1) {
      const decimals = matches[1]
      return decimals
    }

    return null
  }
  const decimals = getDecimals()

  // Keep original decimal padding if no decimalScale
  if (detectIsEmpty(decimalScale) && decimals && decimalSeparator) {
    if (formatted.includes(decimalSeparator)) {
      formatted = formatted.replace(
        RegExp(`(\\d+)(${escapeRegExp(decimalSeparator)})(\\d+)`, 'g'),
        `$1$2${decimals}`
      )
    } else {
      if (intlSuffix && !suffix) {
        formatted = formatted.replace(intlSuffix, `${decimalSeparator}${decimals}${intlSuffix}`)
      } else {
        formatted = `${formatted}${decimalSeparator}${decimals}`
      }
    }
  }

  if (suffix && includeDecimalSeparator) {
    return `${formatted}${includeDecimalSeparator}${suffix}`
  }

  if (intlSuffix && includeDecimalSeparator) {
    return formatted.replace(intlSuffix, `${includeDecimalSeparator}${intlSuffix}`)
  }

  if (intlSuffix && suffix) {
    return formatted.replace(intlSuffix, `${includeDecimalSeparator}${suffix}`)
  }

  return [formatted, includeDecimalSeparator, suffix].join('')
}

/**
 * Before converting to Number, decimal separator has to be .
 */
const replaceDecimalSeparator = (
  value/*: string */,
  decimalSeparator,
  isNegative/*: boolean */
)/*: string */ => {
  if (decimalSeparator && decimalSeparator !== '.') {
    const newValue = value.replace(RegExp(escapeRegExp(decimalSeparator), 'g'), '.')
    if (isNegative && decimalSeparator === '-') {
      return `-${newValue.slice(1)}`
    }
    return newValue
  }
  return value
}

const replaceParts = (
  parts,
  {
    prefix,
    groupSeparator,
    decimalSeparator,
    decimalScale,
    disableGroupSeparators = false
  })/*: string */ => {
  return parts
    .reduce(
      (prev, { type, value }, i) => {
        if (i === 0 && prefix) {
          if (type === 'minusSign') {
            return [value, prefix]
          }

          if (type === 'currency') {
            return [...prev, prefix]
          }

          return [prefix, value]
        }

        if (type === 'currency') {
          if (prefix) {
            return prev
          }
          return [...prev, value]
        }

        if (type === 'group') {
          if (!disableGroupSeparators) {
            if (groupSeparator) {
              return [...prev, groupSeparator]
            }
            return [...prev, value]
          }
          return prev
        }

        if (type === 'decimal') {
          if (decimalScale && decimalScale === 0) {
            return prev
          }
          if (decimalSeparator) {
            return [...prev, decimalSeparator]
          }
          return [...prev, value]
        }

        if (type === 'fraction') {
          if (decimalScale) {
            return [...prev, value.slice(0, decimalScale)]
          }
          return [...prev, value]
        }

        return [...prev, value]
      },
      ['']
    )
    .join('')
}

export const padTrimValue = (
  value/*: string | undefined */,
  decimalSeparator = '.',
  decimalScale/*: number | undefined */
)/*: string */ => {
  if (detectIsUndefined(decimalScale) || value === '' || detectIsUndefined(value)) {
    return value
  }

  const matches = value.match(/\d/g)
  if (detectIsNull(matches)) {
    return ''
  }

  const [int, decimals] = value.split(decimalSeparator)

  if (decimalScale === 0) {
    return int
  }

  let newValue = decimals || ''

  if (newValue.length < decimalScale) {
    while (newValue.length < decimalScale) {
      newValue += '0'
    }
  } else {
    newValue = newValue.slice(0, decimalScale)
  }

  return `${int}${decimalSeparator}${newValue}`
}

export const repositionCursor = ({
  selectionStart/*: number | null | undefined */,
  value/*: number  */,
  lastKeyStroke/*: string | null */,
  stateValue/*: string | undefined */,
  groupSeparator/*: string | undefined */
}) /* { modifiedValue: string  cursorPosition: number | null | undefined} */ => {
  let cursorPosition = selectionStart
  let modifiedValue = value
  if (stateValue && cursorPosition) {
    const splitValue = value.split('')
    // if cursor is to right of groupSeparator and backspace pressed, delete the character to the left of the separator and reposition the cursor
    if (lastKeyStroke === 'Backspace' && stateValue[cursorPosition] === groupSeparator) {
      splitValue.splice(cursorPosition - 1, 1)
      cursorPosition -= 1
    }
    // if cursor is to left of groupSeparator and delete pressed, delete the character to the right of the separator and reposition the cursor
    if (lastKeyStroke === 'Delete' && stateValue[cursorPosition] === groupSeparator) {
      splitValue.splice(cursorPosition, 1)
      cursorPosition += 1
    }
    modifiedValue = splitValue.join('')
    return { modifiedValue, cursorPosition }
  }

  return { modifiedValue, cursorPosition: selectionStart }
}
