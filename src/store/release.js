import Path from 'path'
import glob from 'glob'
import util from 'util'
import { when } from 'mobx'
import { types, getParent } from 'mobx-state-tree'
import { FaFolder, FaFolderOpen } from 'react-icons/lib/fa'

import File from './file'
import { parseLineEnding, parseSFV, parseM3U, crc32, readFile } from '../support'

function isAudio(path) {
  return ['.mp3', '.flac', '.ogg'].includes(Path.extname(path).toLocaleLowerCase())
}

async function verifySFV(self, sfvFile) {
  sfvFile.setStatus('running')

  const buffer = await readFile(sfvFile.path, { encoding: 'utf8' })

  if (buffer.includes('raped')) {
    self.addWarning('raped', sfvFile.name)
  }

  const sfv = await parseSFV(buffer)
  const files = Object.keys(sfv).reduce((h, name) => { h[name] = self.files.find(f => f.name.toLocaleLowerCase() === name.toLocaleLowerCase()); return h }, {})
  const missing = Object.keys(files).filter(name => files[name] === undefined)

  if (missing.length > 0) {
    missing.forEach(name => self.addError('not found', name))
  } else {
    for (const name of Object.keys(sfv)) {
      const file = files[name]
      file.setStatus('running')
      self.setProgress(`Checking ${file.name}`)
      const actual = await crc32(file.path)
      if (actual !== sfv[name]) {
        self.addError('corrupt', name)
      }
      file.setStatus('done')
    }
  }

  sfvFile.setStatus('done')
}

async function verifyM3U(self, m3uFile) {
  m3uFile.setStatus('running')
  const m3u = await parseM3U(m3uFile.path)
  for (const name of m3u) {
    const file = self.files.find(f => f.name.toLocaleLowerCase() === name.toLocaleLowerCase())
    if (!file) {
      self.addError('missing', name)
    }
  }
  m3uFile.setStatus('done')
}

async function verifyLineEnding(self, file, expected) {
  file.setStatus('running')
  const lineEndings = await parseLineEnding(file.path)
  if (lineEndings === expected) {
    //
  } else {
    self.addWarning(`improper file ending ${util.inspect(lineEndings)}`, file.name)
  }
  file.setStatus('done')
}

// xmlstarlet sel -T -t -m "//Search//SourceType[contains(.,'Filename')]/../SearchString" -v '.' -n ~/Downloads/ADLSearch.xml | pbcopy
function verifyFilename(self, path) {
  const regexes = [
    /[^a-z0-9_.()-]/i,
    /^(album|artist|boot|changelog|_?imdb_.*|_imdb|[^a-z]*(?:bok|cd|dvd|media)?info[^a-z]*|install|missing|movie|MP3Test\.log|no|no[-._]?nfo|notes|placeholder|too[-._]old[-._]for[-._](?:m3u|nfo|sfv)|(?:[^a-z]*(complete|proper|tracklist(?:ing)?))+[^a-z]*|tvshow|torrent)\.(?:m3u|nfo|sfv|txt)$/i,
    /^(?:\d+|(?:audio|artist)?[-._]*track[-._]*\d.*)\.(?:cue|m3u|mp3|flac)$/i,
    /(?:^(VTS_\d{2}_\d|(?:Zune)?AlbumArt)|\((?:Small|Medium|Large|Custom)\)).*\.(?:jpe?g|png)$/i,
    /^(?:[^a-z]*(?:(?:^[a-z][^a-z]|[ab][^a-z]|\d{2}x\d{2}|album|and|art|artwork|back|background|banner|bar|bd|booklet|box|characterart|case|cd|clear|copy|cover|cstm|custom|danish|dis[ck]|dvd|english|fanart|finnish|folder|front|german|i[ck]on|in|info|inlay|inner|insert|label|landscape|large|left|logo|medium|mini|movie(?:set)?|nail|norwegian|obj\d{2}[^a-z][a-z]|out|outer|outlay|p[gm]|photo|picture|plex|poster|rear|resize|right|sam|scan(?:nen)?|screen[sz]?|season\d{2}-poster|set|shot|side|sleeve|small|snap|sticker|swedish|thumbs?|top|tracklist(?:ing)?|tray|tvix|uk|us)(?:[^a-z]+([a-d])\1?)?[^a-z]*)+)\.(?:jpe?g|png)$/i,
    /^.{1,2}\.(?:jpe?g|png)$/i,
    /(?:\.(?:srt|sub|idx)|((?:^|[-._])(?:Addic7ed[-._]com|divxsweden[-._]net|Moviesubtitles[-._]org|OpenSubtitles|Subscene|SubtitleSource|undertexter).*)\.(?:nfo|rar|sfv|zip))$/i,
  ]

  if (regexes.some(regex => regex.test(Path.basename(path)))) {
    self.addWarning('improper name', Path.basename(path))
  }
}

// xmlstarlet sel -T -t -m "//Search//SourceType[contains(.,'Directory')]/../SearchString" -v '.' -n ~/Downloads/ADLSearch.xml | pbcopy
function verifyDirname(self) {
  const regexes = [
    /(?:^[^\s]*?\s)/,
    /(?!^(film|serie|dvd|720p|1080p|2160p|4320p|7680p|4k|8k|flac|mp3|mp4.|tv|OS\s|program|musi.|xvid|x26.|hdtv|hd-tv|Games|Movie|spel|season|share).*)^([^\W\xB0\x2D\x5B\x5D\x23\x21\x5F\x3D\xB2\xB9\xB3]).*([^a-z0-9\x28\x29\x2D\x5F\x2E\x40\x26\xe5\xe4\xf6\xe6\xf8]).+/i,
    /[^a-z0-9()_.-].*-\w+$/i,
    /^(?!-FX-|_nds-lite\.nfo$)(?:[-._)]|\([-._()])/i,
    /^\d{9}/,
    /^(?!(?:00-254-254-2012|6581|8088)\.nfo$)[-._()0-9]+\.(?!([acr-xz0-9]\d{2}|ace|arj|cue|flac|jpe?g|m3u|mp3|png|rar|sfv|zip)$)[^.]+$/,
    /^extra(?:fanart|thumbs)$/i,
    /^[^a-z]*(?:art|artworks?|images|labels?|scans?|screens?|screenshots?)[^a-z]*$/i,
  ]

  if (regexes.some(regex => regex.test(Path.basename(self.path)))) {
    self.addWarning('improper name')
  }
}

export default types.model('Release', {
  path: types.identifier(types.string),
  isExpanded: types.optional(types.boolean, false),
  files: types.optional(types.array(File), []),
  errors: types.optional(types.array(types.string), []),
  warnings: types.optional(types.array(types.string), []),
  progress: types.maybe(types.string),
  status: types.optional(types.enumeration(['pending', 'running', 'done']), 'pending'),
})
  .views(self => ({
    get name() {
      return Path.basename(self.path)
    },
    get icon() {
      if (self.isExpanded) {
        return FaFolderOpen
      }
      return FaFolder
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
      return self.errors.length > 0 || self.files.some(f => f.hasErrors)
    },
    get hasWarnings() {
      return self.warnings.length > 0 || self.files.some(f => f.hasWarnings)
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
    afterCreate() {
      glob(Path.join(self.path, '*'), (err, files) => {
        self.setFiles(files.map(file => ({ name: Path.basename(file), path: file })))
      })
    },
    setIsExpanded(value) {
      self.isExpanded = value
    },
    toggleIsExpanded() {
      self.isExpanded = !self.isExpanded
    },
    verify: () => {
      when(() => self.files.length > 0,
        async () => {
          self.setIsExpanded(true)
          self.setStatus('running')

          let nfo
          let m3u

          verifyDirname(self)
          // todo: at least one m3u
          for (const file of self.files) {
            if (file.path) {
              self.setProgress(`Verifying ${file.name}`)
              verifyFilename(self, file.path)
              switch (file.extname) {
                case '.nfo':
                  if (nfo) {
                    file.addError(`dupe ${nfo}`)
                  } else {
                    nfo = file.name
                  }
                  await verifyLineEnding(self, file, '\r\n')
                  break
                case '.m3u':
                  m3u = file.name
                  await verifyLineEnding(self, file, '\n')
                  await verifyM3U(self, file)
                  break
                case '.sfv':
                  await verifyLineEnding(self, file, '\r\n')
                  await verifySFV(self, file)
                  break
              }
            }
          }

          if (!nfo) {
            self.addError('no nfo')
          }

          if (self.files.some(f => isAudio(f.name)) && !m3u) {
            self.addError('no m3u')
          }

          self.setProgress('Done.')
          self.setStatus('done')

          if (self.files.every(f => !f.hasErrors) && self.files.every(f => !f.hasWarnings)) {
            self.setIsExpanded(false)
          }

          if (!self.hasErrors && !self.hasWarnings) {
            getParent(self, 2).removeRelease(self)
          }
        })
    },
    setStatus(status) {
      self.status = status
    },
    setProgress(status) {
      self.progress = status
    },
    setFiles(files) {
      self.files = files
    },
    addError(error, name) {
      if (name) {
        const file = self.files.find(f => f.name === name)
        if (file) {
          file.addError(error)
        } else {
          self.files.push({ name, errors: [error] })
        }
      } else {
        self.errors.push(error)
      }
    },
    addWarning(error, name) {
      if (name) {
        const file = self.files.find(f => f.name === name)
        if (file) {
          file.addWarning(error)
        } else {
          self.files.push({ name, warnings: [error] })
        }
      } else {
        self.warnings.push(error)
      }
    },
  }))
