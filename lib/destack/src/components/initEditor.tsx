import { loadPanels } from '../lib/panels'
import { loadTraits } from '../lib/traits'
import { loadComponents } from '../lib/components'
import { loadCommands } from '../lib/commands'
import { loadBlocks } from '../lib/blocks'
import { fetchJSON, escapeName } from '../utils'
import { appendCss } from '../lib/css'
import { handleEvents } from '../lib/events'

import { ChangeEvent } from 'react'
import { standaloneServerPort as port } from '../../server/config'

const uploadFile = (e, editor, standaloneServer): void => {
  const files = e.dataTransfer ? e.dataTransfer.files : e.target.files
  const formData = new FormData()
  for (const i in files) {
    formData.append('file-' + i, files[i])
  }

  const baseUrl = standaloneServer ? `http://localhost:${port}` : ''
  fetch(`${baseUrl}/api/builder/handle`, { method: 'POST', body: formData })
    .then((res) => res.json())
    .then((images) => {
      editor.AssetManager.add(images)
    })
}

const initEditor = async (startServer = true, standaloneServer): Promise<void> => {
  const grapesjs = await import('grapesjs')

  // for 'npm run test' only
  globalThis.grapesjs = grapesjs

  if (startServer) {
    assetManagerOptions.uploadFile = (e: ChangeEvent<HTMLInputElement>) =>
      uploadFile(e, editor, standaloneServer)
    editorOptions.assetManager = assetManagerOptions
  }

  // need var intead of const so it's global
  // and its accessible in uploadFile function
  var editor = grapesjs.init(editorOptions)

  loadCommands(editor)
  loadTraits(editor)
  loadComponents(editor)
  loadBlocks(editor)
  loadPanels(editor, startServer)

  editor.Panels.getPanels().models.forEach((panel) => {
    // if (panel.id != 'views') {
    editor.Panels.removePanel(panel.id)
    // }
  })
  // editor.Panels.removePanel('options')

  editor.Panels.addPanel({
    id: 'myNewPanel',
    el: '#myNewPanel',
    visible: true,
    buttons: [
      {
        id: 'export-template',
        className: 'fa fa-code',
        command: (e) => e.runCommand('export-template'),
        attributes: { title: 'View Code' },
      },
      {
        id: 'undo',
        className: 'fa fa-undo',
        command: (e) => e.runCommand('core:undo'),
        attributes: { title: 'Undo' },
      },
      {
        id: 'redo',
        className: 'fa fa-repeat',
        command: 'core:redo',
        attributes: { title: 'Redo' },
      },
      {
        id: 'update-theme',
        className: 'fa fa-wrench',
        command: 'open-update-theme',
        attributes: {
          title: 'About',
          'data-tooltip-pos': 'bottom',
        },
      },
      {
        id: 'canvas-clear',
        className: 'fa fa-trash',
        command: (e) => e.runCommand('canvas-clear'),
      },
    ],
  })

  editor.BlockManager.isOpen = false

  editor.Panels.addPanel({
    id: 'sidebar',
    el: '#sidebar',
    visible: true,
    buttons: [
      {
        id: 'open-style-manager',
        className: 'fa fa-paint-brush',
        command: () => {
          console.log(editor.BlockManager)
          if (!editor.BlockManager.isOpen) {
            editor.runCommand('open-blocks')
            editor.BlockManager.isOpen = true
          } else {
            editor.BlockManager.isOpen = false
          }
        },
        attributes: { title: 'Open blocks' },
      },
    ],
  })

  appendCss(editor)

  if (startServer) handleEvents(editor, standaloneServer)
  if (startServer) loadTemplate(editor, standaloneServer)

  return editor
}

const loadTemplate = (editor, standaloneServer): void => {
  const pathName =
    window.location.pathname === '/' ? '/default.json' : `${window.location.pathname}.json`
  const baseUrl = standaloneServer ? `http://localhost:${port}` : ''
  console.log('loadTemplate')
  fetchJSON({ method: 'get', url: `${baseUrl}/api/builder/handle` }).then((data) => {
    const component = Object.keys(data).find((c) => data[c].filename === pathName)
    if (component) {
      const content = JSON.parse(data[component].content)
      editor.setComponents(JSON.parse(content.components))
      editor.setStyle(JSON.parse(content.styles))
    }
  })
}

const assetManagerOptions = {
  storageType: '',
  storeOnChange: true,
  storeAfterUpload: true,
  assets: [],
  uploadFile,
}

const editorOptions = {
  selectorManager: { escapeName },
  container: '#gjs',
  height: '100%',
  storageManager: { autoload: false },
  showDevices: false,
  traitsEditor: true,
  assetManager: assetManagerOptions,
  // pageManager: {
  //   pages: [{
  //     id: 'page-1',
  //     name: 'Page 1',
  //     component: '<div id="comp1">Page 1</div>',
  //     styles: `#comp1 { color: red }`,
  //   }, {
  //     id: 'page-2',
  //     name: 'Page 2',
  //     component: '<div id="comp2">Page 2</div>',
  //     styles: `#comp2 { color: green }`,
  //   }, {
  //     id: 'page-3',
  //     name: 'Page 3',
  //     component: '<div id="comp3">Page 3</div>',
  //     styles: `#comp3 { color: blue }`,
  //   }]
  // }
}
export { initEditor }
