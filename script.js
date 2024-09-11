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

                // Categorize resources by color
                const categorizedResources = categorizeResourcesByColor(resources);

                renderCalendar(resources, token, categorizedResources);
            } else {
                console.error("No providers returned. Please check the API response.");
                renderCalendar([], token, {}); // Render empty calendar
            }
        }, function (error) {
            console.error("Error fetching providers:", error);
            renderCalendar([], token, {}); // Render empty calendar
        });
    }

    function categorizeResourcesByColor(resources) {
        // Define the mapping of color codes to category names
        const colorToCategoryMap = {
            '#34bbf1': 'Training Suites',
            '#b07393': 'Activations Hub',
            '#71909f': 'Wellness & Spa',
            '#fac94e': 'Program'
            // Add more mappings as needed
        };

        const categorizedResources = {};

        // Categorize resources by color
        resources.forEach(resource => {
            const category = colorToCategoryMap[resource.color] || 'Uncategorized'; // Default to 'Uncategorized'
            if (!categorizedResources[category]) {
                categorizedResources[category] = [];
            }
            categorizedResources[category].push(resource);
        });

        console.log("Categorized resources by color:", categorizedResources);
        return categorizedResources;
    }

    function fetchEventsForRange(token, start, end, callback) {
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

        // Fetch events (services) from SimplyBook.me
        client.request('getEventList', [], function (events) {
            if (events) {
                console.log("Fetched events (raw):", events);

                // Ensure the events object is correctly handled
                if (typeof events === 'object' && !Array.isArray(events)) {
                    events = Object.values(events); // Convert to array if it's an object
                }

                if (Array.isArray(events) && events.length > 0) {
                    processEvents(events, token, start, end, callback);
                } else {
                    console.error("No valid events returned. Please check the API response.");
                    callback([]); // Return empty array if no events
                }
            } else {
                console.error("No events returned. Please check the API response.");
                callback([]); // Return empty array if no events
            }
        }, function (error) {
            console.error("Error fetching events:", error);
            callback([]); // Return empty array on error
        });
    }

    function processEvents(events, token, start, end, callback) {
        var calendarEvents = [];
        var processedCount = 0;

        events.forEach(function (event) {
            if (event.unit_map && event.id && event.name) {
                console.log("Processing event:", event); // Log each event to verify its structure
                const providerId = Object.keys(event.unit_map)[0]; // Get the provider ID from the unit_map

                // Fetch start time dynamically using getStartTimeMatrix
                fetchEventStartTime(token, event.id, providerId, start, end, function (startTime) {
                    if (startTime && isDateInRange(startTime, start, end)) { // Check if start time is within the active date range
                        // Fetch end time dynamically using calculateEndTime
                        fetchEventEndTime(token, startTime, event.id, providerId, function (endTime) {
                            if (endTime) {
                                // Push the event into the calendarEvents array
                                calendarEvents.push({
                                    id: event.id,
                                    title: event.name,
                                    start: startTime,
                                    end: endTime,
                                    resourceId: providerId,
                                    description: event.description || '',
                                    category: event.categories[0] // Get the first category
                                });
                            }

                            // Check if all events are processed
                            processedCount++;
                            if (processedCount === events.length) {
                                callback(calendarEvents); // Callback with all processed events
                            }
                        });
                    } else {
                        processedCount++;
                        if (processedCount === events.length) {
                            callback(calendarEvents); // Callback with all processed events
                        }
                    }
                });
            } else {
                console.warn("Event missing required data or incorrect format:", event);
                processedCount++;
                if (processedCount === events.length) {
                    callback(calendarEvents); // Callback with all processed events
                }
            }
        });
    }

    function isDateInRange(date, start, end) {
        const dateObj = new Date(date);
        return dateObj >= new Date(start) && dateObj <= new Date(end); // Check if date is within the range
    }

    function fetchEventStartTime(token, eventId, unitId, from, to, callback) {
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

        // Fetch start times only for the current visible days
        client.request('getStartTimeMatrix', [from, from, eventId, [unitId], 1, null, []], function (timeMatrix) {
            console.log("Fetched start times for event:", timeMatrix);
            if (timeMatrix && Object.keys(timeMatrix).length > 0) {
                const firstDate = Object.keys(timeMatrix)[0]; // Get the first available date
                const startTime = timeMatrix[firstDate][0];   // Get the first available time
                const fullStartTime = `${firstDate}T${startTime}`; // Combine to full ISO date-time string
                callback(fullStartTime);
            } else {
                console.error("No start time available for the given parameters.");
                callback(null);
            }
        }, function (error) {
            console.error("Error fetching start times:", error);
            callback(null);
        });
    }

    function fetchEventEndTime(token, startDateTime, eventId, unitId, callback) {
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

        client.request('calculateEndTime', [startDateTime, eventId, unitId, []], function (endTime) {
            console.log("Fetched end time for event:", endTime);
            if (endTime) {
                callback(endTime);
            } else {
                console.error("No end time available for the given parameters.");
                callback(null);
            }
        }, function (error) {
            console.error("Error fetching end time:", error);
            callback(null);
        });
    }

    function renderCalendar(resources, token, categorizedResources) {
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
                        html: `<div class="fc-event-content" style="padding: 5px">
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

        // Render categories row above the resource row
        renderCategoriesRow(categorizedResources);
    }

    function renderCategoriesRow(categorizedResources) {
        const headerToolbarEl = document.querySelector('.fc-header-toolbar');
        if (!headerToolbarEl) return;

        const categoriesRow = document.createElement('div');
        categoriesRow.className = 'fc-categories-row';

        // Add each category to the row
        Object.keys(categorizedResources).forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'fc-category';
            categoryElement.textContent = category;
            categoriesRow.appendChild(categoryElement);
        });

        headerToolbarEl.insertAdjacentElement('afterend', categoriesRow); // Insert the categories row after the header
    }
});
