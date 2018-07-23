import * as normalizeUrl from 'normalize-url'
import { stripStringPrefix } from './string'

const BASE_NORMALIZATION_OPTIONS = {
  normalizeProtocol: true,
  normalizeHttps: false,
  stripFragment: false,
  stripWWW: true,
  removeTrailingSlash: true,
}

export function normalizeUrlForStorage(url : string) : string {
  url = normalizeUrl(url, {
    ...BASE_NORMALIZATION_OPTIONS,
    stripFragment: true
  })
  url = _cleanNormalizedUrl(url)
  return url
}

export function normalizeUrlForLinkGeneration(url : string) {
  url = normalizeUrl(url, {
    ...BASE_NORMALIZATION_OPTIONS,
    stripFragment: false
  })
  url = _cleanNormalizedUrl(url)
  return url
}

export function normalizeUrlForRetrieval(url : string) {
  url = normalizeUrl(url, {
    ...BASE_NORMALIZATION_OPTIONS,
    stripFragment: true
  })
  return url
}

export function compareUrlsQuickAndDirty(left : string, right : string) {
  return _stripProtocol(left) === _stripProtocol(right)
}

export function _stripProtocol(url : string) {
  url = stripStringPrefix(url, 'http://')
  url = stripStringPrefix(url, 'https://')
  return url
}

export function _stripQuery(url : string) {
  const queryPos = url.indexOf('?')
  return queryPos >= 0 ? url.substr(0, queryPos) : url
}

export function _stripTrailingSlashes(url : string) {
  return url.replace(/\/+$/, "")
}

export function _cleanNormalizedUrl(url : string) {
  url = _stripProtocol(url)
  url = _stripQuery(url)
  url = _stripTrailingSlashes(url)
  return url
}
