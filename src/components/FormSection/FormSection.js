import React from 'react'
import PropTypes from 'prop-types'

class FormSection extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    name: PropTypes.string.isRequired,
  };

  static defaultProps = {
    children: null,
  };

  static childContextTypes = {
    formSectionPath: PropTypes.string,
  };

  static contextTypes = {
    formSectionPath: PropTypes.string,
  };

  getChildContext() {
    const { formSectionPath } = this.context
    const { name } = this.props

    return {
      formSectionPath: formSectionPath
        ? `${formSectionPath}.${name}`
        : name,
    }
  }

  render() {
    const { children } = this.props

    return children
  }
}

export default FormSection
