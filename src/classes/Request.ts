import fetchPonyfill from "../vendor/fetchPonyfill";

const { fetch } = fetchPonyfill({});

type RequestInitializationObject = {
  endpoint?: string;
  options?: RequestInit;
  body?: FormData;
};

class Request {
  // Property types
  endpoint: string;
  options: RequestInit;
  body: FormData;

  // Static properties
  /**
   * @static
   * @member {object} Request.defaultOptions Options object to fallback to if
   * no options property is passed into the constructor config object.
   */
  static defaultOptions: RequestInit = {
    method: "GET",
    headers: { Accept: "application/json" }
  };

  // Constructor
  /**
   * @class Request
   * @param {object} config
   * @param {string} config.endpoint
   * @param {object} [config.options]
   * @param {FormData} [config.body]
   */
  constructor({ endpoint, options, body }: RequestInitializationObject) {
    this.endpoint = endpoint;
    this.options = options || Request.defaultOptions;
    this.body = body;
  }
  // Private methods
  /**
   * @private
   * @function Request.prepareFetchOptions
   * @description Creates blank FormData object if this.body is undefined and
   * this.options.method is equal to "POST".
   * @returns {FormData}
   */
  private prepareFetchOptions = () => {
    if (!this.body && this.options.method === "POST") {
      this.body = new FormData();
    }
    return this.body;
  };
  // Public methods
  /**
   * @public
   * @function Request.send
   * @param	{object} options
   * @param {boolean} [options.async] Allows property `async` to be set to indicate the
   * response should be prepared before returning.
   * @returns {Promise}
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
