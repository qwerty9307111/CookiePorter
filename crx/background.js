/* global chrome */
const DEFAULT_COOKIE_KEY = 'passport_access_token'

let localUrl = 'localhost:8081'
let passportProjectServer = ''

const $message = {
  success (message) {
    chrome.notifications.create(null, {
      type: 'basic',
      title: '成功',
      iconUrl: '../images/success.png',
      message
    })
  },
  warning (message) {
    chrome.notifications.create(null, {
      type: 'basic',
      title: '警告',
      iconUrl: '../images/warning.png',
      message
    })
  },
  error (message) {
    chrome.notifications.create(null, {
      type: 'basic',
      title: '错误',
      iconUrl: '../images/error.png',
      message
    })
  }
}

const throwChromeError = () => {
  if (chrome.runtime.lastError) {
    $message.error(chrome.runtime.lastError.message)
    throw chrome.runtime.lastError
  }
}

const queryString2Object = queryString => {
  const qs = queryString.replace(/.*?\?/, '')
  const result = {}
  return [...new URL(`http://a?${qs}`).searchParams].reduce(
    (cur, [k, v]) => ((cur[k] = v), cur),
    result
  )
}

const saveUrl = (currentUrl, updateUrl) => {
  localUrl = currentUrl
  passportProjectServer = queryString2Object(updateUrl).projectServer
}

const openUrlInCurrentPage = url => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    throwChromeError()
    if (tab) {
      chrome.tabs.update(tab.id, { url })
      saveUrl(tab.url, url)
    } else {
      $message.error('读取浏览器标签页信息失败，可尝试重新访问。')
    }
  })
}

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

  if (changeInfo.url === undefined) { return false }
  if (new URL(tab.url).origin === passportProjectServer) {
    getCookie({
      url: tab.url,
      name: DEFAULT_COOKIE_KEY
    })
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

chrome.webRequest.onResponseStarted.addListener((details) => {
  const { statusCode, responseHeaders } = details
  if (statusCode === 401) {
    const { value } = (responseHeaders || []).find(i => i.name === 'redirect_url')
    openUrlInCurrentPage(value)
  }
}, {
  urls: [
    '*://*/*'
  ]
}, ['responseHeaders'])

const getCookieCallback = cookie => {
  throwChromeError()
  if (!cookie || !cookie.value) {
    return $message.warning('没有获取到' + DEFAULT_COOKIE_KEY + '值')
  }
  setCookieToCurrentTab(cookie)
}

const getCookie = params => chrome.cookies.get(params, getCookieCallback)

const setCookieToCurrentTab = cookie => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab && tab.url) {
      chrome.cookies.set({
        url: localUrl,
        name: cookie.name,
        value: cookie.value
      }, res => {
        throwChromeError()
        if (res) {
          openUrlInCurrentPage(localUrl)
        }
      })
    }
  })
}
