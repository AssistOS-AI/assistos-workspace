(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.AssistOS = {}));
})(this, function(exports2) {
  "use strict";
  function getAugmentedNamespace(n) {
    if (n.__esModule) return n;
    var f = n.default;
    if (typeof f == "function") {
      var a = function a2() {
        if (this instanceof a2) {
          return Reflect.construct(f, arguments, this.constructor);
        }
        return f.apply(this, arguments);
      };
      a.prototype = f.prototype;
    } else a = {};
    Object.defineProperty(a, "__esModule", { value: true });
    Object.keys(n).forEach(function(k) {
      var d = Object.getOwnPropertyDescriptor(n, k);
      Object.defineProperty(a, k, d.get ? d : {
        enumerable: true,
        get: function() {
          return n[k];
        }
      });
    });
    return a;
  }
  var assistosSdk = { exports: {} };
  let ServerSideSecurityContext$1 = class ServerSideSecurityContext {
    constructor(request) {
      this.cookies = request.headers.cookie;
    }
  };
  var ServerSideSecurityContext_1 = ServerSideSecurityContext$1;
  let ClientSideSecurityContext$1 = class ClientSideSecurityContext {
    constructor() {
    }
  };
  var ClientSideSecurityContext_1 = ClientSideSecurityContext$1;
  var constants$2 = {
    DEFAULT_AGENT: "Assistant",
    USER_LOGIN_PLUGIN: "UserLogin",
    USER_LOGGER_PLUGIN: "UserLoggerPlugin",
    ADMIN_PLUGIN: "AdminPlugin",
    ASSISTOS_ADMIN_PLUGIN: "AssistOSAdmin",
    APPLICATION_PLUGIN: "Application",
    AGENT_PLUGIN: "Agent",
    WORKSPACE_PLUGIN: "Workspace",
    DOCUMENTS_PLUGIN: "Documents",
    WORKSPACE_USER_PLUGIN: "WorkspaceUser",
    CHAT_ROOM_PLUGIN: "ChatRoom",
    CHAT_SCRIPT_PLUGIN: "ChatScript",
    LLM_PLUGIN: "LLM",
    TABLE_PLUGIN: "Table",
    WEB_ASSISTANT_PLUGIN: "WebAssistant",
    CODE_MANAGER_PLUGIN: "CodeManager",
    FFMPEG_PLUGIN: "Ffmpeg",
    GLOBAL_SERVERLESS_ID: "assistOS",
    TICKETS_PLUGIN: "TicketsPlugin",
    DOCUMENT_CATEGORIES: {
      SNAPSHOT: "snapshot",
      DOCUMENT: "document",
      CHAT: "chat",
      SCRIPT_EXECUTION: "CODEX"
    },
    DEFAULT_AGENT_NAME: "Assistant",
    DEFAULT_ID_LENGTH: 16,
    ENV_TYPE: {
      NODE: "node",
      BROWSER: "browser",
      UNKNOWN: "unknown"
    }
  };
  function getDefaultExportFromCjs(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
  }
  var PollRequestManager_1;
  var hasRequiredPollRequestManager;
  function requirePollRequestManager() {
    if (hasRequiredPollRequestManager) return PollRequestManager_1;
    hasRequiredPollRequestManager = 1;
    function PollRequestManager(fetchFunction, connectionTimeout = 1e4) {
      const requests = /* @__PURE__ */ new Map();
      function Request(url, options, delay = 0) {
        let promiseHandlers = {};
        let currentState = void 0;
        let timeout;
        this.url = url;
        let abortController;
        let previousAbortController;
        this.execute = function() {
          if (typeof AbortController !== "undefined") {
            if (typeof abortController === "undefined") {
              previousAbortController = new AbortController();
            } else {
              previousAbortController = abortController;
            }
            abortController = new AbortController();
            options.signal = previousAbortController.signal;
          }
          if (!currentState && delay) {
            currentState = new Promise((resolve, reject) => {
              timeout = setTimeout(() => {
                fetchFunction(url, options).then((response) => {
                  resolve(response);
                }).catch((err) => {
                  reject(err);
                });
              }, delay);
            });
          } else {
            currentState = fetchFunction(url, options);
          }
          return currentState;
        };
        this.cancelExecution = function() {
          clearTimeout(timeout);
          timeout = void 0;
          if (typeof currentState !== "undefined") {
            currentState = void 0;
          }
          promiseHandlers.resolve = (...args) => {
            console.log("(not important) Resolve called after cancel execution with the following args", ...args);
          };
          promiseHandlers.reject = (...args) => {
            console.log("(not important) Reject called after cancel execution with the following args", ...args);
          };
        };
        this.setExecutor = function(resolve, reject) {
          if (promiseHandlers.resolve) {
            return reject(new Error("Request already in progress"));
          }
          promiseHandlers.resolve = resolve;
          promiseHandlers.reject = reject;
        };
        this.resolve = function(...args) {
          promiseHandlers.resolve(...args);
          this.destroy();
          promiseHandlers = {};
        };
        this.reject = function(...args) {
          if (promiseHandlers.reject) {
            promiseHandlers.reject(...args);
          }
          this.destroy();
          promiseHandlers = {};
        };
        this.destroy = function(removeFromPool = true) {
          this.cancelExecution();
          if (!removeFromPool) {
            return;
          }
          const requestsEntries = requests.entries();
          let identifier;
          for (const [key, value] of requestsEntries) {
            if (value === this) {
              identifier = key;
              break;
            }
          }
          if (identifier) {
            requests.delete(identifier);
          }
        };
        this.abort = () => {
          if (typeof previousAbortController !== "undefined") {
            previousAbortController.abort();
          }
        };
      }
      this.createRequest = function(url, options, delayedStart = 0) {
        const request = new Request(url, options, delayedStart);
        const promise = new Promise((resolve, reject) => {
          request.setExecutor(resolve, reject);
          createPollingTask(request);
        });
        promise.abort = () => {
          this.cancelRequest(promise);
        };
        requests.set(promise, request);
        return promise;
      };
      this.cancelRequest = function(promiseOfRequest) {
        if (typeof promiseOfRequest === "undefined") {
          console.log("No active request found.");
          return;
        }
        const request = requests.get(promiseOfRequest);
        if (request) {
          request.destroy(false);
          requests.delete(promiseOfRequest);
        }
      };
      this.setConnectionTimeout = (_connectionTimeout) => {
        connectionTimeout = _connectionTimeout;
      };
      function createPollingTask(request) {
        let safePeriodTimeoutHandler;
        let serverResponded = false;
        function beginSafePeriod() {
          safePeriodTimeoutHandler = setTimeout(() => {
            if (!serverResponded) {
              request.abort();
            }
            serverResponded = false;
            beginSafePeriod();
          }, connectionTimeout * 2);
          reArm();
        }
        function endSafePeriod(serverHasResponded) {
          serverResponded = serverHasResponded;
          clearTimeout(safePeriodTimeoutHandler);
        }
        function reArm() {
          request.execute().then((response) => {
            if (!response.ok) {
              endSafePeriod(true);
              if (response.status === 403) {
                request.reject(Error("Token expired"));
                return;
              }
              if (response.status === 503) {
                let err = Error(response.statusText || "Service unavailable");
                err.code = 503;
                throw err;
              }
              return beginSafePeriod();
            }
            if (response.status === 204) {
              endSafePeriod(true);
              beginSafePeriod();
              return;
            }
            if (safePeriodTimeoutHandler) {
              clearTimeout(safePeriodTimeoutHandler);
            }
            request.resolve(response);
          }).catch((err) => {
            switch (err.code) {
              case "ETIMEDOUT":
              case "ECONNREFUSED":
                endSafePeriod(true);
                beginSafePeriod();
                break;
              case 20:
              case "ERR_NETWORK_IO_SUSPENDED":
              case "ERR_INTERNET_DISCONNECTED":
                break;
              default:
                console.log("abnormal error: ", err);
                endSafePeriod(true);
                request.reject(err);
            }
          });
        }
        beginSafePeriod();
      }
    }
    PollRequestManager_1 = PollRequestManager;
    return PollRequestManager_1;
  }
  function NotificationManager$1(webhookUrl, pollTimeout = 3e4, pollInterval = 1e3, infinite = false, maxAttempts = 30) {
    const PollRequestManager = requirePollRequestManager();
    const polling = /* @__PURE__ */ new Map();
    const pollManager = new PollRequestManager(fetch, pollTimeout);
    this.waitForResult = (callId, options = {}) => {
      const {
        onProgress = void 0,
        onEnd = void 0,
        onError = void 0,
        maxAttempts: maxAttempts2,
        infinite: infinite2
      } = options;
      if (polling.has(callId)) {
        return polling.get(callId).promise;
      }
      let attempts = 0;
      let consecutiveFailures = 0;
      const startTime = Date.now();
      const MAX_CONSECUTIVE_FAILURES = 5;
      const promise = new Promise((resolve, reject) => {
        const longPoll = async () => {
          attempts++;
          const attemptsDisplay = infinite2 ? `${attempts}/infinite` : `${attempts}/${maxAttempts2}`;
          console.log(`Long polling for result of call ${callId} (attempt ${attemptsDisplay}, consecutive failures: ${consecutiveFailures})`);
          try {
            const pollPromise = pollManager.createRequest(`${webhookUrl}/${callId}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json"
              }
            });
            const pollingItem = polling.get(callId);
            if (pollingItem) {
              pollingItem.currentPollPromise = pollPromise;
            }
            const response = await pollPromise;
            if (!response.ok) {
              consecutiveFailures++;
              console.error(`Webhook long polling error: ${response.status} ${response.statusText} (consecutive failures: ${consecutiveFailures})`);
              if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                const serverDownError = new Error(`Server appears to be down: ${consecutiveFailures} consecutive failures. Last status: ${response.status}`);
                serverDownError.code = "SERVER_DOWN";
                serverDownError.callId = callId;
                serverDownError.consecutiveFailures = consecutiveFailures;
                polling.delete(callId);
                if (onError) {
                  onError(serverDownError);
                }
                reject(serverDownError);
                return;
              }
              if (!infinite2 && attempts >= maxAttempts2) {
                polling.delete(callId);
                const timeoutError = new Error(`Webhook long polling failed with status ${response.status} after ${attempts} attempts`);
                timeoutError.code = "POLLING_TIMEOUT";
                timeoutError.callId = callId;
                if (onError) {
                  onError(timeoutError);
                }
                reject(timeoutError);
                return;
              }
              setTimeout(() => longPoll(), pollInterval);
              return;
            }
            consecutiveFailures = 0;
            const data = await response.json();
            console.log(`Long poll response for ${callId}:`, JSON.stringify(data));
            if (data.status === "error") {
              const webhookError = new Error(data.message || "Webhook reported an error");
              webhookError.code = data.code || "WEBHOOK_ERROR";
              webhookError.callId = callId;
              webhookError.details = data.details;
              polling.delete(callId);
              if (onError) {
                onError(webhookError);
              }
              reject(webhookError);
              return;
            }
            if (data.status === "completed") {
              const pollingItem2 = polling.get(callId);
              const responseTime = Date.now() - pollingItem2.startTime;
              console.log(`Completed: ${callId} (${responseTime}ms)`);
              if (data.progress && onProgress) {
                onProgress(data.progress);
              }
              polling.delete(callId);
              if (onEnd) {
                onEnd(data.result);
              }
              resolve(data.result);
            } else if (data.status === "pending") {
              const pollingItem2 = polling.get(callId);
              const pollingTime = Date.now() - pollingItem2.startTime;
              if (data.progress && onProgress) {
                console.log(`Progress: ${callId} (${pollingTime}ms)`);
                onProgress(data.progress);
              } else {
                console.log(`Timeout: ${callId} (${pollingTime}ms) - reconnecting`);
              }
              if (!infinite2 && attempts >= maxAttempts2) {
                const timeoutError = new Error(`Timeout waiting for result for call ${callId}`);
                timeoutError.code = "POLLING_TIMEOUT";
                timeoutError.callId = callId;
                polling.delete(callId);
                if (onError) {
                  onError(timeoutError);
                }
                reject(timeoutError);
                return;
              }
              setTimeout(() => longPoll(), 0);
            } else if (data.status === "expired") {
              const expiredError = new Error(`Call ${callId} expired on the server`);
              expiredError.code = "PROCESS_UNAVAILABLE";
              expiredError.callId = callId;
              polling.delete(callId);
              if (onError) {
                onError(expiredError);
              }
              reject(expiredError);
              return;
            }
          } catch (error) {
            if (error.name === "AbortError") {
              console.log(`Long polling aborted for call ${callId}`);
              return;
            }
            consecutiveFailures++;
            console.error(`Long polling error for call ${callId}:`, error, `(consecutive failures: ${consecutiveFailures})`);
            if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
              const persistentError = new Error(`Persistent polling failures: ${error.message}. ${consecutiveFailures} consecutive attempts failed.`);
              persistentError.code = "PERSISTENT_FAILURE";
              persistentError.callId = callId;
              persistentError.consecutiveFailures = consecutiveFailures;
              persistentError.originalError = error;
              polling.delete(callId);
              if (onError) {
                onError(persistentError);
              }
              reject(persistentError);
              return;
            }
            if (!infinite2 && attempts >= maxAttempts2) {
              polling.delete(callId);
              const finalError = new Error(`Polling failed after ${attempts} attempts: ${error.message}`);
              finalError.code = "POLLING_FAILED";
              finalError.callId = callId;
              finalError.originalError = error;
              if (onError) {
                onError(finalError);
              }
              reject(finalError);
              return;
            }
            setTimeout(() => longPoll(), pollInterval);
          }
        };
        longPoll();
      });
      polling.set(callId, {
        promise,
        startTime,
        attempts: 0,
        currentPollPromise: null
      });
      return promise;
    };
    this.cancelPolling = (callId) => {
      const pollingItem = polling.get(callId);
      if (pollingItem) {
        if (pollingItem.currentPollPromise) {
          pollManager.cancelRequest(pollingItem.currentPollPromise);
        }
        polling.delete(callId);
      }
    };
    this.cancelAll = () => {
      for (const [callId, pollingItem] of polling.entries()) {
        if (pollingItem.currentPollPromise) {
          pollManager.cancelRequest(pollingItem.currentPollPromise);
        }
      }
      polling.clear();
    };
    this.setConnectionTimeout = (timeout) => {
      pollManager.setConnectionTimeout(timeout);
    };
  }
  var NotificationManager_1 = NotificationManager$1;
  const NotificationManager = NotificationManager_1;
  function LambdaClientResponse$1(webhookUrl, initialCallId, operationType) {
    let progressCallback = null;
    let endCallback = null;
    let errorCallback = null;
    let callId = initialCallId;
    let currentOperationType = operationType;
    const notificationManager = new NotificationManager(webhookUrl);
    let resolvePromise, rejectPromise;
    let isResolved = false;
    this.result = null;
    const promise = new Promise((resolve, reject) => {
      resolvePromise = (value) => {
        if (!isResolved) {
          isResolved = true;
          resolve(value);
        }
      };
      rejectPromise = (error) => {
        if (!isResolved) {
          isResolved = true;
          if (errorCallback) {
            try {
              errorCallback(error);
            } catch (callbackError) {
              console.error("Error in error callback:", callbackError);
            }
          }
          reject(error);
        }
      };
    });
    this._updateOperationType = (newType) => {
      console.log(`LambdaClientResponse: Updating operation type from ${currentOperationType} to ${newType}`);
      currentOperationType = newType;
    };
    this._isLongRunningOperation = (operationType2) => {
      const longRunningOperations = [
        "slowLambda",
        "observableLambda",
        "cmbSlowLambda",
        "cmbObservableLambda"
      ];
      return longRunningOperations.includes(operationType2);
    };
    this._setCallId = (newCallId) => {
      console.log(`LambdaClientResponse: Setting callId to ${newCallId}`);
      callId = newCallId;
      if (this._isLongRunningOperation(currentOperationType)) {
        const wrapper = {
          onProgress: (callback) => {
            progressCallback = callback;
            return wrapper;
          },
          onEnd: (callback) => {
            endCallback = callback;
            return wrapper;
          },
          onError: (callback) => {
            errorCallback = callback;
            return wrapper;
          },
          result: null
        };
        this._wrapper = wrapper;
        resolvePromise(wrapper);
        setTimeout(() => {
          this._startPolling();
        }, 1);
      } else {
        this._startPolling();
      }
    };
    this._startPolling = () => {
      notificationManager.waitForResult(callId, {
        onProgress: (progress) => {
          if (progressCallback) {
            progressCallback(progress);
          }
        },
        onEnd: (result) => {
          if (this._isLongRunningOperation(currentOperationType) && endCallback) {
            endCallback(result);
          }
        },
        onError: (error) => {
          if (errorCallback) {
            errorCallback(error);
          }
        },
        infinite: this.infinite !== void 0 ? this.infinite : this._isLongRunningOperation(currentOperationType),
        maxAttempts: this.maxAttempts !== void 0 ? this.maxAttempts : this._isLongRunningOperation(currentOperationType) ? Infinity : 30
      }).then((result) => {
        this.result = result;
        if (this._wrapper) {
          this._wrapper.result = result;
        }
        if (!this._isLongRunningOperation(currentOperationType)) {
          resolvePromise(result);
        }
      }).catch((error) => {
        notificationManager.cancelPolling(callId);
        rejectPromise(error);
      }).finally(() => {
        notificationManager.cancelAll();
      });
    };
    this._resolve = (result) => {
      this.result = result;
      if (!this._isLongRunningOperation(currentOperationType)) {
        resolvePromise(result);
      }
    };
    this._reject = rejectPromise;
    this.setTimeout = (duration) => {
      return this;
    };
    this.setInfinite = (infinite = true) => {
      this.infinite = infinite;
      return this;
    };
    this.setMaxAttempts = (maxAttempts) => {
      this.maxAttempts = maxAttempts;
      return this;
    };
    this.onProgress = (callback) => {
      progressCallback = callback;
      return this;
    };
    this.onEnd = (callback) => {
      endCallback = callback;
      return this;
    };
    this.onError = (callback) => {
      errorCallback = callback;
      return this;
    };
    this.then = function(onFulfilled, onRejected) {
      return promise.then(onFulfilled, onRejected);
    };
    this.catch = function(onRejected) {
      return promise.catch(onRejected);
    };
    this.finally = function(onFinally) {
      return promise.finally(onFinally);
    };
  }
  var LambdaClientResponse_1 = LambdaClientResponse$1;
  function PendingCallMixin$2(target) {
    let pendingCalls = [];
    let serialPendingCalls = [];
    let isSerialExecutionReady = false;
    let isExecutionReady = false;
    target.addPendingCall = (pendingFn) => {
      if (isExecutionReady) {
        pendingFn();
      } else {
        pendingCalls.push(pendingFn);
      }
    };
    target.executePendingCalls = () => {
      isExecutionReady = true;
      pendingCalls.forEach((fn) => fn());
      pendingCalls = [];
    };
    target.addSerialPendingCall = (pendingFn) => {
      serialPendingCalls.push(pendingFn);
      if (isSerialExecutionReady) {
        next();
      }
    };
    function next() {
      const fn = serialPendingCalls.shift();
      if (typeof fn !== "undefined") {
        try {
          fn(function() {
            setTimeout(() => {
              next();
            }, 0);
          });
        } catch (e) {
          console.log(e);
        }
      }
    }
    target.executeSerialPendingCalls = () => {
      isSerialExecutionReady = true;
      next();
    };
  }
  var PendingCallMixin_1 = PendingCallMixin$2;
  const LambdaClientResponse = LambdaClientResponse_1;
  const PendingCallMixin$1 = PendingCallMixin_1;
  function ServerlessClient$1(userId, endpoint, serverlessId, pluginName, options = {}) {
    if (!endpoint) {
      throw new Error("Endpoint URL is required");
    }
    const baseEndpoint = `${endpoint}/proxy`;
    const webhookUrl = `${endpoint}/internalWebhook`;
    const commandEndpoint = `${baseEndpoint}/executeCommand/${serverlessId}`;
    let isServerReady = false;
    PendingCallMixin$1(this);
    const waitForServerReady = async (endpoint2, serverlessId2, maxAttempts = 30) => {
      const readyEndpoint = `${endpoint2}/proxy/ready/${serverlessId2}`;
      const interval = 1e3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const response = await fetch(readyEndpoint);
          if (response.ok) {
            const data = await response.json();
            if (data.result && data.result.status === "ready") {
              isServerReady = true;
              this.executePendingCalls();
              return true;
            }
          }
        } catch (error) {
          console.log(`Attempt ${attempt}/${maxAttempts}: Server not ready yet...`);
        }
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, interval));
        }
      }
      throw new Error("Server failed to become ready within the specified timeout");
    };
    const __executeCommand = (commandName, args) => {
      args = args || [];
      const command = {
        forWhom: userId,
        name: commandName,
        pluginName,
        args,
        serverlessId,
        options
      };
      const clientResponse = new LambdaClientResponse(webhookUrl, null, "sync");
      let headers = {};
      if (options.sessionId) {
        headers = {
          "Cookie": `sessionId=${options.sessionId}`
        };
      }
      const executeRequest = () => {
        fetch(commandEndpoint, {
          method: "PUT",
          headers,
          body: JSON.stringify(command)
        }).then((response) => {
          return response.json().then((data) => {
            if (!response.ok) {
              if (data && data.result && typeof data.result === "object" && data.result.message) {
                const error = new Error(data.result.message);
                if (data.result.stack) {
                  error.stack = data.result.stack;
                }
                error.statusCode = data.statusCode || response.status;
                throw error;
              } else {
                const error = new Error(`HTTP error! status: ${response.status}`);
                error.statusCode = response.status;
                throw error;
              }
            }
            return data;
          });
        }).then((res) => {
          if (res.operationType === "restart") {
            isServerReady = false;
            this.addPendingCall(() => executeRequest());
            return;
          }
          if (!webhookUrl && (res.operationType === "slowLambda" || res.operationType === "observableLambda" || res.operationType === "cmbSlowLambda" || res.operationType === "cmbObservableLambda")) {
            throw new Error("Webhook URL is required for async operations");
          }
          if (res.operationType === "sync") {
            clientResponse._resolve(res.result);
          } else {
            clientResponse._updateOperationType(res.operationType);
            clientResponse._setCallId(res.result);
          }
        }).catch((error) => {
          clientResponse._reject(error);
        });
      };
      if (!isServerReady) {
        this.addPendingCall(() => executeRequest());
      } else {
        executeRequest();
      }
      return clientResponse;
    };
    const baseClient = {
      init: async function() {
        await waitForServerReady(endpoint, serverlessId);
        return this;
      }
    };
    return new Proxy(baseClient, {
      get(target, prop, receiver) {
        if (prop in target) {
          return target[prop];
        }
        if (prop === "then") {
          return void 0;
        }
        return (...args) => __executeCommand(prop, args);
      }
    });
  }
  var ServerlessClient_1 = ServerlessClient$1;
  function getBaseURL$1() {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "http://127.0.0.1:8080";
  }
  var getBaseURL_1 = getBaseURL$1;
  const ServerlessClient = ServerlessClient_1;
  const PendingCallMixin = PendingCallMixin_1;
  const getBaseURL = getBaseURL_1;
  async function createServerlessAPIClient(userId, endpoint, serverlessId, pluginName, webhookUrl, options) {
    const client = new ServerlessClient(userId, endpoint, serverlessId, pluginName, options);
    return await client.init();
  }
  var serverlessClient = {
    createServerlessAPIClient,
    PendingCallMixin,
    getBaseURL
  };
  const index = /* @__PURE__ */ getDefaultExportFromCjs(serverlessClient);
  const serverlessClient$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: index
  }, Symbol.toStringTag, { value: "Module" }));
  const require$$1 = /* @__PURE__ */ getAugmentedNamespace(serverlessClient$1);
  const constants$1 = constants$2;
  async function getAPIClient(userId, pluginName, serverlessId, options = {}) {
    if (!serverlessId) {
      serverlessId = constants$1.GLOBAL_SERVERLESS_ID;
    }
    if (typeof serverlessId === "object") {
      options = serverlessId;
      serverlessId = constants$1.GLOBAL_SERVERLESS_ID;
    }
    const serverless = require$$1;
    const serverlessModule = serverless.default || serverless;
    const baseURL = serverlessModule.getBaseURL();
    return await serverlessModule.createServerlessAPIClient(userId, baseURL, serverlessId, pluginName, "", options);
  }
  var utils$1 = {
    getAPIClient
  };
  var util = { exports: {} };
  var hasRequiredUtil;
  function requireUtil() {
    if (hasRequiredUtil) return util.exports;
    hasRequiredUtil = 1;
    (function(module2) {
      const constants2 = constants$2;
      function detectEnvironment() {
        if (typeof fetch === "function" && typeof document === "object") {
          return constants2.ENV_TYPE.BROWSER;
        } else if (typeof require === "function" && true && true) {
          return constants2.ENV_TYPE.NODE;
        } else {
          return constants2.ENV_TYPE.UNKNOWN;
        }
      }
      const envType2 = detectEnvironment();
      async function request(url, method = "GET", data, securityContext, headers = {}, externalRequest) {
        let init = {
          method,
          headers
        };
        if (method === "POST" || method === "PUT") {
          if (data instanceof FormData || typeof data === "function" || data instanceof ArrayBuffer || typeof Buffer !== "undefined" && Buffer.isBuffer(data) || data instanceof Uint8Array) {
            init.body = data;
          } else if (typeof data === "string") {
            init.body = data;
            init.headers["Content-Type"] = "text/plain; charset=UTF-8";
          } else {
            init.body = JSON.stringify(data);
            init.headers["Content-Type"] = "application/json; charset=UTF-8";
          }
        }
        if (envType2 === constants2.ENV_TYPE.NODE && !externalRequest) {
          url = `${process.env.BASE_URL}${url}`;
          if (securityContext && securityContext.cookies) {
            init.headers.Cookie = securityContext.cookies;
          }
        }
        const debugId = `[HTTP:${method}]`;
        try {
          const safeBodyPreview = typeof init.body === "string" ? init.body.slice(0, 500) : init.body ? "[binary/form body]" : void 0;
          const loggedHeaders = { ...init.headers };
          if (loggedHeaders.Cookie) loggedHeaders.Cookie = "[REDACTED]";
          console.log(`${debugId} Request url=${url} externalRequest=${!!externalRequest}`);
          console.log(`${debugId} Request headers=`, loggedHeaders);
          if (safeBodyPreview !== void 0) {
            console.log(`${debugId} Request body(<=500)=`, safeBodyPreview);
          }
        } catch (_) {
        }
        let response;
        const startedAt = Date.now();
        try {
          response = await fetch(url, init);
        } catch (err) {
          console.error(`${debugId} Network error: ${err.message}`);
          throw new Error(err.message);
        }
        const durationMs = Date.now() - startedAt;
        const contentType = response.headers.get("Content-Type") || "";
        console.log(`${debugId} Response status=${response.status} durationMs=${durationMs} content-type=${contentType}`);
        if (!response.ok && !contentType) {
          return;
        }
        if (contentType.includes("application/zip")) {
          return await response.blob();
        }
        if (contentType.includes("audio/") || contentType.includes("image/") || contentType.includes("video/") || contentType.includes("application/octet-stream")) {
          return await response.arrayBuffer();
        }
        if (method === "HEAD") {
          return response.ok;
        }
        if (contentType.includes("application/json")) {
          const jsonText = await response.text();
          try {
            const responseJSON = JSON.parse(jsonText);
            if (!response.ok) {
              let errorData = {
                status: response.status,
                message: responseJSON.message || response.statusText
              };
              console.error(`${debugId} JSON error response body(<=500)=`, jsonText.slice(0, 500));
              throw new Error(JSON.stringify(errorData));
            }
            return responseJSON;
          } catch (e) {
            console.error(`${debugId} JSON parse error body(<=500)=`, jsonText.slice(0, 500));
            throw e;
          }
        }
        let textResponse = await response.text();
        if (!response.ok) {
          console.error(`${debugId} Error body(<=500)=`, textResponse.slice(0, 500));
          throw new Error(textResponse);
        }
        console.log(`${debugId} Text body(<=500)=`, textResponse.slice(0, 500));
        return textResponse;
      }
      function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      }
      function unsanitize(value) {
        if (value != null && typeof value === "string") {
          return value.replace(/&nbsp;/g, " ").replace(/&#13;/g, "\n").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
        }
        return "";
      }
      function sanitize(value) {
        if (value != null && typeof value === "string") {
          return value.replace(/&/g, "&amp;").replace(/'/g, "&#39;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r\n/g, "&#13;").replace(/[\r\n]/g, "&#13;").replace(/\s/g, "&nbsp;");
        }
        return value;
      }
      async function sendRequest(url, method, data) {
        return await request(url, method, this.__securityContext, data);
      }
      async function getTaskLogs(spaceId, taskId) {
        return await this.sendRequest(`/tasks/logs/${spaceId}/${taskId}`, "GET");
      }
      async function cancelTask(taskId) {
        return await this.sendRequest(`/tasks/cancel/${taskId}`, "DELETE");
      }
      async function cancelTaskAndRemove(taskId) {
        return await this.sendRequest(`/tasks/remove/${taskId}`, "DELETE");
      }
      async function removeTask(taskId) {
        return await this.sendRequest(`/tasks/remove/${taskId}`, "DELETE");
      }
      async function downloadLogsFile(spaceId) {
        return await this.sendRequest(`/logs/${spaceId}`, "GET");
      }
      async function getTasks(spaceId) {
        return await this.sendRequest(`/tasks/space/${spaceId}`, "GET");
      }
      async function getTask(taskId) {
        return await this.sendRequest(`/tasks/${taskId}`, "GET");
      }
      async function getTaskRelevantInfo(taskId) {
        return await this.sendRequest(`/tasks/info/${taskId}`, "GET");
      }
      async function runTask(taskId) {
        return await this.sendRequest(`/tasks/${taskId}`, "POST", {});
      }
      async function runAllDocumentTasks(spaceId, documentId) {
        return await this.sendRequest(`/tasks/run-all/${spaceId}/${documentId}`, "POST", {});
      }
      async function cancelAllDocumentTasks(spaceId, documentId) {
        return await this.sendRequest(`/tasks/cancel-all/${spaceId}/${documentId}`, "DELETE");
      }
      module2.exports = {
        request,
        arrayBufferToBase64,
        cancelTask,
        getTasks,
        runTask,
        runAllDocumentTasks,
        cancelAllDocumentTasks,
        getTaskRelevantInfo,
        cancelTaskAndRemove,
        sendRequest,
        getTask,
        getTaskLogs,
        removeTask,
        downloadLogsFile,
        sanitize,
        unsanitize
      };
    })(util);
    return util.exports;
  }
  var document$2;
  var hasRequiredDocument$1;
  function requireDocument$1() {
    if (hasRequiredDocument$1) return document$2;
    hasRequiredDocument$1 = 1;
    const request = requireUtil().request;
    const envType2 = AssistOS.envType;
    const constants2 = constants$2;
    const { getAPIClient: getAPIClient2 } = utils$1;
    async function getClient(pluginName, spaceId) {
      return await getAPIClient2(this.__securityContext.userId, pluginName, spaceId, {
        email: this.__securityContext.email
      });
    }
    async function sendRequest(url, method, data) {
      return await request(url, method, data, this.__securityContext);
    }
    async function exportDocument(spaceId, documentId, exportType) {
      return await this.sendRequest(`/documents/export/${spaceId}/${documentId}`, "POST", { exportType });
    }
    async function exportDocumentAsDocx(spaceId, documentId) {
      return await this.sendRequest(`/documents/export/docx/${spaceId}/${documentId}`, "POST");
    }
    async function importDocument(spaceId, documentFormData) {
      return await this.sendRequest(`/documents/import/${spaceId}`, "POST", documentFormData);
    }
    async function getDocument(spaceId, documentId) {
      let client = await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
      return await client.getDocument(documentId);
    }
    async function loadDocument(spaceId, documentId) {
      let client = await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
      return await client.dumpDocument(documentId);
    }
    async function getDocuments(spaceId) {
      let client = await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
      return await client.getAllDocumentObjects();
    }
    async function addDocument(spaceId, title, category) {
      function createDocId(title2) {
        return title2.replace(/[^a-zA-Z0-9_]/g, "_");
      }
      let client = await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
      let docId = createDocId(title);
      return await client.createDocument(docId, category, title);
    }
    async function convertDocument(formData) {
      try {
        const init = {
          method: "POST",
          body: formData
        };
        let url = "/documents/convert";
        if (envType2 === constants2.ENV_TYPE.NODE) {
          url = `${constants2[constants2.ENVIRONMENT_MODE]}${url}`;
          init.headers = { Cookie: this.__securityContext.cookies };
        }
        const response = await fetch(url, init);
        if (!response.ok) {
          const errorText = await response.text();
          let errorDetails = errorText;
          try {
            errorDetails = JSON.parse(errorText);
          } catch (e) {
          }
          throw new Error(`HTTP error! status: ${response.status}, details: ${typeof errorDetails === "object" ? JSON.stringify(errorDetails) : errorDetails}`);
        }
        return await response.json();
      } catch (error) {
        throw error;
      }
    }
    async function uploadDoc(spaceId, docData) {
      return await this.sendRequest(`/documents/upload/${spaceId}`, "PUT", docData);
    }
    async function deleteDocument(spaceId, documentId) {
      let client = await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
      await client.deleteDocument(documentId);
    }
    async function updateDocument(spaceId, documentId, title, docId, category, infoText, commands, comments, additionalData) {
      let client = await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
      await client.updateDocument(documentId, title, docId, category, infoText, commands, comments, additionalData);
    }
    async function estimateDocumentVideoLength(spaceId, documentId) {
      let client = await this.getClient(constants2.WORKSPACE_PLUGIN, spaceId);
      return await client.estimateDocumentVideoLength(documentId);
    }
    async function documentToVideo(spaceId, documentId) {
      return await this.sendRequest(`/tasks/video/${spaceId}/${documentId}`, "POST", {});
    }
    async function getDocumentTasks(spaceId, documentId) {
      return await this.sendRequest(`/tasks/${spaceId}/${documentId}`, "GET");
    }
    async function translateDocument(spaceId, documentId, language, personalityId) {
      return await this.sendRequest(`/tasks/translate/${spaceId}/${documentId}`, "POST", { language, personalityId });
    }
    async function undoOperation(spaceId, documentId) {
      return await this.sendRequest(`/documents/undo/${spaceId}/${documentId}`, "PUT");
    }
    async function redoOperation(spaceId, documentId) {
      return await this.sendRequest(`/documents/redo/${spaceId}/${documentId}`, "PUT");
    }
    async function getDocumentSnapshot(spaceId, documentId, snapshotId) {
      await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
      return await this.sendRequest(`documents/snapshots/${spaceId}/${documentId}/${snapshotId}`, "GET");
    }
    async function getDocumentSnapshots(spaceId, documentId) {
      let client = await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
      return await client.getDocumentSnapshots(documentId);
    }
    async function addDocumentSnapshot(spaceId, documentId) {
      let client = await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
      return await client.snapshot(documentId);
    }
    async function deleteDocumentSnapshot(spaceId, documentId, snapshotId) {
      let client = await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
      return await client.deleteSnapshot(documentId, snapshotId);
    }
    async function restoreDocumentSnapshot(spaceId, documentId, snapshotId) {
      let client = await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
      return await client.restore(documentId, snapshotId);
    }
    async function getVarValue(spaceId, documentId, varId) {
      let client = await this.getClient(constants2.WORKSPACE_PLUGIN, spaceId);
      return await client.getVarValue(documentId, varId);
    }
    async function getStylePreferences(email) {
      let userInfo = await this.sendRequest(`/auth/getInfo?email=${email}`, "GET");
      return userInfo.stylePreferences || {};
    }
    async function getPrintPreferences(email) {
      let userInfo = await this.sendRequest(`/auth/getInfo?email=${email}`, "GET");
      return userInfo.printPreferences || {};
    }
    async function getExportPreferences(email) {
      let userInfo = await this.sendRequest(`/auth/getInfo?email=${email}`, "GET");
      return userInfo.exportPreferences || {};
    }
    async function updatePrintPreferences(email, printPreferences) {
      let userInfo = await this.sendRequest(`/auth/getInfo?email=${email}`, "GET");
      userInfo.printPreferences = printPreferences;
      return await this.sendRequest(`/auth/setInfo?email=${email}`, "PUT", userInfo);
    }
    async function updateExportPreferences(email, exportPreferences) {
      let userInfo = await this.sendRequest(`/auth/getInfo?email=${email}`, "GET");
      userInfo.exportPreferences = exportPreferences;
      return await this.sendRequest(`/auth/setInfo?email=${email}`, "PUT", userInfo);
    }
    async function updateDocumentPreferences(email, stylePreferences) {
      let userInfo = await this.sendRequest(`/auth/getInfo?email=${email}`, "GET");
      userInfo.stylePreferences = stylePreferences;
      return await this.sendRequest(`/auth/setInfo?email=${email}`, "PUT", userInfo);
    }
    async function updateDocId(spaceId, documentId, docId) {
      let client = await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
      return await client.updateDocId(documentId, docId);
    }
    async function setVarValue(spaceId, documentId, variableName, value) {
      let client = await this.getClient(constants2.WORKSPACE_PLUGIN, spaceId);
      return await client.setVarValue(documentId, variableName, value);
    }
    async function getDocCommandsParsed(spaceId, docId) {
      let client = await this.getClient(constants2.WORKSPACE_PLUGIN, spaceId);
      return await client.getDocCommandsParsed(docId);
    }
    document$2 = {
      getClient,
      getPrintPreferences,
      getStylePreferences,
      getExportPreferences,
      updatePrintPreferences,
      updateExportPreferences,
      updateDocumentPreferences,
      loadDocument,
      getDocuments,
      getDocument,
      addDocument,
      updateDocument,
      deleteDocument,
      sendRequest,
      documentToVideo,
      estimateDocumentVideoLength,
      getDocumentTasks,
      exportDocument,
      importDocument,
      exportDocumentAsDocx,
      translateDocument,
      undoOperation,
      redoOperation,
      getDocumentSnapshot,
      getDocumentSnapshots,
      addDocumentSnapshot,
      deleteDocumentSnapshot,
      restoreDocumentSnapshot,
      convertDocument,
      uploadDoc,
      getVarValue,
      updateDocId,
      setVarValue,
      getDocCommandsParsed
    };
    return document$2;
  }
  var chapter;
  var hasRequiredChapter;
  function requireChapter() {
    if (hasRequiredChapter) return chapter;
    hasRequiredChapter = 1;
    const { getAPIClient: getAPIClient2 } = utils$1;
    const constants2 = constants$2;
    async function getClient(pluginName, spaceId) {
      return await getAPIClient2(this.__securityContext.userId, pluginName, spaceId, {
        email: this.__securityContext.email
      });
    }
    async function getChapter(spaceId, documentId, chapterId) {
      let client = await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
      return await client.getChapter(documentId, chapterId);
    }
    async function addChapter(spaceId, documentId, chapterTitle, commands, comments, position) {
      let client = await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
      return await client.createChapter(documentId, chapterTitle, commands, comments, position);
    }
    async function updateChapter(spaceId, chapterId, chapterTitle, commands, comments, additionalData) {
      let client = await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
      return await client.updateChapter(chapterId, chapterTitle, comments, commands, additionalData);
    }
    async function deleteChapter(spaceId, documentId, chapterId) {
      let client = await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
      return await client.deleteChapter(documentId, chapterId);
    }
    async function changeChapterOrder(spaceId, documentId, chapterId, position) {
      let client = await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
      return await client.changeChapterOrder(documentId, chapterId, position);
    }
    async function compileChapterVideo(spaceId, documentId, chapterId) {
      return await this.sendRequest(`/tasks/video/${spaceId}/${documentId}/${chapterId}`, "POST", {});
    }
    chapter = {
      getChapter,
      addChapter,
      updateChapter,
      deleteChapter,
      changeChapterOrder,
      compileChapterVideo,
      getClient
    };
    return chapter;
  }
  var paragraph;
  var hasRequiredParagraph;
  function requireParagraph() {
    if (hasRequiredParagraph) return paragraph;
    hasRequiredParagraph = 1;
    const { getAPIClient: getAPIClient2 } = utils$1;
    const constants2 = constants$2;
    async function getClient(pluginName, spaceId) {
      return await getAPIClient2(this.__securityContext.userId, pluginName, spaceId, {
        email: this.__securityContext.email
      });
    }
    async function getParagraph(spaceId, paragraphId) {
      let client = await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
      return await client.getParagraph(paragraphId);
    }
    async function addParagraph(spaceId, chapterId, paragraphText, commands, comments, position) {
      let client = await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
      return await client.createParagraph(chapterId, paragraphText, commands, comments, position);
    }
    async function updateParagraph(spaceId, chapterId, paragraphId, paragraphText, commands, comments, additionalData) {
      let client = await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
      return await client.updateParagraph(chapterId, paragraphId, paragraphText, commands, comments, additionalData);
    }
    async function deleteParagraph(spaceId, chapterId, paragraphId) {
      let client = await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
      return await client.deleteParagraph(chapterId, paragraphId);
    }
    async function changeParagraphOrder(spaceId, chapterId, paragraphId, position) {
      let client = await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
      return await client.changeParagraphOrder(chapterId, paragraphId, position);
    }
    async function chatCompleteParagraph({ spaceId, documentId, paragraphId, prompt, modelName = void 0, agentId = void 0 }) {
      if (spaceId === void 0) throw new Error("Parameter 'spaceId' is required");
      if (documentId === void 0) throw new Error("Parameter 'documentId' is required");
      if (paragraphId === void 0) throw new Error("Parameter 'paragraphId' is required");
      if (prompt === void 0) throw new Error("Parameter 'prompt' is required");
      if (modelName === void 0 && agentId === void 0) throw new Error("Either 'modelName' or 'agentId' must be defined");
      return this.sendRequest(`/spaces/chat-completion/${spaceId}/${documentId}/${paragraphId}`, "POST", {
        modelName,
        prompt,
        agentId
      });
    }
    async function createTextToSpeechTask(spaceId, documentId, paragraphId) {
      return await this.sendRequest(`/tasks/audio/${spaceId}/${documentId}/${paragraphId}`, "POST", {});
    }
    async function createLipSyncTask(spaceId, documentId, paragraphId, modelName, configs) {
      return await this.sendRequest(`/tasks/lipsync/${spaceId}/${documentId}/${paragraphId}`, "POST", {
        modelName,
        ...configs || {}
      });
    }
    async function createParagraphCompileVideoTask(spaceId, documentId, chapterId, paragraphId) {
      return await this.sendRequest(`/tasks/video/${spaceId}/${documentId}/${chapterId}/${paragraphId}`, "POST", {});
    }
    paragraph = {
      getParagraph,
      addParagraph,
      updateParagraph,
      deleteParagraph,
      changeParagraphOrder,
      createTextToSpeechTask,
      createLipSyncTask,
      createParagraphCompileVideoTask,
      chatCompleteParagraph,
      getClient
    };
    return paragraph;
  }
  var document$1;
  var hasRequiredDocument;
  function requireDocument() {
    if (hasRequiredDocument) return document$1;
    hasRequiredDocument = 1;
    const documentAPIs = requireDocument$1();
    const chapterAPIs = requireChapter();
    const paragraphAPIs = requireParagraph();
    document$1 = {
      ...documentAPIs,
      ...chapterAPIs,
      ...paragraphAPIs
    };
    return document$1;
  }
  var space;
  var hasRequiredSpace;
  function requireSpace() {
    if (hasRequiredSpace) return space;
    hasRequiredSpace = 1;
    const { request } = requireUtil();
    const { getAPIClient: getAPIClient2 } = utils$1;
    const constants2 = constants$2;
    async function getClient(pluginName, spaceId) {
      return await getAPIClient2(this.__securityContext.userId, pluginName, spaceId, {
        email: this.__securityContext.email,
        sessionId: this.__securityContext.sessionId
      });
    }
    async function sendRequest(url, method, data, headers, externalRequest) {
      return await request(url, method, data, this.__securityContext, headers, externalRequest);
    }
    async function getSpaceChat(spaceId, chatId) {
      return await this.sendRequest(`/spaces/chat/${spaceId}/${chatId}`, "GET");
    }
    async function addSpaceChatMessage(spaceId, chatId, messageData) {
      return await this.sendRequest(`/spaces/chat/${spaceId}/${chatId}`, "POST", messageData);
    }
    async function resetSpaceChat(spaceId, chatId) {
      return await this.sendRequest(`/spaces/chat/${spaceId}/${chatId}`, "DELETE");
    }
    async function saveSpaceChat(spaceId, chatId) {
      return await this.sendRequest(`/spaces/chat/save/${spaceId}/${chatId}`, "POST");
    }
    async function createSpace(spaceName, email) {
      return await this.sendRequest(`/spaces`, "POST", { spaceName, email });
    }
    async function getSpaceStatus(spaceId) {
      let requestURL = spaceId ? `/spaces/${spaceId}` : `/spaces`;
      return await this.sendRequest(requestURL, "GET");
    }
    async function deleteSpace(spaceId) {
      return await this.sendRequest(`/spaces/${spaceId}`, "DELETE");
    }
    async function deleteSecret(spaceId, secretKey) {
      return await this.sendRequest(`/spaces/${spaceId}/secrets/delete`, "PUT", { secretKey });
    }
    async function addSecret(spaceId, secretKey, value) {
      return await this.sendRequest(`/spaces/${spaceId}/secrets`, "POST", { secretKey, value });
    }
    async function editSecret(spaceId, secretKey, value) {
      return await this.sendRequest(`/spaces/${spaceId}/secrets`, "PUT", { secretKey, value });
    }
    async function getSecretsMasked(spaceId) {
      return await this.sendRequest(`/spaces/${spaceId}/secrets`, "GET");
    }
    async function getCollaborators(spaceId) {
      let client = await this.getClient(constants2.WORKSPACE_PLUGIN, spaceId);
      return await client.getCollaborators();
    }
    async function removeCollaborator(referrerEmail, spaceId, email) {
      let adminClient = await this.getClient(constants2.ASSISTOS_ADMIN_PLUGIN);
      await adminClient.unlinkSpaceFromUser(referrerEmail, email, spaceId);
      let localClient = await this.getClient(constants2.WORKSPACE_PLUGIN, spaceId);
      return await localClient.removeCollaborator(email);
    }
    async function addCollaborators(referrerEmail, spaceId, collaborators, spaceName) {
      let client = await this.getClient(constants2.WORKSPACE_PLUGIN, spaceId);
      let userEmails = collaborators.map((user2) => user2.email);
      let userModule = AssistOS.loadModule("user", this.__securityContext);
      const validEmails = [];
      for (let index2 = 0; index2 < userEmails.length; index2++) {
        const email = userEmails[index2];
        let result = await userModule.getPublicAuthInfo(email);
        if (!result || !result.userExists) {
          assistOS.showToast(`Failed to invite ${email} to space. User doesn't have an account!`, "error", 3e3);
        } else {
          validEmails.push(email);
        }
      }
      if (validEmails.length === 0) {
        return [];
      }
      const adminClient = await this.getClient(constants2.ASSISTOS_ADMIN_PLUGIN);
      await adminClient.addSpaceToUsers(validEmails, spaceId, referrerEmail);
      return await client.addCollaborators(referrerEmail, collaborators, spaceId, spaceName);
    }
    async function setCollaboratorRole(spaceId, email, role) {
      let client = await this.getClient(constants2.WORKSPACE_PLUGIN, spaceId);
      return await client.setCollaboratorRole(email, role);
    }
    async function importPersonality(spaceId, personalityFormData) {
      return await this.sendRequest(`/spaces/${spaceId}/import/personalities`, "POST", personalityFormData);
    }
    async function getImageURL(imageId) {
      return await this.getFileURL(imageId, "image/png");
    }
    async function getAudioURL(audioId) {
      return await this.getFileURL(audioId, "audio/mp3");
    }
    async function getVideoURL(videoId) {
      return await this.getFileURL(videoId, "video/mp4");
    }
    async function getFileURL(fileId, type) {
      const downloadData = await this.sendRequest(`/spaces/downloads/${fileId}`, "GET", null, { "Content-Type": type });
      return downloadData.downloadURL;
    }
    async function getAudioHead(audioId) {
      return await this.headFile(audioId, "audio/mp3");
    }
    async function getImageHead(imageId) {
      return await this.headFile(imageId, "image/png");
    }
    async function getVideoHead(videoId) {
      return await this.headFile(videoId, "video/mp4");
    }
    async function headFile(fileId, type) {
      return await this.sendRequest(`/spaces/files/${fileId}`, "HEAD", null, { "Content-Type": type });
    }
    async function getAudio(audioId) {
      return await this.getFile(audioId, "audio/mp3");
    }
    async function getImage(imageId) {
      return await this.getFile(imageId, "image/png");
    }
    async function getVideo(videoId, range) {
      return await this.getFile(videoId, "video/mp4", range);
    }
    async function getFile(fileId, type, range) {
      const downloadData = await this.sendRequest(`/spaces/downloads/${fileId}`, "GET", null, { "Content-Type": type });
      let headers = {};
      if (range) {
        headers.Range = range;
      }
      return await this.sendRequest(downloadData.downloadURL, "GET", null, headers, downloadData.externalRequest);
    }
    async function putAudio(audio) {
      return await this.putFile(audio, "audio/mp3");
    }
    async function putImage(image) {
      return await this.putFile(image, "image/png");
    }
    async function putVideo(video) {
      return await this.putFile(video, "video/mp4");
    }
    async function putFile(file, type) {
      const uploadData = await this.sendRequest(`/spaces/uploads`, "GET", null, { "Content-Type": type });
      await this.sendRequest(uploadData.uploadURL, "PUT", file, {
        "Content-Type": type,
        "Content-Length": file.byteLength
      }, uploadData.externalRequest);
      return uploadData.fileId;
    }
    async function deleteImage(imageId) {
      return await this.deleteFile(imageId, "image/png");
    }
    async function deleteAudio(audioId) {
      return await this.deleteFile(audioId, "audio/mp3");
    }
    async function deleteVideo(videoId) {
      return await this.deleteFile(videoId, "video/mp4");
    }
    async function deleteFile(fileId, type) {
      return await this.sendRequest(`/spaces/files/${fileId}`, "DELETE", null, { "Content-Type": type });
    }
    async function startTelegramBot(spaceId, personalityId, botId) {
      return await this.sendRequest(`/telegram/startBot/${spaceId}/${personalityId}`, "POST", botId);
    }
    async function removeTelegramUser(spaceId, personalityId, telegramUserId) {
      return await this.sendRequest(`/telegram/auth/${spaceId}/${personalityId}`, "PUT", telegramUserId);
    }
    async function runCode(spaceId, commands, args) {
      let client = await this.getClient(constants2.WORKSPACE_PLUGIN, spaceId);
      await client.runCode(commands, ...args);
      await client.buildAll();
    }
    async function buildAll(spaceId) {
      let client = await this.getClient(constants2.WORKSPACE_PLUGIN, spaceId);
      await client.buildAll();
    }
    async function getGraph(spaceId) {
      let client = await this.getClient(constants2.WORKSPACE_PLUGIN, spaceId);
      return await client.getGraph();
    }
    async function getVariables(spaceId) {
      let client = await this.getClient(constants2.WORKSPACE_PLUGIN, spaceId);
      return await client.getEveryVariableObject();
    }
    async function getErrorsFromLastBuild(spaceId) {
      let client = await this.getClient(constants2.WORKSPACE_PLUGIN, spaceId);
      return await client.getErrorFromLastBuild();
    }
    async function defineVariable(spaceId, name, type, documentId, chapterId, paragraphId, command) {
      let client = await this.getClient(constants2.WORKSPACE_PLUGIN, spaceId);
      return await client.defineVariable(name, type, documentId, chapterId, paragraphId, command);
    }
    async function buildForDocument(spaceId, documentId) {
      let client = await this.getClient(constants2.WORKSPACE_PLUGIN, spaceId);
      return await client.buildOnlyForDocument(documentId);
    }
    async function restartServerless(spaceId) {
      return await this.sendRequest(`/spaces/${spaceId}/restart`, "PUT", {});
    }
    async function getCommands(spaceId) {
      let client = await this.getClient(constants2.WORKSPACE_PLUGIN, spaceId);
      return await client.getCommands();
    }
    async function getCustomTypes(spaceId) {
      let client = await this.getClient(constants2.WORKSPACE_PLUGIN, spaceId);
      return await client.getCustomTypes();
    }
    async function insertTableRow(spaceId, docId, varName, row, position) {
      let client = await this.getClient(constants2.TABLE_PLUGIN, spaceId);
      return await client.insert(docId, varName, row, position);
    }
    async function updateTableRow(spaceId, docId, varName, row) {
      let client = await this.getClient(constants2.TABLE_PLUGIN, spaceId);
      return await client.updateRow(docId, varName, row);
    }
    async function deleteTableRow(spaceId, docId, varName, rowId) {
      let client = await this.getClient(constants2.TABLE_PLUGIN, spaceId);
      return await client.deleteRow(docId, varName, rowId);
    }
    async function getMatchingSpaces(input) {
      let client = await this.getClient(constants2.ASSISTOS_ADMIN_PLUGIN);
      let spaces = await client.getMatchingSpaces(input);
      let spacesDetails = [];
      for (let space2 of spaces) {
        let spaceClient = await this.getClient(constants2.WORKSPACE_PLUGIN, space2.id);
        let workspace = await spaceClient.getWorkspaceInfo(space2.id);
        workspace.name = space2.name;
        spacesDetails.push(workspace);
      }
      return spacesDetails;
    }
    async function getSpaces(offset, limit) {
      let client = await this.getClient(constants2.ASSISTOS_ADMIN_PLUGIN);
      let spaces = await client.getSpaces(offset, limit);
      let spacesDetails = [];
      for (let space2 of spaces) {
        let spaceClient = await this.getClient(constants2.WORKSPACE_PLUGIN, space2.id);
        let workspace = await spaceClient.getWorkspaceInfo(space2.id);
        workspace.name = space2.name;
        spacesDetails.push(workspace);
      }
      return spacesDetails;
    }
    async function getSpacesCount() {
      let client = await this.getClient(constants2.ASSISTOS_ADMIN_PLUGIN);
      return await client.getSpacesCount();
    }
    async function getAllDocumentsCount() {
      let client = await this.getClient(constants2.ASSISTOS_ADMIN_PLUGIN);
      let spaceIds = await client.listAllSpaces();
      let documentsCount = 0;
      for (let spaceId of spaceIds) {
        let spaceClient = await this.getClient(constants2.DOCUMENTS_PLUGIN, spaceId);
        let documents = await spaceClient.getAllDocuments();
        documentsCount += documents.length;
      }
      return documentsCount;
    }
    space = {
      getClient,
      createSpace,
      getSpaceStatus,
      deleteSpace,
      editSecret,
      addSecret,
      deleteSecret,
      addSpaceChatMessage,
      addCollaborators,
      sendRequest,
      getSecretsMasked,
      putImage,
      deleteImage,
      putAudio,
      getAudio,
      deleteAudio,
      importPersonality,
      deleteVideo,
      putVideo,
      getVideo,
      getSpaceChat,
      getAudioHead,
      getImageHead,
      getImage,
      getVideoHead,
      getAudioURL,
      getVideoURL,
      getImageURL,
      getCollaborators,
      setCollaboratorRole,
      removeCollaborator,
      saveSpaceChat,
      resetSpaceChat,
      putFile,
      headFile,
      deleteFile,
      getFile,
      getFileURL,
      startTelegramBot,
      removeTelegramUser,
      runCode,
      buildAll,
      getGraph,
      getVariables,
      getErrorsFromLastBuild,
      defineVariable,
      buildForDocument,
      restartServerless,
      getCommands,
      getCustomTypes,
      insertTableRow,
      updateTableRow,
      deleteTableRow,
      getMatchingSpaces,
      getSpaces,
      getSpacesCount,
      getAllDocumentsCount
    };
    return space;
  }
  var user;
  var hasRequiredUser;
  function requireUser() {
    if (hasRequiredUser) return user;
    hasRequiredUser = 1;
    const { request } = requireUtil();
    const { getAPIClient: getAPIClient2 } = utils$1;
    const constants2 = constants$2;
    async function sendRequest(url, method, data, headers) {
      return await request(url, method, data, this.__securityContext, headers);
    }
    async function getClient(pluginName, spaceId) {
      return await getAPIClient2(this.__securityContext.userId, pluginName, spaceId, {
        email: this.__securityContext.email
      });
    }
    async function loadUser(email) {
      let url = "/auth/getInfo";
      if (email) {
        url += `?email=${encodeURIComponent(email)}`;
      }
      let userInfo = await this.sendRequest(url, "GET");
      let client = await this.getClient(constants2.ADMIN_PLUGIN);
      let role = await client.getUserRole(userInfo.email);
      return {
        email: userInfo.email,
        currentSpaceId: userInfo.currentSpaceId,
        spaces: userInfo.spaces,
        imageId: userInfo.imageId,
        role,
        id: userInfo.globalUserId
      };
    }
    async function getGlobalRoles() {
      let client = await this.getClient(constants2.ADMIN_PLUGIN);
      return await client.getRoles();
    }
    async function listUserSpaces(email) {
      let url = "/spaces/listSpaces";
      if (email) {
        url += `?email=${encodeURIComponent(email)}`;
      }
      return await this.sendRequest(url, "GET");
    }
    async function getUserProfileImage(email) {
      email = encodeURIComponent(email);
      let userInfo = await this.sendRequest(`/auth/getInfo?email=${email}`, "GET");
      let spaceModule = AssistOS.loadModule("space", this.__securityContext);
      return await spaceModule.getImage(userInfo.imageId);
    }
    async function updateUserImage(email, imageId) {
      email = encodeURIComponent(email);
      let userInfo = await this.sendRequest(`/auth/getInfo?email=${email}`, "GET");
      userInfo.imageId = imageId;
      return await this.sendRequest(`/auth/setInfo?email=${email}`, "PUT", userInfo);
    }
    async function getCurrentSpaceId(email) {
      email = encodeURIComponent(email);
      let userInfo = await this.sendRequest(`/auth/getInfo?email=${email}`, "GET");
      return userInfo.currentSpaceId;
    }
    async function logoutUser() {
      return await this.sendRequest(`/auth/logout`, "POST");
    }
    async function createGuestUser() {
      let client = await this.getClient(constants2.ADMIN_PLUGIN);
      return await client.createGuestUser();
    }
    async function emailLogin(email, code) {
      return await this.sendRequest(`/auth/loginWithEmailCode`, "POST", { email, code });
    }
    async function passkeyLogin(email, assertion, challengeKey) {
      return await this.sendRequest(`/auth/loginWithPasskey`, "POST", { email, assertion, challengeKey });
    }
    async function totpLogin(email, code) {
      return await this.sendRequest(`/auth/loginWithTotp`, "POST", { email, token: code });
    }
    async function generateAuthCode(email, name, refererId) {
      return await this.sendRequest(`/auth/sendCodeByEmail`, "POST", { email, name, refererId });
    }
    async function setupTotp() {
      return await this.sendRequest(`/auth/setupTotp`, "POST");
    }
    async function enableTotp(token, email) {
      return await this.sendRequest(`/auth/enableTotp`, "POST", {
        token,
        email
      });
    }
    async function getPublicAuthInfo(email) {
      email = encodeURIComponent(email);
      return await this.sendRequest(`/auth/getPublicAuthInfo/${email}`, "GET");
    }
    async function generatePasskeyLoginOptions(email) {
      email = encodeURIComponent(email);
      return await this.sendRequest(`/auth/generatePasskeyLoginOptions/${email}`, "GET");
    }
    async function generatePasskeySetupOptions() {
      return await this.sendRequest(`/auth/generatePasskeySetupOptions`, "POST");
    }
    async function addPasskey(registrationData, challengeKey) {
      return await this.sendRequest(`/auth/addPasskey`, "POST", {
        registrationData,
        challengeKey
      });
    }
    async function deletePasskey(email, credentialId) {
      return await this.sendRequest(`/auth/deletePasskey/${encodeURIComponent(email)}/${encodeURIComponent(credentialId)}`, "DELETE");
    }
    async function deleteTotp(email) {
      return await this.sendRequest(`/auth/deleteTotp/${encodeURIComponent(email)}`, "DELETE");
    }
    async function getUserLogs(email) {
      let client = await this.getClient(constants2.USER_LOGGER_PLUGIN);
      return await client.getUserLogs(email);
    }
    async function getUsers(offset, limit) {
      let client = await this.getClient(constants2.ADMIN_PLUGIN);
      return await client.getUsers(offset, limit);
    }
    async function getUsersCount() {
      let client = await this.getClient(constants2.ADMIN_PLUGIN);
      return await client.getUsersCount();
    }
    async function setUserRole(email, role) {
      let client = await this.getClient(constants2.ADMIN_PLUGIN);
      return await client.setUserRole(email, role);
    }
    async function blockUser(email) {
      let client = await this.getClient(constants2.ADMIN_PLUGIN);
      return await client.blockUser(email);
    }
    async function unblockUser(email) {
      let client = await this.getClient(constants2.ADMIN_PLUGIN);
      return await client.unblockUser(email);
    }
    async function deleteUser(email) {
      let client = await this.getClient(constants2.ADMIN_PLUGIN);
      return await client.deleteUser(email);
    }
    async function getMatchingUsers(input) {
      let client = await this.getClient(constants2.ADMIN_PLUGIN);
      return await client.getMatchingUsers(input);
    }
    async function createTicket(email, subject, message) {
      let client = await this.getClient(constants2.TICKETS_PLUGIN);
      return await client.createTicket(email, subject, message);
    }
    async function resolveTicket(ticketId, resolutionMessage) {
      let client = await this.getClient(constants2.TICKETS_PLUGIN);
      return await client.resolveTicket(ticketId, resolutionMessage);
    }
    async function getTicketsCount() {
      let client = await this.getClient(constants2.TICKETS_PLUGIN);
      return await client.getTicketsCount();
    }
    async function getTickets(offset, limit) {
      let client = await this.getClient(constants2.TICKETS_PLUGIN);
      return await client.getTickets(offset, limit);
    }
    async function getUnresolvedTicketsCount() {
      let client = await this.getClient(constants2.TICKETS_PLUGIN);
      return await client.getUnresolvedTicketsCount();
    }
    async function getUserTickets(email) {
      let client = await this.getClient(constants2.TICKETS_PLUGIN);
      return await client.getUserTickets(email);
    }
    async function getOwnTickets(email) {
      let client = await this.getClient(constants2.TICKETS_PLUGIN);
      return await client.getOwnTickets(email);
    }
    user = {
      loadUser,
      sendRequest,
      getUserProfileImage,
      updateUserImage,
      logoutUser,
      emailLogin,
      passkeyLogin,
      totpLogin,
      generateAuthCode,
      getCurrentSpaceId,
      listUserSpaces,
      setupTotp,
      createGuestUser,
      enableTotp,
      generatePasskeySetupOptions,
      getPublicAuthInfo,
      generatePasskeyLoginOptions,
      addPasskey,
      deletePasskey,
      deleteTotp,
      getClient,
      getUserLogs,
      getUsers,
      getUsersCount,
      setUserRole,
      blockUser,
      unblockUser,
      deleteUser,
      getGlobalRoles,
      getMatchingUsers,
      createTicket,
      resolveTicket,
      getTicketsCount,
      getTickets,
      getOwnTickets,
      getUnresolvedTicketsCount,
      getUserTickets
    };
    return user;
  }
  var agent;
  var hasRequiredAgent;
  function requireAgent() {
    if (hasRequiredAgent) return agent;
    hasRequiredAgent = 1;
    const { getAPIClient: getAPIClient2 } = utils$1;
    const constants2 = constants$2;
    async function getClient(pluginName, spaceId) {
      return await getAPIClient2(this.__securityContext.userId, pluginName, spaceId, {
        email: this.__securityContext.email
      });
    }
    async function getAgents(spaceId) {
      let client = await this.getClient(constants2.AGENT_PLUGIN, spaceId);
      return await client.getAllAgentObjects();
    }
    async function getAgent(spaceId, agentId) {
      let client = await this.getClient(constants2.AGENT_PLUGIN, spaceId);
      return await client.getAgent(agentId);
    }
    async function getDefaultAgent(spaceId) {
      return await this.getAgent(spaceId, constants2.DEFAULT_AGENT);
    }
    async function addAgent(spaceId, agentData) {
      let client = await this.getClient(constants2.AGENT_PLUGIN, spaceId);
      let agent2 = await client.createAgent(agentData.name, agentData.description, "", agentData.imageId);
      await this.getClient(constants2.CHAT_ROOM_PLUGIN, spaceId);
      return agent2;
    }
    async function updateAgent(spaceId, agentId, agentData) {
      let client = await this.getClient(constants2.AGENT_PLUGIN, spaceId);
      return await client.updateAgent(agentId, agentData);
    }
    async function deleteAgent(spaceId, agentId) {
      let client = await this.getClient(constants2.AGENT_PLUGIN, spaceId);
      return await client.deleteAgent(agentId);
    }
    async function exportAgent(spaceId, agentId) {
      let client = await this.getClient(constants2.AGENT_PLUGIN, spaceId);
      return await client.exportAgent(agentId);
    }
    async function getAgentNames(spaceId) {
      let client = await this.getClient(constants2.AGENT_PLUGIN, spaceId);
      return await client.getAgentNames();
    }
    agent = {
      exportAgent,
      addAgent,
      updateAgent,
      deleteAgent,
      getAgent,
      getAgents,
      getDefaultAgent,
      getClient,
      getAgentNames
    };
    return agent;
  }
  var llm;
  var hasRequiredLlm;
  function requireLlm() {
    if (hasRequiredLlm) return llm;
    hasRequiredLlm = 1;
    const { getAPIClient: getAPIClient2 } = utils$1;
    const constants2 = constants$2;
    async function getClient(pluginName, spaceId) {
      return await getAPIClient2(this.__securityContext.userId, pluginName, spaceId, {
        email: this.__securityContext.email
      });
    }
    const getModels = async function({ spaceId }) {
      let client = await this.getClient(constants2.LLM_PLUGIN, spaceId);
      return await client.getModels();
    };
    const getProviderModels = async function({ spaceId, provider }) {
      let client = await this.getClient(constants2.LLM_PLUGIN, spaceId);
      return await client.getProviderModels({ provider });
    };
    const getTextResponse = async function({ spaceId, provider, apiKey, model, prompt, options = {} }) {
      let client = await this.getClient(constants2.LLM_PLUGIN, spaceId);
      return await client.getTextResponse({
        provider,
        apiKey,
        model,
        prompt,
        options
      });
    };
    const getTextStreamingResponse = async function({ spaceId, provider, apiKey, model, prompt, options = {}, onDataChunk }) {
      let client = await this.getClient(constants2.LLM_PLUGIN, spaceId);
      return await client.getTextStreamingResponse({
        provider,
        apiKey,
        model,
        prompt,
        options,
        onDataChunk
      });
    };
    const getChatCompletionResponse = async function({ spaceId, provider, apiKey, model, messages, options = {} }) {
      let client = await this.getClient(constants2.LLM_PLUGIN, spaceId);
      return await client.getChatCompletionResponse({
        provider,
        apiKey,
        model,
        messages,
        options
      });
    };
    const getChatCompletionStreamingResponse = async ({ spaceId, provider, apiKey, model, messages, options = {}, onDataChunk }) => {
      let client = await this.getClient(constants2.LLM_PLUGIN, spaceId);
      return await client.getChatCompletionStreamingResponse({
        provider,
        apiKey,
        model,
        messages,
        options,
        onDataChunk
      });
    };
    llm = {
      getClient,
      getModels,
      getProviderModels,
      getTextResponse,
      getTextStreamingResponse,
      getChatCompletionResponse,
      getChatCompletionStreamingResponse
    };
    return llm;
  }
  var application;
  var hasRequiredApplication;
  function requireApplication() {
    if (hasRequiredApplication) return application;
    hasRequiredApplication = 1;
    const request = requireUtil().request;
    let { getAPIClient: getAPIClient2 } = utils$1;
    const { addSecret } = requireSpace();
    const constants2 = constants$2;
    async function sendRequest(url, method, data) {
      return await request(url, method, data, this.__securityContext);
    }
    async function getClient(pluginName, serverlessId) {
      return await getAPIClient2(this.__securityContext.userId, pluginName, serverlessId, {
        email: this.__securityContext.email,
        authToken: this.__securityContext.authToken,
        sessionId: this.__securityContext.sessionId
      });
    }
    async function installSystemApp(appName) {
      let client = await this.getClient(constants2.ASSISTOS_ADMIN_PLUGIN);
      return await client.installSystemApp(appName);
    }
    async function updateSystemApp(appName) {
      let client = await this.getClient(constants2.ASSISTOS_ADMIN_PLUGIN);
      return await client.updateApplication(appName);
    }
    async function requiresUpdateSystemApp(appName) {
      let client = await this.getClient(constants2.ASSISTOS_ADMIN_PLUGIN);
      return await client.requiresUpdate(appName);
    }
    async function installApplication(spaceId, applicationId) {
      let client = await this.getClient(constants2.APPLICATION_PLUGIN, spaceId);
      await client.installApplication(applicationId);
      const applicationManifest = await client.getApplicationManifest(applicationId);
      const promises = [];
      if ((applicationManifest == null ? void 0 : applicationManifest.secrets) && Array.isArray(applicationManifest.secrets)) {
        for (let i = 0; i < applicationManifest.secrets.length; i++) {
          const secret = applicationManifest.secrets[i];
          promises.push(addSecret.call(this, spaceId, secret.provider, secret.keyName, ""));
        }
      }
      return await Promise.all(promises);
    }
    async function uninstallApplication(spaceId, applicationId) {
      let client = await this.getClient(constants2.APPLICATION_PLUGIN, spaceId);
      return await client.uninstallApplication(applicationId);
    }
    async function getApplicationManifest(spaceId, applicationId) {
      let client = await this.getClient(constants2.APPLICATION_PLUGIN, spaceId);
      return await client.getApplicationManifest(applicationId);
    }
    async function getAvailableApps(spaceId) {
      let client = await this.getClient(constants2.APPLICATION_PLUGIN, spaceId);
      return await client.getAvailableApps();
    }
    async function getApplications(spaceId) {
      let client = await this.getClient(constants2.APPLICATION_PLUGIN, spaceId);
      return await client.getApplications();
    }
    async function updateApplication(spaceId, applicationId) {
      let client = await this.getClient(constants2.APPLICATION_PLUGIN, spaceId);
      return await client.updateApplication(applicationId);
    }
    async function requiresUpdate(spaceId, applicationId) {
      let client = await this.getClient(constants2.APPLICATION_PLUGIN, spaceId);
      return await client.requiresUpdate(spaceId, applicationId);
    }
    async function getApplicationFile(spaceId, applicationId, relativeAppFilePath) {
      const pathSegments = relativeAppFilePath.split("/").map((segment) => encodeURIComponent(segment));
      const encodedPath = pathSegments.join("/");
      const pathParts = relativeAppFilePath.split(".");
      const type = pathParts[pathParts.length - 1].toLowerCase();
      if (type !== "js") {
        let response = await fetch(`/applications/files/${spaceId}/${applicationId}/${encodedPath}`, {
          method: "GET",
          credentials: "include"
        });
        return await response.text();
      } else {
        return await Promise.resolve({ default: {} });
      }
    }
    async function getApplicationTasks(spaceId, applicationId) {
      let client = await this.getClient(constants2.APPLICATION_PLUGIN, spaceId);
      return await client.getApplicationTasks(applicationId);
    }
    async function getApplicationsPlugins(spaceId) {
      let client = await this.getClient(constants2.APPLICATION_PLUGIN, spaceId);
      return await client.getApplicationsPlugins();
    }
    application = {
      getClient,
      installApplication,
      uninstallApplication,
      getAvailableApps,
      getApplicationManifest,
      getApplicationFile,
      sendRequest,
      updateApplication,
      requiresUpdate,
      getApplicationTasks,
      getApplicationsPlugins,
      getApplications,
      installSystemApp,
      updateSystemApp,
      requiresUpdateSystemApp
    };
    return application;
  }
  var chat;
  var hasRequiredChat;
  function requireChat() {
    if (hasRequiredChat) return chat;
    hasRequiredChat = 1;
    const { getAPIClient: getAPIClient2 } = utils$1;
    const { CHAT_ROOM_PLUGIN } = constants$2;
    const constants2 = constants$2;
    async function getClient(pluginName, spaceId) {
      return await getAPIClient2(this.__securityContext.userId, pluginName, spaceId, {
        email: this.__securityContext.email
      });
    }
    async function getChat(spaceId, chatId) {
      const client = await this.getClient(CHAT_ROOM_PLUGIN, spaceId);
      return await client.getChat(chatId);
    }
    async function getChats(spaceId) {
      const client = await this.getClient(CHAT_ROOM_PLUGIN, spaceId);
      return await client.getChats();
    }
    async function getChatHistory(spaceId, chatId) {
      const client = await this.getClient(CHAT_ROOM_PLUGIN, spaceId);
      return await client.getChatHistory(chatId);
    }
    async function getChatContext(spaceId, chatId) {
      const client = await this.getClient(CHAT_ROOM_PLUGIN, spaceId);
      return await client.getChatContext(chatId);
    }
    const getUserChats = async function(spaceId, email) {
      const client = await this.getClient(CHAT_ROOM_PLUGIN, spaceId);
      return client.getUserChats(email);
    };
    const createChat = async function(spaceId, email, docId, scriptName, args) {
      const client = await this.getClient(CHAT_ROOM_PLUGIN, spaceId);
      return await client.createChat(email, docId, scriptName, args);
    };
    const createDefaultChat = async function(spaceId, email, docId, scriptName, args) {
      const client = await this.getClient(CHAT_ROOM_PLUGIN, spaceId);
      return await client.createDefaultChat(email, docId, scriptName, args);
    };
    async function deleteChat(spaceId, chatId) {
      const client = await this.getClient(CHAT_ROOM_PLUGIN, spaceId);
      return await client.deleteChat(chatId);
    }
    async function chatInput(spaceId, chatId, agentName, message, role) {
      const client = await this.getClient(CHAT_ROOM_PLUGIN, spaceId);
      return await client.chatInput(chatId, agentName, message, role);
    }
    function listenForMessages(spaceId, chatId, client) {
      return client.listenForMessages(chatId);
    }
    async function stopListeningForMessages(spaceId, chatId) {
      const client = await this.getClient(CHAT_ROOM_PLUGIN, spaceId);
      return client.stopListeningForMessages(chatId);
    }
    async function getChatScripts(spaceId) {
      let client = await this.getClient(constants2.CHAT_SCRIPT_PLUGIN, spaceId);
      return await client.getChatScripts();
    }
    async function getChatScript(spaceId, name) {
      let client = await this.getClient(constants2.CHAT_SCRIPT_PLUGIN, spaceId);
      return await client.getChatScript(name);
    }
    async function createChatScript(spaceId, name, code, description, widgets, role) {
      let client = await this.getClient(constants2.CHAT_SCRIPT_PLUGIN, spaceId);
      return await client.createChatScript(name, code, description, widgets, role);
    }
    async function updateChatScript(spaceId, scriptId, script) {
      let client = await this.getClient(constants2.CHAT_SCRIPT_PLUGIN, spaceId);
      await client.updateChatScript(scriptId, script);
      await client.updateChatScriptName(scriptId, script.name);
    }
    async function deleteChatScript(spaceId, scriptId) {
      let client = await this.getClient(constants2.CHAT_SCRIPT_PLUGIN, spaceId);
      return await client.deleteChatScript(scriptId);
    }
    async function getChatScriptNamesByRole(spaceId) {
      let client = await this.getClient(constants2.CHAT_SCRIPT_PLUGIN, spaceId);
      return await client.getChatScriptNamesByRole();
    }
    const getDefaultChatScript = async function(spaceId) {
      const client = await this.getClient(constants2.CHAT_SCRIPT_PLUGIN, spaceId);
      return await client.getDefaultChatScript();
    };
    async function getComponentsForChatRoomInstance(spaceId, chatId) {
      let client = await this.getClient(CHAT_ROOM_PLUGIN, spaceId);
      return await client.getComponentsForChatRoomInstance(chatId);
    }
    chat = {
      getChat,
      getChats,
      getChatHistory,
      getChatContext,
      getUserChats,
      createDefaultChat,
      createChat,
      deleteChat,
      chatInput,
      listenForMessages,
      getClient,
      stopListeningForMessages,
      getChatScripts,
      getChatScript,
      createChatScript,
      updateChatScript,
      deleteChatScript,
      getDefaultChatScript,
      getComponentsForChatRoomInstance,
      getChatScriptNamesByRole
    };
    return chat;
  }
  var webassistant;
  var hasRequiredWebassistant;
  function requireWebassistant() {
    if (hasRequiredWebassistant) return webassistant;
    hasRequiredWebassistant = 1;
    const { getAPIClient: getAPIClient2 } = utils$1;
    const constants2 = constants$2;
    async function getClient(spaceId) {
      return await getAPIClient2(this.__securityContext.userId, constants2.WEB_ASSISTANT_PLUGIN, spaceId, {
        email: this.__securityContext.email
      });
    }
    const getWebAssistant = async function(spaceId) {
      const client = await this.getClient(spaceId);
      return client.getWebAssistant();
    };
    const getAuth = async function(spaceId) {
      const client = await this.getClient(spaceId);
      return client.getAuth();
    };
    const updateWebAssistant = async function(spaceId, data) {
      const client = await this.getClient(spaceId);
      return client.updateWebAssistant(data);
    };
    const getThemes = async function(spaceId) {
      const client = await this.getClient(spaceId);
      return client.getThemes();
    };
    const getTheme = async function(spaceId, themeId) {
      const client = await this.getClient(spaceId);
      return client.getTheme(themeId);
    };
    const addTheme = async function(spaceId, theme) {
      const client = await this.getClient(spaceId);
      return client.addTheme(theme);
    };
    const updateTheme = async function(spaceId, themeId, theme) {
      const client = await this.getClient(spaceId);
      return client.updateTheme(themeId, theme);
    };
    const deleteTheme = async function(spaceId, themeId) {
      const client = await this.getClient(spaceId);
      return client.deleteTheme(themeId);
    };
    webassistant = {
      getAuth,
      getWebAssistant,
      updateWebAssistant,
      getThemes,
      getTheme,
      addTheme,
      updateTheme,
      deleteTheme,
      getClient
    };
    return webassistant;
  }
  var codemanager;
  var hasRequiredCodemanager;
  function requireCodemanager() {
    if (hasRequiredCodemanager) return codemanager;
    hasRequiredCodemanager = 1;
    const { getAPIClient: getAPIClient2 } = utils$1;
    const constants2 = constants$2;
    async function getClient(pluginName, spaceId) {
      return await getAPIClient2(this.__securityContext.userId, pluginName, spaceId, {
        email: this.__securityContext.email
      });
    }
    const createApp = async function(spaceId, appName) {
      const client = await this.getClient(constants2.CODE_MANAGER_PLUGIN, spaceId);
      return await client.createApp(appName);
    };
    async function getApps(spaceId) {
      const client = await this.getClient(constants2.CODE_MANAGER_PLUGIN, spaceId);
      return await client.getApps();
    }
    async function getComponent(spaceId, appName, componentName) {
      const client = await this.getClient(constants2.CODE_MANAGER_PLUGIN, spaceId);
      return await client.getComponent(appName, componentName);
    }
    async function saveComponent(spaceId, appName, componentName, html, css, js, newName) {
      const client = await this.getClient(constants2.CODE_MANAGER_PLUGIN, spaceId);
      return await client.saveComponent(appName, componentName, html, css, js, newName);
    }
    async function listComponents(spaceId) {
      const client = await this.getClient(constants2.CODE_MANAGER_PLUGIN, spaceId);
      return await client.listComponents();
    }
    async function listComponentsForApp(spaceId, appName) {
      const client = await this.getClient(constants2.CODE_MANAGER_PLUGIN, spaceId);
      return await client.listComponentsForApp(appName);
    }
    async function deleteComponent(spaceId, appName, componentName) {
      const client = await this.getClient(constants2.CODE_MANAGER_PLUGIN, spaceId);
      return await client.deleteComponent(appName, componentName);
    }
    async function listBackendPluginsForApp(spaceId, appName) {
      const client = await this.getClient(constants2.CODE_MANAGER_PLUGIN, spaceId);
      return await client.listBackendPluginsForApp(appName);
    }
    async function getAppPersistoConfig(spaceId, appName) {
      const client = await this.getClient(constants2.CODE_MANAGER_PLUGIN, spaceId);
      return await client.getAppPersistoConfig(appName);
    }
    async function saveBackendPlugin(spaceId, appName, pluginName, content, newName) {
      const client = await this.getClient(constants2.CODE_MANAGER_PLUGIN, spaceId);
      return await client.saveBackendPlugin(appName, pluginName, content, newName);
    }
    async function getBackendPlugin(spaceId, appName, pluginName) {
      const client = await this.getClient(constants2.CODE_MANAGER_PLUGIN, spaceId);
      return await client.getBackendPlugin(appName, pluginName);
    }
    codemanager = {
      getClient,
      saveComponent,
      listComponents,
      createApp,
      getApps,
      listComponentsForApp,
      listBackendPluginsForApp,
      getAppPersistoConfig,
      getComponent,
      deleteComponent,
      saveBackendPlugin,
      getBackendPlugin
    };
    return codemanager;
  }
  (function(module2) {
    const ServerSideSecurityContext2 = ServerSideSecurityContext_1;
    const ClientSideSecurityContext2 = ClientSideSecurityContext_1;
    const constants2 = constants$2;
    const utils2 = utils$1;
    function detectEnvironment() {
      if (typeof fetch === "function" && typeof document === "object") {
        return constants2.ENV_TYPE.BROWSER;
      } else if (typeof require === "function" && true && true) {
        return constants2.ENV_TYPE.NODE;
      } else {
        return constants2.ENV_TYPE.UNKNOWN;
      }
    }
    const envType2 = detectEnvironment();
    function _loadModule(moduleName) {
      switch (moduleName) {
        case "document":
          return requireDocument();
        case "space":
          return requireSpace();
        case "user":
          return requireUser();
        case "agent":
          return requireAgent();
        case "util":
          return requireUtil();
        case "llm":
          return requireLlm();
        case "application":
          return requireApplication();
        case "chat":
          return requireChat();
        case "webassistant":
          return requireWebassistant();
        case "codemanager":
          return requireCodemanager();
        default:
          return null;
      }
    }
    function sdkModule(moduleName, securityContext) {
      let module3 = _loadModule(moduleName);
      this.__securityContext = securityContext;
      for (let key in module3) {
        if (typeof module3[key] === "function" && !(module3[key].prototype && Object.getOwnPropertyNames(module3[key].prototype).length > 1 && module3[key].prototype.constructor === module3[key])) {
          this[key] = module3[key].bind(this);
        } else {
          this[key] = module3[key];
        }
      }
      return this;
    }
    function loadModule2(moduleName, userContext) {
      if (!userContext) {
        throw new Error("User context is required to load a module");
      }
      return new sdkModule(moduleName, userContext);
    }
    module2.exports = {
      loadModule: loadModule2,
      constants: constants2,
      envType: envType2,
      ServerSideSecurityContext: ServerSideSecurityContext2,
      ClientSideSecurityContext: ClientSideSecurityContext2,
      utils: utils2
    };
  })(assistosSdk);
  var assistosSdkExports = assistosSdk.exports;
  const loadModule = assistosSdkExports.loadModule;
  const constants = assistosSdkExports.constants;
  const envType = assistosSdkExports.envType;
  const ServerSideSecurityContext = assistosSdkExports.ServerSideSecurityContext;
  const ClientSideSecurityContext = assistosSdkExports.ClientSideSecurityContext;
  const utils = assistosSdkExports.utils;
  exports2.ClientSideSecurityContext = ClientSideSecurityContext;
  exports2.ServerSideSecurityContext = ServerSideSecurityContext;
  exports2.constants = constants;
  exports2.default = assistosSdkExports;
  exports2.envType = envType;
  exports2.loadModule = loadModule;
  exports2.utils = utils;
  Object.defineProperties(exports2, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
});
