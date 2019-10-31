/**
 * ts写nodejs代码
 */

import * as request from 'request';
import {urlList} from './week_all_url';
import * as program from 'commander';
import * as fs from 'fs';

async function asyncRequest(options: any) {
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => resolve({error, response, body}));
    });
}

async function asyncReadFile(path: string) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8' ,(err, data) => resolve({err, data}));
    });
}

async function asyncWriteFile(path, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, data, 'utf8' ,(err) => resolve({err}));
    });
}
const timeout = function (delay: number) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                resolve(1);
            } catch (e) {
                reject(0);
            }
        }, delay);
    });
};

function safeParseJSON(str: string) {
    try {
        let ret = JSON.parse(str);
        if (ret === null) {
            return {};
        }
        return ret;
    } catch (e) {
        return {};
    }
}

function extractField(body: any) {
    let ret = {};
    let firstMeaningfulPaint, firstContentfulPaint, reqNum, reqSize, jsNum, cssNum, imgNum;
    let tmp = body.audits;
    if (tmp['first-meaningful-paint']
        && !tmp['first-contentful-paint'].errorMessage
        && !tmp['first-meaningful-paint'].errorMessage) {
        firstMeaningfulPaint = +tmp['first-meaningful-paint'].rawValue.toFixed(2);
        firstContentfulPaint = +tmp['first-contentful-paint'].rawValue.toFixed(2);
    }
    else {
        firstMeaningfulPaint = 'error';
        firstContentfulPaint = 'error';
    }

    let networks = tmp['network-requests'];
    if (networks && tmp['total-byte-weight']) {
        let tmpItem = networks.details.items;
        reqSize = +(tmp['total-byte-weight'].rawValue / 1024).toFixed(2);
        reqNum = networks.rawValue;
        jsNum = tmpItem.filter(ele => ele.resourceType === 'Script').length;
        cssNum= tmpItem.filter(ele => ele.resourceType === 'Stylesheet').length;
        imgNum= tmpItem.filter(ele => ele.resourceType === 'Image').length;
    }
    ret = {
        firstMeaningfulPaint, firstContentfulPaint, reqNum,
        reqSize, jsNum, imgNum, cssNum
    };
    console.log(ret, 'extractFields');
    return ret;
}
const config = {
    api: 'http://bjyz-lpperf.epc.baidu.com:8085/suggest/api/suggest?url='
}
async function getData(urlList: string[], times: number) {
    // console.log('url, 白屏,首屏,总请求数,总资源大小,js数量,img数量,css数量');
    let ret = {}
    for (let idx = 0; idx < urlList.length; idx++) {
        const url = config.api + urlList[idx];
        let response: any = await asyncRequest(url);
        // 白屏,首屏,总请求数,总资源大小,js数量,img数量,css数量
        let body = safeParseJSON(response.body);
        if (body && body.audits) {
            ret[urlList[idx]] = extractField(body);
        }
        // else {
        //     // json异常的情况 重新请求 < 3次
        //     for (let index = 0; index < 3; index++) {
        //         response = await asyncRequest(url);
        //         body = safeParseJSON(response.body);
        //         if (body && body.audits) {
        //             extractField(body);
        //             break;
        //         }
        //         else {
        //             continue;
        //         }
        //     }
        // }
    }
    return JSON.stringify(ret);
}

const generateCsv = async (data, file) => {
    let msg = 'generate fail';
    console.log('generateCsv');
    if (data && file) {
        let ret: any = await asyncWriteFile(file, data);
        msg = ret.err ? `generate ${file} success` : 'generate fail' + JSON.stringify(ret.err);
    }
    console.log(msg);
}
async function run(file: string, times: number, resultFile: string) {
    let urlList;
    let fileRes: any = await asyncReadFile(file);
    if (fileRes.data) {
        urlList = fileRes.data.toString().split('\n');
    }
    // TODO2: request && parse json
    let data = await getData(urlList, times);
    console.log(data);
    
    // TODO3: 写入文件
    await generateCsv(data, resultFile);
}

program
  .version('0.0.1')
  .option('-f,--file <type>', 'url列表(默认url.txt,换行分隔)', 'url.txt')
  .option('-t,--times <type>', '请求遍数(默认1,多次请求用于计算平均值', 1)
  .option('-o,--out <type>', '输出文件名(默认result.csv', 'result.csv');

program.on('--help', function(){
  console.log('Examples:');
  console.log('');
  console.log('$ node index.js -f url.txt -t 1');
  console.log('$ node index.js -h');
});
program.parse(process.argv);

if (program.file && program.times) {
    run(program.file, program.times, program.out);
}
// program.help();