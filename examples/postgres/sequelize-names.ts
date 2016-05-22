////////////////////////////////////////////////////////////////////
//
// GENERATED CLASS
//
// DO NOT EDIT
//
// See sequelize-auto-ts for edits
//
////////////////////////////////////////////////////////////////////

'depends typescript-client-server-compat.js';

import types = require('./sequelize-types');

export interface SequelizeNames {
    TableNames: TableNames;
    calculatedFields:CalculatedFields;
    references:References;
    roleFields:RolesFields;
    userFields:UsersFields;
}

export class TableNames {
    roles:string = 'roles';
    users:string = 'users';
}
export var tableNames:TableNames = new TableNames();

export class RolesFields {
    roleid:string = 'roleid';
    rolename:string = 'rolename';
}
export var rolesFields:RolesFields = new RolesFields();


export class UsersFields {
    userid:string = 'userid';
    roleid:string = 'roleid';
    username:string = 'username';
    role:string = 'role';
}
export var usersFields:UsersFields = new UsersFields();


export class CalculatedFields {}
export var calculatedFields:CalculatedFields = new CalculatedFields();

export class References {
    roleid:types.Reference = { tableName: 'roles', primaryKey: 'roleId', foreignKey: 'roleid', as: undefined};
    userid:types.Reference = { tableName: 'users', primaryKey: 'userid', foreignKey: 'userid', as: undefined};
}

export var references:References = new References();
