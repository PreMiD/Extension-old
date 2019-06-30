var test = new Presence({ clientId: "516242947184787514" });

test.on("iFrameData", data => console.log(data));
