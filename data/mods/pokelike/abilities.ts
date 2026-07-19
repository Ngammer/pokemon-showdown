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
			if (attacker.hasType(move.type) && attacker.activeMoveActions <= 1) {
				this.debug('STAB boost');
				return this.chainModify(1.5);
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
			if (type === 'Steel' && move.type === 'Steel') return typeMod + 1;
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
	toxicdebrisplus: {
		onDamagingHit(damage, target, source, move) {
			const side = source.isAlly(target) ? source.side.foe : source.side;
			const toxicSpikes = side.sideConditions['toxicspikes'];
			if (move.category === 'Physical' && (!toxicSpikes || toxicSpikes.layers < 2)) {
				this.add('-activate', target, 'ability: Toxic Debris');
				side.addSideCondition('toxicspikes', target);
			}
		},
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type)) {
				this.debug('STAB boost');
				return this.chainModify(1.3);
			}
		},
		flags: { },
		name: "Toxic Debris-Plus",
		rating: 3.5,
		num: 295,
	},
	corrosionplus: {
		// Implemented in sim/pokemon.js:Pokemon#setStatus
		onModifyMovePriority: -5,
		onModifyMove(move) {
			if (!move.ignoreImmunity) move.ignoreImmunity = {};
			if (move.ignoreImmunity !== true) {
				move.ignoreImmunity['Poison'] = true;
			}
		},
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type)) {
				this.debug('STAB boost');
				return this.chainModify(1.3);
			}
		},
		flags: { },
		name: "Corrosion-Plus",
		rating: 2.5,
		num: 212,
	},
	flowerveilplus: {
		onAllyTryBoost(boost, target, source, effect) {
			if ((source && target === source) || !target.hasType('Grass')) return;
			let showMsg = false;
			let i: BoostID;
			for (i in boost) {
				if (boost[i]! < 0) {
					delete boost[i];
					showMsg = true;
				}
			}
			if (showMsg && !(effect as ActiveMove).secondaries) {
				const effectHolder = this.effectState.target;
				this.add('-block', target, 'ability: Flower Veil', `[of] ${effectHolder}`);
			}
		},
		onAllySetStatus(status, target, source, effect) {
			if (target.hasType('Grass') && source && target !== source && effect && effect.id !== 'yawn') {
				this.debug('interrupting setStatus with Flower Veil');
				if (effect.name === 'Synchronize' || (effect.effectType === 'Move' && !effect.secondaries)) {
					const effectHolder = this.effectState.target;
					this.add('-block', target, 'ability: Flower Veil', `[of] ${effectHolder}`);
				}
				return null;
			}
		},
		onAllyTryAddVolatile(status, target) {
			if (target.hasType('Grass') && status.id === 'yawn') {
				this.debug('Flower Veil blocking yawn');
				const effectHolder = this.effectState.target;
				this.add('-block', target, 'ability: Flower Veil', `[of] ${effectHolder}`);
				return null;
			}
		},
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type)) {
				this.debug('STAB boost');
				return this.chainModify(1.3);
			}
		},
		flags: { breakable: 1 },
		name: "Flower Veil-Plus",
		rating: 0,
		num: 166,
	},
	runawayplus: {
		onTryBoost(boost, target, source, effect) {
			if (boost.spe && boost.spe < 0) {
				delete boost.spe;
				if (!(effect as ActiveMove).secondaries) {
					this.add("-fail", target, "unboost", "Attack", "[from] ability: Run Away", `[of] ${target}`);
				}
			}
		},
		onTrapPokemon(pokemon) {
			pokemon.trapped = pokemon.maybeTrapped = false;
		},
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type)) {
				this.debug('STAB boost');
				return this.chainModify(1.3);
			}
		},
		flags: { breakable: 1 },
		name: "Run Away-Plus",
		rating: 0,
		num: 50,
	},
	terrifyingplus: {
		onBasePowerPriority: 19,
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type) && move.type === 'Ghost') {
				this.debug('STAB boost');
				return this.chainModify(1.56);
			}
			if (attacker.hasType(move.type)) {
				this.debug('STAB boost');
				return this.chainModify(1.3);
			}
			if (move.type === 'Ghost') {
				this.debug('Terrifying boost');
				return this.chainModify(1.2);
			}
		},
		flags: { },
		name: "Terrifying-Plus",
		rating: 2,
		num: -167,
	},
	souleaterplus: {
		onStart(pokemon) {
			if (pokemon.side.totalFainted) {
				this.add('-activate', pokemon, 'ability: Soul Eater');
				const fallen = Math.min(pokemon.side.totalFainted + pokemon.side.foe.totalFainted, 10);
				this.add('-start', pokemon, `fallen${fallen}`, '[silent]');
				this.effectState.fallen = fallen;
			}
		},
		onEnd(pokemon) {
			this.add('-end', pokemon, `fallen${this.effectState.fallen}`, '[silent]');
		},
		onBasePowerPriority: 21,
		onBasePower(basePower, attacker, defender, move) {
			if (this.effectState.fallen && attacker.hasType(move.type)) {
				const powMod = [5325, 5617, 5911, 6204, 6496, 6789, 7082, 7375, 7667, 7961, 8254];
				this.debug(`Soul Eater boost: ${powMod[this.effectState.fallen]}/4096`);
				return this.chainModify(([powMod[this.effectState.fallen], 4096]));
			}
			if (this.effectState.fallen) {
				const powMod = [4096, 4321, 4547, 4772, 4997, 5222, 5448, 5673, 5898, 6124, 6349];
				this.debug(`Soul Eater boost: ${powMod[this.effectState.fallen]}/4096`);
				return this.chainModify([powMod[this.effectState.fallen], 4096]);
			}
		},
		flags: { },
		name: "Soul Eater-Plus",
		rating: 4,
		num: -115,
	},
	flamebodyplus: {
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target)) {
				if (this.randomChance(5, 10)) {
					source.trySetStatus('brn', target);
				}
			}
		},
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type)) {
				this.debug('STAB boost');
				return this.chainModify(1.3);
			}
		},
		flags: { },
		name: "Flame Body-Plus",
		rating: 2,
		num: 49,
	},
	toughclawsplus: {
		onBasePowerPriority: 21,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['contact'] && attacker.hasType(move.type)) {
				return this.chainModify([6923, 4096]);
			}
			if (move.flags['contact']) {
				return this.chainModify([5325, 4096]);
			}
			if (attacker.hasType(move.type)) {
				this.debug('STAB boost');
				return this.chainModify(1.3);
			}
		},
		flags: { },
		name: "Tough Claws-Plus",
		rating: 3.5,
		num: 181,
	},
	galewingsplus: {
		onModifyPriority(priority, pokemon, target, move) {
			if (move?.type === 'Flying') return priority + 1;
		},
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type)) {
				this.debug('STAB boost');
				return this.chainModify(1.3);
			}
		},
		flags: { },
		name: "Gale Wings-Plus",
		rating: 4,
		num: 177,
	},
	insomniaplus: {
		onUpdate(pokemon) {
			if (pokemon.status === 'slp') {
				this.add('-activate', pokemon, 'ability: Insomnia');
				pokemon.cureStatus();
			}
		},
		onSetStatus(status, target, source, effect) {
			if (status.id !== 'slp') return;
			if ((effect as Move)?.status) {
				this.add('-immune', target, '[from] ability: Insomnia');
			}
			return false;
		},
		onTryAddVolatile(status, target) {
			if (status.id === 'yawn') {
				this.add('-immune', target, '[from] ability: Insomnia');
				return null;
			}
		},
		onBasePower(basePower, attacker, defender, move) {
				return this.clampIntRange(move.basePower + 10, 0, 1000);
		},
		flags: { breakable: 1 },
		name: "Insomnia-Plus",
		rating: 1.5,
		num: 15,
	},
	stakeoutplus: {
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender) {
			if (!defender.activeTurns) {
				this.debug('Stakeout boost');
				return this.chainModify(2);
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender) {
			if (!defender.activeTurns) {
				this.debug('Stakeout boost');
				return this.chainModify(2);
			}
		},
		onBasePower(basePower, attacker, defender, move) {
				return this.clampIntRange(move.basePower + 10, 0, 1000);
		},
		flags: { },
		name: "Stakeout-Plus",
		rating: 4.5,
		num: 198,
	},
	weaverplus: {
		onSourceDamagingHit(damage, target, source, move) {
			// Despite not being a secondary, Shield Dust / Covert Cloak block Toxic Chain's effect
			if (target.hasAbility('shielddust') || target.hasItem('covertcloak')) return;
			if (this.randomChance(10, 10)) {
				this.boost({ spe: -1 }, target, source, null, true, false);
			}
			if (this.randomChance(3, 10)){
				target.addVolatile('weaver');
			}
		},
		onBasePower(basePower, attacker, defender, move) {
				return this.clampIntRange(move.basePower + 10, 0, 1000);
		},
		condition: {
			onTrapPokemon(pokemon) {
				if (pokemon.volatiles['weaver']) {
					pokemon.trapped = pokemon.maybeTrapped = false;
				}
			},
		},
		flags: { breakable: 1 },
		name: "Weaver-Plus",
		rating: 3.5,
		num: -198,
	},
	rivalryplus: {
		onBasePowerPriority: 24,
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.gender && defender.gender && attacker.hasType(move.type)) {
				if (attacker.gender === defender.gender) {
					this.debug('Rivalry boost');
					return this.chainModify(1.95);
				}
			}
			if (attacker.gender && defender.gender) {
				if (attacker.gender === defender.gender) {
					this.debug('Rivalry boost');
					return this.chainModify(1.5);
				}
			}
			if (attacker.hasType(move.type)) {
				if (attacker.gender === defender.gender) {
					this.debug('Rivalry boost');
					return this.chainModify(1.3);
				}
			}
		},
		flags: { },
		name: "Rivalry-Plus",
		rating: 0,
		num: 79,
	},
	intimidateplus: {
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
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type)) {
				this.debug('STAB boost');
				return this.chainModify(1.3);
			}
		},
		flags: { },
		name: "Intimidate-Plus",
		rating: 3.5,
		num: 22,
	},
	gutsplus: {
		onModifyAtkPriority: 5,
		onModifyAtk(atk, pokemon) {
			if (pokemon.status) {
				return this.chainModify(1.5);
			}
		},
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type)) {
				this.debug('STAB boost');
				return this.chainModify(1.3);
			}
		},
		flags: { },
		name: "Guts-Plus",
		rating: 3.5,
		num: 62,
	},
	motordriveplus: {
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Electric') {
				if (!this.boost({ spe: 1 }) && !target.addVolatile('motordrive')) {
					this.add('-immune', target, '[from] ability: Motor Drive');
				}
				return null;
			}
		},
		onSourceDamagingHit(damage, target, source, move) {
			if (source.hasItem('Electirizer') && move.type === 'Electric' && source.species.name === 'Electivire') {
				this.boost({ spe: 1 }, source);
			}
		},
		onStart(pokemon) {
			if (pokemon.getItem().name === 'Quick Ball') {
				this.boost({ spe: 1 }, pokemon);
				pokemon.useItem();
			}
		},
		onMoveAborted(pokemon, target, move) {
			if (move.type === 'Electric' && move.category !== 'Status') {
				pokemon.removeVolatile('motordrive');
			}
		},
		onAfterMove(pokemon, target, move) {
			if (move.type === 'Electric' && move.category !== 'Status') {
				pokemon.removeVolatile('motordrive');
			}
		},
		onEnd(pokemon) {
			pokemon.removeVolatile('motordrive');
		},
		onBasePower(basePower, attacker, defender, move) {
				return this.clampIntRange(move.basePower + 10, 0, 1000);
		},
		condition: {
			noCopy: true, // doesn't get copied by Baton Pass
			onStart(target) {
				this.add('-start', target, 'ability: Motor Drive');
			},
			onModifyAtkPriority: 5,
			onModifyAtk(atk, attacker, defender, move) {
				if (move.type === 'Electric' && attacker.hasAbility('motordrive')) {
					this.debug('Motor Drive boost');
					return this.chainModify(1.25);
				}
			},
			onModifySpAPriority: 5,
			onModifySpA(atk, attacker, defender, move) {
				if (move.type === 'Electric' && attacker.hasAbility('motordrive')) {
					this.debug('Motor Drive boost');
					return this.chainModify(1.25);
				}
			},
			onEnd(target) {
				this.add('-end', target, 'ability: Motor Drive', '[silent]');
			},
		},
		flags: { breakable: 1 },
		name: "Motor Drive-Plus",
		rating: 3,
		num: 78,
	},
	lightningrodplus: {
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Electric') {
				if (!this.boost({ spa: 1 })) {
					this.add('-immune', target, '[from] ability: Lightning Rod');
				}
				return null;
			}
		},
		onAnyRedirectTarget(target, source, source2, move) {
			if (move.type !== 'Electric' || move.flags['pledgecombo']) return;
			const redirectTarget = ['randomNormal', 'adjacentFoe'].includes(move.target) ? 'normal' : move.target;
			if (this.validTarget(this.effectState.target, source, redirectTarget)) {
				if (move.smartTarget) move.smartTarget = false;
				if (this.effectState.target !== target) {
					this.add('-activate', this.effectState.target, 'ability: Lightning Rod');
				}
				return this.effectState.target;
			}
		},
		onStart(pokemon) {
			if (pokemon.getItem().name === 'Fast Ball') {
				this.boost({ spa: 1 }, pokemon);
				pokemon.useItem();
			}
		},
		onBasePower(basePower, attacker, defender, move) {
				return this.clampIntRange(move.basePower + 10, 0, 1000);
		},
		flags: { breakable: 1 },
		name: "Lightning Rod-Plus",
		rating: 3,
		num: 31,
	},
	sapsipperplus: {
		onTryHitPriority: 1,
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Grass') {
				if (!this.boost({ atk: 1 })) {
					this.add('-immune', target, '[from] ability: Sap Sipper');
				}
				return null;
			}
		},
		onAllyTryHitSide(target, source, move) {
			if (source === this.effectState.target || !target.isAlly(source)) return;
			if (move.type === 'Grass') {
				this.boost({ atk: 1 }, this.effectState.target);
			}
		},
		onStart(pokemon) {
			if (pokemon.getItem().name === 'Friend Ball') {
				this.boost({ atk: 1 }, pokemon);
				pokemon.useItem();
			}
		},
		onBasePower(basePower, attacker, defender, move) {
				return this.clampIntRange(move.basePower + 10, 0, 1000);
		},
		flags: { breakable: 1 },
		name: "Sap Sipper-Plus",
		rating: 3,
		num: 157,
	},
	keeneyeplus: {
		onStart(pokemon) {
			this.boost({ accuracy: 1 }, pokemon);
		},
		onBasePower(basePower, attacker, defender, move) {
			if (move.type === 'flying') {
				this.debug('STAB boost');
				return this.chainModify(1.15);
			}
		},
		flags: { breakable: 1 },
		name: "Keen Eye-Plus",
		rating: 0.5,
		num: 51,
	},
	tangledfeetplus: {
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
		onBasePower(basePower, attacker, defender, move) {
			if (move.type === 'flying') {
				this.debug('STAB boost');
				return this.chainModify(1.15);
			}
		},
		flags: { },
		name: "Tangled Feet-Plus",
		rating: 1,
		num: 77,
	},
	bigpecksplus: {
		onSourceModifyDamage(damage, source, target, move) {
			let mod = 1;
			if (move.flags['contact']) mod = 0.9;
			return this.chainModify(mod);
		},
		onBasePower(basePower, attacker, defender, move) {
			if (move.type === 'flying') {
				this.debug('STAB boost');
				return this.chainModify(1.15);
			}
		},
		flags: { breakable: 1 },
		name: "Big Pecks-Plus",
		rating: 0.5,
		num: 145,
	},
	shieldsdownplus: {
		onSwitchInPriority: -1,
		onStart(pokemon) {
			if (pokemon.baseSpecies.baseSpecies !== 'Minior' || pokemon.transformed) return;
			if (pokemon.hp > pokemon.maxhp / 2) {
				if (pokemon.species.forme !== 'Meteor') {
					pokemon.formeChange('Minior-Meteor');
				}
			} else {
				if (pokemon.species.forme === 'Meteor') {
					pokemon.formeChange(pokemon.set.species);
				}
			}
		},
		onResidualOrder: 29,
		onResidual(pokemon) {
			if (pokemon.baseSpecies.baseSpecies !== 'Minior' || pokemon.transformed || !pokemon.hp) return;
			if (pokemon.hp > pokemon.maxhp / 2) {
				if (pokemon.species.forme !== 'Meteor') {
					pokemon.formeChange('Minior-Meteor');
				}
			} else {
				if (pokemon.species.forme === 'Meteor') {
					pokemon.formeChange(pokemon.set.species);
				}
			}
		},
		onSetStatus(status, target, source, effect) {
			if (target.species.id !== 'miniormeteor' || target.transformed) return;
			if ((effect as Move)?.status) {
				this.add('-immune', target, '[from] ability: Shields Down');
			}
			return false;
		},
		onTryAddVolatile(status, target) {
			if (target.species.id !== 'miniormeteor' || target.transformed) return;
			if (status.id !== 'yawn') return;
			this.add('-immune', target, '[from] ability: Shields Down');
			return null;
		},
		onBasePower(basePower, attacker, defender, move) {
			if (move.type === 'flying') {
				this.debug('STAB boost');
				return this.chainModify(1.15);
			}
		},
		flags: { failroleplay: 1, noreceiver: 1, noentrain: 1, notrace: 1, failskillswap: 1, cantsuppress: 1 },
		name: "Shields Down-Plus",
		rating: 3,
		num: 197,
	},
	unnerveplus: {
		onSwitchInPriority: 1,
		onStart(pokemon) {
			if (this.field.pseudoWeather['unnerved']) return;
			this.add('-ability', pokemon, 'Unnerve');
			this.field.addPseudoWeather('unnerved');
		},
		onEnd() {
			this.field.removePseudoWeather('unnerved');
		},
		onFoeTryEatItem() {
			return !this.field.pseudoWeather['unnerved'];
		},
		onBasePower(basePower, attacker, defender, move) {
			if (move.type === 'psychic') {
				this.debug('STAB boost');
				return this.chainModify(1.15);
			}
		},
		flags: { },
		name: "Unnerve-Plus",
		rating: 1,
		num: 127,
	},
	healerplus: {
		onResidualOrder: 5,
		onResidualSubOrder: 3,
		onStart(pokemon) {
			const allies = [...pokemon.side.pokemon, ...pokemon.side.allySide?.pokemon || []];
			for (const ally of allies) {
				ally.cureStatus();
			}
		},
		onResidual(pokemon) {
			for (const allyActive of pokemon.adjacentAllies()) {
				if (allyActive.status && this.randomChance(3, 10)) {
					this.add('-activate', pokemon, 'ability: Healer');
					allyActive.cureStatus();
				}
			}
		},
		onBasePower(basePower, attacker, defender, move) {
			if (move.type === 'psychic') {
				this.debug('STAB boost');
				return this.chainModify(1.15);
			}
		},
		flags: { },
		name: "Healer-Plus",
		rating: 0,
		num: 131,
	},
	telepathyplus: {
		onTryHit(target, source, move) {
			if (target !== source && target.isAlly(source) && move.category !== 'Status') {
				this.add('-activate', target, 'ability: Telepathy');
				return null;
			}
		},
		onModifyMovePriority: -5,
		onModifyMove(move) {
			move.ignoreImmunity = true;
		},
		onBasePower(basePower, attacker, defender, move) {
			if (move.type === 'psychic') {
				this.debug('STAB boost');
				return this.chainModify(1.15);
			}
		},
		flags: { breakable: 1 },
		name: "Telepathy-Plus",
		rating: 0,
		num: 140,
	},
	cutecharmplus: {
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target)) {
				if (this.randomChance(3, 10)) {
					source.addVolatile('attract', this.effectState.target);
				}
				// Increment the cumulative damage reduction, capped at 0.9
				if (!target.volatiles['cutecharm']) {
					source.addVolatile('cutecharm');
				}
				const currentStack = source.volatiles['cutecharm'].stack || 0;
				if (!target.fainted) {
					source.volatiles['cutecharm'].stack = Math.min(currentStack + 0.1, 0.9);
				}
			}
		},
		onSourceModifyDamage(damage, source, target, move) {
			let mod = 1;
			if (move.flags['contact']) {
				const reduction = source.volatiles['cutecharm']?.stack || 0;
				mod *= 1 - reduction;
			}
			return this.chainModify(mod);
		},
		onBasePower(basePower, attacker, defender, move) {
			if (move.type === 'fairy') {
				this.debug('STAB boost');
				return this.chainModify(1.15);
			}
		},
		flags: { breakable: 1 },
		name: "Cute Charm-Plus",
		rating: 0.5,
		num: 56,
	},
	magicalplus: {
		onBasePowerPriority: 19,
		onBasePower(basePower, attacker, defender, move) {
			if (move.type === 'Fairy') {
				this.debug('Magical boost');
				return this.chainModify(1.38);
			}
		},
		flags: { },
		name: "Magical-Plus",
		rating: 2,
		num: -169,
	},
	pixilateplus: {
		onModifyTypePriority: -1,
		onModifyType(move, pokemon) {
			const noModifyType = [
				'judgment', 'multiattack', 'naturalgift', 'revelationdance', 'technoblast', 'terrainpulse', 'weatherball',
			];
			if (move.type === 'Normal' && (!noModifyType.includes(move.id) || this.activeMove?.isMax) &&
				!(move.isZ && move.category !== 'Status') && !(move.name === 'Tera Blast' && pokemon.terastallized)) {
				move.type = 'Fairy';
				move.typeChangerBoosted = this.effect;
			}
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, pokemon, target, move) {
			if (move.typeChangerBoosted === this.effect) return this.chainModify([4915, 4096]);
			if (move.type === 'fairy') {
				this.debug('STAB boost');
				return this.chainModify(1.15);
			}
		},
		flags: { },
		name: "Pixilate-Plus",
		rating: 4,
		num: 182,
	},
	megalauncherplus: {
		onBasePowerPriority: 19,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['pulse']) {
				return this.chainModify(1.5);
			}
		},
		onStart(pokemon) {
			const bestStat = pokemon.getBestStat(true, true);
			this.boost({ [bestStat]: 1 }, pokemon);
		},
		flags: { },
		name: "Mega Launcher-Plus",
		rating: 3,
		num: 178,
	},
	shellarmorplus: {
		onCriticalHit: false,
		onSourceBasePowerPriority: 100, // exageradamente alto, para ir siempre primero
		onSourceBasePower(basePower, source, target, move) {
			const bannedItems = ['powerbelt', 'powerbracer', 'powerweight', 'expertbelt', 'ironball', 'laggingtail', 'lifeorb',
				'protectivepads', 'punchingglove', 'razorfang', 'blackbelt', 'blackglasses',
				'charcoal', 'dragonfang', 'hardstone', 'magnet', 'metalcoat', 'miracleseed', 'mysticwater', 'nevermeltice', 'poisonbarb', 'silverpowder', 'softsand', 'spelltag', 'twistedspoon', 'fairyfeather',
				'buggem', 'darkgem', 'dragongem', 'electricgem', 'fairygem', 'fightinggem', 'firegem', 'flyinggem', 'ghostgem', 'grassgem', 'groundgem', 'icegem', 'normalgem', 'poisongem', 'psychicgem', 'rockgem',
				'steelgem', 'watergem', 'dracoplate', 'dreadplate', 'earthplate', 'fistplate', 'flameplate', 'icicleplate', 'insectplate', 'ironplate', 'meadowplate', 'mindplate', 'pixieplate', 'skyplate',
				'splashplate', 'spookyplate', 'stoneplate', 'toxicplate', 'zapplate', 'skullfossil', 'adamantorb', 'griseousorb', 'lustrousorb', 'souldew', 'deepseascale', 'deepseatooth', 'lightball', 'thickclub',
				'stick', 'dragonscale', 'duskstone', 'firestone', 'waterstone', 'thunderstone', 'leafstone', 'shinyrock', 'ovalstone', 'icestone', 'bugmemory', 'darkmemory', 'dragonmemory', 'electricmemory',
				'fairymemory', 'fightingmemory', 'firememory', 'flyingmemory', 'ghostmemory', 'grassmemory', 'groundmemory', 'icememory', 'normalmemory', 'poisonmemory', 'psychicmemory', 'rockmemory', 'steelmemory',
				'watermemory', 'adamantcrystal', 'griseouscrystal', 'lustrouscrystal', 'leek', 'metalalloy', 'choicespecs', 'choiceband'];
			if (bannedItems.includes(source.item)) {
				source.addVolatile('itemignored');
			}
		},
		onDamagingHit(damage, target, source, move) {
			source.removeVolatile('itemignored');
		},
		condition: {
			duration: 1,
			onStart(pokemon) {
				this.add('-activate', pokemon, '[from] item suppression');
			},
			onEnd(pokemon) {
				this.add('-end', pokemon, '[from] item suppression');
			},
		},
		onStart(pokemon) {
			const bestStat = pokemon.getBestStat(true, true);
			this.boost({ [bestStat]: 1 }, pokemon);
		},
		flags: { breakable: 1 },
		name: "Shell Armor-Plus",
		rating: 1,
		num: 75,
	},
	regeneratorclawitzer: {
		onSwitchOut(pokemon) {
			pokemon.heal(pokemon.baseMaxhp / 3);
		},
		onStart(pokemon) {
			const bestStat = pokemon.getBestStat(true, true);
			this.boost({ [bestStat]: 1 }, pokemon);
		},
		flags: { },
		name: "Regenerator-Clawitzer",
		rating: 4.5,
		num: 144,
	},
	sandveilnidoqueen: {
		onSourceModifyDamage(damage, source, target, move) {
			let mod = 1;
			if (target.hp >= target.maxhp / 2 || (target.hp >= target.maxhp / 4 && this.field.isWeather('sandstorm'))) mod *= 0.75;
			return this.chainModify(mod);
		},
		onStart(pokemon) {
			const bestStat = pokemon.getBestStat(true, true);
			this.boost({ [bestStat]: 1 }, pokemon);
		},
		flags: { breakable: 1 },
		name: "Sand Veil-Nidoqueen",
		rating: 1.5,
		num: 8,
	},
	poisonpointplus: {
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target)) {
				if (this.randomChance(5, 10)) {
					source.trySetStatus('tox', target);
				}
			}
		},
		onStart(pokemon) {
			const bestStat = pokemon.getBestStat(true, true);
			this.boost({ [bestStat]: 1 }, pokemon);
		},
		flags: { },
		name: "Poison Point",
		rating: 1.5,
		num: 38,
	},
	sheerforceplus: {
		onModifyMove(move, pokemon) {
			if (move.secondaries && !move.hasSheerForceBoost) {
				delete move.secondaries;
				// Technically not a secondary effect, but it is negated
				delete move.self;
				if (move.id === 'clangoroussoulblaze') delete move.selfBoost;
				// Actual negation of `AfterMoveSecondary` effects implemented in scripts.js
				move.hasSheerForce = true;
			}
		},
		onBasePowerPriority: 21,
		onBasePower(basePower, pokemon, target, move) {
			if (move.hasSheerForce || move.hasSheerForceBoost) return this.chainModify([5325, 4096]);
		},
		onStart(pokemon) {
			const bestStat = pokemon.getBestStat(true, true);
			this.boost({ [bestStat]: 1 }, pokemon);
		},
		flags: { },
		name: "Sheer Force",
		rating: 3.5,
		num: 125,
	},
	earlybirdplus: {
		flags: { },
		name: "Early Bird-Plus",
		onStart(pokemon) {
			this.actions.useMove('metronome', pokemon)
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
		// Implemented in statuses.js
		rating: 1.5,
		num: 48,
	},
	scrappyplus: {
		onStart(pokemon) {
			this.actions.useMove('metronome', pokemon)
		},
		onModifyMovePriority: -5,
		onModifyMove(move) {
			if (!move.ignoreImmunity) move.ignoreImmunity = {};
			if (move.ignoreImmunity !== true) {
				move.ignoreImmunity['Fighting'] = true;
				move.ignoreImmunity['Normal'] = true;
			}
		},
		onTryBoost(boost, target, source, effect) {
			if (effect.name === 'Intimidate' && boost.atk) {
				delete boost.atk;
				this.add('-fail', target, 'unboost', 'Attack', '[from] ability: Scrappy', `[of] ${target}`);
			}
		},
		flags: { },
		name: "Scrappy-Plus",
		rating: 3,
		num: 113,
	},
	innerfocusplus: {
		onStart(pokemon) {
			this.actions.useMove('metronome', pokemon)
		},
		onTryAddVolatile(status, pokemon) {
			if (status.id === 'flinch') return null;
			if (status.id === 'confusion') return null;
			if (status.id === 'taunt') return null;
			if (status.id === 'curse') return null;
			if (status.id === 'torment') return null;
		},
		onTryBoost(boost, target, source, effect) {
			if (effect.name === 'Intimidate' && boost.atk) {
				delete boost.atk;
				this.add('-fail', target, 'unboost', 'Attack', '[from] ability: Inner Focus', `[of] ${target}`);
			}
		},
		flags: { breakable: 1 },
		name: "Inner Focus-Plus",
		rating: 1,
		num: 39,
	},
	seedsowerplus: {
		onStart(pokemon) {
			this.actions.useMove('metronome', pokemon)
		},
		onDamagingHit(damage, target, source, move) {
			this.field.setTerrain('grassyterrain');
		},
		flags: { },
		name: "Seed Sower-Plus",
		rating: 2.5,
		num: 269,
	},
	harvestplus: {
		onResidualOrder: 28,
		onResidualSubOrder: 2,
		onResidual(pokemon) {
			if (this.field.isWeather(['sunnyday', 'desolateland']) || this.randomChance(1, 2)) {
				if (pokemon.hp && !pokemon.item && this.dex.items.get(pokemon.lastItem).isBerry) {
					pokemon.setItem(pokemon.lastItem);
					pokemon.lastItem = '';
					this.add('-item', pokemon, pokemon.getItem(), '[from] ability: Harvest');
				}
			}
		},
		flags: { },
		name: "Harvest-Plus",
		rating: 2.5,
		num: 139,
	},
};
