/**
 * JSON-RPC Client for SimplyBook.me API
 */

function JSONRpcClient(options) {
    this.url = options.url;
    this.headers = options.headers || {};
    this.onerror = options.onerror || function () {};
}

/**
 * Make a JSON-RPC request to the server
 * @param {string} method - The RPC method to call
 * @param {Array} params - Parameters for the method
 * @param {function} callback - Callback function to handle the response
 */
JSONRpcClient.prototype.request = function (method, params, callback) {
    var requestData = {
        jsonrpc: "2.0",
        method: method,
        params: params,
        id: 1
    };

    $.ajax({
        url: this.url,
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(requestData),
        headers: this.headers,
        success: function (response) {
            if (response.error) {
                console.error("JSON-RPC Error:", response.error);
                if (typeof this.onerror === 'function') {
                    this.onerror(response.error);
                }
            } else {
                callback(response.result);
            }
        },
        error: function (xhr, status, error) {
            console.error("AJAX Error:", error);
            if (typeof this.onerror === 'function') {
                this.onerror(error);
            }
        }
    });
};

/**
 * Fetch the token using the SimplyBook.me API credentials
 * @param {string} companyLogin - The SimplyBook company login
 * @param {string} apiKey - The API key
 * @param {function} callback - Callback function to handle the token
 */
JSONRpcClient.prototype.getToken = function (companyLogin, apiKey, callback) {
    var requestData = {
        jsonrpc: "2.0",
        method: "getToken",
        params: [companyLogin, apiKey],
        id: 1
    };

    $.ajax({
        url: this.url,
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(requestData),
        success: function (response) {
            if (response.error) {
                console.error("Error fetching token:", response.error);
            } else {
                callback(response.result);
            }
        },
        error: function (xhr, status, error) {
            console.error("AJAX Error fetching token:", error);
        }
    });
};
