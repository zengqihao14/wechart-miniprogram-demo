//views.js

Page({
    data: {
        movableItemOutOfBounds: false
    },
    onPageScroll() {
        console.log('onPageScroll');
    },
    handleClick: function() {
        const query = wx.createSelectorQuery();
        query.select('.container').boundingClientRect();
        query.selectViewport().scrollOffset();
        query.exec(function (res) {
            console.log('page res', res);
        })
    },
    handleMovableItemChange: function(ev) {
        const { detail } = ev;
        if (detail.source === 'out-of-bounds') {
            this.setData({
                movableItemOutOfBounds: true
            })
        } else {
            this.setData({
                movableItemOutOfBounds: false
            })
        }
        console.log('handleMovableItemChange', ev);
    },
    handleMovableItemScale: function(ev) {
        console.log('handleMovableItemScale', ev);
    },
    handleMovableXTouchmove: function(ev) {
        console.log('handleMovableXTouchmove', ev);
    },
    handleMovableYTouchmove: function(ev) {
        console.log('handleMovableYTouchmove', ev);
    },
    handleScrollToUpper: function(ev) {
        console.log('handleScrollToUpper', ev);
    },
    handleScrollToLower: function(ev) {
        console.log('handleScrollToLower', ev);
    },
    handleSwiperChange: function(ev) {
        console.log('handleSwiperChange', ev);
    },
})