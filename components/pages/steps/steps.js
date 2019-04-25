//steps.js

Page({
    data: {
        steps: [1, 2, 3],
        currentIdx: 0
    },
    handleNextClick: function() {
        if (this.data.currentIdx < this.data.steps.length - 1) {
            this.setData({
                currentIdx: Math.min(this.data.currentIdx + 1, this.data.steps.length - 1)
            })
        }
    },
    handlePrevClick: function() {
        if (this.data.currentIdx > 0) {
            this.setData({
                currentIdx: Math.max(this.data.currentIdx - 1, 0)
            })
        }
    }
})