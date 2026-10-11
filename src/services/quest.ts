import type {
	Quest as QuestShape,
} from './interface.js';

export class Quest {
	public readonly data: QuestShape;

	constructor(client: any, data: QuestShape) {
		this.data = data;
	}

	static create(data: QuestShape): Quest {
		return new Quest(null, data);
	}

	get id() {
		return this.data.id;
	}

	get config() {
		return this.data.config;
	}

	get userStatus(){
		return this.data.user_status;
	}

	get targetedContent() {
		return this.data.targeted_content;
	}

	get preview(): boolean {
		return this.data.preview;
	}

	get raw() {
		return this.data;
	}

	isExpired(reference: Date = new Date()): boolean {
		return reference.getTime() > new Date(this.data.config.expires_at).getTime();
	}

	isCompleted(): boolean {
		return Boolean(this.userStatus?.completed_at);
	}

    isEnrolledQuest(): boolean {
        return Boolean(this.userStatus?.enrolled_at);
    }

	hasClaimedRewards(): boolean {
		return Boolean(this.userStatus?.claimed_at);
	}

	isExcludedQuest(): boolean {
		return this.isExpired() || this.isCompleted();
	}

    updateUserStatus(userStatus: QuestShape["user_status"]) {
        this.data.user_status = userStatus;
    }
}
