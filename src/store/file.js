import { types } from 'mobx-state-tree'
import Path from 'path'
import fs from 'fs'

import { FaFileO, FaFileImageO, FaFileMovieO, FaFileTextO, FaFileAudioO, FaFolderO } from 'react-icons/lib/fa'

export default types.model('File', {
  name: types.identifier(types.string),
  path: types.maybe(types.string),
  status: types.optional(types.enumeration(['pending', 'running', 'done']), 'pending'),
  errors: types.optional(types.array(types.string), []),
  warnings: types.optional(types.array(types.string), []),
})
  .views(self => ({
    get extname() {
      return Path.extname(self.name).toLocaleLowerCase()
    },
    get isDirectory() {
      try { return self.path && fs.lstatSync(self.path).isDirectory() } catch (e) { return false }
    },
    get icon() {
      if (self.isDirectory) {
        return FaFolderO
      }
      switch (self.extname) {
        case '.nfo':
        case '.m3u':
        case '.sfv':
          return FaFileTextO
        case '.jpg':
        case '.png':
          return FaFileImageO
        case '.avi':
        case '.mpg':
        case '.vob':
        case '.mkv':
          return FaFileMovieO
        case '.mp3':
          return FaFileAudioO
        default:
          return FaFileO
      }
    },
    get isPending() {
      return self.status === 'pending'
    },
    get isRunning() {
      return self.status === 'running'
    },
    get isDone() {
      return self.status === 'done'
    },
    get hasErrors() {
      return self.errors.length > 0
    },
    get hasWarnings() {
      return self.warnings.length > 0
    },
    get className() {
      if (self.isPending) {
        return 'gray-5'
      }

      if (self.hasErrors) {
        return 'red-7'
      }

      if (self.hasWarnings) {
        return 'yellow-7'
      }

      if (self.isDone) {
        return 'green-7'
      }

      return ''
    },
  }))
  .actions(self => ({
    setStatus(status) {
      self.status = status
    },
    addError(error) {
      self.errors.push(error)
    },
    addWarning(error) {
      self.warnings.push(error)
    },
  }))
