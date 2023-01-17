
async function __initDrawPrograms() {
    //Draw rect
    {

        let vertexData = new Float32Array([
            0, 1, 2,
            2, 3, 0,
        ]);

        let vshader1Source = `#version 300 es
            #define WIDTH ${displayOptions.width}.0
            #define HEIGHT ${displayOptions.height}.0
            in float a_Index;

            uniform vec4 u_Rect;
            uniform vec2 u_Camera;

            out vec2 v_IntPosition;
            out vec4 v_Rect;

            void main() {
                v_Rect = u_Rect;

                vec2 position = vec2(0.0, 0.0);

                if (a_Index == 0.0) {
                    position = vec2(u_Rect.x, u_Rect.y);
                } else if (a_Index == 1.0) {
                    position = vec2(u_Rect.z, u_Rect.y);
                } else if (a_Index == 2.0) {
                    position = vec2(u_Rect.z, u_Rect.w);
                } else {
                    position = vec2(u_Rect.x, u_Rect.w);
                }

                v_IntPosition = position + vec2(0.5, 0.0);

                position += vec2(0.5, 0.0);
                position = position - u_Camera;

                // (0, 0) --> (-1, 1)
                // (80, 72) --> (0, 0)
                // (159, 143) --> (1, -1)
                
                position.x = position.x / (WIDTH / 2.0) - 1.0;
                position.y = -(position.y / (HEIGHT / 2.0) - 1.0);

                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        let fshader1Source = `#version 300 es
            precision highp float;

            uniform vec3 u_Color;
            uniform vec3 u_Color2;

            uniform bool u_Solid;

            uniform int u_Fillp;

            in vec4 v_Rect;

            in vec2 v_IntPosition;

            out vec4 FragColor;

            void main() {
                FragColor = vec4(u_Color, 1.0);
                if (!u_Solid) {
                    float dx = min(abs(v_IntPosition.x - v_Rect.x), abs(v_IntPosition.x - v_Rect.z));
                    float dy = min(abs(v_IntPosition.y - v_Rect.y), abs(v_IntPosition.y - v_Rect.w));

                    if (dx > 1.0 && dy > 1.0) {
                        FragColor.a = 0.0;
                    }
                }

                int row = int(v_IntPosition.y) % 4;
                int col = int(v_IntPosition.x) % 4;

                row = 3 - row;

                bool bit = (((u_Fillp >> (row * 4)) & 0xF) & (8 >> col)) != 0;

                if (bit) {
                    if (u_Color2.x == -1.0 || u_Color2.y == -1.0 || u_Color2.z == -1.0) {
                        FragColor.a = 0.0;
                    } else {
                        FragColor = vec4(u_Color2, 1.0);
                    }
                }

            }
        `;

        system.__rectshader = new ShaderProgram(vshader1Source, fshader1Source, {
            attributes: ["a_Index"],
            uniforms: ["u_Camera", "u_Rect", "u_Color", "u_Color2", "u_Solid", "u_Fillp"],
        });

        system.__rectshaderBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, system.__rectshaderBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);


        //Draw circle
        {
            let vertexData = new Float32Array([
                1.0, 1.0, //9
                1.0, -1.0, //3
                -1.0, -1.0, //1

                -1.0, -1.0, //1
                -1.0, 1.0, //7
                1.0, 1.0, //9
            ]);

            let vshader1Source = `#version 300 es
                #define WIDTH ${displayOptions.width}.0
                #define HEIGHT ${displayOptions.height}.0

                in vec2 a_Position;

                uniform vec2 u_Camera;

                out vec2 v_IntPosition;

                void main() {
                    gl_Position = vec4(a_Position, 0.0, 1.0);

                    float x = a_Position.x;
                    float y = a_Position.y;

                    // (-1, 1) --> (0, 0)
                    // (0, 0) --> (64, 64)
                    // (1, -1) --> (128, 128)

                    x = (x + 1.0) * (WIDTH / 2.0);
                    y = (-y + 1.0) * (HEIGHT / 2.0);

                    //x += 0.5;

                    v_IntPosition = vec2(x, y) - u_Camera;
                }
            `;

            let fshader1Source = `#version 300 es
                precision highp float;

                #define WIDTH ${displayOptions.width}.0
                #define HEIGHT ${displayOptions.height}.0

                in vec2 v_IntPosition;

                uniform vec2 u_Center;
                uniform float u_Radius;
                uniform vec3 u_Color;
                uniform vec3 u_Color2;
                uniform int u_Fillp;
                uniform bool u_Solid;

                out vec4 FragColor;

                void main() {
                    vec2 pos = v_IntPosition;

                    pos.x = floor(pos.x);
                    pos.y = floor(pos.y);

                    float dx = u_Center.x - pos.x;
                    float dy = u_Center.y - pos.y;

                    float dist2 = (dx * dx) + (dy * dy);
                    float maxDist = u_Radius * u_Radius;

                    FragColor = vec4(u_Color, 1.0);

                    if (dist2 > maxDist) {
                        FragColor.a = 0.0;
                    }

                    if (!u_Solid && u_Radius >= 1.0) {
                        FragColor.a = 0.0;
                        float maxDistPrev = (u_Radius - 1.0) * (u_Radius - 1.0);
                        if (dist2 >= maxDistPrev && dist2 <= maxDist) {

                            const float offsetX[4] = float[4](1.0, -1.0, 0.0, 0.0);
                            const float offsetY[4] = float[4](0.0, 0.0, 1.0, -1.0);

                            for (int i = 0; i < 4; i++) {
                                float ox = offsetX[i];
                                float oy = offsetY[i];
                            
                                float _x = pos.x + ox;
                                float _y = pos.y + oy;

                                float _dx = (_x - u_Center.x);
                                float _dy = (_y - u_Center.y);

                                float _d2 = (_dx * _dx) + (_dy * _dy);

                                if (_d2 > maxDist) {
                                    FragColor.a = 1.0;
                                    break;
                                }

                                
                            }


                        }


                    }

                    int row = int(pos.y) % 4;
                    int col = int(pos.x) % 4;
                    row = 3 - row;

                    bool bit = (((u_Fillp >> (row * 4)) & 0xF) & (8 >> col)) != 0;

                    if (bit) {
                        if (u_Color2.x == -1.0 || u_Color2.y == -1.0 || u_Color2.z == -1.0) {
                            FragColor.a = 0.0;
                        } else {
                            FragColor.xyz = u_Color2;
                        }
                    }


                }
            `;

            system.__circshader = new ShaderProgram(vshader1Source, fshader1Source, {
                attributes: ["a_Position"],
                uniforms: ["u_Camera", "u_Center", "u_Radius", "u_Color", "u_Color2", "u_Fillp", "u_Solid"],

            });

            system.__circshaderBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, system.__circshaderBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);


        }

    }

    //Draw oval
    {
        let vertexData = new Float32Array([
            1.0, 1.0, //9
            1.0, -1.0, //3
            -1.0, -1.0, //1

            -1.0, -1.0, //1
            -1.0, 1.0, //7
            1.0, 1.0, //9
        ]);


        let vshader1Source = `#version 300 es
            #define WIDTH ${displayOptions.width}.0
            #define HEIGHT ${displayOptions.height}.0

            in vec2 a_Position;

            uniform vec2 u_Camera;

            out vec2 v_IntPosition;

            void main() {
                gl_Position = vec4(a_Position, 0.0, 1.0);

                float x = a_Position.x;
                float y = a_Position.y;

                // (-1, 1) --> (0, 0)
                // (0, 0) --> (64, 64)
                // (1, -1) --> (128, 128)

                x = (x + 1.0) * (WIDTH / 2.0);
                y = (-y + 1.0) * (HEIGHT / 2.0);

                //x += 0.5;

                v_IntPosition = vec2(x, y) - u_Camera;
            }
        `;

        let fshader1Source = `#version 300 es
            precision highp float;

            #define WIDTH ${displayOptions.width}.0
            #define HEIGHT ${displayOptions.height}.0

            in vec2 v_IntPosition;

            uniform vec2 u_Center;
            uniform float u_Radius1;
            uniform float u_Radius2;
            uniform vec3 u_Color;
            uniform vec3 u_Color2;
            uniform int u_Fillp;
            uniform bool u_Solid;
            uniform int u_LongAxis;

            out vec4 FragColor;

            void main() {

                vec2 pos = v_IntPosition;
                pos.x = floor(pos.x);
                pos.y = floor(pos.y);

                float dxNormal = (u_Center.x - pos.x);
                float dyNormal = (u_Center.y - pos.y);

                float ratio = 1.0;
                float minR = min(u_Radius1, u_Radius2);
                float maxR = max(u_Radius1, u_Radius2);
                if (maxR > 0.0 && minR > 0.0) {
                    ratio = minR / maxR;
                }

                float dxScaled = dxNormal;
                float dyScaled = dyNormal;

                if (u_Radius1 > u_Radius2) {
                    dxScaled *= ratio;
                } else {
                    dyScaled *= ratio;
                }

                float maxDist = minR * minR;
                float dist2 = (dxScaled * dxScaled) + (dyScaled * dyScaled);

                FragColor = vec4(u_Color, 1.0);
                if (dist2 > maxDist + 0.01) {
                    FragColor.a = 0.0;
                }

                if (!u_Solid && minR >= 1.0) {
                    FragColor.a = 0.0;

                    if (dist2 <= maxDist) {

                        const float offsetX[4] = float[4](1.0, -1.0, 0.0, 0.0);
                        const float offsetY[4] = float[4](0.0, 0.0, 1.0, -1.0);

                        for (int i = 0; i < 4; i++) {
                            float ox = offsetX[i];
                            float oy = offsetY[i];

                            float _x = pos.x + ox;
                            float _y = pos.y + oy;

                            float _dx = (_x - u_Center.x);
                            float _dy = (_y - u_Center.y);

                            if (u_Radius1 > u_Radius2) {
                                _dx *= ratio;
                            } else {
                                _dy *= ratio;
                            }

                            float _d2 = (_dx * _dx) + (_dy * _dy);

                            if (_d2 > maxDist) {
                                FragColor.a = 1.0;
                                break;
                            }

                        }
                    }
                }

                int row = int(pos.y) % 4;
                int col = int(pos.x) % 4;
                row = 3 - row;

                bool bit = (((u_Fillp >> (row * 4)) & 0xF) & (8 >> col)) != 0;

                if (bit) {
                    if (u_Color2.x == -1.0 || u_Color2.y == -1.0 || u_Color2.z == -1.0) {
                        FragColor.a = 0.0;
                    } else {
                        FragColor.xyz = u_Color2;
                    }
                }



            }
        `;


        system.__ovalshader = new ShaderProgram(vshader1Source, fshader1Source, {
            attributes: ["a_Position"],
            uniforms: ["u_Camera", "u_Center", "u_Radius1", "u_Radius2", "u_Color", "u_Color2", "u_Fillp", "u_Solid"],

        });

        system.__ovalshaderBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, system.__ovalshaderBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);


    }






}

async function rectfill(x1, y1, x2, y2, color = system.color, color2 = system.color2) {
    __rectDraw(x1, y1, x2, y2, true, color, color2);
}

async function rect(x1, y1, x2, y2, color = system.color, color2 = system.color2) {
    __rectDraw(x1, y1, x2, y2, false, color, color2);
}


async function circfill(x, y, r = 4, color = system.color, color2 = system.color2) {
    __circleDraw(x, y, r, true, color, color2);
}

async function circ(x, y, r = 4, color = system.color, color2 = system.color2) {
    __circleDraw(x, y, r, false, color, color2);
}

async function ovalfill(x1, y1, x2, y2, color = system.color, color2 = system.color2) {
    __ovalDraw(x1, y1, x2, y2, true, color, color2);
}

async function oval(x1, y1, x2, y2, color = system.color, color2 = system.color2) {
    __ovalDraw(x1, y1, x2, y2, false, color, color2);
}

async function __ovalDraw(x1, y1, x2, y2, solid, color, color2) {
    let xCoords = [x1, x2];
    let yCoords = [y1, y2];
    x1 = Math.min(...xCoords);
    x2 = Math.max(...xCoords);
    y1 = Math.min(...yCoords);
    y2 = Math.max(...yCoords);

    let r1 = (x2 - x1) / 2;
    let r2 = (y2 - y1) / 2;

    let center = [(x1 + x2) / 2, (y1 + y2) / 2];


    if (color2 === null) {
        color2 = [-1, -1, -1];
    }

    const FSIZE = Float32Array.BYTES_PER_ELEMENT;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(system.__ovalshader.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, system.__ovalshaderBuffer);

    gl.vertexAttribPointer(system.__ovalshader.locations["a_Position"], 2, gl.FLOAT, false, 2 * FSIZE, 0);
    gl.enableVertexAttribArray(system.__ovalshader.locations["a_Position"]);

    gl.uniform2fv(system.__ovalshader.locations["u_Camera"], [system.__cameraX, system.__cameraY]);
    gl.uniform2fv(system.__ovalshader.locations["u_Center"], center);
    gl.uniform1f(system.__ovalshader.locations["u_Radius1"], r1);
    gl.uniform1f(system.__ovalshader.locations["u_Radius2"], r2);

    gl.uniform3fv(system.__ovalshader.locations["u_Color"], color);
    gl.uniform3fv(system.__ovalshader.locations["u_Color2"], color2);
    gl.uniform1f(system.__ovalshader.locations["u_Solid"], solid);
    gl.uniform1i(system.__ovalshader.locations["u_Fillp"], system.__fillp);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.disable(gl.BLEND);


}



async function __circleDraw(x, y, r, solid, color, color2) {
    if (color2 === null) {
        color2 = [-1, -1, -1];
    }

    const FSIZE = Float32Array.BYTES_PER_ELEMENT;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(system.__circshader.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, system.__circshaderBuffer);

    gl.vertexAttribPointer(system.__circshader.locations["a_Position"], 2, gl.FLOAT, false, 2 * FSIZE, 0);
    gl.enableVertexAttribArray(system.__circshader.locations["a_Position"]);

    gl.uniform2fv(system.__circshader.locations["u_Camera"], [system.__cameraX, system.__cameraY]);
    gl.uniform2fv(system.__circshader.locations["u_Center"], [x, y]);
    gl.uniform1f(system.__circshader.locations["u_Radius"], r);

    gl.uniform3fv(system.__circshader.locations["u_Color"], color);
    gl.uniform3fv(system.__circshader.locations["u_Color2"], color2);
    gl.uniform1f(system.__circshader.locations["u_Solid"], solid);
    gl.uniform1i(system.__circshader.locations["u_Fillp"], system.__fillp);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.disable(gl.BLEND);


}

async function __rectDraw(x1, y1, x2, y2, solid, color, color2) {
    if (color2 === null) {
        color2 = [-1, -1, -1];
    }

    const FSIZE = Float32Array.BYTES_PER_ELEMENT;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(system.__rectshader.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, system.__rectshaderBuffer);

    gl.vertexAttribPointer(system.__rectshader.locations["a_Index"], 1, gl.FLOAT, false, 1 * FSIZE, 0);
    gl.enableVertexAttribArray(system.__rectshader.locations["a_Index"]);

    gl.uniform4fv(system.__rectshader.locations["u_Rect"], [x1, y1, x2 + 1, y2 + 1]);
    gl.uniform2fv(system.__rectshader.locations["u_Camera"], [system.__cameraX, system.__cameraY]);
    gl.uniform3fv(system.__rectshader.locations["u_Color"], color);
    gl.uniform3fv(system.__rectshader.locations["u_Color2"], color2);

    gl.uniform1f(system.__rectshader.locations["u_Solid"], solid);
    gl.uniform1i(system.__rectshader.locations["u_Fillp"], system.__fillp);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.disable(gl.BLEND);

}

async function cls(color = [0, 0, 0]) {
    gl.clearColor(color[0], color[1], color[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

async function fillp(pattern = 0) {
    if (typeof pattern === "string") {
        pattern = parseInt(pattern, 2);
    }
    system.__fillp = pattern;
}

async function color(c1 = [1, 1, 1], c2 = null) {
    system.color = c1;
    system.color2 = c2;
}
