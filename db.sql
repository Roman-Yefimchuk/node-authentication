CREATE database plocal:local_db admin admin plocal graph

CREATE CLASS Todo
CREATE PROPERTY Todo.userId STRING
CREATE PROPERTY Todo.title STRING
CREATE PROPERTY Todo.completed BOOLEAN
CREATE PROPERTY Todo.workspaceId STRING
CREATE PROPERTY Todo.creationDate LONG

CREATE CLASS User
CREATE PROPERTY User.accountId STRING 
CREATE PROPERTY User.currentWorkspaceId STRING
CREATE PROPERTY User.currentRootWorkspaceId STRING
CREATE PROPERTY User.role STRING
CREATE PROPERTY User.ownWorkspaces EMBEDDEDLIST STRING
CREATE PROPERTY User.ownGroups EMBEDDEDLIST STRING

CREATE CLASS UserAccount
CREATE PROPERTY UserAccount.userId STRING
CREATE PROPERTY UserAccount.genericId STRING
CREATE PROPERTY UserAccount.displayName STRING
CREATE PROPERTY UserAccount.password STRING
CREATE PROPERTY UserAccount.email STRING
CREATE PROPERTY UserAccount.token STRING
CREATE PROPERTY UserAccount.authorizationProvider STRING
CREATE PROPERTY UserAccount.avatarUrl STRING
CREATE PROPERTY UserAccount.sex STRING
CREATE PROPERTY UserAccount.birthday LONG
CREATE PROPERTY UserAccount.registeredDate LONG

CREATE CLASS Workspace
CREATE PROPERTY Workspace.name STRING
CREATE PROPERTY Workspace.creatorId STRING
CREATE PROPERTY Workspace.creationDate LONG
CREATE PROPERTY Workspace.parentWorkspaceId STRING
CREATE PROPERTY Workspace.hierarchyLevel INTEGER

CREATE CLASS Group
CREATE PROPERTY Group.name STRING
CREATE PROPERTY Group.creatorId STRING
CREATE PROPERTY Group.creationDate LONG
CREATE PROPERTY Group.organizationId STRING
CREATE PROPERTY Group.users EMBEDDEDLIST STRING

CREATE CLASS Organization
CREATE PROPERTY Organization.name STRING
CREATE PROPERTY Organization.creatorId STRING
CREATE PROPERTY Organization.creationDate LONG
CREATE PROPERTY Organization.workspaces EMBEDDEDLIST STRING
CREATE PROPERTY Organization.groups EMBEDDEDLIST STRING

CREATE CLASS PermittedWorkspace
CREATE PROPERTY PermittedWorkspace.userId STRING
CREATE PROPERTY PermittedWorkspace.workspaceId STRING
CREATE PROPERTY PermittedWorkspace.parentWorkspaceId STRING
CREATE PROPERTY PermittedWorkspace.isOwn BOOLEAN
CREATE PROPERTY PermittedWorkspace.isDefault BOOLEAN
CREATE PROPERTY PermittedWorkspace.reader BOOLEAN
CREATE PROPERTY PermittedWorkspace.writer BOOLEAN
CREATE PROPERTY PermittedWorkspace.admin BOOLEAN
CREATE PROPERTY PermittedWorkspace.isAvailable BOOLEAN

INSERT INTO Organization (name, creatorId, creationDate) VALUES ('system', '@system', date());

INSERT INTO Group (name, creatorId, creationDate, organizationId) VALUES ('users', '@system', date(), 'system');
INSERT INTO Group (name, creatorId, creationDate, organizationId) VALUES ('admins', '@system', date(), 'system');

UPDATE Organization ADD groups = (SELECT @rid FROM Group) WHERE name = 'system';