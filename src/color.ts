export module color
{
    export const phi = 1.618033988749895;

    export interface Rgb
    {
        r : number; // min:0.0, max:1.0
        g : number; // min:0.0, max:1.0
        b : number; // min:0.0, max:1.0
    }
    //	※座標空間的に RGB 色空間立方体の座標として捉えるので、本来であれば円筒形あるいは双円錐形の座標となる HLS (および HSV とも)厳密には異なるが、ここでは便宜上 HLS と呼称する。
    export interface Hsl
    {
        h : number; // min:-Math.PI, max:Math.PI
        s : number; // min:0.0, max:Math,Pow(calcSaturation({r:1.0, g:0.0, b:0.0}), 2) === 2.0/3.0
        l : number; // min:0.0, max:1.0
    }
    export const HslHMin = -Math.PI;
    export const HslHMax = Math.PI;
    export const HslSMin = 0.0;
    export const HslSMax = 2.0 / 3.0;
    export const HslLMin = 0.0;
    export const HslLMax = 1.0;
    export const rLumaRate = 0.299;
    export const gLumaRate = 0.587;
    export const bLumaRate = 0.114;

    interface Point3d
    {
        x : number;
        y : number;
        z : number;
    }
    export const rgbForStyle = function(expression: Rgb)
    {
        const toHex = (i : number) : string => {
            let result = ((255 *i) ^ 0).toString(16).toUpperCase();
            if (1 === result.length) {
                result = "0" +result;
            }
            return result;
        };
        return "#"
                +toHex(expression.r)
                +toHex(expression.g)
                +toHex(expression.b)
        ;
    };
    export const rgbFromStyle = function(style : string) : Rgb
    {
        let r = 0.0;
        let g = 0.0;
        let b = 0.0;
        while("#" === style.substr(0,1))
        {
            style = style.substr(1);
        }
        if (3 === style.length)
        {
            r = (parseInt(style.substr(0,1), 16) *0x11) /255.0;
            g = (parseInt(style.substr(1,1), 16) *0x11) /255.0;
            b = (parseInt(style.substr(2,1), 16) *0x11) /255.0;
        }
        if (6 === style.length)
        {
            r = parseInt(style.substr(0,2), 16) /255.0;
            g = parseInt(style.substr(2,2), 16) /255.0;
            b = parseInt(style.substr(4,2), 16) /255.0;
        }
        return {r, g, b};
    };
    export const xyzToLength = (xyz : Point3d) : number => Math.sqrt(Math.pow(xyz.x, 2) +Math.pow(xyz.y, 2) +Math.pow(xyz.z, 2));
    export const rgbToXyz = (expression : Rgb) : Point3d => ({x:expression.r, y:expression.g, z:expression.b});
    export const rgbToHue = (expression : Rgb) => {
        const hueXy = {
            x: expression.r -((expression.g /2) +(expression.b /2)),
            y: Math.sqrt(Math.pow(expression.g, 2) -Math.pow(expression.g /2, 2))
                -Math.sqrt(Math.pow(expression.b, 2) -Math.pow(expression.b /2, 2))
        };
        return Math.atan2(hueXy.y, hueXy.x);
    };
    export const rgbToLuma = (expression : Rgb) : number => (expression.r *rLumaRate) +(expression.g *gLumaRate) +(expression.b *bLumaRate);
    export const rgbToLightness = (expression : Rgb) : number => (expression.r +expression.g +expression.b) /3.0;
    export const calcSaturation = (expression : Rgb) : number => {
        const lightness = rgbToLightness(expression);
        return xyzToLength({x:expression.r -lightness, y:expression.g -lightness, z:expression.b -lightness});
    };
    export const rgbToSaturation = (expression : Rgb) : number => calcSaturation(expression) *calcSaturation({r:1.0, g:0.0, b:0.0});
    export const rgbToHsl = (expression : Rgb) : Hsl =>
    (
        {
            h: rgbToHue(expression),
            s: rgbToSaturation(expression),
            l: rgbToLightness(expression)
        }
    );
    export const hslToRgbElement = (expression : Hsl, Angle : number) : number => expression.l +expression.s *Math.cos(expression.h -(Math.PI *2) /3.0 *Angle);
    export const hslToRgb = (expression : Hsl) : Rgb =>
    (
        {
            r:hslToRgbElement(expression, 0.0),
            g:hslToRgbElement(expression, 1.0),
            b:hslToRgbElement(expression, 2.0)
        }
        );
    export const regulateHue = (expression : Hsl) : Hsl =>
    {
        let h = expression.h;
        while(h < -Math.PI)
        {
            h += Math.PI *2;
        }
        while(Math.PI < h)
        {
            h -= Math.PI *2;
        }
        const result =
        {
            h: h,
            s: expression.s,
            l: expression.l,
        };
        return result;
    };
    export const clipLightness = (expression : Hsl) : Hsl =>
    (
        {
            h: expression.h,
            s: expression.s,
            l: Math.max(0.0, Math.min(1.0, expression.l)),
        }
    );
    export const clipSaturation = (expression : Hsl) : Hsl =>
    {
        const rgb = hslToRgb(expression);
        const overRate = Math.max
        (
            (rgb.r < 0.0) ? (expression.l -rgb.r) / expression.l:
            (1.0 < rgb.r) ? (rgb.r -expression.l) / (1.0 -expression.l):
            1.0,

            (rgb.g < 0.0) ? (expression.l -rgb.g) / expression.l:
            (1.0 < rgb.g) ? (rgb.g -expression.l) / (1.0 -expression.l):
            1.0,

            (rgb.b < 0.0) ? (expression.l -rgb.b) / expression.l:
            (1.0 < rgb.b) ? (rgb.b -expression.l) / (1.0 -expression.l):
            1.0,
        );
        const result =
        {
            h: expression.h,
            s: expression.s / overRate,
            l: expression.l,
        };
        return result;
    };
    export const regulateHsl = (expression : Hsl) : Hsl => clipSaturation(clipLightness(regulateHue(expression)));
    export const clipRgb = (expression : Rgb) : Rgb =>
    (
        {
            r: Math.max(0.0, Math.min(1.0, expression.r)),
            g: Math.max(0.0, Math.min(1.0, expression.g)),
            b: Math.max(0.0, Math.min(1.0, expression.b)),
        }
    );

    /*
    export const test = () =>
    {
        console.log("rgbToHsl({r:0.0,g:0.0,b:0.0})", rgbToHsl({r:0.0,g:0.0,b:0.0}));
        console.log("rgbToHsl({r:1.0,g:0.0,b:0.0})", rgbToHsl({r:1.0,g:0.0,b:0.0}));
        console.log("rgbToHsl({r:0.0,g:1.0,b:0.0})", rgbToHsl({r:0.0,g:1.0,b:0.0}));
        console.log("rgbToHsl({r:0.0,g:0.0,b:1.0})", rgbToHsl({r:0.0,g:0.0,b:1.0}));
        console.log("rgbToHsl({r:1.0,g:1.0,b:0.0})", rgbToHsl({r:1.0,g:1.0,b:0.0}));
        console.log("rgbToHsl({r:1.0,g:1.0,b:1.0})", rgbToHsl({r:1.0,g:1.0,b:1.0}));
        console.log("rgbToHsl({r:0.5,g:0.5,b:0.5})", rgbToHsl({r:0.5,g:0.5,b:0.5}));
        console.log("rgbToHsl({r:0.1,g:0.0,b:0.0})", rgbToHsl({r:0.1,g:0.0,b:0.0}));
        console.log("rgbToHsl({r:0.1,g:0.1,b:0.0})", rgbToHsl({r:0.1,g:0.1,b:0.0}));
        console.log("rgbToHsl({r:0.9,g:0.0,b:0.0})", rgbToHsl({r:0.9,g:0.0,b:0.0}));
        console.log("rgbToHsl({r:0.9,g:0.9,b:0.0})", rgbToHsl({r:0.9,g:0.9,b:0.0}));
        console.log("hslToRgb(rgbToHsl({r:0.0,g:0.0,b:0.0}))", hslToRgb(rgbToHsl({r:0.0,g:0.0,b:0.0})));
        console.log("hslToRgb(rgbToHsl({r:1.0,g:0.0,b:0.0}))", hslToRgb(rgbToHsl({r:1.0,g:0.0,b:0.0})));
        console.log("hslToRgb(rgbToHsl({r:0.0,g:1.0,b:0.0}))", hslToRgb(rgbToHsl({r:0.0,g:1.0,b:0.0})));
        console.log("hslToRgb(rgbToHsl({r:0.0,g:0.0,b:1.0}))", hslToRgb(rgbToHsl({r:0.0,g:0.0,b:1.0})));
        console.log("hslToRgb(rgbToHsl({r:1.0,g:1.0,b:0.0}))", hslToRgb(rgbToHsl({r:1.0,g:1.0,b:0.0})));
        console.log("hslToRgb(rgbToHsl({r:1.0,g:1.0,b:1.0}))", hslToRgb(rgbToHsl({r:1.0,g:1.0,b:1.0})));
        console.log("hslToRgb(rgbToHsl({r:0.5,g:0.5,b:0.5}))", hslToRgb(rgbToHsl({r:0.5,g:0.5,b:0.5})));
        console.log("hslToRgb(rgbToHsl({r:0.1,g:0.0,b:0.0}))", hslToRgb(rgbToHsl({r:0.1,g:0.0,b:0.0})));
        console.log("hslToRgb(rgbToHsl({r:0.1,g:0.1,b:0.0}))", hslToRgb(rgbToHsl({r:0.1,g:0.1,b:0.0})));
        console.log("hslToRgb(rgbToHsl({r:0.9,g:0.0,b:0.0}))", hslToRgb(rgbToHsl({r:0.9,g:0.0,b:0.0})));
        console.log("hslToRgb(rgbToHsl({r:0.9,g:0.9,b:0.0}))", hslToRgb(rgbToHsl({r:0.9,g:0.9,b:0.0})));
    };
    test();
    //*/
}
