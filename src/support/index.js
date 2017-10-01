import fs from 'fs'
import bufferCrc32 from 'buffer-crc32'
import { isEmpty } from 'lodash'
import detectNewline from 'detect-newline'

export async function readFile(...args) {
  return new Promise((resolve, reject) => {
    fs.readFile(...args, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

export async function parseLineEnding(path) {
  const buffer = await readFile(path, { encoding: 'utf8' })
  return detectNewline(buffer)
}

export async function crc32(path) {
  return new Promise((resolve, reject) => {
    let digest
    fs.createReadStream(path)
      .on('data', (data) => {
        if (digest) {
          digest = bufferCrc32(data, digest)
        } else {
          digest = bufferCrc32(data)
        }
      })
      .on('end', () => {
        resolve(digest.readUInt32BE())
      })
      .on('error', (err) => {
        reject(err)
      })
  })
}

export function parseSFV(buffer) {
  const lines = buffer.split(/[\r\n]+/)
  const data = {}
  for (const line of lines) {
    if (isEmpty(line) || line.startsWith('#') || line.startsWith(';')) {
      //
    } else {
      const match = /^(.+?)\s+([\dA-Fa-f]{8})$/.exec(line)
      if (match) {
        data[match[1].trim()] = parseInt(match[2], 16)
      }
    }
  }
  return data
}

export async function parseM3U(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, { encoding: 'utf8' }, (err, buffer) => {
      if (err) {
        reject(err)
      } else {
        const lines = buffer.split(/[\r\n]+/)
        const data = []
        for (const line of lines) {
          if (isEmpty(line) || line.startsWith('#') || line.startsWith(';')) {
            //
          } else {
            data.push(line.trim())
          }
        }
        resolve(data)
      }
    })
  })
}
