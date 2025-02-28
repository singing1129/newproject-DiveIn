import express from "express";
import { pool } from "../../config/mysql.js";
const router = express.Router();

router.post("/join", async (req, res) => {
    try {
        console.log("連接成功");
        const group = parseInt(req.body.group_id)
        const user = parseInt(req.body.user_id)
        const count = parseInt(req.body.number)
        let values = []
        for (let i = 0; i < count; i++) {
            values.push(`(${group}, ${user})`);
        }
        const sql = `INSERT INTO groups_participants (groups_id, user_id) VALUES ${values.join(",")}`;
        const result = await pool.execute(sql)
        console.log(result);
        const checkNumber = `
                            SELECT COUNT(groups_participants.id) AS participant_number
                            FROM groups
                            JOIN groups_participants ON groups.id = groups_participants.groups_id
                            WHERE groups.id = ${group}`;
        const [nowNumber] = await pool.execute(checkNumber)
        console.log(nowNumber[0].participant_number);
        const searchMaxNumber = `SELECT max_number FROM groups WHERE id = ${group}`
        const [maxNumber] = await pool.execute(searchMaxNumber)
        console.log(maxNumber[0].max_number);
        if(nowNumber[0].participant_number >= maxNumber[0].max_number){
            const updateStatus = `UPDATE groups SET status = 1 WHERE id = ${id} `
            const doUpdateStatus = await pool.execute(updateStatus)
            console.log(doUpdateStatus);
        }
        res.status(200).json({
            status: "success",
            message: "新建跟團資料成功"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: "error",
            message: error.message ? error.message : "新建失敗",
        });
    }
});

export default router;
