class JSONRpcClient {
    constructor(options) {
        this.url = options.url;
        this.headers = options.headers || {};
        this.onerror = options.onerror || function () {};
        this.requestQueue = []; // Queue to store requests
        this.isRequestInProgress = false; // Flag to indicate if a request is in progress
    }

    // New method to process the request queue with a delay
    processQueue() {
        if (this.isRequestInProgress || this.requestQueue.length === 0) return;

        const { method, params, onSuccess, onError } = this.requestQueue.shift(); // Get the next request
        this.isRequestInProgress = true; // Mark request as in progress

        this._sendRequest(method, params, (result) => {
            onSuccess(result);
            this.isRequestInProgress = false; // Mark request as done
            setTimeout(() => this.processQueue(), 3000); // Delay next request by 3 seconds
        }, (error) => {
            onError(error);
            this.isRequestInProgress = false; // Mark request as done
            setTimeout(() => this.processQueue(), 3000); // Delay next request by 3 seconds
        });
    }

    request(method, params, onSuccess, onError) {
        this.requestQueue.push({ method, params, onSuccess, onError });
        this.processQueue(); // Start processing the queue
    }

    _sendRequest(method, params, onSuccess, onError) {
        $.ajax({
            url: this.url,
            type: 'POST',
            contentType: 'application/json',
            headers: this.headers,
            data: JSON.stringify({
                jsonrpc: '2.0',
                method: method,
                params: params,
                id: 1
            }),
            success: function (response) {
                if (response.error) {
                    onError(response.error);
                } else {
                    onSuccess(response.result);
                }
            },
            error: this.onerror
        });
    }

    getToken(companyLogin, apiKey, callback) {
        $.ajax({
            url: this.url,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                jsonrpc: '2.0',
                method: 'getToken',
                params: [companyLogin, apiKey],
                id: 1
            }),
            success: function (response) {
                if (response.result) {
                    callback(response.result);
                } else {
                    console.error("Error fetching token:", response.error);
                }
            },
            error: this.onerror
        });
    }
}
