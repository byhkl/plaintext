// utils/util.js
const initMonths = () => {
    const months = [];
    for (let i = 1; i <= 12; i++) {
        months.push(i);
    }
    return months;
};

const updatePeriodicDays = (periodicMonthIndex) => {
    const month = periodicMonthIndex + 1;
    const daysInMonth = new Date(new Date().getFullYear(), month, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }
    return days;
};

const checkUserAuthorization = () => {
    return new Promise((resolve) => {
        wx.getSetting({
            success: res => {
                resolve(!!res.authSetting['scope.subscribeMessage']);
            },
            fail: () => {
                resolve(false);
            }
        });
    });
};

const requestAuthorization = () => {
    return new Promise((resolve) => {
        wx.requestSubscribeMessage({
            tmplIds: ['0nvoP47xFn2N0xkIc1WahKy5mBGpaSEePfgsMy-CxAM'],
            success: res => {
                if (res['0nvoP47xFn2N0xkIc1WahKy5mBGpaSEePfgsMy-CxAM'] === 'accept') {
                    wx.showToast({
                        title: '授权成功',
                        icon: 'success'
                    });
                    resolve(true);
                } else {
                    wx.showToast({
                        title: '授权失败',
                        icon: 'none'
                    });
                    resolve(false);
                }
            },
            fail: err => {
                wx.showToast({
                    title: '授权请求失败',
                    icon: 'none'
                });
                console.error('授权请求失败:', err);
                resolve(false);
            }
        });
    });
};

module.exports = {
    initMonths,
    updatePeriodicDays,
    checkUserAuthorization,
    requestAuthorization
};