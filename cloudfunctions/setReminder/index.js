// cloudfunctions/setReminder/index.js
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
    const { title, remark, remindInfo } = event;
    try {
        // 将提醒信息添加到数据库
        const dbResult = await db.collection('reminders').add({
            data: {
                title,
                remark,
                remindInfo
            }
        });

        if (remindInfo.type === 'once') {
            // 一次性提醒
            const { date, time } = remindInfo;
            const remindDateTime = new Date(`${date} ${time}`);
            const now = new Date();
            const delay = remindDateTime - now;

            if (delay > 0) {
                // 创建定时任务
                await cloud.callFunction({
                    name: 'createScheduledTask',
                    data: {
                        taskType: 'once',
                        remindId: dbResult._id,
                        delay
                    }
                });
            }
        } else if (remindInfo.type === 'periodic') {
            // 周期性提醒
            const { periodType, periodDetail, time } = remindInfo;
            const now = new Date();
            let nextRemindTime;

            switch (periodType) {
                case '每年':
                    const { month, day } = periodDetail;
                    nextRemindTime = new Date(now.getFullYear(), month - 1, day, ...time.split(':'));
                    if (nextRemindTime < now) {
                        nextRemindTime.setFullYear(nextRemindTime.getFullYear() + 1);
                    }
                    break;
                case '每月':
                    const { day: dayOfMonth } = periodDetail;
                    nextRemindTime = new Date(now.getFullYear(), now.getMonth(), dayOfMonth, ...time.split(':'));
                    if (nextRemindTime < now) {
                        nextRemindTime.setMonth(nextRemindTime.getMonth() + 1);
                    }
                    break;
                case '每周':
                    const { week } = periodDetail;
                    const weekMap = { '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6, '周日': 0 };
                    const targetWeekday = weekMap[week];
                    let daysUntilNext = targetWeekday - now.getDay();
                    if (daysUntilNext <= 0) {
                        daysUntilNext += 7;
                    }
                    nextRemindTime = new Date(now.getTime() + daysUntilNext * 24 * 60 * 60 * 1000);
                    nextRemindTime.setHours(...time.split(':'));
                    break;
                case '每天':
                    nextRemindTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), ...time.split(':'));
                    if (nextRemindTime < now) {
                        nextRemindTime.setDate(nextRemindTime.getDate() + 1);
                    }
                    break;
            }

            const delay = nextRemindTime - now;
            if (delay > 0) {
                // 创建定时任务
                await cloud.callFunction({
                    name: 'createScheduledTask',
                    data: {
                        taskType: 'periodic',
                        remindId: dbResult._id,
                        delay
                    }
                });
            }
        }

        return {
            success: true,
            message: '提醒设置成功，已保存到数据库',
            dbResult
        };
    } catch (e) {
        console.error('数据库操作失败:', e);
        return {
            success: false,
            message: '数据库操作失败',
            error: e
        };
    }
};