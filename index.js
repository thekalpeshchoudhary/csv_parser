import express from "express";
import multer from "multer";
import fs from "fs";

const app = express();
const upload = multer({ dest: 'uploads/' })

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const extractJsonData = (allRows) => {
    const headingRow = allRows[0].split(',');
    const dataRows = allRows.slice(1,allRows.length-1)
    const jsonDataArray = [];
    dataRows.forEach(eachRow => {
        const eachDataObj = {}
        const eachLineData = eachRow.split(',');
        eachLineData.forEach((eachData, i) => {
            const propertyTrain = headingRow?.[i]?.split('.');
            let previousRef = eachDataObj;
            propertyTrain?.forEach((eachTrainCoach, trIndex) => {
                if (trIndex === propertyTrain.length - 1) {
                    previousRef[eachTrainCoach] = eachData;
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

app.post('/api/parseCsvToJson', upload.array('fileData'), (req, res) => {
    let fileData = fs.createReadStream(req.files[0].path, { encoding: 'utf8', autoClose: true });
    let jsonDataArray = [];
    let fileChunk = '';

    fileData.on('data', (file) => {
        fileChunk += file.toString();
    });

    fileData.on('close', () => {
        const rawFile = fileChunk;
        const allRows = rawFile.split('\n');
        jsonDataArray = extractJsonData(allRows);
        res.send({ jsonDataArray, })
    })
})

app.listen(process.env.PORT, () => {
    console.log(`listening on port ${process.env.PORT}`);
})
