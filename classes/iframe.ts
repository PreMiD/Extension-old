class iFrame {
  /**
   * Send data from iFrames back to the presence script
   * @param {*} data Data to send
   */
  send(data: any) {
    chrome.runtime.sendMessage({ iFrameData: data });
  }
}

var iframe = new iFrame();
iframe.send(document.URL);
