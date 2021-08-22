class Clock {
  /**
   * 
   * @param {clockType} type 
   * @param {boolean} active 
   * @param {string} name 
   * @param {boolean} overrun 
   */
  constructor(type, active, name, overrun) {
    this.type = type;
    this.active = active;
    this.name = name;
    this.overrun = overrun
  }

  /**
   * 
   * @param {Date} t 
   * @returns 
   */
  static getFormatedTime = function (t) {
    var h = String(t.getUTCHours()).padStart(2, '0');
    var m = String(t.getUTCMinutes()).padStart(2, '0');
    var s = String(t.getUTCSeconds()).padStart(2, '0');
    var ms = String(t.getUTCMilliseconds()).padStart(4, '0');
    return h + ":" + m + ":" + s + ":" + ms;
  }
}

/**
 * clockType ENUM
 * 
 * values from Propresenter 7 are as follows:
 * 0 is Countdown,
 * 1 is Countdown to Time,
 * 2 is Elapsed Time.
 */
const clockType = {
  COUNTDOWN: 0,
  COUNTDOWNTOTIME: 1,
  ELAPSEDTIME: 2
}




export { Clock, clockType };