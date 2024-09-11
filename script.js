$(document).ready(function () {
    console.log("Initializing SimplyBook Widget with Providers...");

    let providersCache = null; // Cache for providers
    let eventsCache = {}; // Cache for events by date range

    // Initialize JSON-RPC Client for SimplyBook API to fetch the token
    try {
        var loginClient = new JSONRpcClient({
            'url': 'https://user-api.simplybook.me/login',
            'onerror': function (error) {
                console.error("Login Error:", error);
            }
        });

        // Fetch token dynamically using the new SimplyBook API credentials
        loginClient.getToken('thefreshlifeconference', 'a5dc632dedf9f85bb8d5bfdd1a8087401787b413111ac0cfbca269a84ec348f3', function (token) {
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
        if (providersCache) {
            console.log("Using cached providers data.");
            renderCalendar(providersCache, token);
            return;
        }

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
                providersCache = Object.values(providers).map(provider => ({
                    id: provider.id,
                    title: provider.name,
                    position: parseInt(provider.position) || 0,
                    color: provider.color || '',
                    picture: provider.picture_path ? `${provider.picture_sub_path}/${provider.picture}` : '',
                    description: provider.description || ''
                }));

                renderCalendar(providersCache, token);
            } else {
                console.error("No providers returned. Please check the API response.");
                renderCalendar([], token); // Render empty calendar
            }
        }, function (error) {
            console.error("Error fetching providers:", error);
            renderCalendar([], token); // Render empty calendar
        });
    }

    function fetchEventsForRange(token, start, end, callback) {
        const cacheKey = `${start}_${end}`;

        if (eventsCache[cacheKey]) {
            console.log("Using cached events data.");
            callback(eventsCache[cacheKey]);
            return;
        }

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
                    processEvents(events, token, start, end, function (processedEvents) {
                        eventsCache[cacheKey] = processedEvents; // Cache events data
                        callback(processedEvents);
                    });
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

    // Other functions remain unchanged
    //...
});
