<template>
	<div id="navbar">
		<img id="logo" draggable="false" src="/assets/images/icon.svg" />
		<h1>PreMiD</h1>
		<transition name="pop">
			<span
				id="info"
				:class="this.$store.state.appVersionSupported ? 'warning' : 'error'"
				v-if="
					!this.$store.state.connected || !this.$store.state.appVersionSupported
				"
				@mouseenter="hoverInfo = true"
				@mouseleave="hoverInfo = false"
				>!</span
			>
		</transition>
		<transition name="slideDown">
			<div
				v-show="hoverInfo"
				id="infoPopup"
				@mouseenter="hoverInfo = true"
				@mouseleave="hoverInfo = false"
			>
				<h1
					v-t="
						this.$store.state.appVersionSupported
							? 'popup.info.notConnected'
							: 'popup.info.unsupportedAppVersion'
					"
				/>
				<p v-html="infoMessage" />
			</div>
		</transition>
		<div
			id="userWrapper"
			@mouseenter="hoverUser = true"
			@mouseleave="hoverUser = false"
		>
			<img
				id="user"
				draggable="false"
				:src="this.$store.state.userAvatar"
				@click="userClick = !userClick"
			/>
			<transition name="slideDown">
				<div id="settingsOverlay" v-show="userClick">
					<h1 v-t="'popup.navigation.settings'" />
					<div id="settings">
						<div id="setting">
							<i class="fas fa-power-off" />
							<p v-t="'popup.setting.enabled'" />
							<checkbox
								:checked="settings['enabled']"
								@change.native="updateSetting('enabled')"
							/>
						</div>
						<div id="setting" v-if="!platform.includes('Linux')">
							<i class="fas fa-rocket" />
							<p v-t="'popup.setting.autoLaunch'" />
							<checkbox
								:checked="settings['autoLaunch']"
								@change="updateSetting('autoLaunch')"
							/>
						</div>
						<div id="setting" v-if="platform === 'MacIntel'">
							<i class="fab fa-apple" />
							<p v-t="'popup.setting.titleMenubar'" />
							<checkbox
								:checked="settings['titleMenubar']"
								@change="updateSetting('titleMenubar')"
							/>
						</div>
					</div>
				</div>
			</transition>
		</div>
	</div>
</template>

<script lang="ts">
	// @ts-ignore
	import checkbox from "./checkbox";

	export default {
		data() {
			return {
				platform: window.navigator.platform,
				hoverUser: false,
				userClick: false,
				hoverInfo: false,
				settings: Object.assign(
					{},
					...Object.keys(this.$store.state.settings).map(k => {
						return { [k]: this.$store.state.settings[k].value };
					})
				)
			};
		},
		created() {
			document.addEventListener("click", this.settingsPopup);
		},
		beforeDestroy() {
			document.removeEventListener("click", this.settingsPopup);
		},
		components: {
			checkbox
		},
		computed: {
			infoMessage() {
				if (this.$store.state.appVersionSupported) {
					let msg = this.$t("popup.info.notConnected.message");
					const match = msg.match(/(\*.*?\*)/g)[0];

					msg = msg.replace(
						match,
						// @ts-ignore
						`<a class="link" target="_blank" href="https://docs.premid.app/troubleshooting">${match.slice(
							1,
							match.length - 1
						)}</a>`
					);

					return msg;
				} else return this.$t("popup.info.unsupportedAppVersion.message");
			}
		},
		methods: {
			settingsPopup() {
				!this.hoverUser && this.userClick ? (this.userClick = false) : "";
			},
			updateSetting(setting: string) {
				this.$store.commit("updateSetting", setting);
				this.settings = Object.assign(
					{},
					...Object.keys(this.$store.state.settings).map(k => {
						return { [k]: this.$store.state.settings[k].value };
					})
				);
			}
		}
	};
</script>

<style lang="scss" scoped>
	@import "../../../assets/scss/_variables.scss";

	#navbar {
		position: relative;
		z-index: 100;

		user-select: none;

		width: 100%;
		color: #fff;

		background-color: $blurple;
		height: 45px;

		display: grid;
		grid-template-columns: min-content auto min-content min-content;
		align-items: center;

		#infoPopup {
			position: absolute;
			max-width: 225px;
			background-color: #2c2f33;
			box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.5);
			border-radius: 5px;
			top: 40px;
			right: 42px;
			z-index: 100;
			padding: 5px;

			&::before {
				position: absolute;
				right: 5px;
				margin-top: -10px;
				content: "";
				width: 0;
				height: 0;
				border-left: 10px solid transparent;
				border-right: 10px solid transparent;
				border-bottom: 10px solid $darkButNotQuiteBlack;
			}

			h1 {
				color: $blurple;
				font-size: 15px;
				margin-left: 5px;
			}

			p {
				margin-left: 5px;
			}
		}

		#logo {
			align-self: center;
			justify-self: center;
			height: 35px;

			margin-right: 5px;
			margin-left: 10px;
		}

		h1 {
			font-family: "Discord Font";
			font-size: 25px;
		}

		#info {
			cursor: help;
			height: 20px;
			width: 20px;
			margin-right: 10px;
			color: $notQuiteBlack;
			border-radius: 100%;
			font-size: 15px;
			font-weight: 900;
			text-align: center;
			box-shadow: 0 0 0 0 inset;

			&.error {
				background-color: #ff5050;
				animation: pulseError 2s infinite;
			}

			&.warning {
				background-color: #ffff00;
				animation: pulseWarn 2s infinite;
			}
		}

		#userWrapper {
			height: 35px;
			width: 35px;
			margin-right: 5px;

			#user {
				transition: 0.1s all ease-out;
				border-radius: 100%;
				height: 35px;
				cursor: pointer;

				&:active {
					transform: scale(0.9);
				}
			}

			#settingsOverlay {
				position: absolute;
				right: 5px;
				margin-top: 5px;
				z-index: 10;

				background-color: $darkButNotQuiteBlack;
				box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.5);

				border-radius: 5px;

				&::before {
					position: absolute;
					right: 5px;
					margin-top: -10px;
					content: "";
					width: 0;
					height: 0;
					border-left: 10px solid transparent;
					border-right: 10px solid transparent;
					border-bottom: 10px solid $darkButNotQuiteBlack;
				}

				h1 {
					color: $blurple;
					font-size: 15px;
					margin-left: 5px;
				}

				#settings {
					display: grid;
					grid-template-columns: auto;
					align-items: center;

					#setting {
						display: inline-grid;
						grid-template-columns: min-content auto min-content;
						grid-gap: 5px;
						align-items: center;

						height: 30px;
						font-size: 17px;
						margin: 0 5px;

						svg {
							width: 20px;
						}

						p {
							margin-right: 15px;
						}
					}
				}
			}
		}
	}
</style>
