import colors from 'colors'
import { logToFile } from '../utils/common.js';

const logger = (req, res, next) => {
    const methodColor = {
        GET: 'green',
        POST: 'blue',
        PUT: 'yellow',
        DELETE: 'red',
        PATCH: 'magenta'
    }

    const color = methodColor[req.method] || 'white';
    const log = `${req.method} ${req.protocol}://${req.get('host')}${req.originalUrl} at ${new Date()}`;
    console.log(log[color]);
    logToFile(log, 'request_logs.txt')
    next();
}

export default logger;