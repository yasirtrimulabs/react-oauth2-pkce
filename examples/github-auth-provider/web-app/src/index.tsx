import React, { useContext } from 'react'
// @ts-ignore
import ReactDOM from 'react-dom'
import { AuthContext, AuthProvider, TAuthConfig, IAuthContext } from "react-pkce-oauth2"

const authConfig: TAuthConfig = {
  clientId: 'c43524cc7d3c82b05a47',
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
  tokenEndpoint: 'http://localhost:5000/api/token',
  redirectUri: 'http://localhost:3000/',
  // Example to redirect back to original path after login has completed
  preLogin: () => localStorage.setItem('preLoginPath', window.location.pathname),
  postLogin: () => window.location.replace(localStorage.getItem('preLoginPath') || ''),
  decodeToken: false,
}

function LoginInfo(): JSX.Element {
  const { tokenData, token, logOut, idToken, error }: IAuthContext = useContext(AuthContext)

  if (error){
    return <>
      <div style={{color: "red"}}>An error occurred during authentication: {error}</div>
      <button onClick={()=>logOut()}>Logout</button>
      </>

  }

  return (
      <>
        {token ?
            <>
              <div>
                <h4>Access Token (JWT)</h4>
                <pre style={{
                  width: '400px',
                  margin: "10px",
                  padding: "5px",
                  border: "black 2px solid",
                  wordBreak: 'break-all',
                  whiteSpace: 'break-spaces',
                }}>
                  {token}</pre>
              </div>
              <div>
                <h4>Login Information from Access Token (Base64 decoded JWT)</h4>
                <pre style={{
                  width: '400px',
                  margin: "10px",
                  padding: "5px",
                  border: "black 2px solid",
                  wordBreak: 'break-all',
                  whiteSpace: 'break-spaces',
                }}>
                  {JSON.stringify(tokenData, null, 2)}</pre>
              </div>
              <button onClick={()=>logOut()}>Logout</button>
            </> :
            <div>You are not logged in. Refresh page to login.</div>
        }
      </>
  )

}


ReactDOM.render(
    <div>
      <div>
        <h1>Demo using the 'react-pkce-oauth2' package</h1>
        <p>Github: <a
            href="https://github.com/yasirtrimulabs/react-oauth2-pkce">https://github.com/yasirtrimulabs/react-oauth2-pkce</a>
        </p>
        <p>NPM: <a
            href="https://www.npmjs.com/package/react-pkce-oauth2">https://www.npmjs.com/package/react-pkce-oauth2</a>
        </p>
      </div>
      <AuthProvider authConfig={authConfig}>
        {/* @ts-ignore*/}
        <LoginInfo/>
      </AuthProvider>
    </div>, document.getElementById('root'),
)