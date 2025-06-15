import NetInfo from '@react-native-community/netinfo'
import { useState, useEffect } from 'react'

export interface NetworkState {
  isConnected: boolean
  isInternetReachable: boolean | null
  type: string | null
}

export const useNetwork = (): NetworkState => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: null,
    type: null,
  })

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      })
    })

    return unsubscribe
  }, [])

  return networkState
}

export const checkNetworkConnection = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch()
    return state.isConnected ?? false
  } catch (error) {
    console.log('Error checking network connection:', error)
    return false
  }
}