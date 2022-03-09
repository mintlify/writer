import axios from 'axios';
import * as vscode from 'vscode';
import { TEAM } from '../helpers/api';
import { AuthService } from '../helpers/auth';

type Member = {
  email: string,
  isInvitePending: boolean,
};

type Team = {
  admin: string,
  members: Member[]
};

vscode.commands.registerCommand('docs.invite', async () => {
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

  vscode.window.showInformationMessage('Invite sent to ' + email);
});

export class TeamProvider implements vscode.TreeDataProvider<TeamMemberItem> {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  getTreeItem(element: TeamMemberItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: vscode.TreeItem): Promise<any[]> {
    if (element) {
      return [new RemoveMemberItem()];
    }

    const email = this.authService.getEmail();
    const { data: team }: { data: Team } = await axios.get(`${TEAM}?email=${email}`);
    const adminTreeItem = new TeamMemberItem(team.admin, team.admin === email, true);
    const membersTreeItems = team.members.map(
      member => new TeamMemberItem(member.email, member.email === email, false, member.isInvitePending)
    );
    return [adminTreeItem, ...membersTreeItems, new AddMemberItem()];
  }
}

class TeamMemberItem extends vscode.TreeItem {
  constructor(
    public readonly name: string,
    public readonly isSelf: boolean,
    public readonly isAdmin: boolean,
    public readonly isInvitePending: boolean = false,
  ) {
    super(name, isSelf ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
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
  constructor() {
    super('Invite Member', vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon('add');

    this.command = {
      title: 'Invite Member',
      command: 'docs.invite',
    };
  }
}

class RemoveMemberItem extends vscode.TreeItem {
  constructor() {
    super('Remove Member', vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon('trash');
  }
}