import express from "express";
import { pool } from "../../config/mysql.js";
import { sendJoinGroupCancelMail } from "../../lib/mail.js";
import { sendSystemNotification } from "../../lib/sendSystemNotification.js";
const router = express.Router();

router.post("/myGroup", async (req, res) => {
    try {
        // res.json({message:"連接我的揪團成功"})
        const user = req.body.user
        const status = req.body.status || 0
        console.log(user);
        const groupIdSearchSql = `SELECT groups_id FROM groups_participants WHERE user_id = ?`;
        const [getGroup] = await pool.execute(groupIdSearchSql, [user]);

        const sql = `
                    SELECT groups.*, 
                        activity_city.name AS city_name, 
                        groups_image.img_url AS group_img,
                        activity_country.id AS country_id,
                        COUNT(groups_participants.id) AS participant_number
                    FROM groups 
                    LEFT JOIN activity_city ON groups.groups_city_id = activity_city.id
                    LEFT JOIN groups_image ON groups.id = groups_image.groups_id
                    LEFT JOIN groups_participants ON groups.id = groups_participants.groups_id
                    LEFT JOIN activity_country ON activity_country.id = activity_city.activity_country_id
                    WHERE groups.user_id = ? 
                    OR groups.id IN (SELECT groups_id FROM groups_participants WHERE user_id = ?)
                    GROUP BY groups.id, activity_city.name, groups_image.img_url
                    ORDER BY sign_end_date ASC
                    `;

        const [rows] = await pool.execute(sql, [user, user]);

        res.status(200).json({
            status: "success",
            message: "成功獲取資料",
            data: rows,
        });
        // const groupIdSearchSql = `SELECT groups_id FROM groups_participants WHERE user_id = ${user} `
        // const [getGroup] = await pool.execute(groupIdSearchSql)
        // const groupId = [...new Set(getGroup.map(v => v.groups_id))]
        // if (!groupId) {
        //     res.status(200).json({
        //         status: "error",
        //         message: "沒有相關資料"
        //     });
        // }
        // console.log(groupId);
        // let sql = `SELECT groups.*, activity_city.name AS city_name, groups_image.img_url AS group_img FROM groups 
        // LEFT JOIN activity_city ON groups.groups_city_id = activity_city.id
        // LEFT JOIN groups_image ON groups.id = groups_image.groups_id 
        // WHERE groups.user_id = ${user} `;

        // let groupConditionArray = []
        // groupId.forEach((v)=>{
        //     groupConditionArray.push(` groups.id = ${v} `)
        // })
        // const groupCondition = groupConditionArray.join(" OR ")
        // sql += `OR ${groupCondition}`
        // sql += ` ORDER BY sign_end_date ASC `
        // // console.log(sql);
        // const [rows] = await pool.execute(sql);
        // console.log(rows);
        // res.status(200).json({
        //     status: "success",
        //     message: "成功獲取資料",
        //     data: rows,
        // });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message ? error.message : "取得資料失敗",
        });
    }
});
router.put("/myGroup/:id", async (req, res) => {
    const id = req.params.id
    const sql = `UPDATE groups SET status = 2 WHERE id = ${id} `
    await pool.execute(sql)
    // 獲取揪團資訊和參加者
    const [group] = await pool.execute("SELECT name, date FROM groups WHERE id = ?", [id]);
    const groupName = group[0].name;
    const groupDate = group[0].date; 
    const getParticipants = `
                            SELECT DISTINCT users.email, groups_participants.user_id
                            FROM groups_participants
                            JOIN users ON groups_participants.user_id = users.id
                            WHERE groups_participants.groups_id = ${id};
                            `;
    const [participants] = await pool.execute(getParticipants)
    
    // 發送系統通知
    const userIds = participants.map((p) => p.user_id);
    const notificationResult = await sendSystemNotification({
      userIds,
      content: `親愛的潛水愛好者您好：很遺憾地通知您，您所參加原定於 ${groupDate} 舉辦的揪團 "${groupName}" 已遭到取消。若有疑問，請詢問官方客服。`,
    });
    if (!notificationResult.success) {
      console.error("系統通知發送失敗:", notificationResult.message);
    }
    for (const participant of participants) {
        await sendJoinGroupCancelMail(participant.email, groupName, groupDate);
    }
    res.status(200).json({
        status: "success",
        message: "成功取消揪團"
    });
});
router.delete("/myGroup/:id", async (req, res) => {
    const id = req.params.id
    const user = req.query.userId
    console.log("id:"+id,"user"+user);
    const sql = `DELETE FROM groups_participants WHERE groups_id = ${id} AND user_id = ${user}`
    await pool.execute(sql)
    res.status(200).json({
        status: "success",
        message: "成功退出揪團"
    })
    // const sql = `UPDATE groups SET status = 2 WHERE id = ${id} `
    // await pool.execute(sql)
    // const getParticipants = `
    //                         SELECT DISTINCT users.email, groups_participants.user_id
    //                         FROM groups_participants
    //                         JOIN users ON groups_participants.user_id = users.id
    //                         WHERE groups_participants.groups_id = ${id};
    //                         `;
    // const [participants] = await pool.execute(getParticipants)
    // for (const participant of participants) {
    //     await sendJoinGroupCancelMail(participant.email, groupName, groupDate);
    // }
    // res.status(200).json({
    //     status: "success",
    //     message: "成功取消揪團"
    // });
});

export default router;
