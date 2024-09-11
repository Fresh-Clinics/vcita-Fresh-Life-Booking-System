function renderCalendar(resources, token) {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        height: 'auto',
        dayMinWidth: 100,
        slotDuration: '00:30:00', // 30-minute intervals
        slotLabelInterval: '00:30:00', // Show labels every 30 minutes
        slotLabelFormat: { hour: 'numeric', minute: '2-digit', hour12: true }, // Display format for time slots
        schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
        timeZone: 'Australia/Sydney', // Set timezone to AEST
        initialView: 'resourceTimeGridDay',
        initialDate: '2024-10-29',
        allDaySlot: false, // Remove 'All Day' slot
        resources: resources,
        events: function (info, successCallback, failureCallback) {
            // Fetch events for the current date range
            fetchEventsForRange(token, info.startStr, info.endStr, successCallback);
        },
        headerToolbar: {
            left: 'prev',
            center: 'title',
            right: 'next'
        },
        resourceOrder: 'position', // Sort resources by position
        eventContent: function (arg) {
            if (arg.event && arg.event.title) {
                return {
                    html: `<div class="fc-event-content">
                              <div class="fc-event-title">${arg.event.title}</div>
                           </div>`
                };
            } else {
                console.warn("Event data is missing or incorrect", arg.event);
                return { html: '<div class="fc-event-content"><div class="fc-event-title">Invalid Event</div></div>' };
            }
        },
        eventDidMount: function (info) {
            // Initialize tippy.js for tooltips with HTML content
            tippy(info.el, {
                content: `<strong>${info.event.title}</strong><br>${info.event.extendedProps.description}`, // Event name in bold and description below
                allowHTML: true, // Enable HTML in the tooltip
                theme: 'light-border', // Choose a theme for the tooltip
                placement: 'top', // Set the placement of the tooltip
                onShown(instance) { // Align tooltip content dynamically
                    if (!info.event.extendedProps.picture) {
                        instance.popper.querySelector('.tippy-content').style.paddingBottom = '0';
                    }
                },
            });
        },
        eventClick: function (info) {
            const event = info.event;
            const category = event.extendedProps.category;
            const service = event.id;
            const date = event.start.toISOString().split('T')[0];
            const time = event.start.toTimeString().split(' ')[0];

            console.log(`Booking: Category ${category}, Service ${service}, Date ${date}, Time ${time}`);

            // Display popup for booking
            const popup = document.createElement('div');
            popup.className = 'popup-overlay';
            popup.innerHTML = `
                <div class="popup-content">
                    <span class="close-popup" onclick="this.parentElement.parentElement.remove()">×</span>
                    <h2>${event.title}</h2>
                    <p>${event.extendedProps.description}</p>
                    <img src="${event.extendedProps.picture || ''}" alt="Provider Image" style="max-width: 100%;">
                    <div class="popup-message"><strong>Bookings open at 7pm AEST Monday 23rd October</strong></div>
                </div>
            `;
            document.body.appendChild(popup);
        },
        slotMinTime: '08:00:00', // Set the start time of slots to match your schedule
        slotMaxTime: '23:00:00'  // Set the end time of slots to match your schedule
    });

    calendar.render();
    console.log("Calendar rendered with events.");
}
