//map.js
import { MAP_TITLE } from '../../constants/index.js';

Page({
  data: {
    mapTitle: MAP_TITLE,
    lat: null,
    lng: null,
  },
  onLoad: function () {
    console.log('getLocation')
    this.getLocation()
  },
  getLocation() {
    wx.getLocation({
      type: 'wgs84',
      success: (res) => {
        this.setData({
          lat: res.latitude,
          lng: res.longitude
        })
      }
    })
  }
})
