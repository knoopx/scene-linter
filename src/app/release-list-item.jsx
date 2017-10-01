import React from 'react'
import classNames from 'classnames'

import { sortBy } from 'lodash'
import { observer } from 'mobx-react'
import { shell } from 'electron'

import Icon from './icon'

const FileItem = observer(({ file }) => (
  <div className={classNames('mb1 flex items-center', file.className)}>
    <Icon icon={file.icon} size={20} />
    <a className="mr2 pointer underline-hover" onClick={() => { shell.showItemInFolder(file.path) }}>{file.name}</a>
    {file.errors.map((error, index) => <span key={index} className="ph2 f7 br-pill bg-red-7 white">{error}</span>)}
    {file.warnings.map((error, index) => <span key={index} className="ph2 f7 br-pill bg-yellow-7 white">{error}</span>)}
  </div>
))

@observer
export default class ReleaseListItem extends React.Component {
  render() {
    const { release } = this.props
    return (
      <div className="pv2 ph3 bb b--gray-4">
        <div className="flex items-center justify-between">
          <span className={classNames('flex items-center', release.className)}>
            <Icon className="pointer" icon={release.icon} size={22} onClick={release.toggleIsExpanded} />
            <a className="mr2 pointer underline-hover" onClick={() => { shell.showItemInFolder(release.path) }}>{release.name}</a>
            {release.errors.map((error, index) => <span key={index} className="ph2 f7 br-pill bg-red-7 white">{error}</span>)}
            {release.warnings.map((error, index) => <span key={index} className="ph2 f7 br-pill bg-yellow-7 white">{error}</span>)}
          </span>
          <span className="gray-6 f7">{release.progress}</span>
        </div>
        {release.isExpanded && (
          <div className="pt2 pl2">
            {sortBy(release.files, 'name').map(file => (<FileItem key={file.name} file={file} />))}
          </div>
        )}
      </div>
    )
  }
}
