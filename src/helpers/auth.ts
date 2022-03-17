import * as vscode from "vscode";
import axios from "axios";
import { URLSearchParams } from "url";
import { ISDEV, USER_CODE, PORTAL, UPGRADE, USER_STATUS, USERID } from "./api";
import { FormatOptionsProvider } from "../options/format";
import { HotkeyOptionsProvider } from "../options/hotkey";
import { LanguageOptionsProvider } from "../options/languages";
import { TeamProvider } from "../options/team";
import { createProgressTree } from "../options/progress";

const auth0URI = ISDEV ? "https://dev-h9spuzyu.us.auth0.com" : "https://mintlify.us.auth0.com";
const responseType = "code";
const clientId = ISDEV ? "Rsc8PmIdW9MqtcaJqMqWpJfYWAiMuyrV" : "MOMiBZylQGPE0nHpbvzVHAT4TgU0DtcP";
const scope = "openid profile email offline_access";

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

export const upgrade = (email?: string) => {
  const upgradeURI = UPGRADE;
  vscode.env.openExternal(
    vscode.Uri.parse(`${upgradeURI}?email=${email}&scheme=${vscode.env.uriScheme}`)
  );
};

export const openPortal = (email?: string) => {
  const portalURI = PORTAL;
  vscode.env.openExternal(
    vscode.Uri.parse(`${portalURI}?email=${email}&scheme=${vscode.env.uriScheme}`)
  );
};

vscode.commands.registerCommand("docs.login", async () => {
  login();
});

vscode.commands.registerCommand("docs.logout", async () => {
  logout();
});

export class AuthService {
  constructor(private storage: vscode.Memento) {}
  public getEmail(): string | undefined {
    return this.storage.get("email", undefined);
  }

  public setEmail(email: string) {
    this.storage.update("email", email);
    if (email) {
      vscode.commands.executeCommand("setContext", "docs.isSignedIn", true);
    }
  }

  public deleteEmail() {
    this.storage.update("email", undefined);
    vscode.commands.executeCommand("setContext", "docs.isSignedIn", false);
  }
}

export const createConfigTree = (isUpgraded: boolean) => {
  vscode.window.createTreeView("formatOptions", {
    treeDataProvider: new FormatOptionsProvider(isUpgraded),
  });
  vscode.window.createTreeView("languageOptions", {
    treeDataProvider: new LanguageOptionsProvider(isUpgraded),
  });
  vscode.window.createTreeView("hotkeyOptions", { treeDataProvider: new HotkeyOptionsProvider() });
};

export type Status = "community" | "team" | "member" | "unaccounted" | "unauthenticated";

export const createTeamTree = (authService: AuthService, status: Status) => {
  vscode.window.createTreeView("team", {
    treeDataProvider: new TeamProvider(authService, status || "unauthenticated"),
  });
};

export const updateTrees = async (authService: AuthService) => {
  try {
    const { data: userStatus } = await axios.get(USER_STATUS, {
      data: {
        email: authService.getEmail(),
      },
    });

    const isUpgraded = Boolean(userStatus?.status === "team" || userStatus?.status === "member");
    createConfigTree(isUpgraded);
    createTeamTree(authService, userStatus?.status);
  } catch {
    console.log("Unable to create configurations at the moment");
  }
};

export const initializeAuth = (authService: AuthService) => {
  if (authService.getEmail() != null) {
    vscode.commands.executeCommand("setContext", "docs.isSignedIn", true);
  }

  createProgressTree();
  updateTrees(authService);
  vscode.window.registerUriHandler({
    async handleUri(uri: vscode.Uri) {
      if (uri.path === "/auth") {
        const query = new URLSearchParams(uri.query);
        const code = query.get("code");
        try {
          const authResponse = await axios.post(USER_CODE, {
            code,
            userId: USERID,
            uriScheme: vscode.env.uriScheme,
          });
          const { email } = authResponse.data;
          authService.setEmail(email);
          updateTrees(authService);

          vscode.window.showInformationMessage(`🙌 Successfully signed in with ${email}`);
        } catch (err) {
          vscode.window.showErrorMessage("Error authenticating user");
        }
      } else if (uri.path === "/logout") {
        authService.deleteEmail();
        updateTrees(authService);

        vscode.window.showInformationMessage("Successfully logged out");
      } else if (uri.path === "/return") {
        const query = new URLSearchParams(uri.query);
        const event = query.get("event");

        if (event === "upgrade") {
          updateTrees(authService);
          vscode.window.showInformationMessage("🎉 Successfully upgraded to the premium plan");
        }
      }
    },
  });
};
