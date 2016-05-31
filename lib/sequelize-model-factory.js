"use strict";
var Sequelize = require('sequelize');
var __defineFieldType__;
var __associationNameQuoted__;
var Models = (function () {
    function Models(database, username, password, options) {
        this.SEQUELIZE = new Sequelize(database, username, password, options);
        var self = this;
        this.__tableNameCamel__ = this.SEQUELIZE.define('__tableNameSingular__', {
            '__fieldName__': __defineFieldType__
        }, {
            timestamps: false,
            classMethods: {
                get__tableNameSingular__: function (__tableNameSingularCamel__) {
                    var where = {};
                    var id = parseInt(__tableNameSingularCamel__);
                    if (isNaN(id)) {
                        if (__tableNameSingularCamel__['__fieldName__'] !== undefined) {
                            where['__fieldName__'] = __tableNameSingularCamel__['__fieldName__'];
                        }
                    }
                    else {
                        where['__idFieldName__'] = id;
                    }
                    return self.__tableNameCamel__.find({ where: where });
                }
            }
        });
        this.__primaryTableNameCamel__.hasMany(this.__foreignTableNameCamel__, { foreignKey: '__foreignKey__' });
        this.__foreignTableNameCamel__.belongsTo(this.__primaryTableNameCamel__, {
            as: __associationNameQuoted__,
            foreignKey: '__foreignKey__'
        });
        this.__firstTableNameCamel__.hasMany(this.__secondTableNameCamel__);
        this.__secondTableNameCamel__.hasMany(this.__firstTableNameCamel__);
    }
    return Models;
}());
exports.Models = Models;
var modelsCache = {};
function forDatabase(database, username, password, options) {
    var cache = modelsCache[database];
    if (cache !== undefined) {
        cache.lastRetrieved = new Date();
        return cache.models;
    }
    if (typeof username !== 'string' || username.length === 0 ||
        typeof password !== 'string' || password.length === 0) {
        throw new Error('Cannot get models for database "' + database + '" since username and/or password were not ' +
            'provided and the database is not yet cached. forDatabase() must be called first with authentication ' +
            'data before it can be called with only the database name.');
    }
    cache = {
        models: new Models(database, username, password, options),
        lastRetrieved: new Date()
    };
    modelsCache[database] = cache;
    return cache.models;
}
exports.forDatabase = forDatabase;
function clearAll() {
    modelsCache = {};
}
exports.clearAll = clearAll;
function clearDatabase(database) {
    delete modelsCache[database];
}
exports.clearDatabase = clearDatabase;
function clearNotUsedSince(date) {
    var time = date.getTime();
    var allKeys = Object.keys(modelsCache);
    var clearKeys = allKeys.filter(function (key) { return modelsCache[key].lastRetrieved.getTime() < time; });
    if (clearKeys.length === 0) {
        return;
    }
    if (clearKeys.length === allKeys.length) {
        clearAll();
        return;
    }
    clearKeys.forEach(function (key) { return clearDatabase(key); });
}
exports.clearNotUsedSince = clearNotUsedSince;
