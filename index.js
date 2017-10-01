const path = require('path')
const electron = require('electron')

const { app, shell, BrowserWindow, Menu } = electron

let win
const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.96 Safari/537.36'

if (process.env.NODE_ENV === 'development') {
  const webpack = require('webpack')
  const WebpackDevServer = require('webpack-dev-server')
  const config = require(path.resolve('./webpack.config.js'))

  config.output.publicPath = 'http://localhost:8080/'
  config.entry.unshift('react-hot-loader/patch', 'webpack-dev-server/client?http://localhost:8080/', 'webpack/hot/dev-server')
  config.plugins.unshift(new webpack.HotModuleReplacementPlugin())

  const compiler = webpack(config)
  const server = new WebpackDevServer(compiler, { hot: true, inline: true })
  server.listen(8080)
}

function createWindow() {
  const { screen } = require('electron')
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  win = new BrowserWindow({
    width,
    height,
    webPreferences: {
      webSecurity: false,
    },
  })

  win.webContents.session.webRequest.onBeforeSendHeaders(({ requestHeaders }, cb) => {
    if (requestHeaders['x-referer']) {
      requestHeaders.Referer = requestHeaders['x-referer']
      delete requestHeaders['x-referer']
    } else {
      delete requestHeaders.Referer
    }
    cb({ requestHeaders })
  }, {
    urls: ['<all_urls>'],
    types: ['xmlhttprequest'],
  })

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:8080/renderer.html', { userAgent })
  } else {
    win.loadURL(`file://${__dirname}/dist/renderer.html`, { userAgent })
  }

  if (process.env.DEBUG || process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools()
  }

  win.on('closed', () => {
    win = null
  })
}

app.on('ready', () => {
  if (process.platform === 'darwin') {
    const defaultMenu = require('electron-default-menu')
    Menu.setApplicationMenu(Menu.buildFromTemplate(defaultMenu(app, shell)))
  }
  createWindow()
})

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})

app.on('will-finish-launching', () => {
  app.on('open-file', (e, path) => {
    if (win) {
      e.preventDefault()
      console.log(e, path)
      win.webContents.send('open-file', path)
    }
  })
})
