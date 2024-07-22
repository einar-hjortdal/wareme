import { component, useReducer } from '@dark-engine/core';
import { CurrencyInput, formatValue } from '@wareme/currency-input';
import { detectIsNaN } from '@wareme/utils/src';

const reducer = (state, { fieldName, value }) => {
  return {
    ...state,
    [fieldName]: value,
  };
}

const initialState = {
  field1: {
    value: 100,
    validationClass: '',
    errorMessage: '',
  },
  field2: {
    value: 200,
    validationClass: '',
    errorMessage: '',
  },
};

export const Example4 = component(() => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const prefix = '£';

  const handleOnValueChange = (_value, fieldName) => {
    if (!fieldName) {
      return;
    }

    if (!_value) {
      return dispatch({
        fieldName,
        value: {
          value: undefined,
          validationClass: '',
          errorMessage: '',
        },
      });
    }

    const value = Number(_value);

    if (detectIsNaN(value)) {
      return dispatch({
        fieldName,
        value: {
          value,
          validationClass: 'is-invalid',
          errorMessage: 'Please enter a valid number',
        },
      });
    }

    return dispatch({
      fieldName,
      value: {
        value,
        validationClass: 'is-valid',
        errorMessage: '',
      },
    });
  };

  const total = state.field1.value + state.field2.value;

  return (
    <div >
      <div >
        <h2>Example 4</h2>
        <ul>
          <li>Add two values together</li>
          <li>Format the total value</li>
        </ul>

        <form >
          <div >
            <div >
              <label htmlFor="validation-example-3-field1">Value 1</label>
              <CurrencyInput
                id="validation-example-3-field1"
                name="field1"
                className={state.field1.validationClass}
                value={state.field1.value}
                onValueChange={handleOnValueChange}
                prefix={prefix}
              />
              <div>{state.field1.errorMessage}</div>
            </div>

            <div>
              <label htmlFor="validation-example-3-field2">Value 2</label>
              <CurrencyInput
                id="validation-example-3-field2"
                name="field2"
                className={state.field2.validationClass}
                value={state.field2.value}
                onValueChange={handleOnValueChange}
                prefix={prefix}
              />
              <div>{state.field2.errorMessage}</div>
            </div>

            <div >
              <div >
                <label>Total:</label>
                <div>
                  <h3>{formatValue({ prefix, value: String(total) })}</h3>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
})

export default Example4;