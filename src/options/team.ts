import axios from 'axios';
import * as vscode from 'vscode';
import { INVITE, TEAM, USERID } from '../helpers/api';
import { AuthService, createTeamTree, Status } from '../helpers/auth';

type Member = {
  email: string,
  isInvitePending: boolean,
};

type Team = {
  admin: string,
  members: Member[]
};

vscode.commands.registerCommand('docs.invite', async (authService: AuthService, status: Status, shouldCreateTeam = true) => {
  const email = await vscode.window.showInputBox({
    title: 'Invite memember adding their email',
    placeHolder: 'hi@example.com',
    validateInput: (email) => {
      if (/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)) {
        return null;
      }

      return 'Please enter a valid email address';
    }
  });

  if (!email) {
    return null;
  }

    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Inviting member',
    }, async () => {
      return new Promise(async (resolve, reject) => {
        try {
          await axios.post(INVITE, {
            userId: USERID,
            fromEmail: authService.getEmail(),
            toEmail: email,
            shouldCreateTeam
          });
          vscode.window.showInformationMessage('Invite sent to ' + email);
          createTeamTree(authService, status);
          resolve('Completed inviting member');
        } catch (error: any) {
          vscode.window.showErrorMessage(error?.response?.data?.error);
          reject('Error inviting member');
        }
      });
    });
});

vscode.commands.registerCommand('docs.removeMember', async (authService, status, email) => {
  try {
    await axios.delete(INVITE, {
      data: {
        fromEmail: authService.getEmail(),
        toEmail: email
      }
    });
    createTeamTree(authService, status);
  } catch (error: any) {
    vscode.window.showErrorMessage(error?.response?.data?.error);
  }
});

export class TeamProvider implements vscode.TreeDataProvider<TeamMemberItem> {
  private authService: AuthService;
  private status: Status;

  constructor(authService: AuthService, status: Status) {
    this.authService = authService;
    this.status = status;
  }

  getTreeItem(element: TeamMemberItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: vscode.TreeItem): Promise<any[]> {
    if (element) {
      return [new RemoveMemberItem(this.authService, this.status, element.id)];
    }

    if (this.status !== 'team' && this.status !== 'member') {
      return [new UpgradeMemberItem(this.authService, this.status)];
    }

    const email = this.authService.getEmail();
    const { data: team }: { data: Team } = await axios.get(TEAM, {
      data: {
        email,
      }
    });
    const adminTreeItem = new TeamMemberItem(this.status, team.admin, team.admin === email, true);
    const membersTreeItems = team.members.map(
      member => new TeamMemberItem(this.status, member.email, member.email === email, false, member.isInvitePending)
    );

    const treeItems: any[] = [adminTreeItem, ...membersTreeItems];
    if (this.status === 'team') {
      treeItems.push(new AddMemberItem(this.authService, this.status));
    }
    return treeItems;
  }
}

class TeamMemberItem extends vscode.TreeItem {
  constructor(
    public readonly status: Status,
    public readonly name: string,
    public readonly isSelf: boolean,
    public readonly isAdmin: boolean,
    public readonly isInvitePending: boolean = false,
  ) {
    super(name, isSelf || status === 'member' ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
    this.id = name;

    if (isAdmin) {
      this.description = 'Admin';
    }
    if (isInvitePending) {
      this.description = 'Invited';
    }
    if (isSelf) {
      this.iconPath = new vscode.ThemeIcon('account');
    }
  }
}

class AddMemberItem extends vscode.TreeItem {
  constructor(authService: AuthService, status: Status) {
    super('Invite Member', vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon('add');

    this.command = {
      title: 'Invite Member',
      command: 'docs.invite',
      arguments: [authService, status]
    };
  }
}

class RemoveMemberItem extends vscode.TreeItem {
  constructor(authService: AuthService, status: Status, email?: string) {
    super('Remove Member', vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon('trash');

    this.command = {
      title: 'Remove Member',
      command: 'docs.removeMember',
      arguments: [authService, status, email]
    };
  }
}

class UpgradeMemberItem extends vscode.TreeItem {
  constructor(authService: AuthService, status: Status) {
    super('Invite Member', vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon('add');

    this.command = {
      title: 'Invite Member',
      command: 'docs.invite',
      arguments: [authService, status, false]
    };
  }
}