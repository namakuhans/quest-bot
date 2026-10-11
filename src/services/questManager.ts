import { QuestTaskConfigType, CaptchaDataFromRequest } from './interface.js';
import { Quest } from './quest.js';
import { ClientQuest } from './client.js';
import { APIApplication } from 'discord-api-types/v10';
import { Utils } from './utils.js';
import { solveCaptcha } from './captcha.js';
import { Agent } from 'undici';

type ProgressCallback = (statusText: string) => Promise<void>;

export class QuestManager {
	public client: ClientQuest;
	public quests: Quest[];

	constructor(client: ClientQuest, quests: Quest[] = []) {
		this.client = client;
		this.quests = quests;
	}

	public static fromResponse(
		client: ClientQuest,
		response: {
			quests: any[];
		},
		fetchExcludedQuests = false,
	): QuestManager {
		const quests = (response?.quests ?? [])
			.map((q) => new Quest(client, q))
			.filter((q) => fetchExcludedQuests || !q.isExcludedQuest());
		return new QuestManager(client, quests);
	}

	public filterQuestsValidToDo(): Quest[] {
		return this.quests.filter((q: any) => q.isValidQuestToDo ? q.isValidQuestToDo() : !q.isCompleted());
	}

	public filterQuestsValidToRedeem(): Quest[] {
		return this.quests.filter((q: any) => q.isValidQuestToRedeem ? q.isValidQuestToRedeem() : q.isCompleted());
	}

	async acceptQuest(quest: Quest, isAndroid = false) {
		const headers = isAndroid
			? (Utils.makeAndroidHeaders(false) as any)
			: (Utils.makeDesktopHeaders(false) as any);
		const response = await this.client.rest.post(
			`/quests/${quest.id}/enroll`,
			{
				body: {
					location: 11, // QUEST_HOME_DESKTOP | https://docs.discord.food/resources/quests#quest-content-type
					is_targeted: false,
					metadata_raw: null,
					metadata_sealed: null,
					traffic_metadata_raw: quest.raw.traffic_metadata_raw,
					traffic_metadata_sealed: quest.raw.traffic_metadata_sealed,
				},
				headers,
			},
		);
		quest.updateUserStatus(response as any);
	}

	async timeout(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async redeemQuest(
		quest: Quest,
		retry = 0,
		customHeaders?: Record<string, string>,
	) {
		let agent: Agent | undefined = undefined;
		let captchaHeaders: Record<string, string> = {
			'content-type': 'application/json',
		};
		if (customHeaders) {
			captchaHeaders = { ...captchaHeaders, ...customHeaders };
		}
		try {
			const res = (await this.client.rest.post(
				`/quests/${quest.id}/claim-reward`,
				{
					body: {
						platform: quest.raw.config.rewards_config.platforms[0],
						location: 11,
						is_targeted: false,
						metadata_raw: null,
						metadata_sealed: null,
						traffic_metadata_raw: quest.raw.traffic_metadata_raw,
						traffic_metadata_sealed: quest.raw.traffic_metadata_sealed,
					},
					headers: captchaHeaders,
					dispatcher: agent,
				},
			)) as any;
			console.log(
				`Claimed rewards for quest "${quest.config.messages.quest_name}"!`,
			);
			quest.updateUserStatus(res);
		} catch (err: any) {
			const rawError = err.rawError as CaptchaDataFromRequest;
			if (rawError && rawError['captcha_key'] && rawError['captcha_sitekey']) {
				console.warn(
					`Captcha required to redeem rewards for quest "${quest.config.messages.quest_name}".`,
					rawError,
				);
				const solvedCaptchaKey = await solveCaptcha(rawError);
				return this.redeemQuest(quest, retry + 1, {
					'x-captcha-key': solvedCaptchaKey,
					'x-captcha-rqtoken': rawError['captcha_rqtoken'],
					'x-captcha-session-id': rawError['captcha_session_id'],
				});
			} else {
				console.error(
					`Failed to redeem rewards for quest "${quest.config.messages.quest_name}".`,
					err.message,
				);
			}
		}
	}

	async doingQuest(quest: Quest, onProgress?: ProgressCallback) {
		const questName = quest.config.messages.quest_name;
		const isAndroid =
			Boolean(quest.config.task_config_v2.tasks.WATCH_VIDEO_ON_MOBILE) &&
			!Boolean(quest.config.task_config_v2.tasks.WATCH_VIDEO);
		if (!quest.isEnrolledQuest()) {
			console.log(
				`Enrolling in quest "${questName}" (${isAndroid ? 'Android' : 'Desktop'} version)...`,
			);
			try {
				await this.acceptQuest(quest, isAndroid);
			} catch (err: any) {
				console.error(
					`Failed to enroll in quest "${questName}".`,
					err?.message,
				);
				return;
			}
		} else {
			console.log(`Already enrolled in quest "${questName}".`);
		}
		const applicationName = quest.config.application.name;
		const taskConfig = quest.config.task_config_v2;
		const taskName = [
			'WATCH_VIDEO',
			'PLAY_ON_DESKTOP',
			'PLAY_ON_XBOX',
			'PLAY_ON_PLAYSTATION',
			'STREAM_ON_DESKTOP',
			'PLAY_ACTIVITY',
			'WATCH_VIDEO_ON_MOBILE',
			'ACHIEVEMENT_IN_ACTIVITY',
		].find(
			(x) => taskConfig.tasks[x as QuestTaskConfigType] != null,
		) as QuestTaskConfigType;
		const secondsNeeded = taskConfig.tasks[taskName].target;
		let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;
		switch (taskName) {
			case 'WATCH_VIDEO':
			case 'WATCH_VIDEO_ON_MOBILE': {
				await this.doingWatchVideoQuest(
					quest,
					questName,
					secondsNeeded,
					secondsDone,
				);
				break;
			}
			case 'PLAY_ON_XBOX':
			case 'PLAY_ON_PLAYSTATION':
			case 'PLAY_ON_DESKTOP': {
				await this.doingPlayOnPlatformQuest(
					quest,
					questName,
					secondsNeeded,
					taskName,
					applicationName,
					onProgress
				);
				break;
			}
			case 'PLAY_ACTIVITY': {
				await this.doingPlayActivityQuest(
					quest,
					questName,
					secondsNeeded,
					taskName,
					applicationName,
					onProgress
				);
				break;
			}
			case 'STREAM_ON_DESKTOP': {
				console.log(
					'This no longer works in node for non-video quests. Use the discord desktop app to complete the',
					questName,
					'quest!',
				);
				break;
			}
			case 'ACHIEVEMENT_IN_ACTIVITY': {
				await this.doingAchievementInActivityQuest(quest, questName);
				break;
			}
			default: {
				console.log(
					'Unknown quest type. Use the discord desktop app to complete the',
					questName,
					'quest!',
				);
			}
		}
	}

	async doingWatchVideoQuest(
		quest: Quest,
		questName: string,
		secondsNeeded: number,
		secondsDone: number,
	) {
		const maxFuture = 10,
			speed = 7,
			interval = 7;
		const enrolledAt = new Date(
			quest.userStatus?.enrolled_at as any,
		).getTime();
		let completed = false;
		let fn = async () => {
			while (true) {
				const maxAllowed =
					Math.floor((Date.now() - enrolledAt) / 1000) + maxFuture;
				const diff = maxAllowed - secondsDone;
				const timestamp = secondsDone + speed;
				if (diff >= speed) {
					const res = (await this.client.rest.post(
						`/quests/${quest.id}/video-progress`,
						{
							body: {
								timestamp: Math.min(
									secondsNeeded,
									timestamp + Math.random(),
								),
							},
						},
					)) as any;
					completed = res.completed_at != null;
					secondsDone = Math.min(secondsNeeded, timestamp);
				}

				if (timestamp >= secondsNeeded) {
					break;
				}
				await this.timeout(interval * 1000);
			}
			if (!completed) {
				await this.client.rest.post(
					`/quests/${quest.id}/video-progress`,
					{
						body: { timestamp: secondsNeeded },
					},
				);
			}
			console.log(`Quest "${questName}" completed!`);
			this.client.emitQuestCompleted(quest.id);
		};
		console.log(`Spoofing video for ${questName}.`);
		await fn();
	}

	async doingPlayOnPlatformQuest(
		quest: Quest,
		questName: string,
		secondsNeeded: number,
		taskName: string,
		applicationName: string,
		onProgress?: ProgressCallback
	) {
		const interval = 20;
		let lastReportedMinutes: number | null = null;

		while (!quest.isCompleted()) {
			const secondsDone =
				(quest.userStatus?.progress?.[taskName]?.value as number) || 0;
			const res = await this.client.rest.post(
				`/quests/${quest.id}/heartbeat`,
				{
					body: {
						application_id: quest.config.application.id,
						terminal: false,
					},
				},
			);
			quest.updateUserStatus(res as any);
			const minutesLeft = Math.ceil((secondsNeeded - secondsDone) / 60);
			const statusMsg = `Spoofed your game to ${applicationName}. Wait for ${minutesLeft} more minute(s).`;
			console.log(statusMsg);

			// Only trigger progress webhook when the remaining minutes actually changes
			if (onProgress && lastReportedMinutes !== minutesLeft) {
				lastReportedMinutes = minutesLeft;
				await onProgress(statusMsg).catch(() => {});
			}

			await new Promise((resolve) =>
				setTimeout(resolve, interval * 1000),
			);
		}
		const res = await this.client.rest.post(
			`/quests/${quest.id}/heartbeat`,
			{
				body: {
					application_id: quest.config.application.id,
					terminal: true,
				},
			},
		);
		quest.updateUserStatus(res as any);
		console.log(`Quest "${questName}" completed!`);
		this.client.emitQuestCompleted(quest.id);
	}

	async doingPlayActivityQuest(
		quest: Quest,
		questName: string,
		secondsNeeded: number,
		taskName: string,
		applicationName: string,
		onProgress?: ProgressCallback
	) {
		const interval = 20;
		const streamKey = 'call:1:1';
		let lastReportedMinutes: number | null = null;

		while (!quest.isCompleted()) {
			const secondsDone =
				(quest.userStatus?.progress?.[taskName]?.value as number) || 0;
			const res = await this.client.rest.post(
				`/quests/${quest.id}/heartbeat`,
				{
					body: { stream_key: streamKey, terminal: false },
				},
			);
			quest.updateUserStatus(res as any);
			const minutesLeft = Math.ceil((secondsNeeded - secondsDone) / 60);
			const statusMsg = `Spoofed your activity to ${applicationName}. Wait for ${minutesLeft} more minute(s).`;
			console.log(statusMsg);

			// Only trigger progress webhook when the remaining minutes actually changes
			if (onProgress && lastReportedMinutes !== minutesLeft) {
				lastReportedMinutes = minutesLeft;
				await onProgress(statusMsg).catch(() => {});
			}

			await new Promise((resolve) =>
				setTimeout(resolve, interval * 1000),
			);
		}
		const res = await this.client.rest.post(
			`/quests/${quest.id}/heartbeat`,
			{
				body: { stream_key: streamKey, terminal: true },
			},
		);
		quest.updateUserStatus(res as any);
		console.log(`Quest "${questName}" completed!`);
		this.client.emitQuestCompleted(quest.id);
	}

	async doingAchievementInActivityQuest(quest: Quest, questName: string) {
		const applicationId = quest.config.application.id;
		const applicationName = quest.config.application.name;
		const questTarget =
			quest.config.task_config_v2.tasks.ACHIEVEMENT_IN_ACTIVITY.target;
		const query = new URLSearchParams({
			response_type: 'code',
			client_id: applicationId,
			scope: 'identify applications.commands applications.entitlements',
			state: '',
		});
		const res2 = (await this.client.rest.post(`/oauth2/authorize`, {
			query,
			body: {
				permissions: '0',
				authorize: true,
				integration_type: 1,
				location_context: {
					guild_id: '10000',
					channel_id: '10000',
					channel_type: 10000,
				},
			},
		})) as Record<string, any>;
		console.log(`Authorized application ${applicationName}`);
		const location = res2?.location;
		let authCode: string | null = null;
		if (location) {
			authCode = new URL(location).searchParams.get('code');
		}
		if (!authCode) {
			console.error(
				`No auth code received for application ${applicationName}. Cannot complete the quest.`,
			);
			return;
		}
		const { token, error: authError, activityReferrer } = await Utils.authorizeDiscordSays(
			applicationId,
			quest.id,
			authCode,
			this.client,
		);
		if (authError || !token) {
			console.error(
				`Failed to authorize with Discord Says for application ${applicationName}. Cannot complete the quest.`,
				authError,
			);
			return;
		}
		const { success, error: progressError } =
			await Utils.progressDiscordSays(
				applicationId,
				quest.id,
				token,
				questTarget,
				activityReferrer,
			);
		if (progressError || !success) {
			console.error(
				`Failed to progress quest with Discord Says for application ${applicationName}. Cannot complete the quest.`,
				progressError,
			);
			return;
		}
		const res3 = (await this.client.rest.get(`/oauth2/tokens`)) as {
			id: string;
			scopes: string[];
			application: APIApplication;
			disclosures: number[];
		}[];
		const tokenInfo = res3.find((t) => t.application.id === applicationId);
		if (tokenInfo) {
			try {
				await this.client.rest.delete(`/oauth2/tokens/${tokenInfo.id}`);
				console.log(`Deauthorized application ${applicationName}`);
			} catch (err) {
				console.error(
					`Failed to deauthorize token for application ${applicationName}.`,
					(err as Error).message,
				);
			}
		}
		console.log(`Quest "${questName}" completed!`);
		this.client.emitQuestCompleted(quest.id);
	}
}
