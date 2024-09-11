$(document).ready(function () {
    console.log("Initializing SimplyBook Widget with Providers...");

    // Initialize JSON-RPC Client for SimplyBook API to fetch the token
    try {
        var loginClient = new JSONRpcClient({
            'url': 'https://user-api.simplybook.me/login',
            'onerror': function (error) {
                console.error("Login Error:", error);
            }
        });

        // Fetch token dynamically using the SimplyBook API credentials
        loginClient.getToken('thefreshlifeconference', '5622f213016960fc53a1c61e6ac61aee0eabebcedd688b374f9761c9c6f69dce', function (token) {
            if (token) {
                console.log("Fetched token: ", token);
                // Fetch providers and then render the calendar with the token
                fetchProvidersAndRenderCalendar(token);
            } else {
                console.error("Failed to fetch token. Please check your API credentials.");
            }
        });
    } catch (e) {
        console.error("Error initializing JSON-RPC client or fetching token:", e);
    }

    function fetchProvidersAndRenderCalendar(token) {
        console.log("Fetching providers...");
        var client = new JSONRpcClient({
            'url': 'https://user-api.simplybook.me',
            'headers': {
                'X-Company-Login': 'thefreshlifeconference',
                'X-Token': token
            },
            'onerror': function (error) {
                console.error("Error in JSON-RPC client setup:", error);
            }
        });

        // Fetch providers (units) from SimplyBook.me
        client.request('getUnitList', [], function (providers) {
            if (providers) {
                console.log("Fetched providers:", providers);
                var resources = Object.values(providers).map(provider => ({
                    id: provider.id,
                    title: provider.name,
                    position: parseInt(provider.position) || 0,
                    color: provider.color || '',
                    picture: provider.picture_path ? `${provider.picture_sub_path}/${provider.picture}` : '',
                    description: provider.description || ''
                }));

                renderCalendar(resources, token);
            } else {
                console.error("No providers returned. Please check the API response.");
                renderCalendar([], token); // Render empty calendar
            }
        }, function (error) {
            console.error("Error fetching providers:", error);
            renderCalendar([], token); // Render empty calendar
        });
    }

    function renderCalendar(resources, token) {
        var calendarEl = document.getElementById('calendar');
        var calendar = new FullCalendar.Calendar(calendarEl, {
            height: 'auto',
            dayMinWidth: 150,
            slotDuration: '00:30:00',
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
});
