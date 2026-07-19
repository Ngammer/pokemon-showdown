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
	intimidate: {
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
		name: "Intimidate",
		rating: 3.5,
		num: 22,
	},
	guts: {
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
		name: "Guts",
		rating: 3.5,
		num: 62,
	},
};
