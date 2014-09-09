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
CREATE PROPERTY User.currentSuperRootWorkspaceId STRING
CREATE PROPERTY User.role STRING
CREATE PROPERTY User.ownWorkspaces EMBEDDEDLIST STRING

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
CREATE PROPERTY Workspace.children EMBEDDEDLIST STRING

CREATE CLASS PermittedWorkspace
CREATE PROPERTY PermittedWorkspace.userId STRING
CREATE PROPERTY PermittedWorkspace.workspaceId STRING
CREATE PROPERTY PermittedWorkspace.parentWorkspaceId STRING
CREATE PROPERTY PermittedWorkspace.permittedChildren EMBEDDEDLIST STRING
CREATE PROPERTY PermittedWorkspace.isOwn BOOLEAN
CREATE PROPERTY PermittedWorkspace.isDefault BOOLEAN
CREATE PROPERTY PermittedWorkspace.readOnly BOOLEAN
CREATE PROPERTY PermittedWorkspace.collectionManager BOOLEAN
CREATE PROPERTY PermittedWorkspace.accessManager BOOLEAN