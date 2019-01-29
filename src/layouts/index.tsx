import React, { ReactNode } from 'react'
import styles from './index.less'
import { isNull } from 'util'

import BasicLayout from './BasicLayout/'

export type BasicLayoutComponent<P> = React.SFC<P>

export interface BasicLayoutProps extends React.Props<any> {
  history?: History
  location?: Location
}

// 根据路由名称获取不同等级的路由
export function getSinglePath(pathname = '/', level = 1) {
  const pathArr = pathname.split('/')[level]
  if (pathArr) {
    return pathArr
  } else {
    return null
  }
}

const Layout: BasicLayoutComponent<BasicLayoutProps> = props => {
  const firstLevenPath = getSinglePath(props.location.pathname)
  // const firstLevenPath = 'basic'
  let ChlLayout = null
  switch (firstLevenPath) {
    case 'basic':
      ChlLayout = () => <BasicLayout>{props.children}</BasicLayout>
      break
    default:
      ChlLayout = null
      break
  }
  return (
    <div className={styles.normal}>
      {isNull(ChlLayout) ? <>{props.children}</> : <ChlLayout>{props.children}</ChlLayout>}
    </div>
  )
}

export default Layout
