import express from "express";
import { pool } from "../config/mysql.js";

export async function checkAndUpdateGroupStatus() {
    try {
        const sql = "SELECT * FROM groups WHERE groups.status = 0"
        const now = new Date()
        const [rows] = await pool.execute(sql)
        // console.log(rows);
        for (const row of rows) { // ✅ 改用 for...of
            if (new Date(row.sign_end_date) < now) {
                await pool.execute("UPDATE groups SET status = 2 WHERE id = ?", [row.id]); // ✅ 修正 SQL Injection
                console.log(`揪團id${row.id} ${row.name} 超過報名截止日期，已自動取消`);
            }
        }
    } catch (error) {
        console.log(error);
    }
}