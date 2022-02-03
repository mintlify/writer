import * as vscode from 'vscode';
import axios from 'axios';
import { URLSearchParams } from 'url';
import { ISDEV } from "./api";

const auth0URI = ISDEV ? 'https://dev-h9spuzyu.us.auth0.com' : 'https://mintlify.us.auth0.com';
const responseType = 'code';
const clientId = ISDEV ? 'Rsc8PmIdW9MqtcaJqMqWpJfYWAiMuyrV' : 'MOMiBZylQGPE0nHpbvzVHAT4TgU0DtcP';
const scope = 'openid profile email offline_access';

export const getLoginURI = (uriScheme: string) => {
  const redirectURI = `https://mintlify.com/start/${uriScheme}`;
  return `${auth0URI}/authorize?response_type=${responseType}&client_id=${clientId}&redirect_uri=${redirectURI}&scope=${scope}`;
};

export const getLogoutURI = (uriScheme: string) => {
  const returnToURI = `${uriScheme}://mintlify.search/logout`;
  return `${auth0URI}/v2/logout?client_id=${clientId}&returnTo=${returnToURI}`;
};

export const login = () => {
  const loginURI = getLoginURI(vscode.env.uriScheme);
  vscode.env.openExternal(vscode.Uri.parse(loginURI));
};

export const logout = () => {
  const logoutURI = getLoginURI(vscode.env.uriScheme);
  vscode.env.openExternal(vscode.Uri.parse(logoutURI));
};

export class AuthService {
  constructor(private storage: vscode.Memento) {}
	
  public getToken(): string | null {
    return this.storage.get('authToken', null);
  }

  public setToken(value: string | null) {
    this.storage.update('authToken', value);
  }

  public deleteToken() {
    this.storage.update('authToken', undefined);
  }
}

export const initializeAuth = (authService: AuthService) => {
  vscode.window.registerUriHandler({
    async handleUri(uri: vscode.Uri) {
      if (uri.path === '/auth') {
        const query = new URLSearchParams(uri.query);
  
        const code = query.get('code');
        try {
          console.log({code});
          // const authResponse = await axios.post(MINT_USER_CODE, { code });
          // const { authToken, email, isFirstTime } = authResponse.data;
          
          // Get user data
        } catch (err) {
          vscode.window.showErrorMessage('Error authenticating user');
        }
      } else if (uri.path === '/logout') {
        authService.deleteToken();
      }
    }
  });
};