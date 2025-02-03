import express from "express";
import colors from 'colors'
import logger from "./middleware/logger.js";
import { logDecorator } from "./utils/common.js";
import userRoutes from "./routes/users.js";
import csvToJsonRoutes from "./routes/csvToJson.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.use('/api/user', userRoutes);
app.use('/api/csvToJson', csvToJsonRoutes);

app.listen(process.env.PORT, () => {
    logDecorator();
    console.log(`App listening on PORT: ${process.env.PORT}`['bgGreen']);
    logDecorator();
})
