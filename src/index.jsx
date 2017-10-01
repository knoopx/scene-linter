import React from 'react'
import ReactDOM from 'react-dom'
import { useStrict } from 'mobx'
import { Provider } from 'mobx-react'
import { AppContainer } from 'react-hot-loader'
import { onSnapshot, getSnapshot, applySnapshot } from 'mobx-state-tree'

import Store from './store'
import App from './app'

let store = Store.create(localStorage.store && JSON.parse(localStorage.store))

useStrict(true)

function render() {
  ReactDOM.render(
    <AppContainer>
      <Provider store={store} >
        <App />
      </Provider>
    </AppContainer>
    , document.querySelector('#root'),
  )
}

onSnapshot(store, (snapshot) => {
  // localStorage.store = JSON.stringify(snapshot)
})

if (module.hot) {
  module.hot.accept('./app', render)
  module.hot.accept('./store', (newStore) => {
    store = newStore
  })

  if (module.hot.data && module.hot.data.store) {
    applySnapshot(store, module.hot.data.store)
  }

  module.hot.dispose((data) => {
    data.store = getSnapshot(store)
  })
}

render()
