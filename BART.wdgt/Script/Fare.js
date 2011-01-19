//-----------------------------------------------------------------------------
//  Fare.js is part of the BART dashboard widget.       (c) 2008 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//-----------------------------------------------------------------------------
//
//  Automatically generated by make_fare.pl on Wed Jan 19 10:52:09 2011.
//
//  cents = Fare.getCentsBetween("Del Norte", "Castro Valley")
//

function Fare () {

    var fares = [ 520, 325, 175, 335, 175, 370, 260, 175, 300, 310, 175, 380, 365, 380, 230, 400, 310, 400, 175, 360, 300, 275, 175, 175, 450, 310, 175, 385, 220, 430, 205, 330, 310, 260, 175, 840, 420, 225, 325, 395, 370, 315, 385, 175, 325, 520, 325, 175, 365, 175, 435, 375, 460, 175, 390, 310, 535, 275, 415, 560, 175, 565, 365, 175, 465, 450, 325, 345, 415, 175, 380, 555, 415, 600, 395, 500, 175, 430, 365, 805, 375, 415, 490, 340, 535, 485, 545, 310, 175, 325, 520, 335, 175, 370, 260, 175, 300, 310, 175, 380, 365, 380, 230, 400, 310, 400, 175, 360, 300, 275, 175, 175, 450, 310, 175, 385, 220, 430, 205, 330, 310, 260, 175, 840, 420, 225, 325, 395, 370, 315, 385, 175, 335, 175, 335, 520, 370, 175, 440, 380, 465, 175, 395, 300, 540, 275, 415, 565, 175, 570, 375, 175, 470, 455, 335, 355, 410, 175, 385, 560, 420, 605, 400, 505, 175, 435, 375, 795, 365, 420, 495, 330, 540, 490, 550, 320, 175, 365, 175, 370, 520, 390, 295, 175, 320, 350, 220, 400, 365, 400, 175, 420, 350, 420, 190, 385, 320, 265, 175, 175, 470, 350, 175, 380, 210, 430, 175, 325, 350, 175, 175, 860, 440, 265, 345, 415, 390, 310, 405, 175, 370, 175, 370, 175, 390, 520, 460, 400, 485, 175, 415, 290, 560, 275, 435, 585, 175, 590, 395, 175, 490, 475, 370, 380, 375, 175, 405, 580, 440, 625, 420, 520, 175, 455, 390, 760, 330, 440, 515, 290, 560, 510, 570, 355, 260, 435, 260, 440, 295, 460, 520, 305, 175, 430, 175, 470, 445, 475, 340, 175, 430, 175, 220, 455, 175, 365, 260, 275, 540, 430, 305, 465, 330, 510, 325, 410, 430, 360, 280, 930, 510, 175, 175, 490, 175, 395, 175, 275, 175, 375, 175, 380, 175, 400, 305, 520, 330, 365, 235, 410, 370, 410, 175, 430, 365, 430, 205, 395, 325, 280, 175, 175, 480, 365, 175, 385, 225, 435, 175, 330, 365, 175, 175, 865, 450, 280, 355, 425, 400, 315, 415, 180, 300, 460, 300, 465, 320, 485, 175, 330, 520, 455, 230, 495, 470, 500, 365, 175, 455, 340, 260, 480, 175, 390, 300, 310, 565, 455, 330, 490, 355, 535, 350, 435, 455, 385, 310, 955, 535, 175, 235, 515, 300, 420, 175, 310, 310, 175, 310, 175, 350, 175, 430, 365, 455, 520, 380, 325, 530, 295, 405, 555, 175, 560, 350, 175, 455, 445, 310, 330, 425, 175, 370, 545, 410, 595, 390, 490, 175, 425, 350, 810, 390, 410, 485, 355, 525, 475, 540, 290, 175, 390, 175, 395, 220, 415, 175, 235, 230, 380, 520, 425, 400, 425, 290, 360, 380, 360, 175, 405, 230, 315, 175, 200, 495, 380, 245, 415, 280, 465, 275, 360, 380, 310, 205, 880, 465, 175, 270, 440, 330, 350, 345, 195, 380, 310, 380, 300, 400, 290, 470, 410, 495, 325, 425, 520, 570, 290, 445, 595, 325, 600, 405, 290, 495, 485, 380, 390, 335, 325, 415, 585, 450, 635, 430, 530, 325, 465, 400, 720, 290, 450, 525, 290, 565, 520, 580, 375, 365, 535, 365, 540, 365, 560, 445, 370, 470, 530, 400, 570, 520, 570, 405, 570, 530, 575, 380, 555, 470, 175, 365, 365, 640, 530, 375, 175, 175, 175, 390, 175, 530, 425, 350, 1025, 610, 425, 500, 585, 545, 175, 555, 380, 380, 275, 380, 275, 400, 275, 475, 410, 500, 295, 425, 290, 570, 520, 450, 600, 295, 600, 410, 275, 500, 490, 380, 390, 355, 295, 415, 590, 455, 635, 435, 535, 295, 465, 405, 740, 290, 450, 525, 290, 570, 520, 585, 375, 230, 415, 230, 415, 175, 435, 340, 175, 365, 405, 290, 445, 405, 450, 520, 465, 405, 465, 270, 430, 365, 325, 230, 210, 515, 405, 175, 425, 290, 470, 175, 370, 405, 175, 215, 905, 485, 320, 390, 460, 435, 355, 450, 245, 400, 560, 400, 565, 420, 585, 175, 430, 175, 555, 360, 595, 570, 600, 465, 520, 555, 435, 375, 580, 335, 490, 400, 410, 665, 555, 430, 590, 455, 635, 450, 535, 555, 485, 410, 1055, 635, 330, 365, 615, 405, 520, 175, 410, 310, 175, 310, 175, 350, 175, 430, 365, 455, 175, 380, 325, 530, 295, 405, 555, 520, 560, 350, 175, 455, 445, 310, 330, 425, 175, 370, 545, 410, 595, 390, 490, 175, 425, 350, 810, 390, 410, 485, 355, 525, 475, 540, 290, 400, 565, 400, 570, 420, 590, 175, 430, 340, 560, 360, 600, 575, 600, 465, 435, 560, 520, 375, 585, 175, 490, 400, 410, 670, 560, 435, 590, 455, 640, 450, 535, 560, 485, 410, 1055, 640, 335, 175, 615, 175, 525, 420, 410, 175, 365, 175, 375, 190, 395, 220, 205, 260, 350, 175, 405, 380, 410, 270, 375, 350, 375, 520, 390, 260, 300, 175, 175, 475, 350, 220, 400, 250, 445, 245, 345, 350, 290, 180, 865, 445, 175, 300, 420, 345, 330, 360, 175, 360, 175, 360, 175, 385, 175, 455, 395, 480, 175, 405, 290, 555, 275, 430, 580, 175, 585, 390, 520, 480, 470, 360, 375, 390, 175, 400, 570, 435, 620, 415, 515, 175, 450, 385, 770, 340, 435, 510, 305, 550, 500, 565, 340, 300, 465, 300, 470, 320, 490, 175, 325, 175, 455, 230, 495, 470, 500, 365, 335, 455, 175, 260, 480, 520, 390, 300, 310, 565, 455, 335, 490, 355, 535, 350, 435, 455, 385, 310, 955, 535, 175, 175, 515, 175, 420, 320, 310, 275, 450, 275, 455, 265, 475, 365, 280, 390, 445, 315, 485, 175, 490, 325, 490, 445, 490, 300, 470, 390, 520, 275, 260, 555, 445, 290, 275, 175, 335, 305, 175, 445, 340, 240, 945, 525, 345, 415, 500, 460, 175, 475, 295, 175, 325, 175, 335, 175, 370, 260, 175, 300, 310, 175, 380, 365, 380, 230, 400, 310, 400, 175, 360, 300, 275, 520, 175, 450, 310, 175, 385, 220, 430, 205, 330, 310, 260, 175, 840, 420, 225, 325, 395, 370, 315, 385, 175, 175, 345, 175, 355, 175, 380, 275, 175, 310, 330, 200, 390, 365, 390, 210, 410, 330, 410, 175, 375, 310, 260, 175, 520, 460, 330, 175, 380, 175, 430, 185, 325, 330, 240, 175, 845, 430, 245, 335, 405, 380, 310, 395, 175, 450, 415, 450, 410, 470, 375, 540, 480, 565, 425, 495, 335, 640, 355, 515, 665, 425, 670, 475, 390, 565, 555, 450, 460, 520, 425, 485, 655, 520, 705, 500, 600, 425, 535, 470, 400, 290, 520, 595, 290, 635, 590, 650, 445, 310, 175, 310, 175, 350, 175, 430, 365, 455, 175, 380, 325, 530, 295, 405, 555, 175, 560, 350, 175, 455, 445, 310, 330, 425, 520, 370, 545, 410, 595, 390, 490, 175, 425, 350, 810, 390, 410, 485, 355, 525, 475, 540, 290, 175, 380, 175, 385, 175, 405, 305, 175, 330, 370, 245, 415, 375, 415, 175, 430, 370, 435, 220, 400, 335, 290, 175, 175, 485, 370, 520, 390, 235, 440, 175, 335, 370, 175, 175, 870, 455, 285, 360, 430, 405, 325, 415, 195, 385, 555, 385, 560, 380, 580, 465, 385, 490, 545, 415, 585, 175, 590, 425, 590, 545, 590, 400, 570, 490, 275, 385, 380, 655, 545, 390, 520, 320, 175, 410, 175, 545, 440, 370, 1045, 625, 445, 515, 605, 560, 175, 575, 400, 220, 415, 220, 420, 210, 440, 330, 225, 355, 410, 280, 450, 175, 455, 290, 455, 410, 455, 250, 435, 355, 175, 220, 175, 520, 410, 235, 320, 520, 365, 265, 175, 410, 305, 175, 910, 490, 310, 380, 470, 425, 175, 440, 240, 430, 600, 430, 605, 430, 625, 510, 435, 535, 595, 465, 635, 175, 635, 470, 635, 595, 640, 445, 620, 535, 335, 430, 430, 705, 595, 440, 175, 365, 520, 455, 175, 595, 490, 415, 1090, 675, 490, 565, 650, 610, 175, 620, 445, 205, 395, 205, 400, 175, 420, 325, 175, 350, 390, 275, 430, 390, 435, 175, 450, 390, 450, 245, 415, 350, 305, 205, 185, 500, 390, 175, 410, 265, 455, 520, 355, 390, 175, 190, 890, 470, 300, 375, 445, 420, 340, 435, 220, 330, 500, 330, 505, 325, 520, 410, 330, 435, 490, 360, 530, 175, 535, 370, 535, 490, 535, 345, 515, 435, 175, 330, 325, 600, 490, 335, 175, 175, 175, 355, 520, 490, 390, 310, 990, 570, 390, 460, 550, 505, 175, 520, 345, 310, 175, 310, 175, 350, 175, 430, 365, 455, 175, 380, 325, 530, 295, 405, 555, 175, 560, 350, 175, 455, 445, 310, 330, 425, 175, 370, 545, 410, 595, 390, 490, 520, 425, 350, 810, 390, 410, 485, 355, 525, 475, 540, 290, 260, 430, 260, 435, 175, 455, 360, 175, 385, 425, 310, 465, 425, 465, 175, 485, 425, 485, 290, 450, 385, 340, 260, 240, 535, 425, 175, 440, 305, 490, 175, 390, 425, 520, 245, 925, 505, 335, 410, 480, 455, 370, 470, 275, 175, 365, 175, 375, 175, 390, 280, 175, 310, 350, 205, 400, 350, 405, 215, 410, 350, 410, 180, 385, 310, 240, 175, 175, 470, 350, 175, 370, 175, 415, 190, 310, 350, 245, 520, 860, 440, 250, 335, 420, 380, 290, 395, 175, 840, 805, 840, 795, 860, 760, 930, 865, 955, 810, 880, 720, 1025, 740, 905, 1055, 810, 1055, 865, 770, 955, 945, 840, 845, 400, 810, 870, 1045, 910, 1090, 890, 990, 810, 925, 860, 520, 690, 905, 980, 690, 1025, 975, 1040, 830, 420, 375, 420, 365, 440, 330, 510, 450, 535, 390, 465, 290, 610, 290, 485, 635, 390, 640, 445, 340, 535, 525, 420, 430, 290, 390, 455, 625, 490, 675, 470, 570, 390, 505, 440, 690, 520, 490, 565, 290, 605, 560, 620, 415, 225, 415, 225, 420, 265, 440, 175, 280, 175, 410, 175, 450, 425, 450, 320, 330, 410, 335, 175, 435, 175, 345, 225, 245, 520, 410, 285, 445, 310, 490, 300, 390, 410, 335, 250, 905, 490, 520, 230, 465, 295, 375, 320, 240, 325, 490, 325, 495, 345, 515, 175, 355, 235, 485, 270, 525, 500, 525, 390, 365, 485, 175, 300, 510, 175, 415, 325, 335, 595, 485, 360, 515, 380, 565, 375, 460, 485, 410, 335, 980, 565, 230, 520, 540, 175, 450, 350, 335, 395, 340, 395, 330, 415, 290, 490, 425, 515, 355, 440, 290, 585, 290, 460, 615, 355, 615, 420, 305, 515, 500, 395, 405, 290, 355, 430, 605, 470, 650, 445, 550, 355, 480, 420, 690, 290, 465, 540, 520, 585, 535, 600, 390, 370, 535, 370, 540, 390, 560, 175, 400, 300, 525, 330, 565, 545, 570, 435, 405, 525, 175, 345, 550, 175, 460, 370, 380, 635, 525, 405, 560, 425, 610, 420, 505, 525, 455, 380, 1025, 605, 295, 175, 585, 520, 495, 390, 380, 315, 485, 315, 490, 310, 510, 395, 315, 420, 475, 350, 520, 175, 520, 355, 520, 475, 525, 330, 500, 420, 175, 315, 310, 590, 475, 325, 175, 175, 175, 340, 175, 475, 370, 290, 975, 560, 375, 450, 535, 495, 520, 505, 330, 385, 545, 385, 550, 405, 570, 175, 415, 175, 540, 345, 580, 555, 585, 450, 175, 540, 420, 360, 565, 320, 475, 385, 395, 650, 540, 415, 575, 440, 620, 435, 520, 540, 470, 395, 1040, 620, 320, 350, 600, 390, 505, 520, 395, 175, 310, 175, 320, 175, 355, 275, 180, 310, 290, 195, 375, 380, 375, 245, 410, 290, 410, 175, 340, 310, 295, 175, 175, 445, 290, 195, 400, 240, 445, 220, 345, 290, 275, 175, 830, 415, 240, 335, 390, 380, 330, 395, 520 ];
    
    var station_names = [ "12th St", "16th St", "19th St", "24th St", "Ashby", "Balboa Park", "Bay Fair", "Berkeley", "Castro Valley", "Civic Center", "Coliseum", "Colma", "Concord", "Daly City", "Del Norte", "Dublin", "Embarcadero", "Fremont", "Fruitvale", "Glen Park", "Hayward", "Lafayette", "Lake Merritt", "MacArthur", "Millbrae", "Montgomery", "North Berkeley", "North Concord", "Orinda", "Pittsburg", "Plaza", "Pleasant Hill", "Powell", "Richmond", "Rockridge", "SFO", "San Bruno", "San Leandro", "South Hayward", "South SF", "Union City", "Walnut Creek", "West Dublin", "West Oakland" ];

    var station_indexes = {}
    for (var i=0; i < station_names.length; i++) {
        station_indexes[ station_names[i] ] = i
    }
    
    Fare.getCentsBetween = function (start_name, end_name) {
        var start_index = station_indexes[start_name]
        var end_index   = station_indexes[end_name]
        return fares[ start_index * 44 + end_index ]
    }
}

// Open the package.
Fare();

