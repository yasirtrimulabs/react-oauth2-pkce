# react-oauth2-pkce

Plug-and-play react package for OAuth2 Authorization Code flow with PKCE

Adhering to the RFCs recommendations, cryptographically sound, and with __zero__ dependencies!  

## What is OAuth2 Authorization Code flow with PKCE?

Short version;  
The modern and secure way to do authentication for mobile and web applications!

Long version;  
<https://oauth.net/2/pkce/>  
<https://datatracker.ietf.org/doc/html/rfc7636>

## Features

- Authorization server agnostic, works equally well with all OAuth2 auth servers following the OAuth2 spec
- Supports OpenID Connect (idTokens)
- Pre- and Post login callbacks
- Silently refreshes short lived access tokens in the background
- Decodes JWT's

## Example

```javascript
import React, { useContext } from 'react'
import ReactDOM from 'react-dom'
import { AuthContext, AuthProvider, TAuthConfig } from "react-pkce-oauth2"

const authConfig: TAuthConfig = {
  clientId: 'myClientID',
  authorizationEndpoint: 'myAuthEndpoint',
  tokenEndpoint: 'myTokenEndpoint',
  // Whereever your application is running. Must match configuration on authorization server
  redirectUri: 'http://localhost:3000/',
  // Optional
  scope: 'someScope openid',
  // Optional
  logoutEndpoint: '',
  // Optional
  logoutRedirect: '',
  // Example to redirect back to original path after login has completed
  preLogin: () => localStorage.setItem('preLoginPath', location.pathname),
  postLogin: () => location.replace(localStorage.getItem('preLoginPath')),
  // Wether or not to try and decode the access token. 
  // Stops errors from being printed in the console for non-JWT access tokens, etc. from Github
  decodeToken: true
}

function LoginInfo() {
  const { tokenData, token, idToken, logOut, error } = useContext(AuthContext)

  return (
      <>
        {token ?
            <>
              <div>
                <h4>Access Token (JWT)</h4>
                <pre>{token}</pre>
              </div>
              <div>
                <h4>Login Information from Access Token (Base64 decoded JWT)</h4>
                <pre>{JSON.stringify(tokenData, null, 2)}</pre>
              </div>
            </> :
            <div>You are not logged in</div>
        }
      </>
  )

}


ReactDOM.render(
    <div>
      <AuthProvider authConfig={authConfig}>
        <LoginInfo/>
      </AuthProvider>
    </div>, document.getElementById('root'),
)
```

## Install

The package is available on npmjs.com here; https://www.npmjs.com/package/react-pkce-oauth2

```bash
npm install react-pkce-oauth2
```

and import

```javascript
import { AuthContext, AuthProvider } from "react-pkce-oauth2"
```
## Develop

1. Update the 'authConfig' object in `src/index.js` with config from your authorization server and application
2. Install node_modules -> `$ yarn install`
3. Run -> `$ yarn start`
## Contribute

You are welcome to create issues and pull requests :)
