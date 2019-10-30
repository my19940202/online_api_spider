/**
 * ts nodejs代码
 */

import * as path from 'path';
import * as request from 'request';
import {urlList} from './week_all_url';

async function asyncRequest(options: any) {
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => resolve({error, response, body}));
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

function extractField(body: any, url) {
    let ret: any[] = [];
    let firstMeaningfulPaint, firstContentfulPaint, reqNum, reqSize, jsNum, cssNum, imgNum;
    let tmp = body.audits;
    if (tmp['first-meaningful-paint']
        && !tmp['first-contentful-paint'].errorMessage
        && !tmp['first-meaningful-paint'].errorMessage) {
        firstMeaningfulPaint = tmp['first-meaningful-paint'].rawValue.toFixed(2) + 'ms';
        firstContentfulPaint = tmp['first-contentful-paint'].rawValue.toFixed(2) + 'ms';
    }
    else {
        firstMeaningfulPaint = 'error';
        firstContentfulPaint = 'error';
    }

    let networks = tmp['network-requests'];
    if (networks && tmp['total-byte-weight']) {
        let tmpItem = networks.details.items;
        reqSize = (tmp['total-byte-weight'].rawValue / 1024).toFixed(2) + 'kb';
        reqNum = networks.rawValue;
        jsNum = tmpItem.filter(ele => ele.resourceType === 'Script').length;
        cssNum= tmpItem.filter(ele => ele.resourceType === 'Stylesheet').length;
        imgNum= tmpItem.filter(ele => ele.resourceType === 'Image').length;
    }
    ret = [
        url, firstMeaningfulPaint, firstContentfulPaint, reqNum,
        reqSize, jsNum, imgNum, cssNum
    ]
    console.log(ret.join(','));
}

async function main() {
    let prefix = 'http://bjyz-lpperf.epc.baidu.com:8085/suggest/api/suggest?url=';
    // console.log('url, 白屏,首屏,总请求数,总资源大小,js数量,img数量,css数量');
    for (let idx = 0; idx < urlList.length; idx++) {
        const url = prefix + urlList[idx];
        let response: any = await asyncRequest(url);
        timeout(1000);
        console.log('running:', idx);
        
        // 白屏,首屏,总请求数,总资源大小,js数量,img数量,css数量
        // TODO json parse异常需要重新请求
        let body = safeParseJSON(response.body);
        if (body && body.audits) {
            extractField(body, url);
        }
        else {
            // json异常的情况 重新请求 < 3次
            for (let index = 0; index < 3; index++) {
                response = await asyncRequest(url);
                body = safeParseJSON(response.body);
                if (body && body.audits) {
                    extractField(body, url);
                    break;
                }
                else {
                    continue;
                }
            }
        }
    }
    console.log('done');
}
main();
