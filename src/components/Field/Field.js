import React from 'react'
import PropTypes from 'prop-types'

const isEvent = candidate =>
  !!(candidate && candidate.stopPropagation && candidate.preventDefault)

class Field extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    component: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.string,
    ]).isRequired,
    validate: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.func),
      PropTypes.func,
    ]),
    asyncValidate: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.func),
      PropTypes.func,
    ]),
    valueKey: PropTypes.string,
    defaultValue: PropTypes.any, // eslint-disable-line react/forbid-prop-types
    type: PropTypes.any, // eslint-disable-line react/forbid-prop-types
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
  };

  static defaultProps = {
    defaultValue: undefined,
    type: undefined,
    validate: undefined,
    asyncValidate: undefined,
    valueKey: 'value',
    onFocus: undefined,
    onBlur: undefined,
  };

  static contextTypes = {
    registerField: PropTypes.func.isRequired,
    formSectionPath: PropTypes.string,
  };

  componentWillMount() {
    const { formSectionPath, registerField } = this.context

    if (!registerField) {
      throw new Error('Fields must be wrapped in a Form')
    }

    let defaultValue = this.props.defaultValue || ''

    if (this.props.type === 'checkbox' || this.props.type === 'radio') {
      this.isCheckbox = true
      defaultValue = false
    }

    const {
      unregister,
      updateFieldState,
      getFormMeta,
      getFieldState,
      shouldUpdate,
    } = registerField(
      formSectionPath
        ? `${formSectionPath}.${this.props.name}`
        : this.props.name,
      {

        value: defaultValue,
        error: this.validateValue(defaultValue),
      },
      this,
    )

    this.unregister = unregister
    this.updateFieldState = updateFieldState
    this.getFormMeta = getFormMeta
    this.getFieldState = getFieldState
    this.shouldUpdate = shouldUpdate
  }

  shouldComponentUpdate() {
    if (this.shouldUpdate()) {
      return true
    }

    return false
  }

  componentWillUnmount() {
    clearTimeout(this.focusTimeout)
    this.unregister()
  }

  handleChange = (event) => {
    let value
    if (isEvent(event)) {
      value = event.target[this.isCheckbox ? 'checked' : this.props.valueKey]
    } else {
      value = event
    }
    if (value === this.getFieldState().value) {
      return
    }

    const validationError = this.validateValue(value)
    this.updateFieldState({ value, error: validationError })
  }

  validateValue(value) {
    const { validate: validators } = this.props

    if (validators) {
      if (Array.isArray(validators)) {
        let error
        if (validators.some((validator) => {
          error = validator(value)
          return error
        })) {
          return error
        }

        return null
      }

      return validators(value)
    }

    return null
  }

  asyncValidate() {
    const { value } = this.getFieldState()
    const { asyncValidate: asyncValidators } = this.props
    const handleSuccess = () => this.updateFieldState({
      asyncError: null,
      asyncValidating: false,
    })

    const handleError = (asyncError) => {
      this.updateFieldState({
        asyncError,
        asyncValidating: false,
      })
    }

    if (asyncValidators) {
      // Set asyncValidating
      if (!this.getFieldState().asyncValidating) {
        this.updateFieldState({
          asyncValidating: true,
        })
      }


      if (Array.isArray(asyncValidators)) {
        let promise
        asyncValidators.forEach((asyncValidator) => {
          if (!promise) {
            promise = asyncValidator(value)
          } else {
            promise.then(() => asyncValidator(value))
          }
        })
        promise.then(handleSuccess).catch(handleError)
      } else {
        asyncValidators(value).then(handleSuccess).catch(handleError)
      }
    }
  }

  handleFocus = (event) => {
    if (this.props.onFocus) {
      this.props.onFocus(event)
    }

    const updateState = () => this.updateFieldState({ isFocused: true })

    // Fix events going crazy
    // TODO: Fix focus and blur events
    if (this.isCheckbox) {
      clearTimeout(this.focusTimeout)
      this.focusTimeout = setTimeout(() => updateState(), 100)
    } else {
      updateState()
    }
  }


  handleBlur = (event) => {
    if (this.props.onBlur) {
      this.props.onBlur(event)
    }

    const updateState = () => {
      this.updateFieldState(
        { isFocused: false, touched: true },
        () => this.asyncValidate(),
      )
    }

    // Fix events going crazy
    // TODO: Fix focus and blur events
    if (this.isCheckbox) {
      clearTimeout(this.focusTimeout)
      this.focusTimeout = setTimeout(() => updateState(), 100)
    } else {
      updateState()
    }
  }

  render() {
    const { isCheckbox } = this
    const {
      component: Component,
      // unused
      name,
      valueKey,
      validate,
      asyncValidate,
      ...props
    } = this.props

    const fieldState = this.getFieldState()

    const input = {
      name: fieldState.path,
      onChange: this.handleChange,
      onFocus: this.handleFocus,
      onBlur: this.handleBlur,
    }

    if (typeof Component === 'string') {
      // set value
      input[isCheckbox ? 'checked' : valueKey] = fieldState.value

      return (
        <Component
          {...props}
          {...input}
        />
      )
    }

    // set value
    input[Component.formKeyName || valueKey] = fieldState.value

    return (
      <Component
        {...props}
        {...(Component.formPassPropsAsInput ? input : { input })}
        meta={{
          ...fieldState,
          ...this.getFormMeta(),
        }}
      />
    )
  }
}

export default Field
