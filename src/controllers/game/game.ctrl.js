import StatusBarCtrl from '../statusBar/statusBar.ctrl'
import HistoryCtrl   from '../history/history.ctrl'
import LockCtrl      from '../lock/lock.ctrl'
import SummaryCtrl   from '../summary/summary.ctrl'
import Pattern       from '../../models/pattern'
import PatternSVG    from '../../utils/patternSVG'
import config        from '../../config'
import dom           from '../../utils/dom'

require('./game.scss');

/**
 * Game Controller
 * The playground, the arena
 * It combines a status bar, a pattern history
 * and a lock.
 */
class GameCtrl {

  /**
   * Setup the controller
   * The callback provided will be called with
   * different parameter depending on the type
   * of end (abort, success, fail)
   * @param  {function} onEnd Callback for end of game
   * @return {[type]}       [description]
   */
  constructor (onEnd) {
    // Lets leave it empty for now
    // just init the shite to help V8
    this.statusBar = new StatusBarCtrl(this.abort.bind(this))
    this.history   = new HistoryCtrl()
    this.lock      = new LockCtrl(this.newAttempt.bind(this)); //# TO_DO move the dot length to dynamic
    this.summary   = new SummaryCtrl()
    this.pattern   = null
    this.type      = null
    this.onEnd     = onEnd

    //# QUESTION: Does it really make sense?
    this.statusBar.init()
    this.lock.init()

    this.setupTemplate()
  }

  /**
   * Build template of the controller
   * @return {SVGDOMElement}
   */
  setupTemplate () {
    this.summary.hide()

    this.el = dom.create('div', {class: 'game-layout'}, [
      this.statusBar.el,
      this.history.el,
      this.lock.el,
      this.summary.el
    ])
    return this.el
  }


  /* Controls **********************************/

  /**
   * Start a new game
   * @param  {int} type       Type ID
   * @param  {int} difficulty Number of dots
   */
  start (type, difficulty) {
    this.type = type
    this.lock.setDotLength(difficulty)
    this.pattern = new Pattern(difficulty)
    this.pattern.fillRandomly()
    this.history.clear()
    this.count = 0

    switch (type) {
      case config.GAME.TYPE.PRACTICE:
        return this.statusBar.setCounter(0)
      case config.GAME.TYPE.CHALLENGE:
        return this.statusBar.setCounter(10)
      case config.GAME.TYPE.COUNTDOWN:
        return this.statusBar.setCountdown(60)
    }
  }

  newAttempt (pattern) {
    // Generate a SVG from the pattern provided
    let attemptSVG = new PatternSVG()
    attemptSVG.addDots(1)
    attemptSVG.addPattern(pattern, 14, ['#999','#ccc','#fff']) //# TO_DO: Need consts

    let match = this.pattern.compare(pattern)
    PatternSVG.prototype.addCombinaison.apply(attemptSVG, match)

    this.count++

    if (match[0] === this.pattern.dotLength) {
      // Success case
      this.summary.setContent(true, 'Lock found in ' + this.count + ' attemps. Well done.', [1,2])

      return true
    }
    else {
      // Fail case
      this.history.stackPattern(attemptSVG.getSVG())
      switch (this.type) {
        case config.GAME.TYPE.PRACTICE:
          return this.statusBar.incrementCounter()
        case config.GAME.TYPE.CHALLENGE:
          if (this.statusBar.decrementCounter() === 0) {
            this.summary.setContent(false, 'Sorry, you didn\'t make it this time.', [2])
          }
          break;
      }
      return false
    }
  }

  abort () {

  }
}

export default GameCtrl
