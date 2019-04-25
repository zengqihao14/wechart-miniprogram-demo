//scrollSteps.js

Page({
  data: {
    timerId: null,
    steps: [1, 2, 3],
    currentIdx: 0,
    stepProgress: [0, 0, 0]
  },
  onShow() {
    this.getStepContents();
  },
  onPageScroll() {
    if (!this.data.timerId) {
      const timerId = setTimeout(() => {
        this.getStepContents();
        this.setData({
          timerId: null
        });
      }, 200);

      this.setData({
        timerId: timerId
      });
    }
  },
  getStepContents() {
    // 实机运行极其缓慢
    wx.createSelectorQuery()
      .selectAll('.step-content')
      .boundingClientRect()
      .selectViewport()
      .scrollOffset()
      .exec((res) => {
        if (res && res.length > 1) {
          let currentIdx = this.data.currentIdx;
          const stepOneProgress = this.calcStepProgress(0, res[0][0]);
          const stepTwoProgress = this.calcStepProgress(1, res[0][1]);
          const stepThreeProgress = this.calcStepProgress(2, res[0][2]);
          if (stepOneProgress >= 0) {
            currentIdx = 0;
          }
          if (stepTwoProgress > 0) {
            currentIdx = 1;
          }
          if (stepThreeProgress > 0) {
            currentIdx = 2;
          }
          this.setData({
            stepProgress: [stepOneProgress, stepTwoProgress, stepThreeProgress],
            currentIdx
          });
        }
      });
  },
  calcStepProgress(index, res) {
    const offset = 0;
    return Math.min(Math.max((1 - (res.top - (offset * (index + 1)) - 68 + res.height) / (res.height - offset)) * 100, 0), 100);
  }
})