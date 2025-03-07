Page({
  data: {
    title: '小轻提醒',
    remark: '',
    reminderType: 'once',
    onceDate: '',
    onceTime: '',
    periodTypes: ['每年', '每月', '每周', '每天'],
    periodTypeIndex: 0,
    periodicMonthIndex: 0,
    periodicDayIndex: 0,
    periodicWeekIndex: 0,
    periodicTime: '',
    hasUserAuthorized: false,
    months: [],
    periodicDays: [],
    weeks: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2099-12-31',
    periodicYearDate: ''
  },

  onLoad() {
    this.checkUserAuthorization();
    this.initMonths();
    this.updatePeriodicDays();
  },

  checkUserAuthorization() {
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.subscribeMessage']) {
          this.setData({
            hasUserAuthorized: true
          });
        }
      }
    });
  },

  initMonths() {
    const months = [];
    for (let i = 1; i <= 12; i++) {
      months.push(i);
    }
    this.setData({
      months
    });
  },

  updatePeriodicDays() {
    const { periodicMonthIndex } = this.data;
    const month = this.data.months[periodicMonthIndex];
    const daysInMonth = new Date(new Date().getFullYear(), month, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    this.setData({
      periodicDays: days
    });
  },

  bindTitleInput(e) {
    this.setData({
      title: e.detail.value
    });
  },

  bindRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    });
  },
  
  bindPeriodicMonthChange(e) {
    this.setData({
      periodicMonthIndex: e.detail.value
    });
    this.updatePeriodicDays();
  },

  bindReminderTypeChange(e) {
    this.setData({
      reminderType: e.detail.value === '0'? 'once' : 'periodic'
    });
  },

  bindOnceDateChange(e) {
    this.setData({
      onceDate: e.detail.value
    });
  },

  bindOnceTimeChange(e) {
    this.setData({
      onceTime: e.detail.value
    });
  },

  bindPeriodTypeChange(e) {
    this.setData({
      periodTypeIndex: e.detail.value
    });
    if (['每年', '每月'].includes(this.data.periodTypes[e.detail.value])) {
      this.updatePeriodicDays();
    }
  },

  bindPeriodicYearDateChange(e) {
    this.setData({
      periodicYearDate: e.detail.value
    });
    const [, month, day] = e.detail.value.split('-');
    this.setData({
      periodicMonthIndex: parseInt(month) - 1,
      periodicDayIndex: parseInt(day) - 1
    });
  },

  bindPeriodicDayChange(e) {
    this.setData({
      periodicDayIndex: e.detail.value
    });
  },

  bindPeriodicWeekChange(e) {
    this.setData({
      periodicWeekIndex: e.detail.value
    });
  },

  bindPeriodicTimeChange(e) {
    this.setData({
      periodicTime: e.detail.value
    });
  },

  requestAuthorization() {
    wx.requestSubscribeMessage({
      tmplIds: ['0nvoP47xFn2N0xkIc1WahKy5mBGpaSEePfgsMy-CxAM'],
      success: res => {
        if (res['0nvoP47xFn2N0xkIc1WahKy5mBGpaSEePfgsMy-CxAM'] === 'accept') {
          this.setData({
            hasUserAuthorized: true
          });
          wx.showToast({
            title: '授权成功',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: '授权失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        wx.showToast({
          title: '授权请求失败',
          icon: 'none'
        });
      }
    });
  },

  submitReminder() {
    if (!this.data.hasUserAuthorized) {
      wx.showToast({
        title: '请先授权服务通知',
        icon: 'none'
      });
      return;
    }

    const { title, remark, reminderType, onceDate, onceTime, periodTypes, periodTypeIndex, periodicMonthIndex, periodicDayIndex, periodicWeekIndex, periodicTime } = this.data;
    let remindInfo = {};
    if (reminderType === 'once') {
      remindInfo = {
        type: 'once',
        date: onceDate,
        time: onceTime
      };
    } else {
      const periodType = periodTypes[periodTypeIndex];
      let periodDetail = {};
      if (periodType === '每年') {
        periodDetail = {
          month: this.data.months[periodicMonthIndex],
          day: this.data.periodicDays[periodicDayIndex]
        };
      } else if (periodType === '每月') {
        periodDetail = {
          day: this.data.periodicDays[periodicDayIndex]
        };
      } else if (periodType === '每周') {
        periodDetail = {
          week: this.data.weeks[periodicWeekIndex]
        };
      }
      remindInfo = {
        type: 'periodic',
        periodType,
        periodDetail,
        time: periodicTime
      };
    }

    wx.cloud.callFunction({
      name: 'setReminder',
      data: {
        title,
        remark,
        remindInfo
      },
      success: res => {
        wx.showToast({
          title: '提醒设置成功',
          icon: 'success'
        });
      },
      fail: err => {
        console.error('调用云函数失败:', err);
        let errorMsg = '提醒设置失败';
        if (err.errMsg) {
          errorMsg += `: ${err.errMsg}`;
        }
        wx.showToast({
          title: errorMsg,
          icon: 'none'
        });
      }
    });
  }
});