declare class iFrame {
    /**
     * Send data from iFrames back to the presence script
     * @param {*} data Data to send
     */
    send(data: any): void;
}
declare var iframe: iFrame;
