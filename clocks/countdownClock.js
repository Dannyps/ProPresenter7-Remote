import { Clock, clockType } from "./clock.js";

class CountdownClock extends Clock {
    /**
     *
     * @param {boolean} active 
     * @param {String} name 
     * @param {false} overrun 
     * @param {String} clockDuration the total duration of the clock
     * @param {String} clockTime the remaining time
     */
    constructor(active, name, overrun, clockDuration, clockTime) {
        super(clockType.COUNTDOWN, active, name, overrun);
        this.clockDuration = clockDuration;
        this.clockEnd = CountdownClock.getClockEnd(clockTime);
    }
    /**
     * Given the remaining time, get the end of the clock.
     * 
     * @param {String} clockTime the remaining time
     */
    static getClockEnd(clockTime) {
        let milis = 0;
        let a;
        [...a] = clockTime.split(":");
        milis += a[0] * 60 * 60 * 1000;
        milis += a[1] * 60 * 1000;
        milis += a[2] * 1000;

        if (clockTime[0] == '-') {
            milis *= -1;
        }

        let d = new Date().getTime() + milis;

        return new Date(d);
    }

    getTimeRemaining() {
        if (!this.active)
            return this.clockDuration;
        let diff;
        if (diff < 0) {
            diff = new Date() - this.clockEnd
        }
        else {
            diff = this.clockEnd - new Date()
        }

        let tr = new Date(diff)
        if (diff < 0)
            return '-' + Clock.getFormatedTime(tr);
        else {
            return Clock.getFormatedTime(tr);
        }
    }
}

export { CountdownClock }
