import { component, detectIsEmpty } from '@dark-engine/core'

import { useTranslation } from './useTranslation'

// This transforms a string into an array of elements.
// It does not handle nested elements.
//  <Translate
//   id='some.id'
//   defaultMessage='hello <italic>beautiful</italic> <bold>{what}</bold>'
//   values={{what: 'world'}}
//   elements={{
//     italic: (chunk) => <i>{chunk}</i>,
//     bold: (chunk) => <strong>{chunk}</strong>
//   }}
// />

function locateNextDummyElement (translation, fromIndex, dummyElement, renderElement) {
  // find placeholder
  const remaining = translation.substring(fromIndex)
  const opening = `<${dummyElement}>`
  const closing = `</${dummyElement}>`
  const openingIndex = remaining.indexOf(opening)
  const closingIndex = remaining.indexOf(closing)

  // handle not found
  if (openingIndex === -1 || closingIndex === -1) {
    return null
  }

  const adjustedOpeningIndex = fromIndex + openingIndex
  const adjustedClosingIndex = fromIndex + closingIndex
  const actualClosingIndex = adjustedClosingIndex + closing.length

  // extract substring from translation
  let found = translation.substring(0, actualClosingIndex)
  found = found.substring(adjustedOpeningIndex)

  // extract content from found
  const content = found.substring(opening.length, found.length - closing.length)

  return {
    dummyElement,
    renderElement,
    found,
    content,
    openingIndex: adjustedOpeningIndex,
    closingIndex: actualClosingIndex
  }
}

// locateElements returns an array of objects that extend the elements object
// This array will not contain elements that were not found.
function locateDummyElements (translation, elements) {
  const dummyElements = Object.keys(elements)
  const result = []
  for (let i = 0, len = dummyElements.length; i < len; i++) {
    const dummyElement = dummyElements[i]
    const renderElement = elements[dummyElement]

    let fromIndex = 0
    while (true) { // spooky
      const locatedDummyElement = locateNextDummyElement(translation, fromIndex, dummyElement, renderElement)
      if (locatedDummyElement === null) {
        break
      } else {
        result.push(locatedDummyElement)
        fromIndex = locatedDummyElement.closingIndex
      }
    }
  }
  return result
}

// locatedDummyElementIndexes returns an array containing all the openingIndex and closingIndex of locatedDummyElements.
function locatedDummyElementIndexes (locatedDummyElements) {
  const result = []
  for (let i = 0, len = locatedDummyElements.length; i < len; i++) {
    const dummyElement = locatedDummyElements[i]
    result.push(dummyElement.openingIndex)
    result.push(dummyElement.closingIndex)
  }
  return result
}

function findLocatedDummyElementByIndex (locatedDummyElements, openingIndex) {
  for (let i = 0, len = locatedDummyElements.length; i < len; i++) {
    const dummyElement = locatedDummyElements[i]
    if (dummyElement.openingIndex === openingIndex) {
      return dummyElement
    }
  }
}

// replaceDummyElements processes the translation: replaces dummy-elements with real elements.
// Returns an array, ready to be rendered.
function replaceDummyElements (translation, locatedDummyElements) {
  // problem: find all text that is not inside a dummy-element, put in a fragment, in correct location.

  const result = []
  // First: find beginning and end parts
  const dummyElementIndexes = locatedDummyElementIndexes(locatedDummyElements)
  const lowest = Math.min(...dummyElementIndexes)
  const highest = Math.max(...dummyElementIndexes)

  if (lowest !== 0) {
    const start = translation.substring(0, lowest)
    result.push(<>{start}</>)
  }

  // start replacing dummy-elements
  for (let i = 0, len = dummyElementIndexes.length; i < len; i += 2) {
    const dummyElementIndex = dummyElementIndexes[i]
    const dummyElement = findLocatedDummyElementByIndex(locatedDummyElements, dummyElementIndex)
    result.push(dummyElement.renderElement(dummyElement.content))

    // handle gaps
    if (i + 2 === len) { // last iteration does not have gaps
      break
    }

    const closingIndex = dummyElementIndexes[i + 1]
    const nextDummyElementIndex = dummyElementIndexes[i + 2]
    if (closingIndex !== nextDummyElementIndex) {
      const gap = translation.substring(closingIndex, nextDummyElementIndex)
      result.push(<>{gap}</>)
    }
  }

  if (highest !== translation.length) {
    const end = translation.substring(highest)
    result.push(<>{end}</>)
  }

  return result
}

// Translate is able to perform interpolation and handle elements
export const Translate = component(({ className, id, defaultMessage, elements, values }) => {
  if (detectIsEmpty(id) && detectIsEmpty(defaultMessage)) {
    throw new Error('Missing both `id` and `defaultMessage` props')
  }

  const { t } = useTranslation()
  const options = {
    defaultMessage,
    ...values // TODO make own property (refactor parser)
  }
  const translation = t(id, options)

  if (detectIsEmpty(elements)) {
    return translation
  }

  const locatedDummyElements = locateDummyElements(translation, elements)
  const result = replaceDummyElements(translation, locatedDummyElements)
  return result
})
