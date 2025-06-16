import { useState, useEffect } from 'react'
import { Dimensions } from 'react-native'
import { useOrientation } from './useOrientation'

export const useResponsiveDimensions = () => {
  const orientation = useOrientation()
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'))

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window)
    })

    return () => subscription?.remove()
  }, [])

  const isLandscape = orientation === 'landscape'
  const isTablet = Math.min(dimensions.width, dimensions.height) >= 600

  return {
    width: dimensions.width,
    height: dimensions.height,
    isLandscape,
    isTablet,
    orientation,
    // Adaptive padding and margins
    containerPadding: isLandscape ? (isTablet ? 48 : 32) : 24,
    listPadding: isLandscape ? (isTablet ? 32 : 24) : 16,
    modalWidth: isTablet ? '60%' : '80%',
    maxContentWidth: isTablet ? 800 : undefined,
  }
}