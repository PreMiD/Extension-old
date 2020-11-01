import * as aesjs from "aes-js";

import { error, info } from "./util/debug";

import cleanObject from "./util/functions/cleanObject";
import { getStorage } from "./util/functions/asyncStorage";
import { getString } from "./util/langManager";

let tabPriority: number = null,
	port = chrome.runtime.connect({ name: "contentScript" }),
	decryptionKey: Uint8Array;

window.addEventListener("PreMiD_UpdatePresence", async (data: CustomEvent) => {
	try {
		const decryptedData = JSON.parse(await decryptData(data.detail));
		cleanObject(decryptedData);
		port.postMessage({ action: "updatePresence", presence: decryptedData })
	} catch (e) {
		if (e instanceof SyntaxError) {
			error("contentScript.ts", "Data could not be decrypted into JSON object.");
		} else {
			throw e;
		}
	}
});

chrome.runtime.onMessage.addListener(function (data) {
	if (port === null) return;

	if (typeof data.iFrameData !== "undefined") {
		window.dispatchEvent(
			new CustomEvent("PreMiD_iFrameData", {
				detail: data.iFrameData
			})
		);
	}

	if (typeof data.tabPriority !== "undefined") {
		if (data.tabPriority) {
			//* Prevent multiple intervals
			if (tabPriority === null) {
				info("contentScript.ts", `Tab Priority: ${data.tabPriority}`);
				tabPriority = window.setInterval(() => {
					//TODO Find a way to prevent console error spam (context invalidated) > Most likely using runtime.connect()
					chrome.runtime.sendMessage({ iFrameUpdateData: true });

					document.dispatchEvent(new CustomEvent("PreMiD_UpdateData"));

					info("contentScript.ts", "updateData");
				}, 100);
			}
		} else {
			clearInterval(tabPriority);
			tabPriority = null;
		}
	}
});

window.addEventListener("PreMiD_RequestExtensionData", async function (
	data: CustomEvent
) {
	let strings = data.detail.strings;
	const language = data.detail.language;

	(
		await Promise.all(
			Object.keys(strings).map(string => getString(strings[string], language))
		)
	).map((sT, i) => (strings[Object.keys(strings)[i]] = sT));

	window.dispatchEvent(
		new CustomEvent("PreMiD_ReceiveExtensionData", {
			detail: {
				strings: strings
			}
		})
	);
});

/**
 * Generates a AES key from the app identifier
 */
async function getDecryptionKey(): Promise<Uint8Array> {
	if (decryptionKey) {
		return decryptionKey;
	}

	const key: string = (await getStorage("local", "identifier")).identifier;
	let keySize: number;

	if (key.length >= 32) {
		keySize = 32;
	} else if (key.length >= 24) {
		keySize = 24;
	} else if (key.length >= 16) {
		keySize = 16;
	} else {
		error("contentScript.ts", "String is not long enough to create decryption key.");
		return new Uint8Array();
	}

	decryptionKey = aesjs.utils.utf8.toBytes(key.substring(0, keySize));

	return decryptionKey;
}

/**
 * Decrypts hex into a string using the app identifier as the key
 * @param data Encrypted hex string
 */
async function decryptData(data: string): Promise<string> {
	const encryptionKey = await getDecryptionKey();

	if (encryptionKey.length > 0) {
		const aesCtr = new aesjs.ModeOfOperation.ctr(encryptionKey),
		encryptedBytes = aesjs.utils.hex.toBytes(data),
		decryptedBytes = aesCtr.decrypt(encryptedBytes),
		decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);

		return decryptedText;
	}

	return "";
}