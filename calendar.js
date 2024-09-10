$(document).ready(function () {
    console.log("Initializing SimplyBook Widget with Providers...");

    var calendarEl = document.getElementById('calendar');

    // Initialize JSON-RPC Client for SimplyBook API to fetch the token
    var loginClient = new JSONRpcClient({
        'url': 'https://user-api.simplybook.me/login',
        'onerror': function (error) {
            console.error("Error: " + error.message);
        }
    });

    // Fetch token dynamically using the SimplyBook API credentials
    var token = loginClient.getToken('thefreshlifeconference', '5622f213016960fc53a1c61e6ac61aee0eabebcedd688b374f9761c9c6f69dce', function (token) {
        console.log("Fetched token: ", token);
        // Once token is fetched, use it to get the list of services and providers
        fetchProvidersAndServices(token);
    });

    function fetchProvidersAndServices(token) {
        console.log("Fetching providers and events...");
        var client = new JSONRpcClient({
            'url': 'https://user-api.simplybook.me',
            'headers': {
                'X-Company-Login': 'thefreshlifeconference',
                'X-Token': token
            }
        });

        // Fetch Providers (Resources)
        client.request('getUnitList', [], function (providersResponse) {
            const providers = providersResponse.result;
            console.log("Fetched providers: ", providers);

            // Fetch Events (Services)
            client.request('getEventList', [], function (eventsResponse) {
                const events = eventsResponse.result;
                console.log("Fetched events: ", events);

                // Transform data to fit FullCalendar's resource and event structure
                setupFullCalendar(providers, events);
            });
        });
    }

    function setupFullCalendar(providers, events) {
        // Transform providers to FullCalendar resources format
        const resources = providers.map(provider => ({
            id: provider.id,
            title: provider.name
        }));

        // Transform events to FullCalendar events format
        const calendarEvents = events.map(event => ({
            id: event.id,
            resourceId: event.unit_map ? Object.keys(event.unit_map)[0] : null,  // Assuming the first unit is the primary
            title: event.name,
            start: event.start_date,  // Adjust based on actual date field from SimplyBook
            end: event.end_date       // Adjust based on actual end date field from SimplyBook
        }));

        var calendar = new FullCalendar.Calendar(calendarEl, {
            schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
            initialView: 'resourceTimelineDay',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'resourceTimelineDay,resourceTimelineWeek'
            },
            resources: resources,
            events: calendarEvents
        });

        calendar.render();
    }
});
