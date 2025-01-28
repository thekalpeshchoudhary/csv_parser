import express from "express";
import multer from "multer";
import fs from "fs";
import pkg from 'pg';
import _ from 'lodash'

const { Pool } = pkg;
const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASS,
    port: process.env.POSTGRES_PORT,
})

const app = express();
const upload = multer({ dest: 'uploads/' })

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const getRowsFromRawCsv = (rawFileData) => {
    const allRows = rawFileData.replace('\r', '').split('\n');
    return allRows
}

const extractJsonDataFromRows = (allRows) => {
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

const resultCallback = (res) => (ageDistribution) => {
    console.log('Age Distribution');
    console.table(ageDistribution);
    res.send({ ageDistribution })
}

const insertDataIntoDb = (jsonDataArray, res) => {
    let queryFailure = false;
    jsonDataArray.forEach((jsonData) => {
        if (!queryFailure) {
            const additionalInfo = _.omit(jsonData, ['name', 'age', 'address'])

            pool.query(
                'INSERT INTO users (name, age, address, additional_info, id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [
                    `${jsonData?.name.firstname} ${jsonData?.name.lasttname}`,
                    Number(jsonData?.age),
                    jsonData?.address,
                    additionalInfo,
                    _.uniqueId(Math.round(Math.random() * 100000))
                ],
                (error) => {
                    if (error) {
                        queryFailure = error
                    }
                })
        }
    })
    if (!queryFailure) {
        getAgeDistribution(resultCallback(res));
        return;
    }
    res.status(500).send({ msg: "Failed", queryFailure })
}

const getAgeDistribution = (callbackR) => {
    pool.query(
        `SELECT
            CASE
                WHEN age < 20 THEN '< 20'
                WHEN age BETWEEN 20 AND 39 THEN '20-40'
                WHEN age BETWEEN 40 AND 60 THEN '40-60'
                ELSE '> 60'
            END AS age_group,
            COUNT(*) AS total_users
        FROM users
        GROUP BY
            CASE
                WHEN age < 20 THEN '< 20'
                WHEN age BETWEEN 20 AND 39 THEN '20-40'
                WHEN age BETWEEN 40 AND 60 THEN '40-60'
                ELSE '> 60'
            END`,
        [],
        (e, r) => {
            callbackR(r.rows);
        }
    )
}


app.post('/api/parseCsvToJson', upload.array('fileData'), (req, res) => {
    let fileData = fs.createReadStream(req.files[0].path, { encoding: 'utf8', autoClose: true });
    let jsonDataArray = [];
    let fileChunk = '';

    fileData.on('data', (file) => {
        fileChunk += file.toString();
    });

    fileData.on('close', () => {
        const allRows = getRowsFromRawCsv(fileChunk)
        jsonDataArray = extractJsonDataFromRows(allRows);
        insertDataIntoDb(jsonDataArray, res)
    })
})

app.post('/api/csvToJsonRaw', (req, res) => {
    let fileBuffer = Buffer.alloc(0);

    req.on('data', (chunk) => {
        fileBuffer = Buffer.concat([fileBuffer, chunk]);
    });
    req.on('end', () => {
        let jsonDataArray = [];
        const fileBufferString = fileBuffer.toString();
        const boundary = req.headers['content-type'].split('boundary=')[1];
        const fileContents = fileBufferString.split(`${boundary}`)[1];
        const rawFileData = fileContents.split('\r\n\r\n')[1]
        const rawCsvData = rawFileData.slice(0, rawFileData.lastIndexOf('\r\n'));
        const allRows = getRowsFromRawCsv(rawCsvData)

        jsonDataArray = extractJsonDataFromRows(allRows);
        insertDataIntoDb(jsonDataArray, res);

    });
})


app.get('/api/getAgeDistribution', (req, res) => {
    getAgeDistribution(resultCallback(res));
})

app.listen(process.env.PORT, () => {
    console.log(`listening on port ${process.env.PORT}`);
})
