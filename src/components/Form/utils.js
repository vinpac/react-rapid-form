import has from 'has'

export function getByPath(path, fromObj, diggMode = 0, initialValue) {
  if (!path) {
    return fromObj
  }

  let obj = fromObj
  path.split('.').some((fieldName) => {
    if (!has(obj, fieldName)) {
      if (diggMode === 1) {
        obj[fieldName] = { ...initialValue } || {}
      } else if (diggMode === 2) {
        return true
      }
    }

    obj = obj[fieldName]
    return false
  })

  return obj
}

export function hasByPath(fromObj, path) {
  let obj = fromObj
  const pathSplited = path.split('.')
  for (let i = 0; i < pathSplited.length; i += 1) {
    if (has(obj, pathSplited[i])) {
      obj = pathSplited[i]
    } else {
      return false
    }
  }
}

export function getParentByPath(path, fromObj, diggMode, initialValue) {
  const splitedPath = path.split('.')
  return getByPath(
    splitedPath.slice(0, splitedPath.length - 1).join('.'),
    fromObj,
    diggMode,
    initialValue,
  )
}

export function getLastFieldName(path) {
  const index = path.lastIndexOf('.')
  return index === -1 ? path : path.slice(index + 1, path.length)
}

export function getFirstFieldName(path) {
  const index = path.indexOf('.')
  return index === -1 ? path : path.slice(0, index)
}

export function setByPath(path, fromObj, newValue, initialParentValue) {
  getParentByPath(
    path,
    fromObj,
    1,
    initialParentValue,
  )[getLastFieldName(path)] = newValue
}
