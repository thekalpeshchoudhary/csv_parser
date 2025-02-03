import fs from 'fs'
import path from 'path';
import { fileURLToPath } from 'url';

// get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __root_dir = __dirname.replace(path.basename(__dirname), '');

export const getRowsFromRawCsv = (rawFileData) => {
    const allRows = rawFileData.replace('\r', '').split('\n');
    return allRows
}

export const logToFile = (log, fileName) => {
    fs.appendFile(`${__root_dir}/logs/${fileName}`, `${log}\n`, (err) => {
        err && console.log(err)
    })
}

export const logDecorator = () => {
    console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=');
}

export const extractJsonDataFromRows = (allRows) => {
    const headingRow = allRows[0].split(',');
    const dataRows = allRows.slice(1, allRows.length - 1)
    const jsonDataArray = [];
    dataRows.forEach(eachRow => {
        const eachDataObj = {}
        const eachLineData = eachRow.split(',');
        eachLineData.forEach((eachData, i) => {
            const propertyTrain = headingRow?.[i]?.split('.');
            let previousRef = eachDataObj;
            propertyTrain?.forEach((eachTrainCoach, trIndex) => {
                if (trIndex === propertyTrain.length - 1) {
                    previousRef[eachTrainCoach] = eachData.replace('\r', '');
                } else {
                    previousRef[eachTrainCoach] = previousRef?.[eachTrainCoach] ?? {}
                    previousRef = previousRef[eachTrainCoach];
                }
            })
        });
        jsonDataArray.push(eachDataObj);
    })

    return jsonDataArray
}
