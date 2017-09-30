import React from 'react'
import PropTypes from 'prop-types'
import Field from './Field'

const FieldArray = ({ defaultValue, valueKey, ...props }) => (
  <Field
    {...props}
    defaultValue={defaultValue}
    valueKey={valueKey}
  />
)

FieldArray.displayName = 'FieldArray'

FieldArray.propTypes = {
  defaultValue: PropTypes.array, // eslint-disable-line react/forbid-prop-types
  valueKey: PropTypes.string,
}

FieldArray.defaultProps = {
  defaultValue: [],
  valueKey: 'values',
}

export default FieldArray
