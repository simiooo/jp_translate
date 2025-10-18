import { createIsomorphicFn } from "@tanstack/react-start"

// Window API wrappers
export const getWindow = createIsomorphicFn()
  .server(() => undefined)
  .client(() => window)

export const getDocument = createIsomorphicFn()
  .server(() => undefined)
  .client(() => document)

export const getLocation = createIsomorphicFn()
  .server(() => ({ origin: '' }))
  .client(() => location)

// LocalStorage API wrappers
export const getLocalStorageItem = createIsomorphicFn()
  .server(() => null)
  .client(() => null)

export const setLocalStorageItem = createIsomorphicFn()
  .server(() => {})
  .client(() => {})

// Document element access
export const getDocumentElement = createIsomorphicFn()
  .server(() => null)
  .client(() => document.documentElement)

// Media query API
export const getMatchMedia = createIsomorphicFn()
  .server(() => ({ matches: false }))
  .client(() => ({ matches: false }))

// URL API wrappers
export const createObjectURL = createIsomorphicFn()
  .server(() => '')
  .client(() => '')

export const revokeObjectURL = createIsomorphicFn()
  .server(() => {})
  .client(() => {})

// Audio API wrapper
export const createAudio = createIsomorphicFn()
  .server(() => ({
    play: () => Promise.resolve(),
    pause: () => {},
    src: ''
  }))
  .client(() => ({
    play: () => Promise.resolve(),
    pause: () => {},
    src: ''
  }))

// Electron API wrapper (already exists but keeping here for consistency)
export const getElectronAPI = createIsomorphicFn()
  .server(() => null)
  .client(() => window?.electronAPI || null)

// Helper functions with parameters - these need to be called differently
export const getLocalStorageItemWithKey = (key: string) => {
  const getLocalStorageItem = createIsomorphicFn()
    .server(() => null)
    .client(() => localStorage.getItem(key))
  return getLocalStorageItem()
}

export const setLocalStorageItemWithKey = (key: string, value: string) => {
  const setLocalStorageItem = createIsomorphicFn()
    .server(() => {})
    .client(() => localStorage.setItem(key, value))
  return setLocalStorageItem()
}

export const getMatchMediaWithQuery = (query: string) => {
  const getMatchMedia = createIsomorphicFn()
    .server(() => ({ matches: false }))
    .client(() => window.matchMedia(query))
  return getMatchMedia()
}

export const createObjectURLForObject = (obj: Blob | MediaSource) => {
  const createObjectURL = createIsomorphicFn()
    .server(() => '')
    .client(() => URL.createObjectURL(obj))
  return createObjectURL()
}

export const revokeObjectURLWithUrl = (url: string) => {
  const revokeObjectURL = createIsomorphicFn()
    .server(() => {})
    .client(() => URL.revokeObjectURL(url))
  return revokeObjectURL()
}

export const createAudioWithSrc = (src?: string) => {
  const createAudio = createIsomorphicFn()
    .server(() => ({
      play: () => Promise.resolve(),
      pause: () => {},
      src: ''
    }))
    .client(() => new Audio(src))
  return createAudio()
}

// Type definitions for the isomorphic wrappers
export interface IsomorphicAudio {
  play: () => Promise<void>
  pause: () => void
  src: string
}

export interface IsomorphicLocation {
  origin: string
}

export interface IsomorphicMediaQueryList {
  matches: boolean
}