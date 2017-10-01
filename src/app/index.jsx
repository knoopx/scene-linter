import React from 'react'
import { inject, observer } from 'mobx-react'

import ReleaseList from './release-list'
import ReleaseListItem from './release-list-item'

@inject('store')
@observer
export default class App extends React.Component {
  render() {
    const { store } = this.props

    return (
      <div className="vh-100 flex flex-column overflow-hidden near-black" onDragOver={this.onDragOver} onDrop={this.onDrop}>
        {this.props.store.releases.length > 0 ? (
          <ReleaseList>
            {this.props.store.releases.map(release => <ReleaseListItem key={release.path} release={release} />)}
          </ReleaseList>
        ) : (
          <div className="flex flex-auto items-center justify-center gray-3 ma3 ba bw1 br3 b--dashed b--gray-3">
            <h1 className="i">Drop files...</h1>
          </div>
        )}
        <div className="flex flex-none ph3 pv2 bt b--gray-3 items-center justify-between">
          <span className="f7">
            {store.scanQueue.active && <span>Scanning {store.scanQueue.active} ({store.scanQueue.items.length} left)</span>}
          </span>
          <span className="b"><span className="green-7">{store.done.filter(r => !r.hasErrors).length}</span> / <span className="red-7">{store.done.filter(r => r.hasErrors).length}</span> / {store.releases.length}</span>
        </div>
      </div>
    )
  }

  onDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  onDrop(e) {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    files.forEach(file => this.props.store.scanQueue.enqueue(file.path))
  }
}
