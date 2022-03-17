import * as vscode from "vscode";

export const ISDEV = process.env.VSCODE_DEBUG_MODE === "true";
export const USERID = vscode.env.machineId;

export const MINTBASE = ISDEV ? "http://localhost:5000" : "https://api.mintlify.com";
export const DOCS_WRITE = MINTBASE + "/docs/write/v3";
export const DOCS_WRITE_NO_SELECTION = MINTBASE + "/docs/write/v3/no-selection";
export const WORKER_STATUS = (id: string) => MINTBASE + `/docs/worker/${id}`;

export const FEEDBACK = MINTBASE + "/docs/feedback";
export const INTRO_DISCOVER = MINTBASE + "/docs/intro/discover";
export const PROGRESS = MINTBASE + "/progress";

export const UPGRADE = MINTBASE + "/user/checkout";
export const PORTAL = MINTBASE + "/user/portal";

export const USER_CODE = MINTBASE + "/user/code";
export const USER_STATUS = MINTBASE + "/user/status";

export const TEAM = MINTBASE + "/team";
export const INVITE = MINTBASE + "/team/invite";
