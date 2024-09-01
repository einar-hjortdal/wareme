// formats phone number strings
// 13-character phone number strings (10 + area code): +000000000000 -> +00 000 00 00 000
export const formatPhoneNumber = (n) => {
  if (n.length === 13) {
    return n.slice(0, 3) + ' ' +
      n.slice(3, 6) + ' ' +
      n.slice(6, 8) + ' ' +
      n.slice(8, 10) + ' ' +
      n.slice(10)
  }
  return n
}
