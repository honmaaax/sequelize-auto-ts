////////////////////////////////////////////////////////////////////
//
// GENERATED CLASS
//
// DO NOT EDIT
//
// See sequelize-auto-ts for edits
//
////////////////////////////////////////////////////////////////////

/// <reference path="../../typings/index.d.ts" />

import sequelize = require('sequelize');
import types = require('./sequelize-types');

var Sequelize:sequelize.SequelizeStatic = require('sequelize');

export var initialized:boolean = false;
export var SEQUELIZE:sequelize.Sequelize;

export var RolesModel:types.RolesModel;
export var UsersModel:types.UsersModel;


export function initialize(database:string, username:string, password:string, options:sequelize.Options):any
{
    if (initialized)
    {
        return;
    }

    SEQUELIZE = new Sequelize(database, username, password, options);

    RolesModel = <types.RolesModel> SEQUELIZE.define<types.RolesInstance, types.RolesPojo>('role', {
        'roleid': {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
        'rolename': {type: Sequelize.STRING, allowNull: false, defaultValue: undefined}
        },
        {
            classMethods: {
                GetRoles:(role:any) => {
                    var where:{[key:string]:any} = {};
                    var id:number = parseInt(role);
                    if (isNaN(id)) {
                        if (role['roleid'] !== undefined) { where['roleid'] = role['roleid']}
                        if (role['rolename'] !== undefined) { where['rolename'] = role['rolename']}
                    } else {
                        where['roleid'] = id;
                    }
                    return RolesModel.find({where: where});
                }
            }
        });
    
    UsersModel = <types.UsersModel> SEQUELIZE.define<types.UsersInstance, types.UsersPojo>('user', {
        'userid': {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
        'roleid': {type: Sequelize.INTEGER, allowNull: false, defaultValue: undefined},
        'username': {type: Sequelize.STRING, allowNull: false, defaultValue: undefined}
        },
        {
            classMethods: {
                GetUsers:(user:any) => {
                    var where:{[key:string]:any} = {};
                    var id:number = parseInt(user);
                    if (isNaN(id)) {
                        if (user['userid'] !== undefined) { where['userid'] = user['userid']}
                        if (user['roleid'] !== undefined) { where['roleid'] = user['roleid']}
                        if (user['username'] !== undefined) { where['username'] = user['username']}
                    } else {
                        where['userid'] = id;
                    }
                    return UsersModel.find({where: where});
                }
            }
        });
    
    RolesModel.hasMany(UsersModel, {foreignKey: 'roleid' });
    UsersModel.belongsTo(RolesModel, {as: undefined, foreignKey: 'roleid' });

    
    return exports;
}
