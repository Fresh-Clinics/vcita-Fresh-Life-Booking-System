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

        // Function to handle retry with extended delay and limited attempts
        function retryRequest(requestFunc, retries = 3, delay = 30000) { // Set delay to 30 seconds
            requestFunc().catch(error => {
                if (error.message === 'Too many requests' && retries > 0) {
                    console.warn(`Too many requests. Retrying in ${delay / 1000}s... (${retries} attempts left)`);
                    setTimeout(() => retryRequest(requestFunc, retries - 1, delay), delay);
                } else {
                    console.error("Failed after multiple retries or a different error occurred:", error);
                }
            });
        }

        // Fetch providers (units) from SimplyBook.me
        retryRequest(() => {
            return new Promise((resolve, reject) => {
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
                        resolve(); // Resolve the promise on success
                    } else {
                        console.error("No providers returned. Please check the API response.");
                        renderCalendar([], token, {}); // Render empty calendar
                        reject(new Error("No providers returned"));
                    }
                }, function (error) {
                    if (error && error.message === 'Too many requests') {
                        reject(new Error('Too many requests'));
                    } else {
                        console.error("Error fetching providers:", error);
                        renderCalendar([], token, {}); // Render empty calendar
                        reject(error); // Reject the promise on error
                    }
                });
            });
        });
    }

    function categorizeResourcesByColor(resources) {
        const colorCategoryMap = {
            '#34bbf1': 'Training Suites',
            '#b07393': 'Activations Hub',
            '#71909f': 'Wellness & Spa',
            '#fac94e': 'Program'
        };

        const categorizedResources = {};

        resources.forEach(resource => {
            const category = colorCategoryMap[resource.color] || 'Other';
            if (!categorizedResources[category]) {
                categorizedResources[category] = [];
            }
            categorizedResources[category].push(resource);
        });

        return categorizedResources;
    }

    // The rest of your code remains unchanged...
});
