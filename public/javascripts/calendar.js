/**
 * Created by mtorres on 10/12/16.
 */
$(document).ready(function() {

    $('#calendar').fullCalendar({
        // put your options and callbacks here

        events: [
            {
                title  : 'event1',
                start  : '2017-01-01'
            },
            {
                title  : 'event2',
                start  : '2017-01-05',
                end    : '2017-01-07'
            },
            {
                title  : 'event3',
                start  : '2017-01-09T12:30:00',
                allDay : false // will make the time show
            }
        ]

    })

});

