"use strict";
var util = require('./util');
var Sequelize = require("sequelize");
var _ = require('lodash');
var ChangeCase = require('change-case');
var DEFAULT_CASE_TYPE = 'case';
var naming;
var Schema = (function () {
    function Schema(tables) {
        this.tables = tables;
        this.references = [];
        this.xrefs = [];
        this.associations = [];
        this.calculatedFields = [];
        this.views = [];
        this.idFields = [];
        this.idFieldLookup = {};
        this.useModelFactory = false;
    }
    Schema.prototype.uniqueReferences = function () {
        var u = [];
        var foundIds = {};
        this.references.forEach(addReferenceIfUnique);
        this.tables.forEach(addTablePrimaryKeys);
        return u;
        function addReferenceIfUnique(reference, index, array) {
            if (reference.isView || foundIds[reference.foreignKey]) {
                return;
            }
            u.push(reference);
            foundIds[reference.foreignKey] = true;
        }
        function addTablePrimaryKeys(table, index, array) {
            if (table.isView || table.tableName.substr(0, 4) === 'Xref') {
                return;
            }
            var pk = table.fields[0];
            if (foundIds[pk.fieldName]) {
                return;
            }
            foundIds[pk.fieldName] = true;
            var r = new Reference(table.tableName, table.tableName, undefined, pk.fieldName, pk.fieldName, false, this);
            u.push(r);
        }
    };
    Schema.idSuffix = "id";
    Schema.fieldTypeTranslations = {
        tinyint: "boolean",
        smallint: "number",
        int: "number",
        integer: "number",
        mediumint: "number",
        bigint: "number",
        year: "number",
        float: "number",
        double: "number",
        decimal: "number",
        timestamp: "Date",
        date: "Date",
        datetime: "Date",
        tinyblob: "Buffer",
        mediumblob: "Buffer",
        longblob: "Buffer",
        blob: "Buffer",
        binary: "Buffer",
        varbinary: "Buffer",
        bit: "Buffer",
        char: "string",
        varchar: "string",
        tinytext: "string",
        mediumtext: "string",
        longtext: "string",
        text: "string",
        "enum": "string",
        "set": "string",
        time: "string",
        geometry: "string"
    };
    Schema.fieldTypeSequelize = {
        tinyint: 'Sequelize.BOOLEAN',
        smallint: 'Sequelize.INTEGER',
        int: 'Sequelize.INTEGER',
        integer: 'Sequelize.INTEGER',
        mediumint: 'Sequelize.INTEGER',
        bigint: 'Sequelize.INTEGER',
        year: 'Sequelize.INTEGER',
        float: 'Sequelize.DECIMAL',
        double: 'Sequelize.DECIMAL',
        decimal: 'Sequelize.DECIMAL',
        timestamp: 'Sequelize.DATE',
        date: 'Sequelize.DATE',
        datetime: 'Sequelize.DATE',
        tinyblob: 'Sequelize.BLOB',
        mediumblob: 'Sequelize.BLOB',
        longblob: 'Sequelize.BLOB',
        blob: 'Sequelize.BLOB',
        binary: 'Sequelize.BLOB',
        varbinary: 'Sequelize.BLOB',
        bit: 'Sequelize.BLOB',
        char: 'Sequelize.STRING',
        varchar: 'Sequelize.STRING',
        tinytext: 'Sequelize.STRING',
        mediumtext: 'Sequelize.STRING',
        longtext: 'Sequelize.STRING',
        text: 'Sequelize.STRING',
        "enum": 'Sequelize.ENUM',
        "set": 'Sequelize.STRING',
        time: 'Sequelize.STRING',
        geometry: 'Sequelize.STRING'
    };
    return Schema;
})();
exports.Schema = Schema;
var Table = (function () {
    function Table(schema, tableName) {
        this.schema = schema;
        this.tableName = tableName;
        this.fields = [];
        this.isView = false;
    }
    Table.prototype.pojoName = function () {
        var name = ChangeCase.snake(this.tableName) + '_pojo';
        return ChangeCase[naming.defaults.caseType](name);
    };
    Table.prototype.instanceTypeName = function () {
        var name = ChangeCase.snake(this.tableName) + '_instance';
        return ChangeCase[naming.defaults.caseType](name);
    };
    Table.prototype.modelTypeName = function () {
        var name = ChangeCase.snake(this.tableName) + '_model';
        return ChangeCase[naming.defaults.caseType](name);
    };
    Table.prototype.assertValidMethodName = function () {
        var name = 'assert_valid_' + ChangeCase.snake(this.tableName);
        return ChangeCase[naming.methodName.caseType](name);
    };
    Table.prototype.getterName = function () {
        var name = 'get_' + ChangeCase.snake(this.tableName);
        var type = _.has(naming, 'getterName.caseType') ? naming.getterName.caseType : naming.defaults.caseType;
        return ChangeCase[type](name);
    };
    Table.prototype.tableNameSingular = function () {
        return Sequelize.Utils.singularize(this.tableName);
    };
    Table.prototype.tableNameSingularCamel = function () {
        return toCamelCase(this.tableNameSingular());
    };
    Table.prototype.tableNamePascal = function () {
        return ChangeCase.pascal(this.tableName);
    };
    Table.prototype.tableNameCamel = function () {
        return ChangeCase.camel(this.tableName);
    };
    Table.prototype.tableNameModel = function () {
        return this.schema.useModelFactory ? this.tableNameCamel() : this.tableName;
    };
    Table.prototype.realDbFields = function () {
        return this.fields.filter(function (f) { return !f.isReference && !f.isCalculated; });
    };
    Table.prototype.idField = function () {
        return _.find(this.fields, function (f) { return f.isIdField(); });
    };
    Table.prototype.idFieldName = function () {
        var idField = this.idField();
        if (idField === undefined) {
            return '!!cannotFindIdFieldOn' + this.tableName + '!!';
        }
        return idField.fieldName;
    };
    Table.prototype.idFieldNameTitleCase = function () {
        var idField = this.idField();
        if (idField === undefined) {
            return '!!cannotFindIdFieldOn' + this.tableName + '!!';
        }
        return idField.fieldNameProperCase();
    };
    return Table;
})();
exports.Table = Table;
var Field = (function () {
    function Field(fieldName, fieldType, columnType, columnDefault, isNullableString, table, isReference, isCalculated) {
        if (isReference === void 0) { isReference = false; }
        if (isCalculated === void 0) { isCalculated = false; }
        this.fieldName = fieldName;
        this.fieldType = fieldType;
        this.columnType = columnType;
        this.columnDefault = columnDefault;
        this.isNullableString = isNullableString;
        this.table = table;
        this.isReference = isReference;
        this.isCalculated = isCalculated;
    }
    Field.prototype.isNullable = function () {
        return this.isNullableString === 'YES';
    };
    Field.prototype.fieldNameAndIsNullable = function () {
        var isNullable = (this.isNullable() ||
            /(_at)|(At)$/.test(this.fieldName) ||
            (!_.isNull(this.columnDefault) && !_.isUndefined(this.columnDefault)) ||
            this.fieldName === 'id' ||
            this.isReference);
        return this.fieldName + (isNullable ? '?' : '');
    };
    Field.prototype.fieldNameProperCase = function () {
        var fieldName = ChangeCase[naming.defaults.caseType](this.fieldName);
        return fieldName;
    };
    Field.prototype.translatedFieldType = function () {
        var fieldType = this.fieldType;
        var translated = Schema.fieldTypeTranslations[fieldType];
        if (translated == undefined) {
            var fieldTypeLength = fieldType.length;
            if (fieldTypeLength < 6 ||
                (fieldType.substr(fieldTypeLength - 4, 4) !== 'Pojo' &&
                    fieldType.substr(fieldTypeLength - 6, 6) !== 'Pojo[]')) {
                console.log('Unable to translate field type:' + fieldType);
            }
            if (fieldType.substr(0, 6) === 'types.') {
                console.log('Removing types prefix from ' + fieldType);
                translated = fieldType.substr(6);
            }
            else {
                translated = fieldType;
            }
        }
        return translated;
    };
    Field.prototype.sequelizeFieldType = function () {
        var translated = Schema.fieldTypeSequelize[this.fieldType];
        if (translated == undefined) {
            console.log('Unable to sequelize field type:' + this.fieldType);
            translated = this.fieldType;
        }
        if (this.fieldType === 'enum') {
            translated += this.columnType.slice(4).replace(/'/g, '"').replace(/""/g, "'");
        }
        return [("type: " + translated)];
    };
    Field.prototype.isIdField = function () {
        return this.targetIdFieldType != undefined || Boolean(this.table.schema.idFieldLookup[this.fieldName]);
    };
    Field.prototype.customFieldType = function () {
        if (this.isIdField()) {
            if (this.targetIdFieldType == undefined) {
                return this.fieldNameProperCase();
            }
            else {
                return this.targetIdFieldType;
            }
        }
        else if (this.isReference) {
            return this.fieldType;
        }
        else {
            return this.translatedFieldType();
        }
    };
    Field.prototype.defineFieldType = function () {
        var fieldType = [];
        if (this == this.table.fields[0]) {
            fieldType = [
                'type: Sequelize.INTEGER',
                'primaryKey: true',
                'autoIncrement: true'
            ];
        }
        else if (this.table.tableName.substr(0, 4) == 'Xref' && this == this.table.fields[1]) {
            fieldType = [
                'type: "number"',
                'primaryKey: true'
            ];
        }
        else {
            fieldType = this.sequelizeFieldType();
            if (!this.isNullable() && !/(_at)|(At)$/.test(this.fieldName)) {
                fieldType.push('allowNull: false');
            }
            if (!_.isNull(this.columnDefault)) {
                fieldType.push('defaultValue: ' + this.generateDefaultValue());
            }
        }
        return '{' + fieldType.join(', ') + '}';
    };
    Field.prototype.generateDefaultValue = function () {
        var raw = this.columnDefault;
        if (this.fieldType === 'tinyint') {
            raw = (raw === '1') ? 'true' : 'false';
        }
        else if (_.isString(raw) && !/^[1-9][0-9]*$/.test(raw)) {
            raw = "\"" + raw + "\"";
        }
        return raw;
    };
    Field.prototype.tableNameSingular = function () {
        return this.table.tableNameSingular();
    };
    Field.prototype.tableNameSingularCamel = function () {
        return this.table.tableNameSingularCamel();
    };
    return Field;
})();
exports.Field = Field;
var Reference = (function () {
    function Reference(primaryTableName, foreignTableName, associationName, primaryKey, foreignKey, isView, schema) {
        this.primaryTableName = primaryTableName;
        this.foreignTableName = foreignTableName;
        this.associationName = associationName;
        this.primaryKey = primaryKey;
        this.foreignKey = foreignKey;
        this.isView = isView;
        this.schema = schema;
    }
    Reference.prototype.primaryTableModelName = function () {
        var name = ChangeCase.snake(this.primaryTableName) + '_model';
        return ChangeCase[naming.defaults.caseType](name);
    };
    Reference.prototype.foreignTableModelName = function () {
        var name = ChangeCase.snake(this.foreignTableName) + '_model';
        return ChangeCase[naming.defaults.caseType](name);
    };
    Reference.prototype.primaryTableNameCamel = function () {
        return toCamelCase(this.primaryTableName);
    };
    Reference.prototype.primaryTableNameModel = function () {
        return this.schema.useModelFactory ? this.primaryTableNameCamel() : this.primaryTableName;
    };
    Reference.prototype.foreignTableNameCamel = function () {
        return toCamelCase(this.foreignTableName);
    };
    Reference.prototype.associationNameQuoted = function () {
        return this.associationName
            ? '\'' + this.associationName + '\''
            : undefined;
    };
    return Reference;
})();
exports.Reference = Reference;
var Xref = (function () {
    function Xref(firstTableName, firstFieldName, secondTableName, secondFieldName, xrefTableName) {
        this.firstTableName = firstTableName;
        this.firstFieldName = firstFieldName;
        this.secondTableName = secondTableName;
        this.secondFieldName = secondFieldName;
        this.xrefTableName = xrefTableName;
    }
    Xref.prototype.firstTableModelName = function () {
        var name = ChangeCase.snake(this.firstTableName) + '_model';
        return ChangeCase[naming.defaults.caseType](name);
    };
    Xref.prototype.secondTableModelName = function () {
        var name = ChangeCase.snake(this.secondTableName) + '_model';
        return ChangeCase[naming.defaults.caseType](name);
    };
    Xref.prototype.firstTableNameCamel = function () {
        return toCamelCase(this.firstTableName);
    };
    Xref.prototype.secondTableNameCamel = function () {
        return toCamelCase(this.secondTableName);
    };
    return Xref;
})();
exports.Xref = Xref;
var Association = (function () {
    function Association(associationName) {
        this.associationName = associationName;
    }
    return Association;
})();
exports.Association = Association;
function read(database, username, password, options, namingOptions, callback) {
    naming = namingOptions || {};
    naming.defaults = naming.defaults || {};
    naming.defaults.caseType = naming.defaults.caseType || DEFAULT_CASE_TYPE;
    var schema;
    var sequelize = new Sequelize(database, username, password, options);
    var tableLookup = {};
    var xrefs = {};
    var associationsFound = {};
    var customReferenceRows = [];
    var idFieldLookup = {};
    var sql = "select table_name, column_name, is_nullable, data_type, column_type, column_default, ordinal_position " +
        "from information_schema.columns " +
        "where table_schema = '" + database + "' " +
        "order by table_name, ordinal_position";
    sequelize
        .query(sql)
        .then(function (rows) { return processTablesAndColumns(undefined, rows[0]); })
        .catch(function (err) { return processTablesAndColumns(err, null); });
    function processTablesAndColumns(err, rows) {
        if (err) {
            callback(err, null);
            return;
        }
        if (rows == null) {
            var err = new Error("No schema info returned for database.");
            callback(err, null);
            return;
        }
        if (rows.length == 0) {
            var err = new Error("Empty schema info returned for database.");
            callback(err, null);
            return;
        }
        readCustomFields(rows);
    }
    function readCustomFields(originalRows) {
        if (!_.any(originalRows, function (r) { return r.table_name == 'SequelizeCustomFieldDefinitions'; })) {
            processTablesAndColumnsWithCustom(originalRows, {});
            return;
        }
        var sql = "select table_name, column_name, is_nullable, data_type, column_type, column_default, referenced_table_name, referenced_column_name, ordinal_position " +
            "from SequelizeCustomFieldDefinitions " +
            "order by table_name, ordinal_position";
        sequelize
            .query(sql)
            .then(function (customFields) { return processCustomFields(undefined, customFields); })
            .catch(function (err) { return processCustomFields(err, null); });
        function processCustomFields(err, customFields) {
            if (err) {
                callback(err, null);
                return;
            }
            var customFieldLookup = util.arrayToDictionary(customFields, 'column_name');
            var combined = originalRows.concat(customFields);
            combined.sort(sortByTableNameThenOrdinalPosition);
            customReferenceRows = _.where(customFields, function (cf) { return cf.referenced_table_name != null && cf.referenced_column_name != null; });
            processTablesAndColumnsWithCustom(combined, customFieldLookup);
        }
    }
    function sortByTableNameThenOrdinalPosition(row1, row2) {
        return row1.table_name < row2.table_name
            ? -1
            : (row1.table_name > row2.table_name
                ? 1
                : (row1.ordinal_position < row2.ordinal_position
                    ? -1
                    : (row1.ordinal_position > row2.ordinal_position
                        ? 1
                        : 0)));
    }
    function processTablesAndColumnsWithCustom(rows, customFieldLookup) {
        var tables = [];
        schema = new Schema(tables);
        var table = new Table(schema, "");
        var calculatedFieldsFound = {};
        for (var index = 0; index < rows.length; index++) {
            var row = rows[index];
            if (row.table_name === 'SequelizeCustomFieldDefinitions') {
                continue;
            }
            if (row.table_name != table.tableName) {
                table = new Table(schema, row.table_name);
                tables.push(table);
            }
            var isCalculated = customFieldLookup[row.column_name] !== undefined;
            var field = new Field(row.column_name, row.data_type, row.column_type, row.column_default, row.is_nullable, table, false, isCalculated);
            table.fields.push(field);
            if (isCalculated && !calculatedFieldsFound[field.fieldName]) {
                schema.calculatedFields.push(field);
                calculatedFieldsFound[field.fieldName] = true;
            }
        }
        processIdFields();
        readReferences();
    }
    function readReferences() {
        var sql = "SELECT	table_name, column_name, referenced_table_name, referenced_column_name " +
            "FROM 	information_schema.key_column_usage " +
            "WHERE	constraint_schema = '" + database + "' " +
            "AND	referenced_table_name IS NOT NULL;";
        sequelize
            .query(sql)
            .then(function (rows) { return processReferences(undefined, rows[0]); })
            .catch(function (err) { return processReferences(err, null); });
    }
    function processReferences(err, rows) {
        if (err) {
            callback(err, null);
            return;
        }
        if (rows == null || rows.length == 0) {
            console.log("Warning: No references defined in database.");
            callback(null, schema);
            return;
        }
        schema.tables.forEach(function (table) { return tableLookup[table.tableName] = table; });
        rows.forEach(processReferenceRow);
        customReferenceRows.forEach(processReferenceRow);
        processReferenceXrefs();
        fixViewNames();
        function processReferenceRow(row) {
            if (row.table_name.length > 4 && row.table_name.substr(0, 4) == 'Xref') {
                processReferenceXrefRow(row);
                return;
            }
            var parentTable = tableLookup[row.referenced_table_name];
            var childTable = tableLookup[row.table_name];
            var associationName;
            if (row.column_name !== row.referenced_column_name) {
                associationName = ChangeCase.snake(row.column_name);
                associationName = row.column_name.slice(0, (row.referenced_column_name.length + 1) * -1);
                if (_.has(naming, 'associationName.tail') && naming.associationName.tail !== null) {
                    if (naming.associationName.tail === 'tableName') {
                        associationName += '_' + row.referenced_table_name;
                    }
                }
                if (_.has(naming, 'associationName.caseType')) {
                    associationName = ChangeCase[naming.associationName.caseType](associationName);
                }
                if (!associationsFound[associationName]) {
                    schema.associations.push(new Association(associationName));
                    associationsFound[associationName] = true;
                }
            }
            childTable.fields.push(new Field(util.camelCase(Sequelize.Utils.singularize(associationName === undefined
                ? row.referenced_table_name
                : associationName)), ChangeCase[naming.defaults.caseType](ChangeCase.snake(row.referenced_table_name) + '_pojo'), undefined, undefined, undefined, childTable, true));
            schema.references.push(new Reference(row.referenced_table_name, row.table_name, associationName, util.camelCase(Sequelize.Utils.singularize(row.referenced_table_name)) + toTitleCase(Schema.idSuffix), row.column_name, false, schema));
        }
        function processReferenceXrefRow(row) {
            var xref = xrefs[row.table_name];
            if (xref == null) {
                xrefs[row.table_name] = new Xref(row.referenced_table_name, row.referenced_column_name, null, null, row.table_name);
            }
            else {
                xref.secondTableName = row.referenced_table_name;
                xref.secondFieldName = row.referenced_column_name;
            }
        }
        function processReferenceXrefs() {
            for (var xrefName in xrefs) {
                if (!xrefs.hasOwnProperty(xrefName)) {
                    continue;
                }
                var xref = xrefs[xrefName];
                schema.xrefs.push(xref);
                var firstTable = tableLookup[xref.firstTableName];
                var secondTable = tableLookup[xref.secondTableName];
                firstTable.fields.push(new Field(util.camelCase(xref.secondTableName), Sequelize.Utils.singularize(xref.secondTableName) + 'Pojo[]', undefined, undefined, undefined, firstTable, true));
                secondTable.fields.push(new Field(util.camelCase(xref.firstTableName), Sequelize.Utils.singularize(xref.firstTableName) + 'Pojo[]', undefined, undefined, undefined, secondTable, true));
            }
        }
    }
    function fixViewNames() {
        var tableNamesManyForms = [];
        _.each(schema.tables, extrapolateTableNameForms);
        _.each(schema.tables, fixViewName);
        if (schema.views.length) {
            addViewReferences();
        }
        callback(null, schema);
        function extrapolateTableNameForms(table, index, array) {
            if (table.tableName === table.tableName.toLowerCase()) {
                return;
            }
            tableNamesManyForms.push(table.tableName);
            tableNamesManyForms.push(Sequelize.Utils.singularize(table.tableName));
        }
        function fixViewName(table, index, array) {
            if (table.tableName !== table.tableName.toLowerCase()) {
                return;
            }
            table.isView = true;
            schema.views.push(table);
            _.each(tableNamesManyForms, fixViewNamePart);
            function fixViewNamePart(otherTableNameForm, index, array) {
                var i = table.tableName.indexOf(otherTableNameForm.toLowerCase());
                if (i < 0) {
                    return;
                }
                var newTableName = '';
                if (i !== 0) {
                    newTableName = table.tableName.substr(0, i);
                }
                newTableName += otherTableNameForm;
                if (table.tableName.length > i + otherTableNameForm.length + 1) {
                    newTableName += table.tableName.charAt(i + otherTableNameForm.length).toUpperCase() +
                        table.tableName.substr(i + otherTableNameForm.length + 1);
                }
                table.tableName = newTableName;
            }
        }
    }
    function addViewReferences() {
        schema.views.forEach(addViewReference);
    }
    function addViewReference(view, index, array) {
        view.fields.forEach(addViewFieldReference);
        function addViewFieldReference(field, index, array) {
            if (!field.isIdField()) {
                return;
            }
            var otherTableName = Sequelize.Utils.pluralize(field.fieldNameProperCase().substr(0, field.fieldName.length - Schema.idSuffix.length));
            var otherTable = tableLookup[otherTableName];
            if (otherTable === undefined) {
                return;
            }
            var reference = new Reference(otherTableName, view.tableName, undefined, field.fieldName, field.fieldName, true, schema);
            schema.references.push(reference);
            var otherTableSingular = Sequelize.Utils.singularize(otherTableName);
            view.fields.push(new Field(otherTableSingular, otherTableSingular + 'Pojo', undefined, undefined, undefined, view, true));
            otherTable.fields.push(new Field(util.camelCase(view.tableName), Sequelize.Utils.singularize(view.tableName) + 'Pojo[]', undefined, undefined, undefined, otherTable, true));
        }
    }
    function processIdFields() {
        var idSuffix = Schema.idSuffix;
        if (idSuffix == null || !idSuffix.length) {
            return;
        }
        var idFields = [];
        var idSuffixLen = idSuffix.length;
        for (var tableIndex = 0; tableIndex < schema.tables.length; tableIndex++) {
            var table = schema.tables[tableIndex];
            if (table == null || table.fields == null || table.fields.length === 0) {
                continue;
            }
            var field = table.fields[0];
            var fieldName = field.fieldName;
            if (!idFieldLookup[fieldName] &&
                fieldName.length > idSuffixLen &&
                fieldName.substr(fieldName.length - idSuffixLen, idSuffixLen).toLocaleLowerCase() == idSuffix) {
                idFields.push(field);
                idFieldLookup[fieldName] = true;
            }
        }
        schema.idFields = idFields;
        schema.idFieldLookup = idFieldLookup;
        processPrefixedForeignKeyTypes();
    }
    function processPrefixedForeignKeyTypes() {
        var idSuffix = Schema.idSuffix;
        var idSuffixLen = idSuffix.length;
        for (var tableIndex = 0; tableIndex < schema.tables.length; tableIndex++) {
            var table = schema.tables[tableIndex];
            if (table == null || table.fields == null || table.fields.length < 2) {
                continue;
            }
            for (var fieldIndex = 1; fieldIndex < table.fields.length; fieldIndex++) {
                var field = table.fields[fieldIndex];
                var fieldName = field.fieldName;
                if (!idFieldLookup[fieldName] &&
                    fieldName.length > idSuffixLen &&
                    fieldName.substr(fieldName.length - idSuffixLen, idSuffixLen).toLocaleLowerCase() == idSuffix) {
                    for (var c = 1; c < fieldName.length - 2; c++) {
                        var rest = fieldName.charAt(c).toLowerCase() + fieldName.substr(c + 1);
                        if (idFieldLookup[rest]) {
                            field.targetIdFieldType = ChangeCase[naming.defaults.caseType](rest);
                        }
                    }
                }
            }
        }
    }
}
exports.read = read;
function toTitleCase(text) {
    return text.charAt(0).toUpperCase() + text.substr(1, text.length - 1);
}
function toCamelCase(text) {
    return text.charAt(0).toLowerCase() + text.substr(1);
}
