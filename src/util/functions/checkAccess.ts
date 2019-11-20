import fetchJSON from "./fetchJSON";

export default function() {
  return new Promise((resolve, reject) => {
    if (!chrome.runtime.getManifest().version_name.includes("-BETA")) {
      resolve();
      return;
    }

    chrome.storage.local.get("userId", async ({ userId }) => {
      if (typeof userId !== "undefined") {
        if (
          (await fetchJSON(`https://api.premid.app/betaAccess/${userId}`))
            .access
        )
          resolve();
        else reject();
        return;
      }

      chrome.identity.launchWebAuthFlow(
        {
          interactive: true,
          url:
            "https://discordapp.com/api/oauth2/authorize?client_id=503557087041683458&redirect_uri=https%3A%2F%2F" +
            chrome.runtime.id +
            ".chromiumapp.org%2F&response_type=token&scope=identify"
        },
        responseUrl => {
          if (typeof responseUrl === "undefined") {
            reject();
            return;
          }

          let params = Object.assign(
            // @ts-ignore
            ...responseUrl
              .slice(58, responseUrl.length)
              .split("&")
              .map(param => {
                return { [param.split("=")[0]]: param.split("=")[1] };
              })
          );

          if (params.error === "access_denied") {
            reject();
            return;
          }

          Promise.resolve(
            fetch("https://discordapp.com/api/users/@me", {
              headers: new Headers({
                Authorization: `Bearer ${params.access_token}`
              })
            }).then(async res => {
              let user = await res.json(),
                access = (
                  await fetchJSON(
                    `https://api.premid.app/betaAccess/${user.id}`
                  )
                ).access;

              return [user, access];
            })
          ).then(access => {
            if (access[1]) {
              chrome.storage.local.set({ userId: access[0].id });
              resolve();
            } else reject();
          });
        }
      );
    });
  });
}
