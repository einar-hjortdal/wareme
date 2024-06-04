export const debounce = (callback, delay) => {
  let timer
  return (...args) => {
    const context = this
    clearTimeout(timer)
    timer = setTimeout(() => callback.apply(context, args), delay)
  }
}

// Clamp a value between a minimum and maximum value
export const clamp = (min, input, max) => {
  return Math.max(min, Math.min(input, max))
}

// Truncate a floating-point number to a specified number of decimal places
export const truncate = (value, decimals = 0) => {
  return parseFloat(value.toFixed(decimals))
}

// Linearly interpolate between two values using an amount (0 <= t <= 1)
export const lerp = (x, y, t) => {
  return (1 - t) * x + t * y
}

export const damp = (x, y, lambda, dt) => {
  return lerp(x, y, 1 - Math.exp(-lambda * dt))
}

// Calculate the modulo of the dividend and divisor while keeping the result within the same sign as the divisor
export const modulo = (n, d) => {
  return ((n % d) + d) % d
}
