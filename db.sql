CREATE database plocal:local_db admin admin plocal graph

## begin_integration

CREATE CLASS ChartPoint
CREATE PROPERTY ChartPoint.timestamp LONG
CREATE PROPERTY ChartPoint.presentListeners INTEGER
CREATE PROPERTY ChartPoint.understandingPercentage FLOAT

CREATE CLASS Lecture
CREATE PROPERTY Lecture.title STRING
CREATE PROPERTY Lecture.authorId STRING
CREATE PROPERTY Lecture.workspaceId STRING
CREATE PROPERTY Lecture.description STRING
CREATE PROPERTY Lecture.tags EMBEDDEDLIST STRING
CREATE PROPERTY Lecture.statisticCharts EMBEDDEDLIST STRING
CREATE PROPERTY Lecture.creationDate LONG

CREATE CLASS Question
CREATE PROPERTY Question.title STRING
CREATE PROPERTY Question.lectureId STRING
CREATE PROPERTY Question.creationDate LONG
CREATE PROPERTY Question.type STRING
CREATE PROPERTY Question.data STRING

CREATE CLASS StatisticChart
CREATE PROPERTY StatisticChart.lectureId STRING
CREATE PROPERTY StatisticChart.chartPoints EMBEDDEDLIST STRING
CREATE PROPERTY StatisticChart.timeline EMBEDDEDLIST STRING
CREATE PROPERTY StatisticChart.totalDuration LONG

CREATE CLASS TimeMarker
CREATE PROPERTY TimeMarker.statisticChartId STRING
CREATE PROPERTY TimeMarker.startTime LONG
CREATE PROPERTY TimeMarker.finishTime LONG
CREATE PROPERTY TimeMarker.status STRING

CREATE CLASS JoinedUser
CREATE PROPERTY JoinedUser.userId STRING
CREATE PROPERTY JoinedUser.lectureId STRING

CREATE CLASS ActiveLecture
CREATE PROPERTY ActiveLecture.lectureId STRING
CREATE PROPERTY ActiveLecture.lecturerId STRING
CREATE PROPERTY ActiveLecture.status STRING

CREATE CLASS Tag
CREATE PROPERTY Tag.title STRING
CREATE PROPERTY Tag.authorId STRING
CREATE PROPERTY Tag.categoryId STRING
CREATE PROPERTY Tag.description STRING

CREATE CLASS Category
CREATE PROPERTY Category.title STRING
CREATE PROPERTY Category.authorId STRING
CREATE PROPERTY Category.parentCategoryId STRING
CREATE PROPERTY Category.description STRING

CREATE CLASS Link
CREATE PROPERTY Link.title STRING
CREATE PROPERTY Link.authorId STRING
CREATE PROPERTY Link.url STRING
CREATE PROPERTY Link.description STRING

## TODO: find more appropriate property name
CREATE PROPERTY Link.usedLectures EMBEDDEDLIST STRING

## end_integration

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
CREATE PROPERTY UserAccount.gender STRING
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