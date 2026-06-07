let statusNode = querySelector('#status')

let modeInputNode = querySelector<HTMLSelectElement>('#modeInput')
let recursiveInputNode = querySelector<HTMLInputElement>('#recursiveInput')
let fileInputNode = querySelector<HTMLInputElement>('#fileInput')

let fileList = querySelector('#fileList')
let fileItemTemplate = querySelector('.file-item')
fileItemTemplate.remove()

async function checkFileInput() {
  let file = fileInputNode.files?.[0]
  if (!file) {
    statusNode.textContent =
      'Select a file from `rclone ls remote:path > list.txt`'
    return
  }
  statusNode.textContent = 'Reading file...'
  let url = URL.createObjectURL(file)
  try {
    let res = await fetch(url)
    let text = await res.text()
    type Item = {
      type: 'F' | 'D'
      size: number
      name: string
    }
    let files: Item[] = text
      .trim()
      .split('\n')
      .map(line => {
        let parts = line.trim().split(' ')
        let size = +parts[0]
        let name = parts.slice(1).join(' ')
        if (size == -1) {
          size = 0
        }
        return { type: 'F', size, name }
      })
    function loadDirs() {
      let dirs = new Map<string, Item>()
      for (let file of files) {
        let parts = file.name.split('/')
        let dir_name = parts.slice(0, -1).join('/')
        let dir = dirs.get(dir_name)
        if (!dir) {
          dir = { type: 'D', size: 0, name: dir_name }
          dirs.set(dir_name, dir)
        }
        dir.size += file.size
      }
      if (recursiveInputNode.checked) {
        let stack = Array.from(dirs.values()).map(dir => {
          let parts = dir.name.split('/')
          let level = parts.length
          let parent_name = parts.slice(0, -1).join('/')
          let parent = dirs.get(parent_name)
          if (!parent) {
            parent = { type: 'D', size: 0, name: parent_name }
            dirs.set(parent_name, parent)
          }
          return { dir, parent, level }
        })
        stack.sort((a, b) => a.level - b.level)
        while (stack.length > 0) {
          let { dir, parent } = stack.pop()!
          parent.size += dir.size
        }
      }
      return dirs
    }
    let items: Item[]
    if (modeInputNode.value === 'file') {
      items = files
    } else if (modeInputNode.value === 'directory') {
      items = Array.from(loadDirs().values())
    } else if (modeInputNode.value === 'both') {
      items = [...Array.from(loadDirs().values()), ...files]
    } else {
      throw new Error('Invalid mode: ' + modeInputNode.value)
    }
    items.sort((a, b) => b.size - a.size)
    fileList.textContent = ''
    for (let item of items) {
      let tr = fileItemTemplate.cloneNode(true) as HTMLElement
      tr.querySelector('.file-type')!.textContent = `[${item.type}]`
      tr.querySelector('.file-size')!.textContent = formatSize(item.size)
      tr.querySelector('.file-name')!.textContent = item.name
      fileList.appendChild(tr)
    }
    statusNode.textContent = 'File read completed.'
  } catch (error) {
    statusNode.textContent = String(error)
  } finally {
    URL.revokeObjectURL(url)
  }
}

fileInputNode.onchange = checkFileInput
modeInputNode.onchange = checkFileInput
recursiveInputNode.onchange = checkFileInput

function querySelector<E extends HTMLElement>(
  selector: string,
  container: ParentNode = document.body,
) {
  let element = container.querySelector<E>(selector)
  if (!element) {
    throw new Error(`Element not found: "${selector}"`)
  }
  return element
}

function formatSize(size: number) {
  if (size < 1024) {
    return `${size}B`
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)}KB`
  }
  if (size < 1024 * 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(2)}MB`
  }
  return `${(size / 1024 / 1024 / 1024).toFixed(2)}GB`
}

statusNode.textContent = 'Ready'

setTimeout(checkFileInput)
