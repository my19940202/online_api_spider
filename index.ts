/**
 * ts写nodejs代码
 */
import * as request from 'request';
import * as program from 'commander';
import * as fs from 'fs';

const config = {
    times: 1,
    input: 'url.txt',
    out: 'result.csv',
    api: 'http://bjyz-ywrd-lpperf-01.epc.baidu.com:8085/suggest/api/suggest'
}

async function asyncRequest(api: string, url: string) {
    console.log('running');
    return new Promise((resolve, reject) => {
        request({
            url: api,
            method: 'POST',
            json: true,
            headers: {
                'content-type': 'application/json',
            },
            body: {url}
        }, (error, response, body) => resolve({error, response, body})); 
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
        // console.log('safeParseJSON', e, str);
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
        firstMeaningfulPaint = 0;
        firstContentfulPaint = 0;
    }

    let networks = tmp['network-requests'];
    if (networks && tmp['total-byte-weight']) {
        let tmpItem = networks.details.items;
        reqSize = +(tmp['total-byte-weight'].rawValue / 1024).toFixed(2);
        reqNum = networks.rawValue;
        jsNum = tmpItem.filter(ele => ele.resourceType === 'Script').length;
        cssNum = tmpItem.filter(ele => ele.resourceType === 'Stylesheet').length;
        imgNum = tmpItem.filter(ele => ele.resourceType === 'Image').length;
    }
    // 白屏,首屏,总请求数,总资源大小,js数量,img数量,css数量
    ret = {
        firstContentfulPaint, firstMeaningfulPaint, reqNum,
        reqSize, jsNum, imgNum, cssNum
    };
    return ret;
}

async function getData(urlList: string[], times: number, api: string) {
    let ret = {};
    for (let idx = 0; idx < urlList.length; idx++) {
        const url = urlList[idx];
        let res, body;
        let reqSuccessCounter = 0;
        let avg = {
            firstContentfulPaint: [], firstMeaningfulPaint: [], reqNum: [],
            reqSize: [], jsNum: [], imgNum: [], cssNum: []
        };
        console.log(`going to reqest ${idx}th url`, times + 3, );
        ret[urlList[idx]] = {};
        
        // 多次请求 求平均值(最多再重试3次 不然请求次数太多)
        for (let index = 0; index < times + 3; index++) {
            res = await asyncRequest(api, url);
            body = safeParseJSON(res && res.response && res.response.body);
            if (body && body.audits) {
                reqSuccessCounter++;
                let tmp = extractField(body);
                for (const key in tmp) {
                    if (tmp.hasOwnProperty(key) && tmp[key] !== undefined) {
                        avg[key].push(tmp[key]);
                    }
                }
                if (reqSuccessCounter === times) break;
            }
        }
        // 平均值处理
        for (const key in avg) {
            let average = avg[key].length > 0 ?
                avg[key].reduce((a,b) => a + b, 0) / avg[key].length : 0;
            ret[urlList[idx]][key] = !!key.match(/Num$/g) ? average : average.toFixed(2);
        }
    }
    return ret;
}

const generateCsv = async (data, file) => {
    let msg = 'generate fail';
    let str = 'url,白屏(ms),首屏(ms),总请求数,总资源大小(kb),js数量,img数量,css数量';
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            const {
                firstContentfulPaint, firstMeaningfulPaint, reqNum,
                reqSize, jsNum, imgNum, cssNum
            } = data[key];
            str += `\n${key},${firstContentfulPaint},${firstMeaningfulPaint},${reqNum},${reqSize},${jsNum},${imgNum},${cssNum}`
        }
    }
    if (data && file) {
        let ret: any = await asyncWriteFile(file, str);
        msg = !!ret.err ? `generate ${file} success` : 'generate fail' + JSON.stringify(ret.err);
    }
}

async function run(file: string, times: number, resultFile: string, api: string) {
    let urlList;
    let fileRes: any = await asyncReadFile(file);
    if (fileRes.data) {
        urlList = fileRes.data.toString().trim().split('\n');
    }
    let data = await getData(urlList, times, api);

    await generateCsv(data, resultFile);
}

program
  .version('0.0.1')
  .option('-a,--api <type>', 'req api', config.api)
  .option('-i,--input <type>', 'file of url list', config.input)
  .option('-t,--times <type>', 'repeat times request per url (default 1,repeat request to get avg', config.times)
  .option('-o,--out <type>', 'output file name', config.out);

program.on('--help', function(){
  console.log('Examples:');
  console.log('');
  console.log('$ node index.js -i url.txt -t 2 -o result.txt');
  console.log('$ node index.js -h');
});
program.parse(process.argv);

if (program.input && program.times) {
    run(program.input, +program.times, program.out, program.api);
}