"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
/**
 * ts写nodejs代码
 */
var request = require("request");
var program = require("commander");
var fs = require("fs");
var config = {
    times: 1,
    input: 'url.txt',
    out: 'result.csv',
    api: 'http://bjyz-ywrd-lpperf-01.epc.baidu.com:8085/suggest/api/suggest'
};
function asyncRequest(api, url) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            console.log('running');
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    request({
                        url: api,
                        method: 'POST',
                        json: true,
                        headers: {
                            'content-type': 'application/json'
                        },
                        body: { url: url }
                    }, function (error, response, body) { return resolve({ error: error, response: response, body: body }); });
                })];
        });
    });
}
function asyncReadFile(path) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    fs.readFile(path, 'utf8', function (err, data) { return resolve({ err: err, data: data }); });
                })];
        });
    });
}
function asyncWriteFile(path, data) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    fs.writeFile(path, data, 'utf8', function (err) { return resolve({ err: err }); });
                })];
        });
    });
}
var timeout = function (delay) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            try {
                resolve(1);
            }
            catch (e) {
                reject(0);
            }
        }, delay);
    });
};
function safeParseJSON(str) {
    try {
        var ret = JSON.parse(str);
        if (ret === null) {
            return {};
        }
        return ret;
    }
    catch (e) {
        // console.log('safeParseJSON', e, str);
        return {};
    }
}
function extractField(body) {
    var ret = {};
    var firstMeaningfulPaint, firstContentfulPaint, reqNum, reqSize, jsNum, cssNum, imgNum;
    var tmp = body.audits;
    if (tmp['first-meaningful-paint']
        && !tmp['first-contentful-paint'].errorMessage
        && !tmp['first-meaningful-paint'].errorMessage) {
        firstMeaningfulPaint = +tmp['first-meaningful-paint'].rawValue.toFixed(2);
        firstContentfulPaint = +tmp['first-contentful-paint'].rawValue.toFixed(2);
    }
    else {
        firstMeaningfulPaint = 0;
        firstContentfulPaint = 0;
    }
    var networks = tmp['network-requests'];
    if (networks && tmp['total-byte-weight']) {
        var tmpItem = networks.details.items;
        reqSize = +(tmp['total-byte-weight'].rawValue / 1024).toFixed(2);
        reqNum = networks.rawValue;
        jsNum = tmpItem.filter(function (ele) { return ele.resourceType === 'Script'; }).length;
        cssNum = tmpItem.filter(function (ele) { return ele.resourceType === 'Stylesheet'; }).length;
        imgNum = tmpItem.filter(function (ele) { return ele.resourceType === 'Image'; }).length;
    }
    // 白屏,首屏,总请求数,总资源大小,js数量,img数量,css数量
    ret = {
        firstContentfulPaint: firstContentfulPaint, firstMeaningfulPaint: firstMeaningfulPaint, reqNum: reqNum,
        reqSize: reqSize, jsNum: jsNum, imgNum: imgNum, cssNum: cssNum
    };
    return ret;
}
function getData(urlList, times, api) {
    return __awaiter(this, void 0, void 0, function () {
        var ret, idx, url, res, body, reqSuccessCounter, avg, index, tmp, key, key, average;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ret = {};
                    idx = 0;
                    _a.label = 1;
                case 1:
                    if (!(idx < urlList.length)) return [3 /*break*/, 7];
                    url = urlList[idx];
                    res = void 0, body = void 0;
                    reqSuccessCounter = 0;
                    avg = {
                        firstContentfulPaint: [], firstMeaningfulPaint: [], reqNum: [],
                        reqSize: [], jsNum: [], imgNum: [], cssNum: []
                    };
                    console.log("going to reqest " + idx + "th url", times + 3);
                    ret[urlList[idx]] = {};
                    index = 0;
                    _a.label = 2;
                case 2:
                    if (!(index < times + 3)) return [3 /*break*/, 5];
                    return [4 /*yield*/, asyncRequest(api, url)];
                case 3:
                    res = _a.sent();
                    body = safeParseJSON(res && res.response && res.response.body);
                    if (body && body.audits) {
                        reqSuccessCounter++;
                        tmp = extractField(body);
                        for (key in tmp) {
                            if (tmp.hasOwnProperty(key) && tmp[key] !== undefined) {
                                avg[key].push(tmp[key]);
                            }
                        }
                        if (reqSuccessCounter === times)
                            return [3 /*break*/, 5];
                    }
                    _a.label = 4;
                case 4:
                    index++;
                    return [3 /*break*/, 2];
                case 5:
                    // 平均值处理
                    for (key in avg) {
                        average = avg[key].length > 0 ?
                            avg[key].reduce(function (a, b) { return a + b; }, 0) / avg[key].length : 0;
                        ret[urlList[idx]][key] = !!key.match(/Num$/g) ? average : average.toFixed(2);
                    }
                    _a.label = 6;
                case 6:
                    idx++;
                    return [3 /*break*/, 1];
                case 7: return [2 /*return*/, ret];
            }
        });
    });
}
var generateCsv = function (data, file) { return __awaiter(void 0, void 0, void 0, function () {
    var msg, str, key, _a, firstContentfulPaint, firstMeaningfulPaint, reqNum, reqSize, jsNum, imgNum, cssNum, ret;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                msg = 'generate fail';
                str = 'url,白屏(ms),首屏(ms),总请求数,总资源大小(kb),js数量,img数量,css数量';
                for (key in data) {
                    if (data.hasOwnProperty(key)) {
                        _a = data[key], firstContentfulPaint = _a.firstContentfulPaint, firstMeaningfulPaint = _a.firstMeaningfulPaint, reqNum = _a.reqNum, reqSize = _a.reqSize, jsNum = _a.jsNum, imgNum = _a.imgNum, cssNum = _a.cssNum;
                        str += "\n" + key + "," + firstContentfulPaint + "," + firstMeaningfulPaint + "," + reqNum + "," + reqSize + "," + jsNum + "," + imgNum + "," + cssNum;
                    }
                }
                if (!(data && file)) return [3 /*break*/, 2];
                return [4 /*yield*/, asyncWriteFile(file, str)];
            case 1:
                ret = _b.sent();
                msg = !!ret.err ? "generate " + file + " success" : 'generate fail' + JSON.stringify(ret.err);
                _b.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); };
function run(file, times, resultFile, api) {
    return __awaiter(this, void 0, void 0, function () {
        var urlList, fileRes, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, asyncReadFile(file)];
                case 1:
                    fileRes = _a.sent();
                    if (fileRes.data) {
                        urlList = fileRes.data.toString().trim().split('\n');
                    }
                    return [4 /*yield*/, getData(urlList, times, api)];
                case 2:
                    data = _a.sent();
                    return [4 /*yield*/, generateCsv(data, resultFile)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
program
    .version('0.0.1')
    .option('-a,--api <type>', 'req api', config.api)
    .option('-i,--input <type>', 'file of url list', config.input)
    .option('-t,--times <type>', 'repeat times request per url (default 1,repeat request to get avg', config.times)
    .option('-o,--out <type>', 'output file name', config.out);
program.on('--help', function () {
    console.log('Examples:');
    console.log('');
    console.log('$ node index.js -i url.txt -t 2 -o result.txt');
    console.log('$ node index.js -h');
});
program.parse(process.argv);
if (program.input && program.times) {
    run(program.input, +program.times, program.out, program.api);
}
