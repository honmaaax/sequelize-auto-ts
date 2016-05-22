////////////////////////////////////////////////////////////////////
//
// GENERATED CLASS
//
// DO NOT EDIT
//
// See sequelize-auto-ts for edits
//
////////////////////////////////////////////////////////////////////

/// <reference path="../typings/index.d.ts"/>

import sequelize = require('sequelize');
import types = require('./sequelize-types');

var Sequelize:sequelize.SequelizeStatic = require('sequelize');

export var initialized:boolean = false;
export var SEQUELIZE:sequelize.Sequelize;

/*__each__ tables */ export var __modelTypeName__:types.__modelTypeName__;

/*__ignore__*/ var __defineFieldType__;
/*__ignore__*/ var __primaryTableModelName__:sequelize.Model<any, any>;
/*__ignore__*/ var __foreignTableModelName__:sequelize.Model<any, any>;
/*__ignore__*/ var __firstTableModelName__:sequelize.Model<any, any>;
/*__ignore__*/ var __secondTableModelName__:sequelize.Model<any, any>;
/*__ignore__*/ var __associationNameQuoted__:string;

export function initialize(database:string, username:string, password:string, options:sequelize.Options):any
{
    if (initialized)
    {
        return;
    }

    SEQUELIZE = new Sequelize(database, username, password, options);

    /*__startEach__ tables */

    __modelTypeName__ = <types.__modelTypeName__> SEQUELIZE.define<types.__instanceTypeName__, types.__pojoName__>('__tableNameSingular__', {
        /*__each__ realDbFields, */'__fieldName__': __defineFieldType__
        },
        {
            classMethods: {
                __getterName__:(__tableNameSingularCamel__:any) => {
                    var where:{[key:string]:any} = {};
                    var id:number = parseInt(__tableNameSingularCamel__);
                    if (isNaN(id)) {
                        /*__each__ realDbFields */ if (__tableNameSingularCamel__['__fieldName__'] !== undefined) { where['__fieldName__'] = __tableNameSingularCamel__['__fieldName__']}
                    } else {
                        where['__idFieldName__'] = id;
                    }
                    return __modelTypeName__.find({where: where});
                }
            }
        });
    /*__endEach__*/

    /*__startEach__ references */

    __primaryTableModelName__.hasMany(__foreignTableModelName__, {foreignKey: '__foreignKey__' });
    __foreignTableModelName__.belongsTo(__primaryTableModelName__, {as: __associationNameQuoted__, foreignKey: '__foreignKey__' });

    /*__endEach__*/

    /*__startEach__ xrefs */

    __firstTableModelName__.belongsToMany(__secondTableModelName__, { through: '__xrefTableName__'});
    __secondTableModelName__.belongsToMany(__firstTableModelName__, { through: '__xrefTableName__'});

    /*__endEach__*/

    return exports;
}
