import Vue from "vue";
import VueI18n from "vue-i18n";
import VueRouter from "vue-router";
import Vuex from "vuex";
// @ts-ignore
import appView from "./app.vue";
// @ts-ignore
import settings from "./settings.vue";

Vue.config.productionTip = false;
Vue.config.devtools = false;

Vue.use(VueRouter);
Vue.use(VueI18n);
Vue.use(Vuex);

window.onload = async () => {
	// @ts-ignore
	const discordUser = (await pmd.getStorage("local", "discordUser"))
		.discordUser,
		// @ts-ignore
		messages = await pmd.getStrings(chrome.i18n.getUILanguage() || "en"),
		// @ts-ignore
		presences = (await pmd.getStorage("local", "presences")).presences;

	if (presences.filter(p => !p.metaTag).length === 0 || !messages) {
		const p = document.createElement("p");
		p.innerText = "Extension did not initialize correctly, press on this message to reinitialize it."
		p.style.color = "white";
		p.style.cursor = "pointer";
		p.style.textAlign = "center";
		p.style.lineHeight = "1.25rem";
		document.body.appendChild(p);

		const port = chrome.runtime.connect({ name: "app.ts" });
		p.onclick = () => {
			port.postMessage({ action: "reinit" });
		};

		port.onMessage.addListener(msg => {
			if (msg.success) {
				location.reload();
			} else {
				alert("Couldn't initialize");
			}
		});

		return;
	}

	new Vue({
		i18n: new VueI18n({
			locale: chrome.i18n.getUILanguage(),
			messages,
			fallbackLocale: "en",
			silentTranslationWarn: true
		}),
		render: h => h(appView),
		store: new Vuex.Store({
			state: {
				port: null,
				connected: true,
				appVersionSupported: true,
				userAvatar: discordUser && discordUser.avatar !== null
					? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}?size=128`
					: "https://cdn.discordapp.com/embed/avatars/0.png?size=128",
				// @ts-ignore
				settings: (await pmd.getStorage("sync", "settings")).settings
			},
			mutations: {
				updateConnectionState(state, payload) {
					state.connected = payload.connected;
					state.appVersionSupported = payload.appVersionSupported;
				},
				updateSetting(state, payload) {
					state.settings[payload].value = !state.settings[payload].value;

					chrome.storage.sync.set({ settings: state.settings });
				},
				updatePort(state, payload) {
					state.port = payload;
				}
			}
		}),
		router: new VueRouter({
			routes: [
				{ path: "*", redirect: "/settings" },

				{
					path: "/settings",
					component: settings
				}
			]
		})
	}).$mount("#app");
};
