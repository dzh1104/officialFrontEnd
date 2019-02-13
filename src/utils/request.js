import axios from 'axios'
import storage from '../utils/storage'
import getBaseUrl from './getBaseUrl'
import messageTip from './messageTip'
import {
  Modal
} from 'antd'

const loginUrl = '/#/user/login'
const urlWhiteList = ['/daas/user/login', '/bi/share']

// https://www.kancloud.cn/yunye/axios/234845

// 创建axios实例
const service = axios.create({
  // api的base_url(根据环境)
  // baseURL: getBaseUrl(), // 在下面各个方法中指定
  // timeout: 6000 // 在下面各个方法中指定
  responseType: 'json',
  // 定义对于给定的HTTP 响应状态码是 resolve 或 reject  promise
  // 大于等于200 小于300 通过校验 resolve
  validateStatus (status) {
    return status >= 200 && status < 300 // 默认的
  }
})

/**
 * 对请求数据 统一 加入token 拦截器，添加到url参数上了（可根据实际前后端约定调整）
 */
service.interceptors.request.use(function (config) {
  let token = storage.getItem('token')
  if (config.params) {
    config.params.token = token
  } else {
    config.params = {
      token
    }
  }
  return config
})

const request = {
  get (url, reqData, {
    needAlert = true,
    timeout = 6000,
    baseURL = getBaseUrl()
  } = {}) {
    return service
      .get(url, {
        params: reqData,
        timeout,
        baseURL
      })
      .then(resData => {
        return handleResData(resData, url, needAlert)
      })
      .catch(error => {
        return handleError(error, url, needAlert)
      })
  },
  post (
    url,
    reqData, {
      needAlert = true,
      timeout = 6000,
      baseURL = getBaseUrl(),
      params = {}
    } = {}
  ) {
    return service
      .post(url, reqData, {
        params,
        timeout,
        baseURL
      })
      .then(resData => {
        return handleResData(resData, url, needAlert)
      })
      .catch(error => {
        return handleError(error, url, needAlert)
      })
  },
  put (
    url,
    reqData, {
      needAlert = true,
      timeout = 6000,
      baseURL = getBaseUrl(),
      params = {}
    } = {}
  ) {
    return service
      .put(url, reqData, {
        params,
        timeout,
        baseURL
      })
      .then(resData => {
        return handleResData(resData, url, needAlert)
      })
      .catch(error => {
        return handleError(error, url, needAlert)
      })
  },
  delete (url, reqData, {
    needAlert = true,
    timeout = 6000,
    baseURL = getBaseUrl()
  } = {}) {
    return service
      .delete(url, {
        data: reqData,
        timeout,
        baseURL
      })
      .then(resData => {
        return handleResData(resData, url, needAlert)
      })
      .catch(error => {
        return handleError(error, url, needAlert)
      })
  }
}

/*
状态码status
  200 正常
  401 未登录
  402 已过登录时效
*/
let hasModal = false // 是否已有重新登录的弹框，避免出现多个弹框

/**
 * 对错误进行统一处理 不在页面中处理
 * @param resData 接口返回的数据
 * @param needAlert 是否需要弹框或额外处理
 * @returns {Number | Object} 页面中可以通过返回的数据类型进行逻辑处理，若为Number，直接返回不做处理
 */
function handleResData (resData, url, needAlert) {
  resData = resData.data
  let status = resData.status
  const token = storage.getItem('token')
  // 根据token判断，除了登录接口和分享页面接口外，没有登录的情况不报错，直接重定向到登录页
  if (!token && urlWhiteList.indexOf(url) === -1) {
    return status
  }
  if (status !== 200) {
    // 特殊情况未登录，先处理，弹框处理
    if (status === 401) {
      if (needAlert && !hasModal) {
        Modal.info({
          content: '您还未登录，请点击确定去登录',
          okText: '确定',
          onOk: () => {
            // 退出登录，刷新跳转、初始化redux数据 和 清空storage中的数据
            storage.clear()
            window.location.href = loginUrl
          }
        })
        // 已弹框处理，不需要message
        needAlert = false
        hasModal = !hasModal
      }
      return status
    }
    // 特殊情况已过登录时效，先处理，弹框处理
    if (status === 402) {
      if (needAlert && !hasModal) {
        Modal.info({
          content: '已过登录时效，请点击确定重新登录',
          okText: '确定',
          onOk: () => {
            // 退出登录，刷新跳转、初始化redux数据 和 清空storage中的数据
            storage.clear()
            window.location.href = loginUrl
          }
        })
        // 已弹框处理，不需要message
        needAlert = false
        hasModal = !hasModal
      }
      return status
    }
    // 统一处理，message处理
    if (needAlert) {
      messageTip({
        type: 'error',
        content: resData.data
      })
    }
    // 返回code 数值类型
    return status
  }
  // 返回请求返回的数据 对象类型
  return resData
}

/**
 * @description 这种是请求的错误，并非业务上的错误，业务上的错误需要在处理返回数据中处理，即handleResData
 *  Something happened in setting up the request that triggered an Error
 * @param {Object} error 接口错误对像
 * @param {String} url 请求报错的接口的path 帮助定位错误接口
 */
function handleError (error, url, needAlert) {
  console.error('发起请求出错: ', error.config, url)
  if (needAlert) {
    if (error.response) {
      // 请求已发出，但服务器响应的状态码不在 2xx 范围内
      messageTip({
        type: 'error',
        content: `网络请求错误（${error.response.status}）`
      })
      // 返回网络请求错误的状态码(number)，以便这个接口错误判断处理(typeof res === 'number'错误)
      return error.response.status
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error at', error.message, url)
      // 返回特殊数字-1，便于错误逻辑处理 对应上面的数值类型
      messageTip({
        type: 'error',
        content: `请求超时，请检查网络`
      })
      return -1
    }
  }
}

export default request
