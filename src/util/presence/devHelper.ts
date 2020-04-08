/**
 * @link https://docs.premid.app/dev/presence/class#presencedata-interface
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
   * @link https://docs.premid.app/dev/presence/class#clientid
   */
  clientId: string;
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

    window.addEventListener("PreMiD_TabPriority", (data: CustomEvent) => {
      if (!data.detail) this.clearActivity();
    });
  }

  /**
   *
   * @param presenceData presenceData
   * @param playback Is presence playing
   * @link https://docs.premid.app/dev/presence/class#setactivitypresencedata-boolean
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
   * @link https://docs.premid.app/dev/presence/class#clearactivity
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
   * @link https://docs.premid.app/dev/presence/class#settraytitlestring
   */
  setTrayTitle(trayTitle: string = "") {
    this.trayTitle = trayTitle;
  }

  //TODO Make this return the active presence shown in Discord.
  /**
   * Get the current activity
   * @param strings
   */
  getActivity() {
    return this.internalPresence;
  }

  /**
   * Get translations from the extension
   * @param strings String object with keys being the key for string, keyValue is the string value
   * @link https://docs.premid.app/dev/presence/class#getstringsobject
   */
  getStrings(strings: Object) {
    return new Promise<any>(resolve => {
      let listener = function(detail: any) {
        window.removeEventListener("PreMiD_ReceiveExtensionData", listener);

        resolve(detail.strings);
      };

      //* Receive data from PreMiD
      window.addEventListener(
        "PreMiD_ReceiveExtensionData",
        (detail: CustomEvent) => listener(detail.detail)
      );

      let pmdRED = new CustomEvent("PreMiD_RequestExtensionData", {
        detail: {
          strings: strings
        }
      });

      //* Trigger the event
      window.dispatchEvent(pmdRED);
    });
  }

  /**
   * Get variables from the current site
   * @param {Array} letiables Array of letiable names to get
   * @link https://docs.premid.app/dev/presence/class#getpageletiablestring
   */
  getPageletiable(letiable: string) {
    return new Promise<any>(resolve => {
      let script = document.createElement("script"),
        _listener = (data: CustomEvent) => {
          script.remove();
          resolve(JSON.parse(data.detail));

          window.removeEventListener("PreMiD_Pageletiable", _listener, true);
        };

      window.addEventListener("PreMiD_Pageletiable", _listener);

      script.id = "PreMiD_Pageletiables";
      script.appendChild(
        document.createTextNode(`
        var pmdPL = new CustomEvent("PreMiD_Pageletiable", {detail: (typeof window["${letiable}"] === "string") ? window["${letiable}"] : JSON.stringify(window["${letiable}"])});
        window.dispatchEvent(pmdPL);
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
    let pmdUP = new CustomEvent("PreMiD_UpdatePresence", {
      detail: data
    });

    window.dispatchEvent(pmdUP);
  }

  /**
   * Subscribe to events emitted by the extension
   * @param eventName EventName to subscribe to
   * @param callback Callback function for event
   * @link https://docs.premid.app/en/dev/presence/class#events
   */
  on(eventName: "UpdateData" | "iFrameData", callback: Function) {
    this._events[eventName] = callback;

    switch (eventName) {
      case "UpdateData":
        document.addEventListener("PreMiD_UpdateData", () => {
          //* Run callback
          this._events[eventName]();
        });
        return;
      case "iFrameData":
        window.addEventListener("PreMiD_iFrameData", (data: CustomEvent) => {
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
   * @link https://docs.premid.app/dev/presence/class#iframedata
   */
  send(data: any) {
    let pmdIFD = new CustomEvent("PreMiD_iFrameData", {
      detail: data
    });

    document.dispatchEvent(pmdIFD);
  }

  //TODO Add to docs
  /**
   * Returns the iframe url
   */
  getUrl() {
    return new Promise<string>(async resolve => {
      let _listener = (data: CustomEvent) => {
        resolve(data.detail);
        document.removeEventListener("PreMiD_iFrameURL", _listener, true);
      };
      document.addEventListener("PreMiD_iFrameURL", _listener);

      let pmdGIFU = new CustomEvent("PreMiD_GETiFrameURL");

      document.dispatchEvent(pmdGIFU);
    });
  }

  /**
   * Subscribe to events emitted by the extension
   * @param eventName
   * @param callback
   * @link https://docs.premid.app/dev/presence/class#updatedata
   */
  on(eventName: "UpdateData", callback: Function) {
    this._events[eventName] = callback;

    switch (eventName) {
      case "UpdateData": {
        document.addEventListener("PreMiD_UpdateData", () => {
          //* Run callback
          this._events[eventName]();
        });
        return;
      }
    }
  }
}
