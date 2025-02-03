import express from 'express';
import { extractWithMulter, extractWithVanillaJs } from '../controller/csvController.js';
import multer from 'multer';
import path from 'path'
const csvToJsonRoutes = express.Router();

const upload = multer({
    dest: 'uploads/', 
    fileFilter: function (req, file, callback) {
        const ext = path.extname(file.originalname);
        if(ext !== '.csv' ) {
            return callback(new Error('Only csv files are allowed'))
        }
        callback(null, true)
    },
})

csvToJsonRoutes.post('/withMulter', upload.array('fileData'), extractWithMulter)

csvToJsonRoutes.post('/withVanillaJs', extractWithVanillaJs)

export default csvToJsonRoutes;