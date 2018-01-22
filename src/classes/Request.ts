import "whatwg-fetch";

type RequestOptions = {
	method: string;
	headers: object;
	dataType: string;
	body?: FormData;
};

type RequestInitializationObject = {
	endpoint?: string;
	options?: RequestInit;
};

class Request {
	// Property types
	endpoint: string;
	options: RequestInit;
	body: FormData;

	// Static properties
	static defaultOptions: RequestInit = {
		method: "GET",
		headers: { Accept: "application/json" }
	};

	// Constructor
	constructor({ endpoint, options }: RequestInitializationObject) {
		this.endpoint = endpoint;
		this.options = options || Request.defaultOptions;
		this.body = options && options.body;
	}

	// Private methods
	/**
	 * @name prepareFetchOptions
	 * @description Creates blank FormData object if this.body is undefined and this.options.method is equal to "POST"
	 * @returns [FormData]
	 */
	private prepareFetchOptions = () => {
		if (!this.body && this.options.method === "POST") {
			this.body = new FormData();
		}
		return this.body;
	};

	// Public methods
	/**
	 * @name send
	 * @param	options [object] Allows property `async` to be set to indicate the response should be prepared before returning
	 * @returns [Promise]
	 */
	public send = ({ async }: { async: boolean } = { async: false }) => {
		const preparedOptions = Object.assign(
			{},
			this.prepareFetchOptions(),
			this.options
		);
		const initFetch = fetch(this.endpoint, preparedOptions);
		return async ? initFetch.then(res => res.json()) : initFetch;
	};
}
export default Request;
