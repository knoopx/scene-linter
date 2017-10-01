import { types } from 'mobx-state-tree'
import { autorunAsync } from 'mobx'

import Release from './release'
import ScanQueue from './scan-queue'

export default types.model('Store', {
  releaseMap: types.optional(types.map(Release), {}),
  scanQueue: types.optional(ScanQueue, {}),
})
  .views(self => ({
    get releases() {
      return self.releaseMap.values()
    },
    get pending() {
      return self.releases.filter(({ status }) => status === 'pending')
    },
    get running() {
      return self.releases.filter(({ status }) => status === 'running')
    },
    get done() {
      return self.releases.filter(({ status }) => status === 'done')
    },
  }))
  .actions(self => ({
    afterCreate() {
      autorunAsync(() => {
        if (self.pending.length > 0 && self.running.length === 0) {
          const release = self.pending.shift()
          release.verify()
        }
      })
    },
    addRelease(props) {
      self.releaseMap.put(props)
    },
    removeRelease(release) {
      self.releaseMap.delete(release.path)
    },
  }))
