
let x1 = 50;
let y1 = 50;
let x2 =  x1 + 20;
let y2 = y1 + 10;

let cx = 100;
let cy = 100;
let r = 4;

function _update() {
    cls([0, 0, 0.2]);
    fillp("1000" + "0100" + "0010" + "1111");
    //rectfill(100, 100, 110, 110, [1, 0, 0], [0, 0, 1]);


    fillp();
    rectfill(x1, y1, x2, y2, [0.5, 0.5, 0.5]);
    fillp("1000" + "0100" + "0010" + "1111");
    fillp();
    ovalfill(x1, y1, x2, y2, [1, 0, 1], [1, 0, 0]);

    fillp();
    circfill(cx, cy, r, [1, 0, 1]);

    if (buttons.key_W) {
        y2 -= 1;
    }
    if (buttons.key_S) {
        y2 += 1;
    }
    if (buttons.key_A) {
        x2 -= 1;
    }
    if (buttons.key_D) {
        x2 += 1;
    }

    if (buttons.key_ArrowUp) {
        r += 1;
    }
    if (buttons.key_ArrowDown) {
        r -= 1;
    }
}
