import React, { FC, useEffect, useState } from 'react'

import { ContentProvider } from './index'
import { dataType } from '../../types'

import { isJsonValid } from '../utils'

const isDev = '_self' in React.createElement('div')

const ContentProviderReact: FC = () => {
  const [loaded, setLoaded] = useState<boolean>(false)
  const [data, setData] = useState<dataType[] | undefined>()

  useEffect(() => {
    const pathName =
      window.location.pathname === '/' || window.location.pathname === ''
        ? 'default.json'
        : `${window.location.pathname.substring(1)}.json`
    if (!isDev) {
      fetch(`/data/${pathName}`)
        .then((response) => response.text())
        .then((_data) => {
          if (isJsonValid(_data)) {
            setData([{ filename: `/${pathName}`, content: _data }])
            setLoaded(true)
          }
        })
    } else {
      setData(undefined)
      setLoaded(true)
    }
  }, [])

  return (
    <div style={{ height: '100%' }}>
      {loaded && <ContentProvider data={data} standaloneServer={true} showEditorInProd={false} />}
    </div>
  )
}

export { ContentProviderReact }
