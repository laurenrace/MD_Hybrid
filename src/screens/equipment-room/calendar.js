import { Calendar } from '@fullcalendar/core';
import listPlugin from '@fullcalendar/list';
import googleCalendarPlugin from '@fullcalendar/google-calendar';



let API_KEY = 'AIzaSyCeDe2K2aCgZB_qr0n58bPRJOtXCNJQgeQ';
let googleCalendarID = 'nyu.edu_jmn8eqiarfitb8fd1crpne27ik@group.calendar.google.com';

let listCalendar = new Calendar(document.getElementById('listCalendar'), {
    plugins: [googleCalendarPlugin, listPlugin],
    googleCalendarApiKey: API_KEY,
    events: {
        googleCalendarId: googleCalendarID
    },
    initialView: 'listMonth',

    // listDayFormat: { // will produce something like "Tuesday, September 18, 2018"
    //     weekday: 'long',
    //     month: 'long',
    //     day: 'numeric',
    // },

    // listDayAltFormat: {
    //     weekday: 'long',
    // },

    // customize the button names,
    // otherwise they'd all just say "list"
    // views: {
    //     listDay: { buttonText: 'list day' },
    //     listWeek: { buttonText: 'list week' },
    //     listMonth: { buttonText: 'list month' },
    //     listSixtyDays: {
    //         type: 'list',
    //         duration: { days: 60 },
    //         buttonText: 'list 60 day'
    //     }
    // },

    // header: {
    //     left: 'title',
    //     center: '',
    //     right: ''
    // },


    // eventClick: function (info) {
    //     info.jsEvent.preventDefault(); // don't let the browser navigate

    // }

});




// monthCalendar.render();
listCalendar.render();
listCalendar.refetchEvents();
console.log('getting calendar events');

// refetch events every 120 seconds
setInterval(() => {
    // monthCalendar.refetchEvents();
    listCalendar.refetchEvents();
    console.log("Updating Calendars...");
}, 120000);