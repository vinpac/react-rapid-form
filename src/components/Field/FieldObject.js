import React from 'react'
import PropTypes from 'prop-types'
import Field from './Field'

const FieldObject = ({ defaultValue, ...props }) => (
  <Field
    {...props}
    defaultValue={defaultValue}
  />
)

FieldObject.displayName = 'FieldObject'

FieldObject.propTypes = {
  defaultValue: PropTypes.object, // eslint-disable-line react/forbid-prop-types
}

FieldObject.defaultProps = {
  defaultValue: {},
}

export default FieldObject
