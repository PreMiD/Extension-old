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
   * Client Id of presence
   */
  clientId: string;
  /**
   * Wether or not this presence supports media keys
   */
  mediaKeys?: boolean;
}

class Presence {
  private clientId: string;
  private trayTitle: string = "";
  private playback: boolean = true;
  private mediaKeys: boolean = false;
  private internalPresence: presenceData = {};
  _events: any = {
    UpdateData: null
  };

  /**
   * Create a new Presence
   */
  constructor(presenceOptions: PresenceOptions) {
    this.clientId = presenceOptions.clientId;
    this.mediaKeys = presenceOptions.mediaKeys ? true : false;
  }

  /**
   *
   * @param presenceData presenceData
   * @param playback Is presence playing
   */
  setActivity(presenceData: presenceData = {}, playback: boolean = true) {
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
  setTrayTitle(trayTitle: string = "") {
    this.trayTitle = trayTitle;
  }

  /**
   * Get translations from the extension
   * @param strings String object with keys being the key for string, keyValue is the string value
   */
  getStrings(strings: Object) {
    return new Promise((resolve, reject) => {
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
   * @example var pageVar = getPageVariable('pageVar') -> pageVar -> "Variable content"
   */
  getPageVariable(variable: string) {
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
  on(eventName: "UpdateData" | "MediaKeys" | "iFrameData", callback: Function) {
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

// @ts-ignore
var presence = new Presence({
    clientId: "463151177836658699",
    mediaKeys: true
  }),
  strings: any = null;

presence.on("UpdateData", async () => {
  if (!strings)
    strings = await presence.getStrings({
      playing: "presence.playback.playing"
    });

  if (
    typeof document.querySelector(".video-stream") === null ||
    typeof document.querySelector(".title.ytmusic-player-bar") === null ||
    document.querySelector("span yt-formatted-string.ytmusic-player-bar") ===
      null ||
    document.querySelectorAll(
      "span yt-formatted-string.ytmusic-player-bar a"
    ) === null
  ) {
    presence.setActivity();
    return;
  }

  presence.setActivity({
    // @ts-ignore
    details: document.querySelector(".title.ytmusic-player-bar").innerText,
    state: "MEEM",
    largeImageKey: "ytm_lg"
  });
});

presence.on("iFrameData", (data: any) => {
  console.log(data);
});
