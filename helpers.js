import { clockType } from "./clocks/clock.js";
import { CountdownClock } from "./clocks/countdownClock.js";

function getClock(cl) {
    console.log(cl)
    switch (cl.clockType) {
        case clockType.COUNTDOWN:
            return new CountdownClock(cl.clockState, cl.clockName, cl.clockOverrun, cl.clockDuration, cl.clockTime);
            break;
    }
}
export { getClock }