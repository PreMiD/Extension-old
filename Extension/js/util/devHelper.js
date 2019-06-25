class iFrame {
  /**
   * Send data from iFrames back to the presence script
   * @param {*} data Data to send
   */
  send(data) {
    chrome.runtime.sendMessage({ iFrameData: data });
  }
}
var iframe = new iFrame();
iframe.send(document.URL);

class Presence {
  /**
   * Create a new Presence
   */
  constructor(presenceOptions) {
    this.trayTitle = "";
    this.playback = true;
    this.mediaKeys = false;
    this.internalPresence = {};
    this._events = {
      UpdateData: null
    };
    this.clientId = presenceOptions.clientId;
    this.mediaKeys = presenceOptions.mediaKeys ? true : false;
  }
  /**
   *
   * @param presenceData presenceData
   * @param playback Is presence playing
   */
  setActivity(presenceData = {}, playback = true) {
    this.internalPresence = presenceData;
    this.playback = playback;
  }
  clearActivity() {
    this.internalPresence = {};
    var event = new CustomEvent("PreMiD_UpdatePresence", {
      detail: {
        clientID: this.clientId,
        trayTitle: null,
        hidden: true
      }
    });
    window.dispatchEvent(event);
  }
  /**
   * Sets the tray title on the Menubar in Mac OS (Mac OS only)
   * @param trayTitle Tray Title
   */
  setTrayTitle(trayTitle = "") {
    this.trayTitle = trayTitle;
  }
  /**
   * Get translations from the extension
   * @param strings String object with keys being the key for string, keyValue is the string value
   */
  getStrings(strings) {
    return new Promise((resolve, reject) => {
      var listener = function(detail) {
        window.removeEventListener("PreMiD_ReceiveExtensionData", listener);
        // @ts-ignore
        resolve(detail.strings);
      };
      //* Receive data from PreMiD
      window.addEventListener("PreMiD_ReceiveExtensionData", detail =>
        // @ts-ignore
        listener(detail.detail)
      );
      var event = new CustomEvent("PreMiD_RequestExtensionData", {
        detail: {
          strings: strings
        }
      });
      //* Trigger the event
      window.dispatchEvent(event);
    });
  }
  /**
   * Get variables from the actual site.
   * @param {Array} variables Array of variable names to get
   * @example var pageVar = getPageVariable('pageVar') -> pageVar -> "Variable content"
   */
  getPageVariable(variable) {
    return new Promise((resolve, reject) => {
      var script = document.createElement("script");
      window.addEventListener("PreMiD_PageVariable", data => {
        script.remove();
        // @ts-ignore
        resolve(JSON.parse(data.detail));
      });
      script.id = "PreMiD_PageVariables";
      script.appendChild(
        document.createTextNode(`
      var event = new CustomEvent("PreMiD_PageVariable", {detail: (typeof window["${variable}"] === "string") ? window["${variable}"] : JSON.stringify(window["${variable}"])});
      window.dispatchEvent(event);
    `)
      );
      (document.body || document.head || document.documentElement).appendChild(
        script
      );
    });
  }
  /**
   * Subscribe to events emitted by the extension
   * @param eventName EventName to subscribe to
   * @param callback Callback function for event
   */
  on(eventName, callback) {
    this._events[eventName] = callback;
    switch (eventName) {
      case "UpdateData":
        window.addEventListener("PreMiD_UpdateData", () => {
          //* Run callback
          this._events.UpdateData();
          //* Send data to app
          var event = new CustomEvent("PreMiD_UpdatePresence", {
            detail: {
              clientID: this.clientId,
              presenceData: this.internalPresence,
              trayTitle: this.trayTitle,
              playback: this.playback,
              mediaKeys: this.mediaKeys
            }
          });
          window.dispatchEvent(event);
        });
        return;
      case "MediaKeys":
        window.addEventListener("PreMiD_MediaKeys", data => {
          // @ts-ignore
          this._events[eventName](data.detail);
        });
        return;
      case "iFrameData":
        window.addEventListener("PreMiD_iFrameData", data => {
          // @ts-ignore
          this._events[eventName](data.detail);
        });
        return;
      default:
        console.error(Error(`${eventName} is not a valid event.`));
        return;
    }
  }
}
