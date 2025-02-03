import connectionPool from "../config/dbCon.js";
import { logDecorator } from "../utils/common.js";

export const getAgeDistribution = (req, res)  => {
    connectionPool.query(
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
        (e, result) => {
            if (e) {
                res.send('Failure')
            }
            if (result) {
                logDecorator()
                console.log('Age Distribution');
                console.table(result.rows.length > 0 ? result.rows : 'Data is missing');
                logDecorator()
                res.send({ data: result.rows })
            }
        }
    )
}


