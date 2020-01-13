// p2p_pong Two-player / two-microbit pong game using
// radio. One of the players starts play by pressing
// A+B. Paddle moves left or right by pressing the A
// or B button. On a "miss", ball is re-served a the
// current ball owner's current position.
input.onButtonPressed(Button.B, function () {
    // Move paddle right.
    if (cx < 4) {
        led.unplot(cx, 4)
        cx += 1
        led.plot(cx, 4)
    }
})
input.onButtonPressed(Button.A, function () {
    // Move paddle left
    if (cx > 0) {
        led.unplot(cx, 4)
        cx += 0 - 1
        led.plot(cx, 4)
    }
})
radio.onReceivedValue(function (name, value) {
    // Other player has pressed A+B.  This microbit
    // receives "gameOn" and knows the game has started.
    if (name == "gameOn" && gameOnFlag == 0) {
        gameOnFlag = 1
    }
    // Ball has passed from the other player's court to
    // this player's court.  "vector" message contains
    // x-position and x-direction of the ball.
    if (name == "vector") {
        myBallFlag = 1
        // "value" var is a number.  We could keep it as a
        // number and look a the individual digits, but I
        // found "substr" before whatever the modulus operator
        // is so I'm converting it to a string.  See the
        // "send" call for details on this variable.
        vectorValStr = "" + value
        // Could probably use parseInt but the block section
        // gave me parseFloat.
        x = parseFloat(vectorValStr.substr(1, 1))
        xDirFlag = parseFloat(vectorValStr.substr(2, 1))
        // Switched this up to look right in head-to-head
        // orientation.
        if (xDirFlag == 0) {
            vx = 1
        } else {
            vx = -1
        }
        // No matter what, the ball is going to be on the top
        // row and moving toward the bottom.
        vy = 1
        y = 0
    }
})
input.onButtonPressed(Button.AB, function () {
    // A+B means that play has started.  Alert the other
    // microbit.
    if (gameOnFlag == 0) {
        radio.sendValue("gameOn", 1)
        gameOnFlag = 1
        myBallFlag = 1
    }
})
// Resets gameplay to initial "gameOn" mode in the
// case of a miss.
function init () {
    y = 3
    x = cx
    vy = 1
    vx = -1
    delay = 750
    led.plot(cx, 4)
}
let vectorData = 0
let hitflag = 0
let vx = 0
let xDirFlag = 0
let x = 0
let vectorValStr = ""
let myBallFlag = 0
let cx = 0
let vy = 0
let delay = 0
let y = 0
let gameOnFlag = 0
let iterator = 0
gameOnFlag = 0
y = 3
delay = 750
vy = -1
radio.setGroup(5)
init()
serial.redirectToUSB()
basic.forever(function () {
    if (gameOnFlag == 1 && myBallFlag == 1) {
        // Active play on the current microbit.  This section
        // moves ball and makes it bounce off the walls and
        // paddle.
        led.plot(x, y)
        basic.pause(delay)
        led.unplot(x, y)
        if (x == cx) {
            // ball has hit the paddle.
            hitflag = 1
        }
        // Increment x,y positions by velocity values
        x += vx
        y += vy
        // Check if we hit a wall
        if (x < 0 || x > 4) {
            vx = vx * -1
            x = x + vx + vx
        }
        // back wall -- bounce if we hit the paddle, reset if
        // it was a miss
        if (y > 3) {
            if (hitflag == 1) {
                vy = vy * -1
                y = y + vy + vy
            } else {
                init()
            }
        } else if (y < 0) {
            // Ball is passing from the current microbit's court
            // to the other microbit's court. The radio.sendValue
            // function can only send a number.  This number needs
            // to contain x-position and x-direction info. I'm
            // going to make it a 3-digit number where each digit
            // has a function: Digit 1 (100's position): Dummy
            // value so I always have at least a zero in digit 2.
            // Digit 2 (10's position): x-position (range 0-4)
            // Digit 3 (1's position): x-direction The "1" in
            // "100" is a dummy value
            vectorData = 100
            // x-pos is in the 10's slot
            vectorData += (4 - x) * 10
            // Can't store x-dir of -1 as a digit so we'll use a
            // binary flag
            if (vx == 1) {
                xDirFlag = 1
            } else {
                xDirFlag = 0
            }
            // x-dir in the 1's slot
            vectorData += xDirFlag
            // send it
            radio.sendValue("vector", vectorData)
            // Ball is no longer in the court of this microbit.
            myBallFlag = 0
        }
        hitflag = 0
    }
})
