
import SVGAVideoSpriteEntity from './videoSpriteEntity'

export default class SVGAVideoEntity {

  constructor(spec, images) {

    /**
     * 影片尺寸
     */
    this.videoSize = {
      width: 0.0,
      height: 0.0,
    };

    /**
     * 帧率
     */
    this.FPS = 20;

    /**
     * 帧数
     */
    this.frames = 0;

    /**
     * Bitmaps
     */
    this.images = {};

    /**
     * SVGAVideoSpriteEntity[]
     */
    this.sprites = []

    if (spec) {
      if (spec.movie) {
        if (spec.movie.viewBox) {
          this.videoSize.width = parseFloat(spec.movie.viewBox.width) || 0.0;
          this.videoSize.height = parseFloat(spec.movie.viewBox.height) || 0.0;
        }
        this.FPS = parseInt(spec.movie.fps) || 20;
        this.frames = parseInt(spec.movie.frames) || 0;
      }
      this.resetSprites(spec)
    }
    if (images) {
      this.images = images
    }

  }

  resetSprites(spec) {
    if (spec) {
      if (spec.sprites) {
        this.sprites = spec.sprites.map((obj) => {
          return new SVGAVideoSpriteEntity(obj)
        })
      }
    }
  }

}