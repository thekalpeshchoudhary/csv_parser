import express from 'express';
import { getAgeDistribution } from '../controller/userController.js';
const userRoutes = express.Router();

userRoutes.get('/getAgeDistribution', getAgeDistribution)

export default userRoutes;