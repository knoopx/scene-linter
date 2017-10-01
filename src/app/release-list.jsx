import React from 'react'
import { observer } from 'mobx-react'

@observer
export default class ReleaseList extends React.Component {
  render() {
    return (
      <div {...this.props} className="flex-column flex flex-auto overflow-y-auto" />
    )
  }
}
