import fs from 'fs'
import async from 'async'
import Path from 'path'
import { ipcRenderer } from 'electron'

import { types, getParent } from 'mobx-state-tree'
import { autorunAsync } from 'mobx'

function isSFV(path) {
  return Path.extname(path).toLocaleLowerCase() === '.sfv'
}

export default types.model('ScanQueue', {
  items: types.optional(types.array(types.string), []),
  active: types.maybe(types.string),
})
  .actions(self => ({
    afterCreate() {
      ipcRenderer.on('open-file', (e, path) => {
        console.log(path)
        self.scan(path)
      })
      autorunAsync(() => {
        if (!self.active && self.items.length > 0) {
          self.scan(self.shift())
        }
      })
    },
    setActive(value) {
      self.active = value
    },
    enqueue(path) {
      self.items.push(path)
    },
    shift() {
      return self.items.shift()
    },
    scan(path) {
      const store = getParent(self)

      if (isSFV(path)) {
        store.addRelease({ path: Path.dirname(path) })
      } else {
        self.setActive(path)
        fs.readdir(path, (err, matches) => {
          const files = matches.filter(f => !['.', '..'].includes(f)).map(m => Path.join(path, m))
          async.map(files, fs.stat, (err, stats) => {
            files.forEach((file) => {
              const stat = stats[files.indexOf(file)]
              if (stat.isDirectory()) {
                self.enqueue(file)
              } else if (isSFV(file)) {
                if (!store.releases.find(r => [path, Path.dirname(path)].includes(r.path))) {
                  store.addRelease({ path })
                }
              }
            })
            self.setActive(null)
          })
        })
      }
    },
  }))
