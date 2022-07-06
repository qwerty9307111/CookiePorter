/* global chrome */
const copyToClipboard = (tabId, textToCopy) => {
  chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    func: textToCopy => {
      const textArea = window.document.createElement('textarea')
      textArea.value = textToCopy
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      window.document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      window.document.execCommand('copy')
      textArea.remove()
    },
    args: [textToCopy]
  })
}

const createContextMenusByCookies = async (tab) => {
  const { url, id: tabId } = tab
  const cookies = await chrome.cookies.getAll({ url })
  if (cookies && cookies.length) {
    chrome.contextMenus.removeAll(() => {
      cookies.sort((a, b) => a.name < b.name ? -1 : 1).forEach(cookie => {
        const id = JSON.stringify({
          tabId,
          name: cookie.name,
          domain: cookie.domain,
          value: cookie.value
        })
        chrome.contextMenus.create({
          title: `复制 ${cookie.name} 字段`,
          id
        })
      })
    })
  }
}

chrome.tabs.onHighlighted.addListener(async (highlightInfo) => {
  const { windowId } = highlightInfo

  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
    windowId
  })

  if (tabs && tabs[0] && tabs[0].url) {
    createContextMenusByCookies(tabs[0])
  }
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active && tab.url) {
    createContextMenusByCookies(tab)
  }
})

chrome.contextMenus.onClicked.addListener(async (data) => {
  const contextData = JSON.parse(data.menuItemId)
  try {
    await copyToClipboard(contextData.tabId, contextData.value)
    chrome.notifications.create(null, {
      type: 'basic',
      title: '成功',
      iconUrl: '../images/success.png',
      message: contextData.name + ' 复制成功'
    })
  } catch (err) {
    chrome.notifications.create(null, {
      type: 'basic',
      title: '错误',
      iconUrl: '../images/error.png',
      message: err
    })
  }
})
