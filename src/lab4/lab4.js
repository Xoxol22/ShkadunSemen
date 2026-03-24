"use strict";
// query.ts
// Полный файл с типами + реализациями where/sort/groupBy/having/query
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.having = exports.groupBy = exports.sort = exports.where = void 0;
exports.query = query;
// ============================
// Реализации шагов
// ============================
var where = function () {
    return function (key, value) {
        return function (data) {
            return data.filter(function (item) { return item[key] === value; });
        };
    };
};
exports.where = where;
var sort = function () {
    return function (key) {
        return function (data) {
            return __spreadArray([], data, true).sort(function (a, b) {
                var av = a[key];
                var bv = b[key];
                // Нормально работает для number/string/date и т.п. (где есть < >)
                if (av < bv)
                    return -1;
                if (av > bv)
                    return 1;
                return 0;
            });
        };
    };
};
exports.sort = sort;
var groupBy = function () {
    return function (key) {
        return function (data) {
            var _a;
            var acc = {};
            for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                var item = data_1[_i];
                var k = String(item[key]); // ключ для Record<string, ...>
                ((_a = acc[k]) !== null && _a !== void 0 ? _a : (acc[k] = { key: item[key], items: [] })).items.push(item);
            }
            return Object.values(acc);
        };
    };
};
exports.groupBy = groupBy;
var having = function () {
    return function (predicate) {
        return function (groups) {
            return groups.filter(predicate);
        };
    };
};
exports.having = having;
// Реализация (универсальная)
function query() {
    var steps = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        steps[_i] = arguments[_i];
    }
    return function (data) { return steps.reduce(function (acc, step) { return step(acc); }, data); };
}
var users = [
    { id: 1, name: "John", surname: "Doe", age: 34, city: "NY" },
    { id: 2, name: "John", surname: "Doe", age: 33, city: "NY" },
    { id: 3, name: "John", surname: "Doe", age: 35, city: "LA" },
    { id: 4, name: "Mike", surname: "Doe", age: 35, city: "LA" },
];
var W = (0, exports.where)();
var S = (0, exports.sort)();
var G = (0, exports.groupBy)();
var H = (0, exports.having)();
var search = query(W("name", "John"), W("surname", "Doe"), S("age"));
var result = search(users);
var groupAndFilter = query(G("city"), H(function (group) { return group.items.length > 1; }));
var grouped = groupAndFilter(users);
var pipeline = query(W("surname", "Doe"), G("city"), H(function (group) { return group.items.some(function (u) { return u.age > 34; }); }));
var res = pipeline(users);
// чтобы TS не ругался на unused (если включён noUnusedLocals)
void result;
void grouped;
void res;
