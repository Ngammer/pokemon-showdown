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
	weezingfusion: {
		// Ability suppression implemented in sim/pokemon.ts:Pokemon#ignoringAbility
		onSwitchInPriority: 2,
		onSwitchIn(pokemon) {
			this.add('-ability', pokemon, 'Weezing Fusion');
			pokemon.abilityState.ending = false;
			const strongWeathers = ['desolateland', 'primordialsea', 'deltastream', 'climatologist'];
			for (const target of this.getAllActive()) {
				if (target.hasItem('Ability Shield')) {
					this.add('-block', target, 'item: Ability Shield');
					continue;
				}
				// Can't suppress a Tatsugiri inside of Dondozo already
				if (target.volatiles['commanding']) {
					continue;
				}
				if (target.illusion) {
					this.singleEvent('End', this.dex.abilities.get('Illusion'), target.abilityState, target, pokemon, 'weezingfusion');
				}
				if (target.volatiles['slowstart']) {
					delete target.volatiles['slowstart'];
					this.add('-end', target, 'Slow Start', '[silent]');
				}
				if (strongWeathers.includes(target.getAbility().id)) {
					this.singleEvent('End', this.dex.abilities.get(target.getAbility().id), target.abilityState, target, pokemon, 'weezingfusion');
				}
			}
		},
		onEnd(source) {
			if (source.transformed) return;
			for (const pokemon of this.getAllActive()) {
				if (pokemon !== source && pokemon.hasAbility('Weezing Fusion')) {
					return;
				}
			}
			this.add('-end', source, 'ability: Weezing Fusion');

			// FIXME this happens before the pokemon switches out, should be the opposite order.
			// Not an easy fix since we cant use a supported event. Would need some kind of special event that
			// gathers events to run after the switch and then runs them when the ability is no longer accessible.
			// (If you're tackling this, do note extreme weathers have the same issue)

			// Mark this pokemon's ability as ending so Pokemon#ignoringAbility skips it
			if (source.abilityState.ending) return;
			source.abilityState.ending = true;
			const sortedActive = this.getAllActive();
			this.speedSort(sortedActive);
			for (const pokemon of sortedActive) {
				if (pokemon !== source) {
					if (pokemon.getAbility().flags['cantsuppress']) continue; // does not interact with e.g Ice Face, Zen Mode
					if (pokemon.hasItem('abilityshield')) continue; // don't restart abilities that weren't suppressed

					// Will be suppressed by Pokemon#ignoringAbility if needed
					this.singleEvent('Start', pokemon.getAbility(), pokemon.abilityState, pokemon);
					if (pokemon.ability === "gluttony") {
						pokemon.abilityState.gluttony = false;
					}
				}
			}
		},
		onResidualOrder: 10,
		onResidualSubOrder: 5,
		onResidual(pokemon) {
			for (const foe of pokemon.adjacentFoes()) {
				this.damage(foe.baseMaxhp / 16, foe, pokemon);
			}
		},
		flags: { failroleplay: 1, noreceiver: 1, noentrain: 1, notrace: 1, failskillswap: 1, notransform: 1, breakable: 1 },
		name: "Weezing Fusion",
		rating: 3.5,
		num: 256,
	},
	overqwilfusion: {
		onStart(pokemon) {
			let activated = false;
			for (const target of pokemon.adjacentFoes()) {
				if (!activated) {
					this.add('-ability', pokemon, 'Intimidate', 'boost');
					activated = true;
				}
				if (target.volatiles['substitute']) {
					this.add('-immune', target);
				} else {
					this.boost({ atk: -1 }, target, pokemon, null, true);
				}
			}
		},
		onDamagingHit(damage, target, source, move) {
			const side = source.isAlly(target) ? source.side.foe : source.side;
			const toxicSpikes = side.sideConditions['toxicspikes'];
			if (move.category === 'Physical' && (!toxicSpikes || toxicSpikes.layers < 2)) {
				this.add('-activate', target, 'ability: Overqwil Fusion');
				side.addSideCondition('toxicspikes', target);
			}
			if (this.checkMoveMakesContact(move, source, target)) {
				if (this.randomChance(5, 10)) {
					source.trySetStatus('tox', target);
				}
			}
		},
		flags: { },
		name: "Overqwil Fusion",
		rating: 3.5,
		num: 22,
	},
	infiltratingprankster: {
		onModifyMove(move) {
			move.infiltrates = true;
		},
		onModifyPriority(priority, pokemon, target, move) {
			if (move?.category === 'Status') {
				move.pranksterBoosted = true;
				return priority + 1;
			}
		},
		flags: { },
		name: "Infiltrating Prankster",
		rating: 2.5,
		num: 151,
	},
	munkidorifusion: {
		onSourceDamagingHit(damage, target, source, move) {
			// Despite not being a secondary, Shield Dust / Covert Cloak block Toxic Chain's effect
			if (target.hasAbility('shielddust') || target.hasItem('covertcloak')) return;

			/* if (this.randomChance(3, 10)) { */
			target.trySetStatus('tox', source);
			/* } */
		},
		onStart(pokemon) {
			for (const target of pokemon.foes()) {
				if (target.item) {
					this.add('-item', target, target.getItem().name, '[from] ability: Munkidori Fusion', `[of] ${pokemon}`);
					target.addVolatile("munkidorifusion");
				}
			}
		},
		onModifyTypePriority: -1,
		onModifyType(move, pokemon) {
			const noModifyType = [
				'judgment', 'multiattack', 'naturalgift', 'revelationdance', 'technoblast', 'terrainpulse', 'weatherball',
			];
			if (move.type === 'Normal' && (!noModifyType.includes(move.id) || this.activeMove?.isMax) &&
				!(move.isZ && move.category !== 'Status') && !(move.name === 'Tera Blast' && pokemon.terastallized)) {
				move.type = 'Poison';
				move.typeChangerBoosted = this.effect;
			}
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, pokemon, target, move) {
			if (move.typeChangerBoosted === this.effect) return this.chainModify([4915, 4096]);
		},
		condition: {
			duration: 8,
			onStart(pokemon) {
				this.add('-start', pokemon, 'Munkidori Fusion');
				this.singleEvent('End', pokemon.getItem(), pokemon.itemState, pokemon);
			},
			onResidualOrder: 21,
			onEnd(pokemon) {
				this.add('-end', pokemon, 'Munkidori Fusion');
			},
		},
		flags: { },
		name: "Munkidori Fusion",
		rating: 4.5,
		num: 305,
	},
	torrentplus: {
		onBasePowerPriority: 19,
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type) && move.type === 'Water' && attacker.activeMoveActions <= 1) {
				this.debug('STAB boost');
				return this.chainModify(1.8);
			}
			if (attacker.hasType(move.type) && attacker.activeMoveActions <= 1) {
				this.debug('STAB boost');
				return this.chainModify(1.5);
			}
			if (move.type === 'Water') {
				this.debug('Torrent boost');
				return this.chainModify(1.2);
			}
		},
		flags: { },
		name: "Torrent-Plus",
		rating: 2,
		num: 67,
	},
	gluttonyplus: {
		onStart(pokemon) {
			pokemon.abilityState.gluttony = true;
		},
		onDamage(item, pokemon) {
			pokemon.abilityState.gluttony = true;
		},
		onBasePower(basePower, attacker, defender, move) {
			for (const type in attacker.types) {
				if (move.type === type && attacker.activeMoveActions <= 1) {
					this.debug('STAB boost');
					return this.chainModify(1.5);
				}
			}
		},
		flags: { },
		name: "Gluttony-Plus",
		rating: 1.5,
		num: 82,
	},
	blinddrop: {
		onAnyAccuracy(accuracy, target, source, move) {
			if (move.type === 'Water') return true;
			if (move.accuracy === true) accuracy = 100;
			if (move.accuracy !== accuracy && typeof move.accuracy === 'number') accuracy = move.accuracy;
			const final = this.clampIntRange(accuracy - 10, 0, 100);
			this.add('-message', `DEBUG: accuracy original=${move.accuracy} accuracy recibida=${accuracy}, final=${final}`); // ← temporal
			return final;
		},
		onAnyModifyBoost(boosts, pokemon) {
			const unawareUser = this.effectState.target;
			if (unawareUser === pokemon) return;
			if (pokemon === this.activePokemon && unawareUser === this.activeTarget) {
				boosts['accuracy'] = 0;
			}
		},
		onSwitchOut(pokemon) {
			for (const target of pokemon.foes()) {
				if (target.volatiles['blinddrop']) {
					target.removeVolatile('blinddrop');
				}
			}
		},
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type) && attacker.activeMoveActions <= 1) {
				this.debug('STAB boost');
				return this.chainModify(1.5);
			}
		},
		flags: { },
		name: "Blind Drop",
		rating: 3,
		num: -195,
	},
	moldbreakerplus: {
		onStart(pokemon) {
			this.add('-ability', pokemon, 'Mold Breaker');
		},
		onModifyMove(move) {
			move.ignoreAbility = true;
		},
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type) && attacker.activeMoveActions <= 1) {
				this.debug('STAB boost');
				return this.chainModify(1.5);
			}
		},
		flags: { },
		name: "Mold Breaker-Plus",
		rating: 3,
		num: 104,
	},
	metalbreakerplus: {
		onEffectiveness(typeMod, target, type, move) {
			if (type === 'Steel' && move.type === 'Steel') return 1;
		},
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type) && attacker.activeMoveActions <= 1) {
				this.debug('STAB boost');
				return this.chainModify(1.5);
			}
		},
		flags: { },
		name: "Metal Breaker-Plus",
		rating: 3.5,
		num: -197,
	},
	ironfistgolurk: {
		onBasePowerPriority: 23,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['punch']) {
				this.debug('Iron Fist (Golurk) boost');
				return this.chainModify([6144, 4096]);
			}
		},
		onDamage(damage, target, source, effect) {
			this.effectState.checkedBerserk = !(
				effect.effectType === "Move" && !effect.multihit &&
				!(effect.hasSheerForce && source.hasAbility('sheerforce'))
			);
		},
		onTryEatItem(item) {
			const healingItems = [
				'aguavberry', 'enigmaberry', 'figyberry', 'iapapaberry', 'magoberry', 'sitrusberry', 'wikiberry', 'oranberry', 'berryjuice',
			];
			if (healingItems.includes(item.id)) {
				return this.effectState.checkedBerserk;
			}
			return true;
		},
		onAfterMoveSecondary(target, source, move) {
			this.effectState.checkedBerserk = true;
			if (!source || source === target || !target.hp || !move.totalDamage) return;
			const lastAttackedBy = target.getLastAttackedBy();
			if (!lastAttackedBy) return;
			const damage = move.multihit && !move.smartTarget ? move.totalDamage : lastAttackedBy.damage;
			if (target.hp <= target.maxhp / 2 && target.hp + damage > target.maxhp / 2) {
				this.boost({ spa: 1 }, target, target);
			}
		},
		flags: { },
		name: "Iron Fist (Golurk)",
		rating: 3,
		num: 89,
	},
	klutzgolurk: {
		// Klutz isn't technically active immediately in-game, but it activates early enough to beat all items
		// we should keep an eye out in future gens for items that activate on switch-in before Unnerve
		onSwitchInPriority: 1,
		// Item suppression implemented in Pokemon.ignoringItem() within sim/pokemon.js
		onStart(pokemon) {
			pokemon.addVolatile('confusion');
			this.boost({ atk: 1 }, pokemon);
		},
		onResidualOrder: 28,
		onResidualSubOrder: 2,
		onResidual(pokemon) {
			if (pokemon.activeTurns) {
				this.boost({ spa: 1 });
			}
		},
		flags: { },
		name: "Klutz (Golurk)",
		rating: -1,
		num: 103,
	},
	noguardgolurk: {
		onAnyInvulnerabilityPriority: 1,
		onAnyInvulnerability(target, source, move) {
			if (move && (source === this.effectState.target || target === this.effectState.target)) return 0;
		},
		onAnyAccuracy(accuracy, target, source, move) {
			if (move && (source === this.effectState.target || target === this.effectState.target)) {
				return true;
			}
			return accuracy;
		},
		onStart(pokemon) {
			let activated = false;
			for (const target of pokemon.adjacentFoes()) {
				if (!activated) {
					this.add('-ability', pokemon, 'No Guard (Golurk)', 'boost');
					activated = true;
				}
				if (target.volatiles['substitute']) {
					this.add('-immune', target);
				} else {
					this.boost({ atk: -1 }, target, pokemon, null, true);
				}
			}
		},
		flags: { },
		name: "Blind Drop",
		rating: 3,
		num: -195,
	},
	beastboostplus: {
		onSourceAfterFaint(length, target, source, effect) {
			if (effect && effect.effectType === 'Move') {
				const bestStat = source.getBestStat(true, true);
				this.boost({ [bestStat]: length }, source);
			}
		},
		onStart(pokemon) {
			if (pokemon.getItem().name === 'Beast Ball' && pokemon.useItem()) {
				const bestStat = pokemon.getBestStat(true, true);
				this.boost({ [bestStat]: 1 }, pokemon);
			}
		},
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type) && attacker.activeMoveActions <= 1) {
				this.debug('STAB boost');
				return this.chainModify(1.5);
			}
		},
		flags: { },
		name: "Beast Boost-Plus",
		rating: 3.5,
		num: 224,
	},
	levitateplus: {
		// airborneness implemented in sim/pokemon.js:Pokemon#isGrounded
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type) && attacker.activeMoveActions <= 1) {
				this.debug('STAB boost');
				return this.chainModify(1.5);
			}
		},
		flags: { breakable: 1 },
		name: "Levitate-Plus",
		rating: 3.5,
		num: 26,
	},
	filthyplus: {
		onBasePowerPriority: 19,
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type) && move.type === 'Poison' && attacker.activeMoveActions <= 1) {
				this.debug('STAB boost');
				return this.chainModify(1.8);
			}
			if (attacker.hasType(move.type) && attacker.activeMoveActions <= 1) {
				this.debug('STAB boost');
				return this.chainModify(1.5);
			}
			if (move.type === 'Poison') {
				this.debug('Filthy boost');
				return this.chainModify(1.2);
			}
		},
		flags: { },
		name: "Filthy-Plus",
		rating: 2,
		num: -159,
	},
	sandveilplus: {
		onSourceModifyDamage(damage, source, target, move) {
			let mod = 1;
			if (target.hp >= target.maxhp / 2 || (target.hp >= target.maxhp / 4 && this.field.isWeather('sandstorm'))) mod *= 0.75;
			return this.chainModify(mod);
		},
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type) && attacker.activeMoveActions <= 1) {
				this.debug('STAB boost');
				return this.chainModify(1.5);
			}
		},
		flags: { breakable: 1 },
		name: "Sand Veil-Plus",
		rating: 1.5,
		num: 8,
	},
	draconianplus: {
		onBasePowerPriority: 19,
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type) && move.type === 'Dragon' && attacker.activeMoveActions <= 1) {
				this.debug('STAB boost');
				return this.chainModify(1.8);
			}
			if (attacker.hasType(move.type) && attacker.activeMoveActions <= 1) {
				this.debug('STAB boost');
				return this.chainModify(1.5);
			}
			if (move.type === 'Dragon') {
				this.debug('Draconian boost');
				return this.chainModify(1.2);
			}
		},
		flags: { },
		name: "Draconian-Plus",
		rating: 2,
		num: -163,
	},
	dragonizeplus: {
		isNonstandard: "Future",
		onModifyTypePriority: -1,
		onModifyType(move, pokemon) {
			const noModifyType = [
				'judgment', 'multiattack', 'naturalgift', 'revelationdance', 'technoblast', 'terrainpulse', 'weatherball',
			];
			if (move.type === 'Normal' && (!noModifyType.includes(move.id) || this.activeMove?.isMax) &&
				!(move.isZ && move.category !== 'Status') && !(move.name === 'Tera Blast' && pokemon.terastallized)) {
				move.type = 'Dragon';
				move.typeChangerBoosted = this.effect;
			}
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, pokemon, target, move) {
			if (move.typeChangerBoosted === this.effect) return this.chainModify([4915, 4096]);
			if (pokemon.hasType(move.type) && pokemon.activeMoveActions <= 1) {
				this.debug('STAB boost');
				return this.chainModify(1.5);
			}
		},
		flags: {},
		name: "Dragonize-Plus",
		rating: 4,
		num: 312,
	},
	joyfulplus: {
		onDamagingHit(damage, target, source, effect) {
			this.boost({ spa: 1 });
		},
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type) && attacker.activeMoveActions <= 1) {
				this.debug('STAB boost');
				return this.chainModify(1.5);
			}
		},
		flags: { },
		name: "Joyful-Plus",
		rating: 1,
		num: -124,
	},
	regeneratorplus: {
		onSwitchOut(pokemon) {
			pokemon.heal(pokemon.baseMaxhp / 3);
		},
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type) && attacker.activeMoveActions <= 1) {
				this.debug('STAB boost');
				return this.chainModify(1.5);
			}
		},
		flags: { },
		name: "Regenerator-Plus",
		rating: 4.5,
		num: 144,
	},
	blessedbodyplus: {
		onDamagingHit(damage, target, source, effect) {
			const r = this.random(100);
			if (r < 20) {
				this.boost({ atk: 1 });
			} else if (r < 40) {
				this.boost({ spa: 1 });
			} else if (r < 60) {
				this.boost({ def: 1 });
			} else if (r < 80) {
				this.boost({ spd: 1 });
			} else if (r < 100) {
				this.boost({ spe: 1 });
			}
		},
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type) && attacker.activeMoveActions <= 1) {
				this.debug('STAB boost');
				return this.chainModify(1.5);
			}
		},
		flags: { },
		name: "Blessed Body-Plus",
		rating: 1,
		num: -133,
	},
};
