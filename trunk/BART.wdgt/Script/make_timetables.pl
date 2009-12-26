#! /usr/bin/perl -w
#---------------------------------------------------------------------------------
#  make_timetables.pl is part of the BART dashboard widget.  (c) 2005 Bret Victor
#  This software is licensed under the terms of the open source MIT license.
#---------------------------------------------------------------------------------
#
#  perl make_timetables.pl > Timetables.js
#
#  Downloads the line schedules from bart.gov and generates a JavaScript
#  timetable on stdout.  This becomes the Timetables.js file.
# 

use strict;

#-----------------------------------------------------------------
#  Tables

my $starting_hour = 4;      # 4:00 am is the origin.

my %line_names = (
    yellow_millbrae  => '1',
    yellow_pittsburg => '2',
    orange_richmond  => '3',
    orange_fremont   => '4',
    green_dalycity   => '5',
    green_fremont    => '6',
    red_millbrae     => '7',
    red_richmond     => '8',
    blue_dalycity    => '11',
    blue_dublin      => '12',
);

my %day_names = (
    weekday  => '12/18/2009',
    saturday => '12/19/2009',
    sunday   => '12/20/2009',
);

my %station_names = (

    MLBR => "Millbrae",
    SFIA => "SFO",
    SBRN => "San Bruno",
    SSAN => "South SF",
    COLM => "Colma",
    
    DALY => "Daly City",
    BALB => "Balboa Park",
    
    WOAK => "West Oakland",
    EMBR => "Embarcadero", 
    MONT => "Montgomery", 
    POWL => "Powell", 
    CIVC => "Civic Center",
    '16TH' => "16th St",
    '24TH' => "24th St",

    PITT => "Pittsburg", 
    NCON => "North Concord",
    CONC => "Concord", 
    PHIL => "Pleasant Hill",
    WCRK => "Walnut Creek",
    LAFY => "Lafayette", 
    ORIN => "Orinda", 
    ROCK => "Rockridge", 
    MCAR => "MacArthur",
    '12TH' => "12th St",
    '19TH' => "19th St",
    
    HAYW => "Hayward", 
    SHAY => "South Hayward",
    UCTY => "Union City",
    FRMT => "Fremont",

    LAKE => "Lake Merritt", 
    FTVL => "Fruitvale", 
    COLS => "Coliseum",
    SANL => "San Leandro",
    BAYF => "Bay Fair",
    
    RICH => "Richmond", 
    DELN => "Del Norte", 
    PLZA => "Plaza", 
    NBRK => "North Berkeley",
    DBRK => "Berkeley", 
    ASHB => "Ashby",
    
    GLEN => "Glen Park",
    CAST => "Castro Valley",
    DUBL => "Dublin",
);


#-----------------------------------------------------------------
#  Main code

print getHeader();
print "timetables = {};\n";
print "timetables.starting_hour = $starting_hour;\n";

for my $line_name (sort keys %line_names) {
    print "\ntimetables.$line_name = {};\n";
    for my $day_name (sort keys %day_names) {
        next if $day_name eq 'sunday' and not runsOnSunday($line_name);
        my $js_array_name = "timetables.$line_name.$day_name";
        print STDERR "Generating $js_array_name...\n";
        print "$js_array_name = {};\n";
        my $url = makeBartUrl($line_name, $day_name);
        my $html = getFromUrl($url);
        my $js = translateHtml($html,$js_array_name);
        print $js;
    }
}
print getFooter();
exit();


#-----------------------------------------------------------------
#  Main subroutines

sub makeBartUrl {
    my ($line_name, $day_name) = @_;
    my ($srcdst, $daycode) = ($line_names{$line_name}, $day_names{$day_name});
    return "http://www.bart.gov/schedules/bylineresults.aspx?route=${srcdst}&date=${daycode}"
}

sub getFromUrl {
    my ($url) = @_;
    # I'd rather use LWP, but I can't get CPAN to work.
    # return `wget --quiet -O - $url`;
    return `curl --silent '$url'`;
}

sub translateHtml {
    my ($html,$js_array_name) = @_;
    my ($station_timetables, $bike_boundaries) = parseHtml($html);
    my $text = translateStationTimetables($station_timetables, $js_array_name);
    $text .=   translateBikeBoundaries($bike_boundaries, $js_array_name);
    return $text;
}


#-----------------------------------------------------------------
#  Bart HTML input parsing

sub parseHtml {
    my ($html) = @_;
    my $station_timetables = {};
    my $bike_boundaries = [];
    
    my $first_no_bikes_station;
    my $last_no_bikes_station;
    
    my $checkForBikeBoundary = sub {
        my ($no_bikes, $station) = @_;
        if ($no_bikes =~ /shaded/) {
            $first_no_bikes_station ||= $station;
            $last_no_bikes_station = $station;
        }
        else {
            return unless $first_no_bikes_station;
            my $train_index = @{$station_timetables->{$first_no_bikes_station}} - 1;
            $bike_boundaries->[$train_index] = [ $first_no_bikes_station, $last_no_bikes_station ];
            $first_no_bikes_station = undef;
        }
    };

    my $addStop = sub {
        my ($station, $hour, $min, $must_be_pm) = @_;
        $station_timetables->{$station} ||= [];
        push(@{$station_timetables->{$station}}, [ $hour, $min, $must_be_pm ]);
    };
    
    my $must_be_pm = 0;
    # Jump ahead to avoid matching some earlier tables.
    $html =~ m{<p class="bike-hours">}g;
    while ($html =~ m{<td class="(.*?)" headers="id(\w+)" style=".*?">\s*(.*?)\s*?</td>}gs) {
        my ($no_bikes, $station, $time) = ($1, $2, $3);
        my ($hour, $min) = (-1, -1);
        if ($time =~ /(\d+):(\d+)/) {
            ($hour, $min) = ($1, $2);
            if ($hour == 2) { $must_be_pm = 1; }
        }
        $addStop->($station, $hour, $min, $must_be_pm);
        $checkForBikeBoundary->($no_bikes, $station);
    }
    
    return ($station_timetables, $bike_boundaries);
}

sub runsOnSunday {
    my ($line_name) = @_;
    return not ($line_name =~ /green/ or $line_name =~ /red/);
}


#-----------------------------------------------------------------
#  JavaScript output generation

sub getHeader {
    my $now = localtime;
    return <<_EOT_;
//-----------------------------------------------------------------------------
//  Timetables.js is part of the BART dashboard widget.  (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//-----------------------------------------------------------------------------
//
//  Automatically generated by make_timetables.pl on $now.
//
//  Times are stored as the number of minutes after 4:00 am.
//

_EOT_
}

sub getFooter {
    return "";
}

sub translateBikeBoundaries {
    my ($bike_boundaries, $js_array_name) = @_;
    return "" unless @$bike_boundaries;
    my $out = "\n$js_array_name.no_bikes = [];\n";

    my $train_index = 0;
    for my $boundary (@$bike_boundaries) {
        next unless $boundary;
        my ($start_station, $end_station) = @$boundary;
            $out .= "$js_array_name.no_bikes[$train_index] = [ " . 
                    "$js_array_name\['$station_names{$start_station}'][$train_index], " .
                    "$js_array_name\['$station_names{$end_station}'][$train_index] ];\n";
    }
    continue { ++$train_index }

    return $out;
}

sub translateStationTimetables {
    my ($station_timetables, $js_array_name) = @_;
    
    my $out = "";
    for my $station_code (sort keys %$station_timetables) {
        my $timetable = $station_timetables->{$station_code};
        my $station_name = $station_names{$station_code};
        $out .= translateSingleStation($timetable, $station_name, $js_array_name);
    }
    return $out;
}

sub translateSingleStation {
    my ($timetable, $station_name, $js_array_name) = @_;

    my $ampm_hour_offset = 0;
    my $hour_of_last_stop = 0;
    my $out = "$js_array_name\['$station_name'] = [\n   ";
    
    my $last_valid_entry = -1;
    my $was_last_valid = -1;
    
    my $count = 0;
    for my $info (@$timetable) {
        my ($hour, $min, $must_be_pm) = @$info;
        
        my $minutes_since_morn;
        if ($hour < 0) {    # Invalid entry.
            $minutes_since_morn = $last_valid_entry + 0.5;
            $was_last_valid = -1; ## Kludge to make Yellow Millbrae times correct.
        }
        else {              # Valid entry.
            if ($must_be_pm and ($last_valid_entry == -1 or $was_last_valid == -1)) { $ampm_hour_offset = 12; }
            elsif ($hour < $hour_of_last_stop) { $ampm_hour_offset = $ampm_hour_offset + 12 }
            $hour_of_last_stop = $hour;
            $minutes_since_morn = $min + 60 * ($hour + $ampm_hour_offset - $starting_hour);
            $last_valid_entry = $minutes_since_morn;
            $was_last_valid = 0;
        }
        $out .= "$minutes_since_morn, ";
        $out .= "\n   " unless ++$count % 16;
    }
    
    $out .= "];\n";

    if ($last_valid_entry < 0) { $out = "" }    # If it's all invalid, leave it out entirely.
    return $out;
}

