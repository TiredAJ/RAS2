/*
 * Notes
 * "ticks" refer to the number of iterations done by the "main" reader 
 * loop (unless specified otherwise),whether that's ReadColour() or 
 * SpecColourReader()
 */

//variables
let RunSpeed: number = 10
let Run_Logic: boolean = false
let Run_Motors: boolean = false
let Paused: boolean = false
let DEBUG_VIEW: boolean = false
let LastCol: number = 0
let Log: ColTracker = new ColTracker()
let Init: boolean = false
let Mode: RunMode = RunMode.SpecColour;

//sets the inital status, letting the user know the robot's ready to run
brick.showString("Sts: Ready!", 1);

//ensures the sensor is trying to read colours instead of intensity on startup
sensors.color3.setMode(ColorSensorMode.Color);

//start/stop toggle
sensors.touch1.onEvent(ButtonEvent.Pressed, function () {
    PrintToScreen("Sts: Starting...", 1)

    Paused = false;
    
    //toggles between running or printing
    if (!Run_Logic) {
        Run_Logic = true
        Run_Motors = true

        //checks if the robot's been initialised
        if (!Init) {      

            //updates the running mode to the screen
            PrintToScreen(`Mode: ${Mode}`, 5);

            //switches depending on the mode the user's chosen
            //so it either reads the raw colour (for debugging) or one 
            //of the 8 enumerated colours
            switch (Mode) {
                case RunMode.RawColour:
                    control.runInParallel(SpecColourReader)
                    break;
                case RunMode.SpecColour:
                    control.runInParallel(ReadColour)
                    break;
            }

            //runs the distance pauser and the motor drivers
            //in parallel to the main thread
            control.runInParallel(DistancePauser)
            control.runInParallel(Driver)

            Init = true;
        }
    }
    else {
        //toggles the run flags to false, stopping the threaded loops
        //on their next iteration.
        Run_Logic = false
        Run_Motors = false

        //sends a stop command to the motors to ensure the robot
        //comes to a stop
        motors.largeBC.stop()

        //waits briefly before pringting the decoded string
        control.waitMicros(500000);

        //prints the decoded morse string
        Print();
    }
})

//Main function for reading colours
function ReadColour(): void {
    //initialises the colour variables
    let LastCol: ColorSensorColor = sensors.color3.color()
    let CurCol: ColorSensorColor = sensors.color3.color()

    //this object stores details on each block, it stores the number
    //of ticks the colour has been read
    let CurColBlock: ColBlock = new ColBlock()

    while (Run_Logic) {
        //checks if the pause flag has been triggered, and if so, 
        //to wait until it's unpaused
        pauseUntil(() => !Paused);

        //prints the current status and the motor speed (percentage) of 
        //the robot
        PrintToScreen(`Sts: Running @ ${RunSpeed}% Spd`, 1)

        //checks if the robot's currently over an edge of the track.
        if (sensors.color3.color() == ColorSensorColor.Black || sensors.color3.color() == ColorSensorColor.Yellow)
        { EdgeDetected(CurCol, sensors.color3.color()); }

        //retrieves the current colour
        CurCol = sensors.color3.color()

        //prints the colour it's currently reading
        PrintToScreen(`Colour: ${ColToStr(CurCol)}`, 2)

        //checks if the colour has changed since the last iteration
        if (LastCol == CurCol) {
            //if the colour's the same, it increments the time
            CurColBlock.Amser++

            //if debug is toggled, it displays whether it's 
            //seeing the same colour...
            if (DEBUG_VIEW)
            { PrintToScreen("DEBUG::Same Col", 3) }
        }
        else {
            //if the colour has changed, the previous colour is 
            //stored in the block object and is pushed to the log
            CurColBlock.Colour = LastCol;

            Log.Add(CurColBlock)

            //a new colour block is made and assigned
            CurColBlock = new ColBlock()

            //last colour is switched to the new colour
            LastCol = CurCol

            //... or a different one
            if (DEBUG_VIEW) 
            { PrintToScreen("DEBUG::Diff Col", 3) }
        }
    }

    //Changes displays the change in status
    PrintToScreen("Sts: Stopping...", 1);
}

//this function reads the RGB values from the sensor and
//prints them to the screen
function SpecColourReader(){
    while (Run_Logic)
    {
        //stores the currently read colours
        let RCol = sensors.color3.rgbRaw()

        PrintToScreen(`R:${RCol[0]}, G:${RCol[1]}, B:${RCol[2]}`, 2) 
    }
}

//this detects the robot's distance from an obstacle infront of it
function DistancePauser(){

    //sets the sensor's mode to proximity sensing
    sensors.infrared4.setMode(InfraredSensorMode.Proximity)

    //displays to the user that it's checking distance
    if (DEBUG_VIEW)
    { PrintToScreen("Checking distance", 4) }

    while (Run_Logic) {
        //checks if there's an object within 20% proximity
        if (sensors.infrared4.proximity() < 20)
        {//if so, it triggers the pause flage and updates the display status            
            Paused = true; 
            PrintToScreen(`Sts: Paused`, 1)
        }
        else
        { Paused = false; }
    }
}

//Main driving function
function Driver(): void {
    while (Run_Motors)
    { motors.largeBC.run(RunSpeed); }
}

//Allows the user to increase the run speed by pressing the 
//up button
brick.buttonUp.onEvent(ButtonEvent.Pressed, function () 
{ RunSpeed += 2; })
//Allows the user to decrease the run speed by pressing the 
//down button
brick.buttonDown.onEvent(ButtonEvent.Pressed, function ()
{ RunSpeed -= 2; })

//toggles whether debug view is on or not
brick.buttonRight.onEvent(ButtonEvent.Pressed, function () 
{ 
    if (DEBUG_VIEW)
    { DEBUG_VIEW = false; }
    else
    { DEBUG_VIEW = true; }
})

//allows the user to change the run mode, only works prior 
//to initialisation
brick.buttonLeft.onEvent(ButtonEvent.Pressed, function () {
    if (Mode == RunMode.RawColour)
        Mode = RunMode.SpecColour
    else
        Mode = RunMode.RawColour

    PrintToScreen(`Mode: ${RunModeToStr(Mode)}`, 5);
})

