import React from 'react'
import styles from './index.less'
import { Layout } from 'antd'

export default props => {
  return (
    <div>
      <Layout>头部 内容区 底部{props.children}</Layout>
    </div>
  )
}
