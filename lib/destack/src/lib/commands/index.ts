const txtConfirm = "Are you sure you want to clear the editor? This can't be undone."

const themeList = [
  { name: 'indigo', color: '#6366f1' },
  { name: 'yellow', color: '#f59e0b' },
  { name: 'red', color: '#f56565' },
  { name: 'purple', color: '#9f7aea' },
  { name: 'pink', color: '#ed64a6' },
  { name: 'blue', color: '#4299e1' },
  { name: 'green', color: '#48bb78' },
]

const colorRegex = new RegExp(
  /(bg|text|border|ring)-(red|yellow|green|blue|indigo|purple|green)-(\d\d\d)/,
  'g',
)

const getAllComponents = (model: any, result = [] as any[]) => {
  result.push(model)
  model.components().each((mod) => getAllComponents(mod, result))
  return result
}

const updateThemeColor = (editor, color) => {
  const wrapper = editor.DomComponents.getWrapper()
  const componentsAll = getAllComponents(wrapper, [])
  componentsAll.forEach((c) => {
    const { el } = c.view
    if (typeof el.className?.baseVal === 'string' && el.className?.baseVal.match(colorRegex)) {
      el.className.baseVal = el.className.baseVal.replace(colorRegex, `$1-${color}-$3`)
      c.replaceWith(el.outerHTML)
    } else if (typeof el.className === 'string' && el.className.match(colorRegex)) {
      el.className = el.className.replace(colorRegex, `$1-${color}-$3`)
      c.replaceWith(el.outerHTML)
    }
  })
}

const getUpdateThemeModal = (editor) => {
  const md = editor.Modal
  const pfx = editor.getConfig().stylePrefix

  const container = document.createElement('div')

  const containerBody = document.createElement('div')
  containerBody.style.padding = '40px 0px'
  containerBody.style.display = 'flex'
  containerBody.style.justifyContent = 'center'

  let selectedTheme
  themeList.forEach((theme) => {
    const btnColor = document.createElement('button')
    btnColor.className = 'change-theme-button'
    btnColor.style.backgroundColor = theme.color
    btnColor.onclick = () => (selectedTheme = theme)

    containerBody.appendChild(btnColor)
  })

  const containerFooter = document.createElement('div')

  const btnEdit = document.createElement('button')
  btnEdit.innerHTML = 'Update'
  btnEdit.className = pfx + 'btn-prim ' + pfx + 'btn-import'
  btnEdit.style.float = 'right'
  btnEdit.onclick = () => {
    updateThemeColor(editor, selectedTheme.name)
    md.close()
  }

  const btnCancel = document.createElement('button')
  btnCancel.innerHTML = 'Cancel'
  btnCancel.className = pfx + 'btn-prim ' + pfx + 'btn-import'
  btnCancel.style.float = 'right'
  btnCancel.onclick = () => {
    md.close()
  }

  // box-shadow: 0 0 0 2pt #c5c5c575
  containerFooter.appendChild(btnEdit)
  containerFooter.appendChild(btnCancel)

  container.appendChild(containerBody)
  container.appendChild(containerFooter)
  return container
}

export const loadCommands = (editor) => {
  editor.Commands.add('import-template', (e) => {
    let modal = e.Modal
    modal.setTitle('Import template file')

    let modalBody = document.createElement('div')
    let testText = document.createElement('p')
    testText.innerText = 'Import file here'
    let input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('single', 'true')

    modalBody.appendChild(testText)
    modalBody.appendChild(input)

    let modalFooter = document.createElement('div')
    modalFooter.className = 'flex justify-end'
    modalFooter.style.textAlign = 'right'

    let cancelButton = document.createElement('button')
    cancelButton.innerText = 'Cancel'
    cancelButton.style.marginRight = '20px'
    cancelButton.addEventListener('click', (e) => {
      e.preventDefault()
      modal.close()
    })

    let importButton = document.createElement('button')
    importButton.innerHTML = 'Import'
    importButton.disabled = !input.files?.length

    importButton.addEventListener('click', (_e) => {
      _e.preventDefault()
      if (input.files?.length) {
        let file = input.files[0]
        if (file) {
          if (file.type == 'application/json') {
            const onReaderLoaded = (event) => {
              let data = JSON.parse(event.target.result)
              let components = data.components
              let styles = data.styles
              try {
                components = JSON.parse(components)
              } catch (error) {
                alert('Wrong format file')
                return
              }
              try {
                styles = JSON.parse(styles)
              } catch (error) {
                alert('Wrong format file')
                return
              }
              editor.setComponents(components)
              editor.setStyle(styles)
            }
            let reader = new FileReader()
            reader.onload = onReaderLoaded
            reader.readAsText(file)
          }
        }
      }
      input.value = ''
      modal.close()
    })

    input.addEventListener('change', function () {
      if (!this.files || this.files.length == 0) {
        importButton.disabled = true
      } else {
        importButton.disabled = false
      }
    })

    modalFooter.appendChild(cancelButton)
    modalFooter.appendChild(importButton)

    modalBody.appendChild(modalFooter)

    modal.setContent(modalBody)
    modal.open()
  })

  editor.Commands.add('set-device-desktop', (e) => e.setDevice('Desktop'))
  editor.Commands.add('set-device-tablet', (e) => e.setDevice('Tablet'))
  editor.Commands.add('set-device-mobile', (e) => e.setDevice('Mobile portrait'))

  editor.Commands.add(
    'canvas-clear',
    (e) => confirm(txtConfirm) && e.runCommand('core:canvas-clear'),
  )

  editor.Commands.add('open-update-theme', {
    run(_, sender) {
      sender.set('active', 0)
      const md = editor.Modal
      md.setTitle('Change Theme')
      const container = getUpdateThemeModal(editor)
      md.setContent(container)
      md.open()
    },
  })
}
