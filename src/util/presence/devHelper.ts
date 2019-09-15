/**
 * @link https://docs.premid.app/presence-development/coding/presence-class#getpagevariable-string
 */
interface presenceData {
  state?: string;
  details?: string;
  startTimestamp?: number;
  endTimestamp?: number;
  largeImageKey?: string;
  smallImageKey?: string;
  smallImageText?: string;
}

interface PresenceOptions {
  /**
   * ClientId of Discord application
   * @link https://docs.premid.app/presence-development/coding/presence-class#clientid
   */
  clientId: string;
  /**
   * Wether or not this presence supports media keys
   * @default {mediaKeys: false}
   * @link https://docs.premid.app/presence-development/coding/presence-class#mediakeys
   * @deprecated Deprecated for now as browsers automatically support this
   */
  mediaKeys?: boolean;
}

class Presence {
  private clientId: string;
  private trayTitle: string = "";
  private playback: boolean = true;
  private mediaKeys: boolean = false;
  private internalPresence: presenceData = {};
  _events: any = {};

  /**
   * Create a new Presence
   */
  constructor(presenceOptions: PresenceOptions) {
    this.clientId = presenceOptions.clientId;
    this.mediaKeys = presenceOptions.mediaKeys ? true : false;

    window.addEventListener("PreMiD_TabPriority", data => {
      //@ts-ignore
      if (!data.detail) this.clearActivity();
    });
  }

  /**
   *
   * @param presenceData presenceData
   * @param playback Is presence playing
   * @link https://docs.premid.app/presence-development/coding/presence-class#setactivity-presencedata-boolean
   */
  setActivity(presenceData: presenceData = {}, playback: boolean = true) {
    this.internalPresence = presenceData;
    this.playback = playback;

    //* Senddata
    this.sendData({
      clientId: this.clientId,
      presenceData: this.internalPresence,
      trayTitle: this.trayTitle,
      playback: this.playback,
      mediaKeys: this.mediaKeys
    });
  }

  /**
   * Clears the activity shown in discord as well as the Tray and keybinds
   * @link https://docs.premid.app/presence-development/coding/presence-class#clearactivity
   */
  clearActivity() {
    this.internalPresence = {};
    this.trayTitle = "";

    //* Send data to app
    this.sendData({
      presenceData: {},
      playback: false,
      hidden: true
    });
  }

  /**
   * Sets the tray title on the Menubar in Mac OS (Mac OS only, supports ANSI colors)
   * @param trayTitle Tray Title
   * @link https://docs.premid.app/presence-development/coding/presence-class#settraytitle-string
   */
  setTrayTitle(trayTitle: string = "") {
    this.trayTitle = trayTitle;
  }

  //TODO Make this return the active presence shown in Discord.
  /**
   * Get the current
   * @param strings
   * @since 2.0-BETA3
   */
  getActivity() {
    return this.internalPresence;
  }

  /**
   * Get translations from the extension
   * @param strings String object with keys being the key for string, keyValue is the string value
   * @link https://docs.premid.app/presence-development/coding/presence-class#getstrings-object
   */
  getStrings(strings: Object) {
    return new Promise<any>((resolve, reject) => {
      var listener = function(detail: object) {
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
   * @example var pageVar = getPageVariable('pageVar') -> "Variable content"
   * @link https://docs.premid.app/presence-development/coding/presence-class#getpagevariable-string
   */
  getPageVariable(variable: string) {
    return new Promise<any>((resolve, reject) => {
      var script = document.createElement("script"),
        _listener = data => {
          script.remove();
          // @ts-ignore
          resolve(JSON.parse(data.detail));

          window.removeEventListener("PreMiD_PageVariable", _listener, true);
        };

      window.addEventListener("PreMiD_PageVariable", _listener);

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
   * Sends data back to application
   * @param data Data to send back to application
   */
  private sendData(data: Object) {
    //* Send data to app
    var event = new CustomEvent("PreMiD_UpdatePresence", {
      detail: data
    });

    window.dispatchEvent(event);
  }

  /**
   * Subscribe to events emitted by the extension
   * @param eventName EventName to subscribe to
   * @param callback Callback function for event
   * @link https://docs.premid.app/presence-development/coding/presence-class#events
   */
  on(eventName: "UpdateData" | "MediaKeys" | "iFrameData", callback: Function) {
    this._events[eventName] = callback;

    switch (eventName) {
      case "UpdateData":
        document.addEventListener("PreMiD_UpdateData", () => {
          //* Run callback
          this._events[eventName]();
        });
        return;
      case "MediaKeys":
        document.addEventListener("PreMiD_MediaKeys", data => {
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

class iFrame {
  _events: any = {};

  /**
   * Send data from iFrames back to the presence script
   * @param data Data to send
   */
  send(data: any) {
    var event = new CustomEvent("PreMiD_iFrameData", {
      detail: data
    });

    document.dispatchEvent(event);
  }

  //TODO Add to docs
  /**
   * Returns the iframe url
   * @since 2.0-BETA3
   */
  getUrl() {
    return new Promise<string>(async resolve => {
      var _listener = data => {
        // @ts-ignore
        resolve(data.detail);
        document.removeEventListener("PreMiD_iFrameURL", _listener, true);
      };
      document.addEventListener("PreMiD_iFrameURL", _listener);

      var event = new CustomEvent("PreMiD_GETiFrameURL");

      document.dispatchEvent(event);
    });
  }

  /**
   * Subscribe to events emitted by the extension
   * @param eventName
   * @param callback
   */
  on(eventName: "UpdateData" | "MediaKeys", callback: Function) {
    this._events[eventName] = callback;

    switch (eventName) {
      case "UpdateData": {
        document.addEventListener("PreMiD_UpdateData", () => {
          //* Run callback
          this._events[eventName]();
        });
        return;
      }
      case "MediaKeys":
        document.addEventListener("PreMiD_MediaKeys", data => {
          // @ts-ignore
          this._events[eventName](data.detail);
        });
        return;
    }
  }
}
