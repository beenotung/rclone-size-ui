let statusNode = querySelector('#status')

statusNode.textContent = 'Ready'

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
