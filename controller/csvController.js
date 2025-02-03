import _ from "lodash";
import { extractJsonDataFromRows, getRowsFromRawCsv, logDecorator, logToFile } from "../utils/common.js";
import fs from 'fs';
import connectionPool from "../config/dbCon.js";
import { v4 as uuidv4 } from 'uuid';

const insertUserDataIntoDb = async (jsonDataArray, dbPoolClient) => {
    let queryValuesPlaceHolder = '';
    let insertFail = '';

    const queryDataMap = jsonDataArray.map((jsonData, index) => {
        queryValuesPlaceHolder += `${index === 0 ? '' : ', '}($${index * 5 + 1}, $${index * 5 + 2}, $${index * 5 + 3}, $${index * 5 + 4}, $${index * 5 + 5})`;
        const additionalInfo = _.omit(jsonData, ['name', 'age', 'address'])
        return [
            `${jsonData?.name.firstname} ${jsonData?.name.lasttname}`,
            Number(jsonData?.age),
            jsonData?.address,
            additionalInfo,
            uuidv4()
        ]
    });

    await dbPoolClient.query(
        `INSERT INTO users (name, age, address, additional_info, uid) VALUES ${queryValuesPlaceHolder} RETURNING *`,
        queryDataMap.flat(),
    ).catch(err => {
        insertFail = err;
        console.log('db entry err', err)
    })

    if (insertFail) throw insertFail;
}

const startBatchUpload = async (jsonDataArray) => {
    const batchSize = 1000;
    let batchStart = 0;
    let dbUploadFailed = false;

    const dbPoolClient = await connectionPool.connect();
    await dbPoolClient.query('BEGIN');

    const promises = [];

    while (batchStart < jsonDataArray.length - 1) {
        const batch = jsonDataArray.slice(batchStart, batchStart + 1000);
        const dataInsertPromise = new Promise((resolve, reject) => {
            const batchNo = `${batchStart} to ${batchStart + 1000}`;
            insertUserDataIntoDb(batch, dbPoolClient).then(() => {
                resolve(`done : ${batchNo}`)
            }).catch((err) => {
                reject(`rejected : ${batchNo}, ${err}`)
            });
        })
        promises.push(dataInsertPromise);
        batchStart += batchSize;
    }

    await Promise
        .all(promises)
        .then(() => {
            dbPoolClient.query('COMMIT')
        })
        .catch((reason) => {
            dbUploadFailed = reason;
            logToFile(reason.toString(), 'dbUploadFailures.txt');
            dbPoolClient.query('ROLLBACK')
        });

    if (dbUploadFailed) throw dbUploadFailed;

    return { dbUploadFailed }
}


export const extractWithMulter = async (req, res) => {
    let fileData = fs.createReadStream(req.files[0].path, { encoding: 'utf8', autoClose: true });
    let jsonDataArray = [];
    let fileChunk = '';

    fileData.on('data', (file) => {
        fileChunk += file.toString();
    });

    fileData.on('close', async () => {
        const allRows = getRowsFromRawCsv(fileChunk)
        
        jsonDataArray = extractJsonDataFromRows(allRows);

        await startBatchUpload(jsonDataArray).then(
            () => res.send({ status: `Success, Added ${jsonDataArray.length} entries`, })
        ).catch(async () => {
            logDecorator()
            console.log('DB Upload Failure')
            console.log('Retrying Again')
            logDecorator()
            await startBatchUpload(jsonDataArray).then(
                () => res.send({ status: `Success, Added ${jsonDataArray.length} entries`, })
            ).catch(
                () => res.status(500).send('Failure')
            )
        }
        );
    })
}

export const extractWithVanillaJs = async (req, res) => {
    let fileBuffer = Buffer.alloc(0);

    req.on('data', (chunk) => {
        fileBuffer = Buffer.concat([fileBuffer, chunk]);
    });
    req.on('end', async () => {
        let jsonDataArray = [];
        const fileBufferString = fileBuffer.toString();
        const boundary = req.headers['content-type'].split('boundary=')[1];
        const fileContents = fileBufferString.split(`${boundary}`)[1];
        const rawFileData = fileContents.split('\r\n\r\n')[1]
        const rawCsvData = rawFileData.slice(0, rawFileData.lastIndexOf('\r\n'));
        const allRows = getRowsFromRawCsv(rawCsvData)

        jsonDataArray = extractJsonDataFromRows(allRows);

        await startBatchUpload(jsonDataArray).then(
            () => res.send({ status: `Success, Added ${jsonDataArray.length} entries`, })
        ).catch(async () => {
            logDecorator()
            console.log('DB Upload Failure')
            console.log('Retrying Again')
            logDecorator()
            await startBatchUpload(jsonDataArray).then(
                () => res.send({ status: `Success, Added ${jsonDataArray.length} entries`, })
            ).catch(
                () => res.status(500).send('Failure')
            )
        }
        );
    });
}