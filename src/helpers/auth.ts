import * as vscode from 'vscode';
import axios from 'axios';
import { URLSearchParams } from 'url';
import { ISDEV, MINTBASE } from "./api";

const auth0URI = ISDEV ? 'https://dev-h9spuzyu.us.auth0.com' : 'https://mintlify.us.auth0.com';
const responseType = 'code';
const clientId = ISDEV ? 'Rsc8PmIdW9MqtcaJqMqWpJfYWAiMuyrV' : 'MOMiBZylQGPE0nHpbvzVHAT4TgU0DtcP';
const scope = 'openid profile email offline_access';

const USER_CODE = MINTBASE + '/user/code';

export const getLoginURI = (uriScheme: string) => {
  const redirectURI = `https://mintlify.com/start/${uriScheme}`;
  return `${auth0URI}/authorize?response_type=${responseType}&client_id=${clientId}&redirect_uri=${redirectURI}&scope=${scope}`;
};

export const getLogoutURI = (uriScheme: string) => {
  const returnToURI = `${uriScheme}://mintlify.document/logout`;
  return `${auth0URI}/v2/logout?client_id=${clientId}&returnTo=${returnToURI}`;
};

export const login = () => {
  const loginURI = getLoginURI(vscode.env.uriScheme);
  vscode.env.openExternal(vscode.Uri.parse(loginURI));
};

export const logout = () => {
  const logoutURI = getLogoutURI(vscode.env.uriScheme);
  vscode.env.openExternal(vscode.Uri.parse(logoutURI));
};

export class AuthService {
  constructor(private storage: vscode.Memento) {}
	
  public getToken(): string | null {
    return this.storage.get('authToken', null);
  }

  public setToken(token: string | null) {
    this.storage.update('authToken', token);
  }

  public deleteToken() {
    this.storage.update('authToken', undefined);
  }

  public getEmail(): string | null {
    return this.storage.get('email', null);
  }

  public setEmail(email: string | null) {
    this.storage.update('email', email);
  }

  public deleteEmail() {
    this.storage.update('email', undefined);
  }

}

export const initializeAuth = (authService: AuthService) => {
  if (authService.getEmail() != null) {
    vscode.commands.executeCommand('setContext', 'docs.isSignedIn', true);
  }

  vscode.window.registerUriHandler({
    async handleUri(uri: vscode.Uri) {
      if (uri.path === '/auth') {
        const query = new URLSearchParams(uri.query);
        const code = query.get('code');
        try {
          const authResponse = await axios.post(USER_CODE,
            {
              code,
              userId: vscode.env.machineId,
              uriScheme: vscode.env.uriScheme
            }
          );
          const { email } = authResponse.data;
          authService.setEmail(email);

          vscode.window.showInformationMessage(`🙌 Successfully signed in with ${email}`);
          vscode.commands.executeCommand('setContext', 'docs.isSignedIn', true);
        } catch (err) {
          vscode.window.showErrorMessage('Error authenticating user');
        }
      } else if (uri.path === '/logout') {
        authService.deleteEmail();
        vscode.window.showInformationMessage('Successfully logged out');
        vscode.commands.executeCommand('setContext', 'docs.isSignedIn', false);
      }
    }
  });
};