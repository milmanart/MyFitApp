import { useState, useEffect } from 'react'
import { Dimensions } from 'react-native'

export type Orientation = 'portrait' | 'landscape'

export const useOrientation = () => {
  const [orientation, setOrientation] = useState<Orientation>(() => {
    const { width, height } = Dimensions.get('window')
    return width > height ? 'landscape' : 'portrait'
  })

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const { width, height } = window
      setOrientation(width > height ? 'landscape' : 'portrait')
    })

    return () => subscription?.remove()
  }, [])

  return orientation
}