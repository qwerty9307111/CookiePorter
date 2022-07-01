/* global chrome flow */
const ORIGIN_INPUT = document.querySelector('#origin')
const KEY_INPUT = document.querySelector('#key')
const SUBMIT_BUTTON = document.querySelector('#submit')
const CLASS_SEPARATOR = ' '
const DEFAULT_COOKIE_KEY = 'passport_access_token'

const classNameToClassList = className => typeof className === 'string' ? className.split(CLASS_SEPARATOR) : []
const classListToClassName = classList => Array.isArray(classList) ? classList.join(CLASS_SEPARATOR) : ''
const deDuplication = arr => Array.isArray(arr) ? [...new Set(arr)] : arr
const concatArray = (arr1, arr2) => arr1.concat(arr2)
const addClass = (el, className) => (
  el.className = flow(
    concatArray,
    deDuplication,
    classListToClassName
  )(
    classNameToClassList(el.className),
    classNameToClassList(className)
  )
)
const removeClass = (el, className) => (
  el.className = el.className.replace(`${className}`, '').trim()
)
const getOriginValue = () => ORIGIN_INPUT?.value
const getCookieKeyValue = () => KEY_INPUT?.value || DEFAULT_COOKIE_KEY

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

const reload = tab => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    func: () => location.reload()
  })
}

const setCookieToCurrentTab = cookie => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab && tab.url) {
      chrome.cookies.set({
        url: tab.url,
        name: cookie.name,
        value: cookie.value
      }, res => {
        throwChromeError()
        if (res) {
          $message.success('设置成功')
          reload(tab)
        }
      })
    }
  })
}

const getCookieCallback = cookie => {
  throwChromeError()
  if (!cookie || !cookie.value) {
    return $message.warning('没有获取到' + getCookieKeyValue() + '值')
  }
  setCookieToCurrentTab(cookie)
}

const getCookie = params => chrome.cookies.get(params, getCookieCallback)

const queryTabsCallback = tabs => {
  throwChromeError()
  if (!tabs || !tabs.length) {
    return $message.warning('没有找到对应的页签')
  }
  getCookie({
    url: tabs[0].url,
    name: getCookieKeyValue()
  })
}

const queryTabs = params => chrome.tabs.query(params, queryTabsCallback)

const verifyOriginField = () => {
  const originValue = getOriginValue()
  if (!originValue) {
    addClass(ORIGIN_INPUT, 'is-danger')
    return $message.warning('Origin is a required field')
  }
  try {
    new URL(originValue)
  } catch (e) {
    addClass(ORIGIN_INPUT, 'is-danger')
    return $message.warning('Origin is invalid')
  }
  removeClass(ORIGIN_INPUT, 'is-danger')
  return true
}

const storageFormData = () => {
  chrome.storage.sync.set({
    origin: getOriginValue(),
    key: getCookieKeyValue()
  }, () => {
    console.log('storage init value')
  })
}

const onSubmit = () => {
  if (verifyOriginField()) {
    storageFormData()
    queryTabs({ url: new URL(getOriginValue()).origin + '/*' })
  }
}

SUBMIT_BUTTON.addEventListener('click', onSubmit, false)

;(function getStorageData () {
  chrome.storage.sync.get('origin', function (data) {
    if (data && data.origin) {
      ORIGIN_INPUT.value = data.origin
    }
  })
  chrome.storage.sync.get('key', function (data) {
    if (data && data.key) {
      KEY_INPUT.value = data.key
    }
  })
})()
