//Main object that holds each coloured block read, containing 
//how many ticks that colour's been read for
class ColBlock {
    constructor(_A: number = 1, _C: ColorSensorColor = 0) {
        this.Amser = _A;
        this.Colour = _C;
    }

    //named "Amser" because there were some issues calling iteration
    //"Time", although in hindsight it could've been called "ticks"
    Amser: number;
    Colour: ColorSensorColor;
}


class ColTracker {
    constructor() {
        this.Calibrated = false;
        //this.MTMap = JSON.parse(MorseTable);
    }

    Log: ColBlock[] = []
    Text: string
    MTMap = JSON.parse(MorseTable);
    private Calibrated: boolean = false

    UnitSize: number = 1
    private readonly Deviation: number = 5//%
    //private WordSpace: number = 0
    //private CharSpace: number = 0

    //adds the inputed code block to the log. It also checks if it's 
    //been calibrated, if not, it takes the ticks of the first block
    //as the UnitSize
    Add(_C: ColBlock) {

        if (!this.Calibrated && _C.Colour == ColorSensorColor.Red) { this.UnitSize = _C.Amser; this.Calibrated = true; }
        else if (!this.Calibrated) { return; } //skips the first white block before calibration block

        this.Log.push(_C);
    }

    //starts the analysis of the entire Log and returns the decoded
    //string
    Analyse(): string {
        let DecodedStr: string = ""
        let MorseStr: string = ""

        for (let CB of this.Log) {
            switch (CB.Colour) {
                case ColorSensorColor.White:
                    if (this.InDev(CB.Amser, this.CharSpace())) {
                        DecodedStr += this.GetChar(MorseStr)
                        MorseStr = ""
                    }
                    else if (this.InDev(CB.Amser, this.WordSpace())) {
                        DecodedStr += ` ${this.GetChar(MorseStr)}`
                        MorseStr = ""
                    }
                    break;
                case ColorSensorColor.Red:
                    MorseStr += this.MorseChar(CB.Amser)
                    break;
            }
        }

        return DecodedStr;
    }

    GetRawLog(): ColBlock[] { return this.Log; }

    private WordSpace(): number { return this.UnitSize * 7; }

    private CharSpace(): number { return this.UnitSize * 3; }

    private GetChar(_MS: string): string { return this.MTMap[_MS]; }

    private GetDev(_Val: number): number { return (_Val / 100) * this.Deviation; }

    //checks if _ReadTime is within Deviation of _Compare
    private InDev(_ReadTime: number, _Compare: number): boolean {
        if ((_ReadTime <= (_Compare + this.GetDev(_Compare))) && (_ReadTime >= (_Compare - this.GetDev(_Compare)))) { return true; }
        else { return false; }
    }

    //Checks if input is divisible by 1 * UniSize or 3 * UniSize (with deviation)
    private MorseChar(_Input: number): string {
        if
            (_Input % this.UnitSize == 1 || ((_Input + this.GetDev(_Input)) + (_Input - this.GetDev(_Input))) < 2) { return "."; }
        else if
            ((_Input % (3 * this.UnitSize) == 1) || ((_Input + this.GetDev(_Input)) + (_Input - this.GetDev(_Input))) < 2) { return "-"; }
        else { throw "Timing is off"; }
    }
}

//converts the ColorSensorColor enum to a string
function ColToStr(_Col: ColorSensorColor): string {
    let S = ""

    switch (_Col) {
        case ColorSensorColor.Black:
            S = "Black"
            break;
        case ColorSensorColor.Blue:
            S = "Blue"
            break;
        case ColorSensorColor.Brown:
            S = "Brown"
            break;
        case ColorSensorColor.Green:
            S = "Green"
            break;
        case ColorSensorColor.Red:
            S = "Red"
            break;
        case ColorSensorColor.White:
            S = "White"
            break;
        case ColorSensorColor.Yellow:
            S = "Yellow"
            break;
        case ColorSensorColor.None:
            S = "None"
            break;
        default:
            S = "Default"
            break;
    }

    return S;
}

//converst RunMode enum to a string
function RunModeToStr(_Mode: RunMode) {
    let S = ""

    switch (_Mode) {
        case RunMode.SpecColour:
            S = "SpecCol"
            break;
        case RunMode.RawColour:
            S = "RawCol"
            break;
        default:
            S = "Default"
            break;
    }

    return S;
}

//Prints the stored values to the log
function Print() {
    brick.clearScreen()
    brick.showString("Status: Printing...", 1);

    PrintToScreen("Message:", 2)
    PrintToScreen(Log.Analyse(), 3);
}

//Prints a message to the screen without blocking the main thread
function PrintToScreen(_Msg: string, _Line: number) {
    control.runInParallel(function () {

        //ensures the line is overwritten without the use of brick.clearScreen()
        //which causes flickering
        _Msg.concat("                      ".substr(22 - _Msg.length))

        brick.showString(_Msg, _Line);
    })
}

//When the robot detects one of the edge guidelines
function EdgeDetected(_CurCol: ColorSensorColor, _EdgeCol: ColorSensorColor) {

}

//enum for the two different run modes
enum RunMode {
    RawColour,
    SpecColour
}

//the json representation of the morsecode binary tree, implemented as a lookup 
//table as it's contents shouldn't change
let MorseTable = `
{
    "-": "T",
    ".": "E",
	"..": "I",
	".-": "A",
	"--": "M",
	"-.": "N",
	"...": "S",
	"..-": "U",
	".-.": "R",
	".--": "W",
	"---": "O",
	"--.": "G",
	"-.-": "K",
	"-..": "D",
	"....": "H",
	"...-": "V",
	"..-.": "F",
	"..--": "Ü",
	".-..": "L",
	".-.-": "Ä",
	".--.": "P",
	".---": "J",
	"----": "Ch",
	"---.": "Ó",
	"--.-": "Q",
	"--..": "Z",
	"-.--": "Y",
	"-.-.": "C",
	"-..-": "X",
	"-...": "B",
	".....": "5",
	"....-": "4",
	"...-.": "Ŝ",
	"...--": "3",
	"..-..": "É",
	"..--.": "Ð",
	"..---": "2",
	".-...": "&",
	".-..-": "È",
	".-.-.": "+/EOM",
	".--..": "Þ",
	".--.-": "À",
	".---.": "Ĵ",
	".----": "1",
	"-----": "0",
	"----.": "9",
	"---..": "8",
	"--.--": "Ń",
	"--.-.": "Ĝ",
	"--..-": "Ż",
	"--...": "7",
	"-.--.": "(",
	"-.-..": "Ć",
	"-..-.": "/",
	"-...-": "=",
	"-....": "6",
	"-.-.--": "!",
	"..--..": "?",
	".-..-.": "\"",
	".-.-.-": ".",
	".--.-.": "@",
	".----.": "'",
	"---...": ":",
	"--..--": ",",
	"--..-.": "Ź",
	"-.--.-": ")",
	"-....-": "-",
	"...-...": "Ś",
	"........": "ERROR"
}
`