import React, { createContext, useEffect, useState } from 'react' // eslint-disable-line
import {
  decodeJWT,
  errorMessageForExpiredRefreshToken,
  fetchTokens,
  fetchWithRefreshToken,
  logIn,
  timeOfExpire,
  tokenExpired,
} from './authentication'
import useLocalStorage from './Hooks'
import { IAuthContext, IAuthProvider, TInternalConfig, TTokenData, TTokenResponse } from './Types'
import { validateAuthConfig } from './validateAuthConfig'

const FALLBACK_EXPIRE_TIME = 600 // 10minutes

export const AuthContext = createContext<IAuthContext>({
  token: '',
  logOut: () => null,
  error: null,
})

export const AuthProvider = ({ authConfig, children }: IAuthProvider) => {
  const [refreshToken, setRefreshToken] = useLocalStorage<string | undefined>('ROCP_refreshToken', undefined)
  const [refreshTokenExpire, setRefreshTokenExpire] = useLocalStorage<number>(
    'ROCP_refreshTokenExpire',
    timeOfExpire(FALLBACK_EXPIRE_TIME)
  )
  const [token, setToken] = useLocalStorage<string>('ROCP_token', '')
  const [tokenExpire, setTokenExpire] = useLocalStorage<number>('ROCP_tokenExpire', timeOfExpire(FALLBACK_EXPIRE_TIME))
  const [idToken, setIdToken] = useLocalStorage<string | undefined>('ROCP_idToken', undefined)
  const [loginInProgress, setLoginInProgress] = useLocalStorage<boolean>('ROCP_loginInProgress', false)
  const [tokenData, setTokenData] = useState<TTokenData | undefined>()
  const [error, setError] = useState<string | null>(null)

  let interval: any

  // Set default values and override from passed config
  const { decodeToken = true, scope = '', preLogin = () => null, postLogin = () => null } = authConfig

  const config: TInternalConfig = {
    decodeToken: decodeToken,
    scope: scope,
    preLogin: preLogin,
    postLogin: postLogin,
    ...authConfig,
  }

  validateAuthConfig(config)

  function logOut() {
    setRefreshToken(undefined)
    setToken('')
    setTokenExpire(timeOfExpire(FALLBACK_EXPIRE_TIME))
    setRefreshTokenExpire(timeOfExpire(FALLBACK_EXPIRE_TIME))
    setIdToken(undefined)
    setTokenData(undefined)
    setLoginInProgress(false)
  }

  function handleTokenResponse(response: TTokenResponse) {
    setRefreshToken(response?.refresh_token)
    setToken(response.access_token)
    setTokenExpire(timeOfExpire(response.expires_in || FALLBACK_EXPIRE_TIME))
    setRefreshTokenExpire(timeOfExpire(response.refresh_token_expires_in || FALLBACK_EXPIRE_TIME))
    setIdToken(response?.id_token)
    setLoginInProgress(false)
    try {
      if (config.decodeToken) setTokenData(decodeJWT(response.access_token))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function refreshAccessToken() {
    if (token && tokenExpired(tokenExpire)) {
      if (refreshToken && !tokenExpired(refreshTokenExpire)) {
        fetchWithRefreshToken({ config, refreshToken })
          .then((result: any) => handleTokenResponse(result))
          .catch((error: string) => {
            setError(error)
            if (errorMessageForExpiredRefreshToken(error)) {
              logOut()
              logIn(config)
            }
          })
      } else {
        // The refresh token has expired. Need to log in from scratch.
        logOut()
        logIn(config)
      }
    }
  }

  // Register the 'check for soon expiring access token' interval (Every minute)
  useEffect(() => {
    interval = setInterval(() => refreshAccessToken(), 60000) // eslint-disable-line
    return () => clearInterval(interval)
  }, [token]) // This token dependency removes the old, and registers a new Interval when a new token is fetched.

  // Runs once on page load
  useEffect(() => {
    if (loginInProgress) {
      // The client has been redirected back from the Auth endpoint with an auth code
      const urlParams = new URLSearchParams(window.location.search)
      if (!urlParams.get('code')) {
        // This should not happen. There should be a 'code' parameter in the url by now..."
        const error_description =
          urlParams.get('error_description') || 'Bad authorization state. Refreshing the page might solve the issue.'
        console.error(error_description)
        setError(error_description)
        logOut()
      } else {
        // Request token from auth server with the auth code
        fetchTokens(config)
          .then((tokens: TTokenResponse) => {
            handleTokenResponse(tokens)
            window.history.replaceState(null, '', window.location.pathname) // Clear ugly url params
            // Call any postLogin function in authConfig
            if (config?.postLogin) config.postLogin()
          })
          .catch((error: string) => {
            setError(error)
          })
      }
    } else if (!token) {
      // First page visit
      setLoginInProgress(true)
      logIn(config)
    } else {
      if (decodeToken) {
        try {
          setTokenData(decodeJWT(token))
        } catch (e) {
          setError((e as Error).message)
        }
      }
      refreshAccessToken() // Check if token should be updated
    }
  }, []) // eslint-disable-line

  return <AuthContext.Provider value={{ tokenData, token, idToken, logOut, error }}>{children}</AuthContext.Provider>
}
