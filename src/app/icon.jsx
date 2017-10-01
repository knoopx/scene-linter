import React from 'react'
import classNames from 'classnames'

export default ({ icon, size, className, ...props }) => {
  const Icon = icon
  return <Icon className={classNames('mr2', className)} size={size} {...props} />
}
