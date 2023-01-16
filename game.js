let cx = 10;
let cy = 10;
let r = 20;


function _update() {
    cls([0, 0, 0.2]);
    fillp("1000" + "0100" + "0010" + "1111");

    rectfill(0, 0, 159, 143, [0, 0, 0], [0.25, 0.25, 0.25]);

    //fillp();
    //
    for (let r2 = 0; r2 < 20; r2 += 1) {
        circ(cx, cy, r2, [1,1,1], [1,0,1]);
    }
    fillp();

    if (buttons.key_ArrowUp) {
        r += 1;
        console.log(r);
    }
    if (buttons.key_ArrowDown) {
        r -= 1;
        console.log(r);
    }


    if (buttons.key_W) {
        cy -= 1;
    }
    if (buttons.key_S) {
        cy += 1;
    }
    if (buttons.key_A) {
        cx -= 1;
    }
    if (buttons.key_D) {
        cx += 1;
    }
}
