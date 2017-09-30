import React from 'react'
import PropTypes from 'prop-types'
import has from 'has'
import {
  getByPath,
  getLastFieldName,
  getParentByPath,
  hasByPath,
  setByPath,
} from './utils'
import { objectForEach } from '../../../../core/utils/objectUtils'

const PARENT_INDICATOR_KEY = '@@form/is-parent'
class Form extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    onSubmit: PropTypes.func,
    // eslint-disable-next-line react/forbid-prop-types
    initialValues: PropTypes.object,
    component: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    className: PropTypes.string,
  }

  static defaultProps = {
    onChange: null,
    onSubmit: null,
    initialValues: {},
    component: 'form',
    className: '',
  }

  static childContextTypes = {
    formSectionPath: PropTypes.string,
    registerField: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)

    this.shouldUpdate = {}
    this.initialFieldStates = {}
    this.state = {
      submited: false,
      fields: {},
    }
  }

  getChildContext() {
    return {
      formSectionPath: '',
      registerField: this.registerField,
    }
  }

  getFieldsState(
    {
      value: includeValues = true,
      errors: includeErrors = true,
      asyncErrors: includeAsyncErrors = true,
      meta: includeMeta = true,
    } = {},
  ) {
    const output = { hasError: false }

    if (includeValues) output.values = {}
    if (includeErrors) output.errors = {}
    if (includeAsyncErrors) output.asyncErrors = {}
    if (includeMeta) output.meta = {}

    this.forEach(({ value, error, asyncError, ...fieldMeta }, path) => {
      if (includeValues) setByPath(path, output.values, value)
      if (includeMeta) setByPath(path, output.meta, fieldMeta)

      if (error) {
        output.hasError = true
        if (includeErrors) setByPath(path, output.errors, error)
      }

      if (asyncError) {
        output.hasError = true
        if (includeAsyncErrors) setByPath(path, output.asyncErrors, asyncError)
      }
    })

    return output
  }


  reset = () => {
    const fields = {}
    this.forEach((field) => {
      setByPath(
        field.path,
        fields,
        { ...getByPath(field.path, this.initialFieldStates) },
        { [PARENT_INDICATOR_KEY]: true },
      )
      setByPath(field.path, this.shouldUpdate, true)
    })

    this.setState({ fields }, this.handleChange)
  }

  handleChange = () =>
    this.props.onChange && this.props.onChange(this.getFieldsState(), this)

  handleSubmit = (event) => {
    const { onSubmit } = this.props

    this.forEach((field) => {
      setByPath(field.path, this.shouldUpdate, true)
    })

    this.setState({
      submited: true,
    })

    if (onSubmit) {
      onSubmit(event, this.getFieldsState(), this)
    }
  }

  forEach(fn, obj = this.state.fields, parentKey) {
    objectForEach(obj, (field, key, i) => {
      if (key === PARENT_INDICATOR_KEY) {
        return
      }

      if (field[PARENT_INDICATOR_KEY]) {
        this.forEach(fn, field, parentKey ? `${parentKey}.${key}` : key)
        return
      }

      fn(field, parentKey ? `${parentKey}.${key}` : key, i)
    })
  }

  registerField = (path, intialState, ref) => {
    const { initialValues } = this.props
    const parent = getParentByPath(path, this.state.fields, 1, {
      [PARENT_INDICATOR_KEY]: true,
    })
    const fieldName = getLastFieldName(path)

    if (!fieldName) {
      throw new Error('Missing Field name at registering')
    }

    if (parent[fieldName]) {
      throw new Error(`Field named ${path.join('.')} already registered`)
    }

    parent[fieldName] = intialState
    parent[fieldName].path = path

    if (hasByPath(initialValues, path)) {
      parent[fieldName].value = getByPath(initialValues, path)
      parent[fieldName].error = ref.validateValue(parent[fieldName].value)
    }

    clearTimeout(this.setStateTimeout)
    setByPath(path, this.initialFieldStates, { ...parent[fieldName] })

    this.setStateTimeout = setTimeout(() => {
      this.setState({ fields: this.state.fields }, this.handleChange)
    }, 50)

    return {
      // Unregister the field
      unregister: () => this.removeField(fieldName),

      // Register the new state of the field
      updateFieldState: (newState, fn) => {
        setByPath(path, this.shouldUpdate, true)
        this.updateFieldState(path, newState, fn)
      },

      // Returns the current state of the field
      getFieldState: () => getByPath(path, this.state.fields),

      // Returns meta from the form
      getFormMeta: () => ({ submited: this.state.submited }),

      // Returns if re-rendering is necessary for field
      shouldUpdate: () => {
        const shouldUpdate = getParentByPath(path, this.shouldUpdate, 2)
        if (shouldUpdate[fieldName]) {
          shouldUpdate[fieldName] = false
          return true
        }

        return false
      },
    }
  }

  updateFieldState(path, changes, fn) {
    const currentState = getByPath(path, this.state.fields)
    const newState = {}
    let shouldUpdateState = false

    ;[
      'value',
      'error',
      'asyncError',
      'asyncValidating',
      'isFocused',
      'touched',
    ].forEach((key) => {
      if (has(changes, key) && currentState[key] !== changes[key]) {
        shouldUpdateState = true
        newState[key] = changes[key]
      }
    })

    if (shouldUpdateState) {
      setByPath(path, this.state.fields, {
        ...currentState,
        ...newState,
      })

      this.setState(
        {
          fields: this.state.fields,
        },
        () => {
          this.handleChange()

          if (fn) {
            fn()
          }
        },
      )
    }
  }

  removeField(fieldName) {
    const { fields } = this.state
    delete fields[fieldName]

    this.setState({
      fields: {
        ...fields,
      },
    })
  }

  render() {
    const {
      component: Component,
      className,
      onSubmit,
      onChange,
      initialValues,
      ...props
    } = this.props

    return (
      <Component
        {...props}
        className={['form', className].join(' ').trim()}
        onSubmit={this.handleSubmit}
      />
    )
  }
}

export default Form
