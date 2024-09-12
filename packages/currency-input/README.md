# currency-input

Currency input for Dark applications

## Features

- Supports abbreviations (eg. 1k = 1,000 2.5m = 2,500,000)
- Supports prefix and suffix (eg. £ or \$)
- Automatically inserts group separators
- Accepts Intl locale config
- Can use arrow down/up to increment/decrement
- Can allow/disallow decimals

## Usage

Install with `bun add @wareme/utils @wareme/currency-input`.

See the [example](../../examples/currency-input/).

## Props

| Name                                               | Type       | Default        | Description                                                                                      |
| -------------------------------------------------- | ---------- | -------------- | ------------------------------------------------------------------------------------------------ |
| allowDecimals                                      | `boolean`  | `true`         | Allow decimals                                                                                   |
| allowNegativeValue                                 | `boolean`  | `true`         | Allow user to enter negative value                                                               |
| defaultValue                                       | `number`   |                | Default value                                                                                    |
| value                                              | `number`   |                | Programmatically set the value                                                                   |
| onValueChange                                      | `function` |                | Handle change in value                                                                           |
| placeholder                                        | `string`   |                | Placeholder if no value                                                                          |
| decimalsLimit                                      | `number`   | `2`            | Limit length of decimals allowed                                                                 |
| decimalScale                                       | `number`   |                | Specify decimal scale for padding/trimming (eg. 1.5 -> 1.50 or 1.234 -> 1.23 if decimal scale 2) |
| fixedDecimalLength                                 | `number`   |                | Value will always have the specified length of decimals                                          |
| prefix                                             | `string`   |                | Include a prefix (eg. £ or \$)                                                                   |
| suffix                                             | `string`   |                | Include a suffix (eg. € or %)                                                                    |
| decimalSeparator                                   | `string`   | locale default | Separator between integer part and fractional part of value                                      |
| groupSeparator                                     | `string`   | locale default | Separator between thousand, million and billion                                                  |
| intlConfig                                         | `object`   |                | International locale config                                                                      |
| disabled                                           | `boolean`  | `false`        | Disabled                                                                                         |
| disableAbbreviations                               | `boolean`  | `false`        | Disable abbreviations (eg. 1k -> 1,000, 2m -> 2,000,000, 3b -> 3,000,000,000)                    |
| disableGroupSeparators                             | `boolean`  | `false`        | Disable auto adding the group separator between values (eg. 1000 -> 1,000)                       |
| maxLength                                          | `number`   |                | Maximum characters the user can enter                                                            |
| step                                               | `number`   |                | Incremental value change on arrow down and arrow up key press                                    |
| transformRawValue                                  | `function` |                | Transform the raw value from the input before parsing. Needs to return `string`.                 |

### onValueChange

`onValueChange` provides 3 parameters: `value`, `name`, `values`.

- `value` is the value in string format, without the prefix/suffix/separators (eg. `12345`)
- `name` is the name you have given to the component
- `values` is an object with three key values:
  - `float`: value as float or null if empty
  - `formatted`: value after applying formatting
  - `value`: unformatted as string, same as the `value` parameter

### Prefix and suffix

Defining a prefix or suffix will override the intl locale config

### Separators

Separators cannot be a number, and `decimalSeparator` must be different from `groupSeparator`
