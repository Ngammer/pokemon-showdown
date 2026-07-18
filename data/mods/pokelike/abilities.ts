export const Abilities: import('../../../sim/dex-abilities').ModdedAbilityDataTable = {
	dodriofusion: {
		onModifyMove(move) {
			if (move.multihit && Array.isArray(move.multihit) && move.multihit.length) {
				move.multihit = move.multihit[1];
			}
			if (move.multiaccuracy) {
				delete move.multiaccuracy;
			}
		},
		onModifyPriority(priority, source, target, move) {
			if (['sunnyday', 'desolateland'].includes(source.effectiveWeather()) || source.volatiles['dreamball']) {
				return priority + 1;
			}
		},
		onEnd(pokemon) {
			if (pokemon.getItem().name === 'Dream Ball') {
				pokemon.useItem();
			}
		},
		onDamage(damage, target, source, effect) {
			this.effectState.checkedTangledFeet = !(
				effect.effectType === "Move" && !effect.multihit &&
				!(effect.hasSheerForce && source.hasAbility('sheerforce'))
			);
		},
		onTryEatItem(item) {
			const healingItems = [
				'aguavberry', 'enigmaberry', 'figyberry', 'iapapaberry', 'magoberry', 'sitrusberry', 'wikiberry', 'oranberry', 'berryjuice',
			];
			if (healingItems.includes(item.id)) {
				return this.effectState.checkedTangledFeet;
			}
			return true;
		},
		onAfterMoveSecondary(target, source, move) {
			this.effectState.checkedTangledFeet = true;
			if (!source || source === target || !target.hp || !move.totalDamage) return;
			const lastAttackedBy = target.getLastAttackedBy();
			if (!lastAttackedBy) return;
			const damage = move.multihit && !move.smartTarget ? move.totalDamage : lastAttackedBy.damage;
			if (target.hp <= target.maxhp / 2 && target.hp + damage > target.maxhp / 2) {
				this.boost({ spe: 1 }, target, target);
			}
		},
		flags: { },
		name: "Dodrio Fusion",
		rating: 3,
		num: 92,
	},
};
