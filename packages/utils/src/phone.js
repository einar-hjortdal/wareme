import { config } from '../config'

// formats phone number strings
// 13-character phone number strings (10 + area code): +000000000000 -> +00 000 00 00 000
export function formatPhoneNumber (number) {
  if (number.length === 13) {
    return number.slice(0, 3) + ' ' +
      number.slice(3, 6) + ' ' +
      number.slice(6, 8) + ' ' +
      number.slice(8, 10) + ' ' +
      number.slice(10)
  }
  return number
}

export const formattedPhoneNumber = formatPhoneNumber(config.CONTACT_PHONE)
