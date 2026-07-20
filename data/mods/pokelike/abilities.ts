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
	torrentstabhit: {
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
		name: "Torrent-STAB Hit",
		rating: 2,
		num: 67,
	},
	gluttonystabhit: {
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
		name: "Gluttony-STAB Hit",
		rating: 1.5,
		num: 82,
	},
	blinddropstabhit: {
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
		name: "Blind Drop-STAB Hit",
		rating: 3,
		num: -195,
	},
	moldbreakerstabhit: {
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
		name: "Mold Breaker-STAB Hit",
		rating: 3,
		num: 104,
	},
	metalbreakerstabhit: {
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
		name: "Metal Breaker-STAB Hit",
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
		name: "Iron Fist-Golurk",
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
		name: "Klutz-Golurk",
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
		name: "No-Guard-Golurk",
		rating: 3,
		num: -195,
	},
	beastbooststabhit: {
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
		name: "Beast Boost-STAB Hit",
		rating: 3.5,
		num: 224,
	},
	levitatestabhit: {
		// airborneness implemented in sim/pokemon.js:Pokemon#isGrounded
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type) && attacker.activeMoveActions <= 1) {
				this.debug('STAB boost');
				return this.chainModify(1.5);
			}
		},
		flags: { breakable: 1 },
		name: "Levitate-STAB Hit",
		rating: 3.5,
		num: 26,
	},
	filthystabhit: {
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
		name: "Filthy-STAB Hit",
		rating: 2,
		num: -159,
	},
	sandveilstabhit: {
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
		name: "Sand Veil-STAB Hit",
		rating: 1.5,
		num: 8,
	},
	draconianstabhit: {
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
		name: "Draconian-STAB Hit",
		rating: 2,
		num: -163,
	},
	dragonizestabhit: {
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
		name: "Dragonize-STAB Hit",
		rating: 4,
		num: 312,
	},
	joyfulcrowthsola: {
		onDamagingHit(damage, target, source, effect) {
			this.boost({ spa: 1 });
		},
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type) && attacker.activeMoveActions <= 1) {
				this.debug('STAB boost');
				return this.chainModify(1.5);
			}
		},
		onSourceDamagingHit(damage, target, source, move) {
			if (target.hasAbility('shielddust') || target.hasItem('covertcloak')) return;
			if (move.type === 'Rock' && !target.getVolatile('smackdown')) {
				target.addVolatile('smackdown');
			}
		},
		flags: { },
		name: "Joyful-Crowthsola",
		rating: 1,
		num: -124,
	},
	regeneratorcrowthsola: {
		onSwitchOut(pokemon) {
			pokemon.heal(pokemon.baseMaxhp / 3);
		},
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.hasType(move.type) && attacker.activeMoveActions <= 1) {
				this.debug('STAB boost');
				return this.chainModify(1.5);
			}
		},
		onSourceDamagingHit(damage, target, source, move) {
			if (target.hasAbility('shielddust') || target.hasItem('covertcloak')) return;
			if (move.type === 'Rock' && !target.getVolatile('smackdown')) {
				target.addVolatile('smackdown');
			}
		},
		flags: { },
		name: "Regenerator-Crowthsola",
		rating: 4.5,
		num: 144,
	},
	blessedbodycrowthsola: {
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
		onSourceDamagingHit(damage, target, source, move) {
			if (target.hasAbility('shielddust') || target.hasItem('covertcloak')) return;
			if (move.type === 'Rock' && !target.getVolatile('smackdown')) {
				target.addVolatile('smackdown');
			}
		},
		flags: { },
		name: "Blessed Body-Crowthsola",
		rating: 1,
		num: -133,
	},
	toxicdebrisonlystab: {
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
		name: "Toxic Debris-Only STAB",
		rating: 3.5,
		num: 295,
	},
	corrosiononlystab: {
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
		name: "Corrosion-Only STAB",
		rating: 2.5,
		num: 212,
	},
	flowerveilonlystab: {
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
		name: "Flower Veil-Only STAB",
		rating: 0,
		num: 166,
	},
	runawayonlystab: {
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
		name: "Run Away-Only STAB",
		rating: 0,
		num: 50,
	},
	terrifyingonlystab: {
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
		name: "Terrifying-Only STAB",
		rating: 2,
		num: -167,
	},
	souleateronlystab: {
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
		name: "Soul Eater-Only STAB",
		rating: 4,
		num: -115,
	},
	flamebodyonlystab: {
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
		name: "Flame Body-Only STAB",
		rating: 2,
		num: 49,
	},
	toughclawsonlystab: {
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
		name: "Tough Claws-Only Stab",
		rating: 3.5,
		num: 181,
	},
	galewingsonlystab: {
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
		name: "Gale Wings-Only STAB",
		rating: 4,
		num: 177,
	},
	insomniamorepower: {
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
		name: "Insomnia-More Power",
		rating: 1.5,
		num: 15,
	},
	stakeoutmorepower: {
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
		name: "Stakeout-More Power",
		rating: 4.5,
		num: 198,
	},
	weavermorepower: {
		onSourceDamagingHit(damage, target, source, move) {
			// Despite not being a secondary, Shield Dust / Covert Cloak block Toxic Chain's effect
			if (target.hasAbility('shielddust') || target.hasItem('covertcloak')) return;
			if (this.randomChance(10, 10)) {
				this.boost({ spe: -1 }, target, source, null, true, false);
			}
			if (this.randomChance(3, 10)) {
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
		name: "Weaver-More Power",
		rating: 3.5,
		num: -198,
	},
	rivalryonlystab: {
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
		name: "Rivalry-Only STAB",
		rating: 0,
		num: 79,
	},
	intimidateonlystab: {
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
		name: "Intimidate-Only Stab",
		rating: 3.5,
		num: 22,
	},
	gutsonlystab: {
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
		name: "Guts-STAB Only",
		rating: 3.5,
		num: 62,
	},
	motordrivemorepower: {
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
		name: "Motor Drive-More Power",
		rating: 3,
		num: 78,
	},
	lightningrodmorepower: {
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
		name: "Lightning Rod-More Power",
		rating: 3,
		num: 31,
	},
	sapsippermorepower: {
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
		name: "Sap Sipper-More Power",
		rating: 3,
		num: 157,
	},
	keeneyeaffinity: {
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
		name: "Keen Eye-Affinity",
		rating: 0.5,
		num: 51,
	},
	tangledfeetaffinity: {
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
		name: "Tangled Feet-Affinity",
		rating: 1,
		num: 77,
	},
	bigpecksaffinity: {
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
		name: "Big Pecks-Affinity",
		rating: 0.5,
		num: 145,
	},
	shieldsdownaffinity: {
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
		name: "Shields Down-Affinity",
		rating: 3,
		num: 197,
	},
	unnerveaffinity: {
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
		name: "Unnerve-Affinity",
		rating: 1,
		num: 127,
	},
	healeraffinity: {
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
		name: "Healer-Affinity",
		rating: 0,
		num: 131,
	},
	telepathyaffinity: {
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
		name: "Telepathy-Affinity",
		rating: 0,
		num: 140,
	},
	cutecharmaffinity: {
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
		name: "Cute Charm-Affinity",
		rating: 0.5,
		num: 56,
	},
	magicalaffinity: {
		onBasePowerPriority: 19,
		onBasePower(basePower, attacker, defender, move) {
			if (move.type === 'Fairy') {
				this.debug('Magical boost');
				return this.chainModify(1.38);
			}
		},
		flags: { },
		name: "Magical-Affinity",
		rating: 2,
		num: -169,
	},
	pixilateaffinity: {
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
		name: "Pixilate-Affinity",
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
	sandveilplus: {
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
		name: "Sand Veil-Plus",
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
		name: "Poison Point-Plus",
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
		name: "Sheer Force-Plus",
		rating: 3.5,
		num: 125,
	},
	earlybirdrandom: {
		flags: { },
		name: "Early Bird-Random",
		onStart(pokemon) {
			this.actions.useMove('metronome', pokemon);
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
	scrappyrandom: {
		onStart(pokemon) {
			this.actions.useMove('metronome', pokemon);
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
		name: "Scrappy-Random",
		rating: 3,
		num: 113,
	},
	innerfocusrandom: {
		onStart(pokemon) {
			this.actions.useMove('metronome', pokemon);
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
		name: "Inner Focus-Random",
		rating: 1,
		num: 39,
	},
	seedsowerrandom: {
		onStart(pokemon) {
			this.actions.useMove('metronome', pokemon);
		},
		onDamagingHit(damage, target, source, move) {
			this.field.setTerrain('grassyterrain');
		},
		flags: { },
		name: "Seed Sower-Random",
		rating: 2.5,
		num: 269,
	},
	harvestrandom: {
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
		name: "Harvest-Random",
		rating: 2.5,
		num: 139,
	},
	hypercutterexplosive: {
		onSourceDamagingHit(damage, target, source, move) {
			// Despite not being a secondary, Shield Dust / Covert Cloak block Poison Touch's effect
			if (move.flags['slicing']) {
				const r = this.random(100);
				if (r < 50) {
					this.boost({ def: -1 }, target, source, null, true, false);
				}
			}
		},
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			if (!target.hp) {
				this.actions.useMove('explosion', target);
			}
		},
		flags: { },
		name: "Hyper Cutter-Explosive",
		rating: 1.5,
		num: 52,
	},
	shellarmorexplosive: {
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
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			source.removeVolatile('itemignored');
			if (!target.hp) {
				this.actions.useMove('explosion', target);
			}
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
		flags: { breakable: 1 },
		name: "Shell Armor-Explosive",
		rating: 1,
		num: 75,
	},
	sheerforceexplosive: {
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
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			if (!target.hp) {
				this.actions.useMove('selfdestruct', target);
			}
		},
		flags: { },
		name: "Sheer Force-Explosive",
		rating: 3.5,
		num: 125,
	},
	intimidateexplosive: {
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
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			if (!target.hp) {
				this.actions.useMove('selfdestruct', target);
			}
		},
		flags: { },
		name: "Intimidate-Explosive",
		rating: 3.5,
		num: 22,
	},
	intimidateexplosive2: {
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
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			if (!target.hp) {
				this.actions.useMove('explosion', target);
			}
		},
		flags: { },
		name: "Intimidate-Explosive 2",
		rating: 3.5,
		num: 22,
	},
	dampexplosive: {
		onAnyTryMove(target, source, effect) {
			if (['explosion', 'mindblown', 'mistyexplosion', 'selfdestruct'].includes(effect.id)) {
				this.attrLastMove('[still]');
				this.add('cant', this.effectState.target, 'ability: Damp', effect, `[of] ${target}`);
				return false;
			}
		},
		onAnyDamage(damage, target, source, effect) {
			if (effect && effect.name === 'Aftermath') {
				return false;
			}
		},
		onSourceModifyDamage(damage, source, target, move) {
			let mod = 1;
			if (move.type === 'Fire') mod *= 0.25;
			return this.chainModify(mod);
		},
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			if (!target.hp) {
				this.actions.useMove('selfdestruct', target);
			}
		},
		flags: { breakable: 1 },
		name: "Damp-Explosive",
		rating: 0.5,
		num: 6,
	},
	unnerveexplosive: {
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
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			if (!target.hp) {
				this.actions.useMove('selfdestruct', target);
			}
		},
		flags: { },
		name: "Unnerve-Explosive",
		rating: 1,
		num: 127,
	},
	protosynthesisexplosive: {
		onSwitchInPriority: -2,
		onStart(pokemon) {
			this.singleEvent('WeatherChange', this.effect, this.effectState, pokemon);
		},
		onWeatherChange(pokemon) {
			// Protosynthesis is not affected by Utility Umbrella
			if (this.field.isWeather('sunnyday')) {
				pokemon.addVolatile('protosynthesis');
			} else if (!pokemon.volatiles['protosynthesis']?.fromBooster && !this.field.isWeather('sunnyday')) {
				pokemon.removeVolatile('protosynthesis');
			}
		},
		onEnd(pokemon) {
			delete pokemon.volatiles['protosynthesis'];
			this.add('-end', pokemon, 'Protosynthesis', '[silent]');
		},
		condition: {
			noCopy: true,
			onStart(pokemon, source, effect) {
				if (effect?.name === 'Booster Energy') {
					this.effectState.fromBooster = true;
					this.add('-activate', pokemon, 'ability: Protosynthesis', '[fromitem]');
				} else {
					this.add('-activate', pokemon, 'ability: Protosynthesis');
				}
				this.effectState.bestStat = pokemon.getBestStat(false, true);
				this.add('-start', pokemon, 'protosynthesis' + this.effectState.bestStat);
			},
			onModifyAtkPriority: 5,
			onModifyAtk(atk, pokemon) {
				if (this.effectState.bestStat !== 'atk' || pokemon.ignoringAbility()) return;
				this.debug('Protosynthesis atk boost');
				return this.chainModify([5325, 4096]);
			},
			onModifyDefPriority: 6,
			onModifyDef(def, pokemon) {
				if (this.effectState.bestStat !== 'def' || pokemon.ignoringAbility()) return;
				this.debug('Protosynthesis def boost');
				return this.chainModify([5325, 4096]);
			},
			onModifySpAPriority: 5,
			onModifySpA(spa, pokemon) {
				if (this.effectState.bestStat !== 'spa' || pokemon.ignoringAbility()) return;
				this.debug('Protosynthesis spa boost');
				return this.chainModify([5325, 4096]);
			},
			onModifySpDPriority: 6,
			onModifySpD(spd, pokemon) {
				if (this.effectState.bestStat !== 'spd' || pokemon.ignoringAbility()) return;
				this.debug('Protosynthesis spd boost');
				return this.chainModify([5325, 4096]);
			},
			onModifySpe(spe, pokemon) {
				if (this.effectState.bestStat !== 'spe' || pokemon.ignoringAbility()) return;
				this.debug('Protosynthesis spe boost');
				return this.chainModify(1.5);
			},
			onEnd(pokemon) {
				this.add('-end', pokemon, 'Protosynthesis');
			},
		},
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			if (!target.hp) {
				this.actions.useMove('explosion', target);
			}
		},
		flags: { failroleplay: 1, noreceiver: 1, noentrain: 1, notrace: 1, failskillswap: 1, notransform: 1 },
		name: "Protosynthesis-Explosive",
		rating: 3,
		num: 281,
	},
	forewarnexplosive: {
		onModifyPriority(priority, pokemon, target, move) {
			if (pokemon.activeTurns === 1) {
				return priority + 1;
			}
		},
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			if (!target.hp) {
				this.actions.useMove('explosion', target);
			}
		},
		flags: { },
		name: "Forewarn-Explosive",
		rating: 0.5,
		num: 108,
	},
	zerotoherosurf: {
		onSwitchOut(pokemon) {
			if (pokemon.baseSpecies.baseSpecies !== 'Palafin') return;
			if (pokemon.species.forme !== 'Hero') {
				pokemon.formeChange('Palafin-Hero', this.effect, true);
				pokemon.heroMessageDisplayed = false;
			}
		},
		onSwitchIn(pokemon) {
			this.actions.useMove('surf', pokemon);
			if (pokemon.baseSpecies.baseSpecies !== 'Palafin') return;
			if (!pokemon.heroMessageDisplayed && pokemon.species.forme === 'Hero') {
				this.add('-activate', pokemon, 'ability: Zero to Hero-Surf');
				pokemon.heroMessageDisplayed = true;
			}
		},
		flags: { failroleplay: 1, noreceiver: 1, noentrain: 1, notrace: 1, failskillswap: 1, cantsuppress: 1, notransform: 1 },
		name: "Zero to Hero-Surf",
		rating: 5,
		num: 278,
	},
	cudchewfield: {
		onEatItem(item, pokemon, source, effect) {
			if (item.isBerry && (!effect || !['bugbite', 'pluck'].includes(effect.id))) {
				this.effectState.berry = item;
				this.effectState.counter = 2;
				// This is needed in case the berry was eaten during residuals, preventing the timer from decreasing this turn
				if (!this.queue.peek()) this.effectState.counter--;
			}
			this.heal(pokemon.baseMaxhp / 4);
		},
		onResidualOrder: 28,
		onResidualSubOrder: 2,
		onResidual(pokemon) {
			if (!this.effectState.berry || !pokemon.hp) return;
			if (--this.effectState.counter <= 0) {
				const item = this.effectState.berry;
				this.add('-activate', pokemon, 'ability: Cud Chew');
				this.add('-enditem', pokemon, item.name, '[eat]');
				if (this.singleEvent('Eat', item, null, pokemon, null, null)) {
					this.runEvent('EatItem', pokemon, null, null, item);
				}
				if (item.onEat) pokemon.ateBerry = true;
				delete this.effectState.berry;
				delete this.effectState.counter;
			}
		},
		onStart(source) {
			const r = this.random(100);
			if (r < 25) {
				this.field.setTerrain('grassyterrain');
			} else if (r < 50) {
				this.field.setTerrain('mistyterrain');
			} else if (r < 75) {
				this.field.setTerrain('electricterrain');
			} else if (r < 100) {
				this.field.setTerrain('psychicterrain');
			}
		},
		flags: { },
		name: "Cud Chew-Field",
		rating: 2,
		num: 291,
	},
	armortailfield: {
		onFoeTryMove(target, source, move) {
			const targetAllExceptions = ['perishsong', 'flowershield', 'rototiller'];
			if (move.target === 'foeSide' || (move.target === 'all' && !targetAllExceptions.includes(move.id))) {
				return;
			}

			const armorTailHolder = this.effectState.target;
			if ((source.isAlly(armorTailHolder) || move.target === 'all') && move.priority > 0.1) {
				this.attrLastMove('[still]');
				this.add('cant', armorTailHolder, 'ability: Armor Tail', move, `[of] ${target}`);
				return false;
			}
		},
		onStart(source) {
			const r = this.random(100);
			if (r < 25) {
				this.field.setTerrain('grassyterrain');
			} else if (r < 50) {
				this.field.setTerrain('mistyterrain');
			} else if (r < 75) {
				this.field.setTerrain('electricterrain');
			} else if (r < 100) {
				this.field.setTerrain('psychicterrain');
			}
		},
		flags: { breakable: 1 },
		name: "Armor Tail-Field",
		rating: 2.5,
		num: 296,
	},
	sapsipperfield: {
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
			const r = this.random(100);
			if (r < 25) {
				this.field.setTerrain('grassyterrain');
			} else if (r < 50) {
				this.field.setTerrain('mistyterrain');
			} else if (r < 75) {
				this.field.setTerrain('electricterrain');
			} else if (r < 100) {
				this.field.setTerrain('psychicterrain');
			}
		},
		flags: { breakable: 1 },
		name: "Sap Sipper-Field",
		rating: 3,
		num: 157,
	},
	rockheaddefog: {
		onDamage(damage, target, source, effect) {
			if (effect.id === 'recoil') {
				if (!this.activeMove) throw new Error("Battle.activeMove is null");
				if (this.activeMove.id !== 'struggle') return null;
			}
		},
		onStart(pokemon) {
			const activated = false;
			const sideConditions = ['spikes', 'toxicspikes', 'stealthrock', 'stickyweb', 'gmaxsteelsurge',
				'sharproot', 'hail', 'iondeluge'];
			const removeTarget = ['reflect', 'lightscreen', 'auroraveil', 'safeguard', 'mist', ...sideConditions];
			for (const condition of sideConditions) {
				if (pokemon.hp && pokemon.side.removeSideCondition(condition) && !pokemon.hasItem('heavydutyboots') && !activated) {
					this.add('-sideend', pokemon.side, this.dex.conditions.get(condition).name, '[from] ability: Skill', `[of] ${pokemon}`);
				}
			}
			for (const condition of removeTarget) {
				if (pokemon.hp && pokemon.side.foe.removeSideCondition(condition) && !pokemon.hasItem('heavydutyboots') && !activated) {
					this.add('-sideend', pokemon.side.foe, this.dex.conditions.get(condition).name, '[from] ability: Skill', `[of] ${pokemon}`);
				}
			}
		},
		flags: { },
		name: "Rock Head-Defog",
		rating: 3,
		num: 69,
	},
	pressuredefog: {
		onStart(pokemon) {
			this.add('-ability', pokemon, 'Pressure');
			const activated = false;
			const sideConditions = ['spikes', 'toxicspikes', 'stealthrock', 'stickyweb', 'gmaxsteelsurge',
				'sharproot', 'hail', 'iondeluge'];
			const removeTarget = ['reflect', 'lightscreen', 'auroraveil', 'safeguard', 'mist', ...sideConditions];
			for (const condition of sideConditions) {
				if (pokemon.hp && pokemon.side.removeSideCondition(condition) && !pokemon.hasItem('heavydutyboots') && !activated) {
					this.add('-sideend', pokemon.side, this.dex.conditions.get(condition).name, '[from] ability: Skill', `[of] ${pokemon}`);
				}
			}
			for (const condition of removeTarget) {
				if (pokemon.hp && pokemon.side.foe.removeSideCondition(condition) && !pokemon.hasItem('heavydutyboots') && !activated) {
					this.add('-sideend', pokemon.side.foe, this.dex.conditions.get(condition).name, '[from] ability: Skill', `[of] ${pokemon}`);
				}
			}
		},
		onDeductPP(target, source) {
			if (target.isAlly(source)) return;
			return 3;
		},
		flags: { },
		name: "Pressure-Defog",
		rating: 2.5,
		num: 46,
	},
	fossilizationdefog: {
		onTryHit(target, source, move) {
			if (target !== source && (move.type === 'Rock' || move.type === 'Steel')) {
				if (!this.heal(target.baseMaxhp / 4)) {
					this.add('-immune', target, '[from] ability: Fossilization');
				}
				return null;
			}
		},
		onStart(pokemon) { // Falta adaptar
			const removeAll = ['stealthrock'];
			const sides = [pokemon.side, ...pokemon.side.foeSidesWithConditions()];
			for (const side of sides) {
				for (const sideCondition of removeAll) {
					if (side.removeSideCondition(sideCondition)) {
						this.add('-sideend', side, this.dex.conditions.get(sideCondition).name);
					}
				}
			}
			const activated = false;
			const sideConditions = ['spikes', 'toxicspikes', 'stealthrock', 'stickyweb', 'gmaxsteelsurge',
				'sharproot', 'hail', 'iondeluge'];
			const removeTarget = ['reflect', 'lightscreen', 'auroraveil', 'safeguard', 'mist', ...sideConditions];
			for (const condition of sideConditions) {
				if (pokemon.hp && pokemon.side.removeSideCondition(condition) && !pokemon.hasItem('heavydutyboots') && !activated) {
					this.add('-sideend', pokemon.side, this.dex.conditions.get(condition).name, '[from] ability: Skill', `[of] ${pokemon}`);
				}
			}
			for (const condition of removeTarget) {
				if (pokemon.hp && pokemon.side.foe.removeSideCondition(condition) && !pokemon.hasItem('heavydutyboots') && !activated) {
					this.add('-sideend', pokemon.side.foe, this.dex.conditions.get(condition).name, '[from] ability: Skill', `[of] ${pokemon}`);
				}
			}
		},
		flags: { breakable: 1 },
		name: "Fossilization-Defog",
		rating: 3.5,
		num: -110,
	},
	sandveilspin: {
		onSourceModifyDamage(damage, source, target, move) {
			let mod = 1;
			if (target.hp >= target.maxhp / 2 || (target.hp >= target.maxhp / 4 && this.field.isWeather('sandstorm'))) mod *= 0.75;
			return this.chainModify(mod);
		},
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['spin']) {
				this.debug('Skill boost');
				return this.chainModify(2);
			}
		},
		flags: { breakable: 1 },
		name: "Sand Veil-Spin",
		rating: 1.5,
		num: 8,
	},
	roughskinspin: {
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target, true)) {
				this.damage(source.baseMaxhp / 8, source, target);
			}
		},
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['spin']) {
				this.debug('Skill boost');
				return this.chainModify(2);
			}
		},
		flags: { },
		name: "Rough Skin-Spin",
		rating: 2.5,
		num: 24,
	},
	sandrushspin: {
		onModifySpe(spe, pokemon) {
			if (this.field.isWeather('sandstorm') || pokemon.volatiles['nestball']) {
				return this.chainModify(2);
			}
		},
		onImmunity(type, pokemon) {
			if (type === 'sandstorm') return false;
		},
		onEnd(pokemon) {
			if (pokemon.getItem().name === 'Nest Ball') {
				pokemon.useItem();
			}
		},
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['spin']) {
				this.debug('Skill boost');
				return this.chainModify(2);
			}
		},
		flags: { },
		name: "Sand Rush-Spin",
		rating: 3,
		num: 146,
	},
	hierarchicalheadomniboost: {
		onSourceModifyDamage(damage, source, target, move) {
			let mod = 1;
			if (target.species.forme === 'Totem-Serious') {
				mod *= 0.50;
			};
			return this.chainModify(mod);
		},
		onResidual(target) {
			if ((target.hp > target.maxhp / 1.5)) {
				target.formeChange('Xatu-Totem-Serious', this.effect, false);
			}
			if ((target.hp <= target.maxhp / 1.5) && (target.hp > target.maxhp / 3)) {
				target.formeChange('Xatu-Totem-Grief', this.effect, false);
			}
			if ((target.hp <= target.maxhp / 3)) {
				target.formeChange('Xatu-Totem-Wrath', this.effect, false);
			}
		},
		onTryBoost(boost, target, source, effect) {
			if (target.species.forme === 'Totem-Grief') {
				if (source && target === source) return;
				let showMsg = false;
				let i: BoostID;
				for (i in boost) {
					if (boost[i]! < 0) {
						delete boost[i];
						showMsg = true;
					}
				}
				if (showMsg && !(effect as ActiveMove).secondaries && effect.id !== 'octolock') {
					this.add("-fail", target, "unboost", "[from] ability: Hierarchical Head", `[of] ${target}`);
				}
			}
		},
		onBasePowerPriority: 19,
		onBasePower(basePower, attacker, defender, move) {
			if (attacker.species.forme === 'Totem-Wrath') {
				this.debug('Hierarchical Head boost');
				return this.chainModify(1.33);
			}
		},
		onStart(pokemon) {
			this.boost({ atk: 1 }, pokemon);
			this.boost({ def: 1 }, pokemon);
			this.boost({ spa: 1 }, pokemon);
			this.boost({ spd: 1 }, pokemon);
			this.boost({ spe: 1 }, pokemon);
		},
		flags: { breakable: 1 },
		name: "Hierarchical Head-Omni Boost",
		rating: 1.5,
		num: -144,
	},
	gooeyberserker: {
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target, true) || target.getItem().name === 'Net Ball') {
				this.add('-ability', target, 'Gooey');
				this.boost({ spe: -1, atk: -1 }, source, target, null, true);
			}
			if (target.hp <= target.maxhp / 2) {
				this.boost({ atk: 1 }, target);
				this.boost({ def: 1 }, target);
				this.boost({ spa: 1 }, target);
				this.boost({ spd: 1 }, target);
				this.boost({ spe: 1 }, target);
			}
		},
		onEnd(pokemon) {
			if (pokemon.getItem().name === 'Net Ball') {
				pokemon.useItem();
			}
		},
		flags: { },
		name: "Gooey-Berserker",
		rating: 2,
		num: 183,
	},
	hydrationberserker: {
		onResidualOrder: 5,
		onResidualSubOrder: 3,
		onResidual(pokemon) {
			if (pokemon.status && ['raindance', 'primordialsea'].includes(pokemon.effectiveWeather())) {
				this.debug('hydration');
				this.add('-activate', pokemon, 'ability: Hydration');
				pokemon.cureStatus();
			}
		},
		onBeforeMove(attacker, defender, move) {
			if (move.type === 'Water' && attacker !== defender) {
				attacker.cureStatus();
			}
		},
		onDamagingHit(damage, target, source, move) {
			if (target.hp <= target.maxhp / 2) {
				this.boost({ atk: 1 }, target);
				this.boost({ def: 1 }, target);
				this.boost({ spa: 1 }, target);
				this.boost({ spd: 1 }, target);
				this.boost({ spe: 1 }, target);
			}
		},
		flags: { },
		name: "Hydration-Berserker",
		rating: 1.5,
		num: 93,
	},
	sapsipperberserker: {
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
		onDamagingHit(damage, target, source, move) {
			if (target.hp <= target.maxhp / 2) {
				this.boost({ atk: 1 }, target);
				this.boost({ def: 1 }, target);
				this.boost({ spa: 1 }, target);
				this.boost({ spd: 1 }, target);
				this.boost({ spe: 1 }, target);
			}
		},
		flags: { breakable: 1 },
		name: "Sap Sipper-Berserker",
		rating: 3,
		num: 157,
	},
	swarmlucky: {
		onBasePowerPriority: 19,
		onBasePower(basePower, attacker, defender, move) {
			if (move.type === 'Bug') {
				this.debug('Swarm boost');
				return this.chainModify(1.2);
			}
		},
		onModifyMovePriority: -2,
		onModifyMove(move) {
			if (move.secondaries) {
				this.debug('doubling secondary chance');
				for (const secondary of move.secondaries) {
					if (secondary.chance) secondary.chance *= 2;
				}
			}
			if (move.self?.chance) move.self.chance *= 2;
		},
		flags: { },
		name: "Swarm-Lucky",
		rating: 2,
		num: 68,
	},
	technicianlucky: {
		onBasePowerPriority: 30,
		onBasePower(basePower, attacker, defender, move) {
			const basePowerAfterMultiplier = this.modify(basePower, this.event.modifier);
			this.debug(`Base Power: ${basePowerAfterMultiplier}`);
			if (basePowerAfterMultiplier <= 60) {
				this.debug('Technician boost');
				return this.chainModify(1.5);
			}
		},
		onModifyMovePriority: -2,
		onModifyMove(move) {
			if (move.secondaries) {
				this.debug('doubling secondary chance');
				for (const secondary of move.secondaries) {
					if (secondary.chance) secondary.chance *= 2;
				}
			}
			if (move.self?.chance) move.self.chance *= 2;
		},
		flags: { },
		name: "Technician-Lucky",
		rating: 3.5,
		num: 101,
	},
	owntempolucky: {
		onUpdate(pokemon) {
			if (pokemon.volatiles['confusion']) {
				this.add('-activate', pokemon, 'ability: Own Tempo');
				pokemon.removeVolatile('confusion');
			}
		},
		onSetStatus(status, target, source, effect) {
			if ((effect as Move)?.status) {
				this.add('-immune', target, '[from] ability: Own Tempo');
			}
			return false;
		},
		onTryAddVolatile(status, pokemon) {
			if (status.id === 'confusion') return null;
		},
		onHit(target, source, move) {
			if (move?.volatileStatus === 'confusion') {
				this.add('-immune', target, 'confusion', '[from] ability: Own Tempo');
			}
		},
		onTryBoost(boost, target, source, effect) {
			if (effect.name === 'Intimidate' && boost.atk) {
				delete boost.atk;
				this.add('-fail', target, 'unboost', 'Attack', '[from] ability: Own Tempo', `[of] ${target}`);
			}
		},
		onModifyMovePriority: -2,
		onModifyMove(move) {
			if (move.secondaries) {
				this.debug('doubling secondary chance');
				for (const secondary of move.secondaries) {
					if (secondary.chance) secondary.chance *= 2;
				}
			}
			if (move.self?.chance) move.self.chance *= 2;
		},
		flags: { breakable: 1 },
		name: "Own Tempo-Lucky",
		rating: 1.5,
		num: 20,
	},
	waterabsorbeternalrain: {
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Water') {
				if (!this.heal(target.baseMaxhp / 4)) {
					this.add('-immune', target, '[from] ability: Water Absorb');
				}
				return null;
			}
		},
		onWeatherModifyDamagePriority: 1,
		onWeatherModifyDamage(damage, attacker, defender, move) {
			(this.dex.conditions.getByID('raindance' as ID) as any).onWeatherModifyDamage
				.call(this, damage, attacker, defender, move);
			return damage; // fast exit from event
		},
		flags: { breakable: 1 },
		name: "Water Absorb-Eternal Rain",
		rating: 3.5,
		num: 11,
	},
	dampeternalrain: {
		onAnyTryMove(target, source, effect) {
			if (['explosion', 'mindblown', 'mistyexplosion', 'selfdestruct'].includes(effect.id)) {
				this.attrLastMove('[still]');
				this.add('cant', this.effectState.target, 'ability: Damp', effect, `[of] ${target}`);
				return false;
			}
		},
		onAnyDamage(damage, target, source, effect) {
			if (effect && effect.name === 'Aftermath') {
				return false;
			}
		},
		onSourceModifyDamage(damage, source, target, move) {
			let mod = 1;
			if (move.type === 'Fire') mod *= 0.25;
			return this.chainModify(mod);
		},
		onWeatherModifyDamagePriority: 1,
		onWeatherModifyDamage(damage, attacker, defender, move) {
			(this.dex.conditions.getByID('raindance' as ID) as any).onWeatherModifyDamage
				.call(this, damage, attacker, defender, move);
			return damage; // fast exit from event
		},
		flags: { breakable: 1 },
		name: "Damp-Eternal Rain",
		rating: 0.5,
		num: 6,
	},
	swiftswimeternalrain: {
		onModifySpe(spe, pokemon) {
			return this.chainModify(2);
		},
		onWeatherModifyDamagePriority: 1,
		onWeatherModifyDamage(damage, attacker, defender, move) {
			(this.dex.conditions.getByID('raindance' as ID) as any).onWeatherModifyDamage
				.call(this, damage, attacker, defender, move);
			return damage; // fast exit from event
		},
		flags: { },
		name: "Swift Swim-Eternal Rain",
		rating: 3,
		num: 33,
	},
	thickfatrainbreath: {
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Ice' || move.type === 'Fire') {
				this.debug('Thick Fat weaken');
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 5,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Ice' || move.type === 'Fire') {
				this.debug('Thick Fat weaken');
				return this.chainModify(0.5);
			}
		},
		onStart(pokemon) {
			this.singleEvent('WeatherChange', this.effect, this.effectState, pokemon);
		},
		onWeatherChange(pokemon) {
			switch (pokemon.effectiveWeather()) {
			case 'raindance':
			case 'primordialsea':
				this.heal(pokemon.maxhp / 2);
				break;
			default:
				break;
			}
		},
		flags: { breakable: 1 },
		name: "Thick Fat-Rain Breath",
		rating: 3.5,
		num: 47,
	},
	icebodyrainbreath: {
		onWeather(target, source, effect) {
			if (effect.id === 'hail' || effect.id === 'snowscape') {
				this.heal(target.baseMaxhp / 8);
			}
		},
		onImmunity(type, pokemon) {
			if (type === 'hail') return false;
		},
		onBasePowerPriority: 19,
		onBasePower(basePower, attacker, defender, move) {
			if (move.type === 'Ice') {
				this.debug('Ice Body boost');
				return this.chainModify(1.1);
			}
		},
		onStart(pokemon) {
			this.singleEvent('WeatherChange', this.effect, this.effectState, pokemon);
		},
		onWeatherChange(pokemon) {
			switch (pokemon.effectiveWeather()) {
			case 'raindance':
			case 'primordialsea':
				this.heal(pokemon.maxhp / 2);
				break;
			default:
				break;
			}
		},
		flags: { },
		name: "Ice Body-Rain Breath",
		rating: 1,
		num: 115,
	},
	obliviousrainbreath: {
		onUpdate(pokemon) {
			if (pokemon.volatiles['attract']) {
				this.add('-activate', pokemon, 'ability: Oblivious');
				pokemon.removeVolatile('attract');
				this.add('-end', pokemon, 'move: Attract', '[from] ability: Oblivious');
			}
			if (pokemon.volatiles['taunt']) {
				this.add('-activate', pokemon, 'ability: Oblivious');
				pokemon.removeVolatile('taunt');
				// Taunt's volatile already sends the -end message when removed
			}
		},
		onImmunity(type, pokemon) {
			if (type === 'attract') return false;
		},
		onTryHit(pokemon, target, move) {
			if (move.id === 'attract' || move.id === 'captivate' || move.id === 'taunt') {
				this.add('-immune', pokemon, '[from] ability: Oblivious');
				return null;
			}
		},
		onTryBoost(boost, target, source, effect) {
			if (effect.name === 'Intimidate' && boost.atk) {
				delete boost.atk;
				this.add('-fail', target, 'unboost', 'Attack', '[from] ability: Oblivious', `[of] ${target}`);
			}
		},
		onStart(pokemon) {
			this.singleEvent('WeatherChange', this.effect, this.effectState, pokemon);
		},
		onWeatherChange(pokemon) {
			switch (pokemon.effectiveWeather()) {
			case 'raindance':
			case 'primordialsea':
				this.heal(pokemon.maxhp / 2);
				break;
			default:
				break;
			}
		},
		flags: { breakable: 1 },
		name: "Oblivious-Rain Breath",
		rating: 1.5,
		num: 12,
	},
	overgrowseedhit: {
		onBasePowerPriority: 19,
		onBasePower(basePower, attacker, defender, move) {
			if (move.type === 'Grass') {
				this.debug('Overgrow boost');
				return this.chainModify(1.2);
			}
		},
		onSourceDamagingHit(damage, target, source, move) {
			if (target.hasAbility('shielddust') || target.hasItem('covertcloak')) return;
			if (move.type === 'Grass' && !target.getVolatile('leechseed')) {
				target.addVolatile('leechseed');
			}
		},
		flags: { },
		name: "Overgrow-Seed Hit",
		rating: 2,
		num: 65,
	},
	battlebondseedhit: {
		onSourceAfterFaint(length, target, source, effect) {
			if (source.bondTriggered) return;
			if (effect?.effectType !== 'Move') return;
			if (source.species.id === 'greninjabond' && source.hp && !source.transformed && source.side.foePokemonLeft()) {
				this.boost({ atk: 1, spa: 1, spe: 1 }, source, source, this.effect);
				this.add('-activate', source, 'ability: Battle Bond');
				source.bondTriggered = true;
			}
		},
		onStart(pokemon) {
			if (pokemon.getItem().name === 'Strange Ball') {
				this.boost({ spe: 1, spa: 1, atk: 1 }, pokemon);
				this.damage(pokemon.baseMaxhp / 3.33, pokemon);
				pokemon.useItem();
			}
		},
		onSourceDamagingHit(damage, target, source, move) {
			if (target.hasAbility('shielddust') || target.hasItem('covertcloak')) return;
			if (move.type === 'Grass' && !target.getVolatile('leechseed')) {
				target.addVolatile('leechseed');
			}
		},
		flags: { failroleplay: 1, noreceiver: 1, noentrain: 1, notrace: 1, failskillswap: 1, cantsuppress: 1 },
		name: "Battle Bond- Seed Hit",
		rating: 3.5,
		num: 210,
	},
	shellarmorseedhit: {
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
		onSourceDamagingHit(damage, target, source, move) {
			if (target.hasAbility('shielddust') || target.hasItem('covertcloak')) return;
			if (move.type === 'Grass' && !target.getVolatile('leechseed')) {
				target.addVolatile('leechseed');
			}
		},
		flags: { breakable: 1 },
		name: "Shell Armor-Seed Hit",
		rating: 1,
		num: 75,
	},
	limberblinded: {
		onUpdate(pokemon) {
			if (pokemon.status === 'par') {
				this.add('-activate', pokemon, 'ability: Limber');
				pokemon.cureStatus();
			}
		},
		onSetStatus(status, target, source, effect) {
			if (status.id !== 'par') return;
			if ((effect as Move)?.status) {
				this.add('-immune', target, '[from] ability: Limber');
			}
			return false;
		},
		onTryBoost(boost, target, source, effect) {
			if (source && target === source && boost.spe && boost.spe < 0) {
				delete boost.spe;
				if (!(effect as ActiveMove).secondaries) {
					this.add("-fail", target, "unboost", "Attack", "[from] ability: Limber", `[of] ${target}`);
				}
			}
		},
		onSourceDamagingHit(damage, target, source, move) {
			if (target.hasAbility('shielddust') || target.hasItem('covertcloak')) return;
			if (move.type === 'Dark' && !target.getVolatile('darknessgem')) {
				target.addVolatile('darknessgem');
			}
		},
		flags: { breakable: 1 },
		name: "Limber-Blinded",
		rating: 2,
		num: 7,
	},
	unburdenblinded: {
		onAfterUseItem(item, pokemon) {
			if (pokemon !== this.effectState.target) return;
			pokemon.addVolatile('unburden');
		},
		onTakeItem(item, pokemon) {
			pokemon.addVolatile('unburden');
		},
		onEnd(pokemon) {
			pokemon.removeVolatile('unburden');
			pokemon.removeVolatile('healball');
		},
		condition: {
			onModifySpe(spe, pokemon) {
				if (!pokemon.item && !pokemon.ignoringAbility()) {
					return this.chainModify(2);
				}
			},
		},
		onStart(pokemon) {
			if (pokemon.getItem().name === 'Heal Ball') {
				pokemon.useItem();
			}
		},
		onSourceDamagingHit(damage, target, source, move) {
			if (target.hasAbility('shielddust') || target.hasItem('covertcloak')) return;
			if (move.type === 'Dark' && !target.getVolatile('darknessgem')) {
				target.addVolatile('darknessgem');
			}
		},
		flags: { },
		name: "Unburden-Blinded",
		rating: 3.5,
		num: 84,
	},
	pranksterblinded: {
		onModifyPriority(priority, pokemon, target, move) {
			if (move?.category === 'Status') {
				move.pranksterBoosted = true;
				return priority + 1;
			}
		},
		onSourceDamagingHit(damage, target, source, move) {
			if (target.hasAbility('shielddust') || target.hasItem('covertcloak')) return;
			if (move.type === 'Dark' && !target.getVolatile('darknessgem')) {
				target.addVolatile('darknessgem');
			}
		},
		flags: { },
		name: "Prankster-Blinded",
		rating: 4,
		num: 158,
	},
	protosynthesisflaming: {
		onSwitchInPriority: -2,
		onStart(pokemon) {
			this.singleEvent('WeatherChange', this.effect, this.effectState, pokemon);
		},
		onWeatherChange(pokemon) {
			// Protosynthesis is not affected by Utility Umbrella
			if (this.field.isWeather('sunnyday')) {
				pokemon.addVolatile('protosynthesis');
			} else if (!pokemon.volatiles['protosynthesis']?.fromBooster && !this.field.isWeather('sunnyday')) {
				pokemon.removeVolatile('protosynthesis');
			}
		},
		onEnd(pokemon) {
			delete pokemon.volatiles['protosynthesis'];
			this.add('-end', pokemon, 'Protosynthesis', '[silent]');
		},
		condition: {
			noCopy: true,
			onStart(pokemon, source, effect) {
				if (effect?.name === 'Booster Energy') {
					this.effectState.fromBooster = true;
					this.add('-activate', pokemon, 'ability: Protosynthesis', '[fromitem]');
				} else {
					this.add('-activate', pokemon, 'ability: Protosynthesis');
				}
				this.effectState.bestStat = pokemon.getBestStat(false, true);
				this.add('-start', pokemon, 'protosynthesis' + this.effectState.bestStat);
			},
			onModifyAtkPriority: 5,
			onModifyAtk(atk, pokemon) {
				if (this.effectState.bestStat !== 'atk' || pokemon.ignoringAbility()) return;
				this.debug('Protosynthesis atk boost');
				return this.chainModify([5325, 4096]);
			},
			onModifyDefPriority: 6,
			onModifyDef(def, pokemon) {
				if (this.effectState.bestStat !== 'def' || pokemon.ignoringAbility()) return;
				this.debug('Protosynthesis def boost');
				return this.chainModify([5325, 4096]);
			},
			onModifySpAPriority: 5,
			onModifySpA(spa, pokemon) {
				if (this.effectState.bestStat !== 'spa' || pokemon.ignoringAbility()) return;
				this.debug('Protosynthesis spa boost');
				return this.chainModify([5325, 4096]);
			},
			onModifySpDPriority: 6,
			onModifySpD(spd, pokemon) {
				if (this.effectState.bestStat !== 'spd' || pokemon.ignoringAbility()) return;
				this.debug('Protosynthesis spd boost');
				return this.chainModify([5325, 4096]);
			},
			onModifySpe(spe, pokemon) {
				if (this.effectState.bestStat !== 'spe' || pokemon.ignoringAbility()) return;
				this.debug('Protosynthesis spe boost');
				return this.chainModify(1.5);
			},
			onEnd(pokemon) {
				this.add('-end', pokemon, 'Protosynthesis');
			},
		},
		onSourceDamagingHit(damage, target, source, move) {
			if (target.hasAbility('shielddust') || target.hasItem('covertcloak')) return;
			if (move.type === 'Fire') {
				target.trySetStatus('brn');
			}
		},
		flags: { failroleplay: 1, noreceiver: 1, noentrain: 1, notrace: 1, failskillswap: 1, notransform: 1 },
		name: "Protosynthesis-Flaming",
		rating: 3,
		num: 281,
	},
	intimidateflaming: {
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
		onSourceDamagingHit(damage, target, source, move) {
			if (target.hasAbility('shielddust') || target.hasItem('covertcloak')) return;
			if (move.type === 'Fire') {
				target.trySetStatus('brn');
			}
		},
		flags: { },
		name: "Intimidate-Flaming",
		rating: 3.5,
		num: 22,
	},
	toughclawsflaming: {
		onBasePowerPriority: 21,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['contact']) {
				return this.chainModify([5325, 4096]);
			}
		},
		onSourceDamagingHit(damage, target, source, move) {
			if (target.hasAbility('shielddust') || target.hasItem('covertcloak')) return;
			if (move.type === 'Fire') {
				target.trySetStatus('brn');
			}
		},
		flags: { },
		name: "Tough Claws-Flaming",
		rating: 3.5,
		num: 181,
	},
	thickfatsimplified: {
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Ice' || move.type === 'Fire') {
				this.debug('Thick Fat weaken');
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 5,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Ice' || move.type === 'Fire') {
				this.debug('Thick Fat weaken');
				return this.chainModify(0.5);
			}
		},
		onSourceDamagingHit(damage, target, source, move) {
			if (target.hasAbility('shielddust') || target.hasItem('covertcloak')) return;
			if (move.type === 'Normal') {
				this.boost({ spd: 1 }, source);
			}
		},
		flags: { breakable: 1 },
		name: "Thick Fat-Simplified",
		rating: 3.5,
		num: 47,
	},
	owntemposimplified: {
		onUpdate(pokemon) {
			if (pokemon.volatiles['confusion']) {
				this.add('-activate', pokemon, 'ability: Own Tempo');
				pokemon.removeVolatile('confusion');
			}
		},
		onSetStatus(status, target, source, effect) {
			if ((effect as Move)?.status) {
				this.add('-immune', target, '[from] ability: Own Tempo');
			}
			return false;
		},
		onTryAddVolatile(status, pokemon) {
			if (status.id === 'confusion') return null;
		},
		onHit(target, source, move) {
			if (move?.volatileStatus === 'confusion') {
				this.add('-immune', target, 'confusion', '[from] ability: Own Tempo');
			}
		},
		onTryBoost(boost, target, source, effect) {
			if (effect.name === 'Intimidate' && boost.atk) {
				delete boost.atk;
				this.add('-fail', target, 'unboost', 'Attack', '[from] ability: Own Tempo', `[of] ${target}`);
			}
		},
		onSourceDamagingHit(damage, target, source, move) {
			if (target.hasAbility('shielddust') || target.hasItem('covertcloak')) return;
			if (move.type === 'Normal') {
				this.boost({ spd: 1 }, source);
			}
		},
		flags: { breakable: 1 },
		name: "Own Tempo-Simplified",
		rating: 1.5,
		num: 20,
	},
	defiantsimplified: {
		onAfterEachBoost(boost, target, source, effect) {
			if (!source || target.isAlly(source)) {
				return;
			}
			let statsLowered = false;
			let i: BoostID;
			for (i in boost) {
				if (boost[i]! < 0) {
					statsLowered = true;
				}
			}
			if (statsLowered) {
				this.boost({ atk: 2 }, target, target, null, false, true);
			}
		},
		onStart(pokemon) {
			if (pokemon.getItem().name === 'Sport Ball') {
				this.boost({ atk: 2 }, pokemon);
				pokemon.useItem();
			}
		},
		onSourceDamagingHit(damage, target, source, move) {
			if (target.hasAbility('shielddust') || target.hasItem('covertcloak')) return;
			if (move.type === 'Normal') {
				this.boost({ spd: 1 }, source);
			}
		},
		flags: { },
		name: "Defiant-Simplified",
		rating: 3,
		num: 128,
	},
	levitatemultihead: {
		// airborneness implemented in sim/pokemon.js:Pokemon#isGrounded
		onPrepareHit(source, target, move) {
			if (move.category === 'Status' || move.multihit || move.flags['noparentalbond'] || move.flags['charge'] ||
				move.flags['futuremove'] || move.spreadHit || move.isZ || move.isMax) return;
			move.multihit = 3;
			move.multihitType = 'parentalbond';
		},
		// Damage modifier implemented in BattleActions#modifyDamage()
		onSourceModifySecondaries(secondaries, target, source, move) {
			if (move.multihitType === 'parentalbond' && move.id === 'secretpower' && move.hit < 3) {
				// hack to prevent accidentally suppressing King's Rock/Razor Fang
				return secondaries.filter(effect => effect.volatileStatus === 'flinch');
			}
		},
		flags: { breakable: 1 },
		name: "Levitate-Multihead",
		rating: 3.5,
		num: 26,
	},
	hustlemultihead: {
		onEmergencyExit(target) {
			this.boost({ atk: 1 });
		},
		onPrepareHit(source, target, move) {
			if (move.category === 'Status' || move.multihit || move.flags['noparentalbond'] || move.flags['charge'] ||
				move.flags['futuremove'] || move.spreadHit || move.isZ || move.isMax) return;
			move.multihit = 3;
			move.multihitType = 'parentalbond';
		},
		// Damage modifier implemented in BattleActions#modifyDamage()
		onSourceModifySecondaries(secondaries, target, source, move) {
			if (move.multihitType === 'parentalbond' && move.id === 'secretpower' && move.hit < 3) {
				// hack to prevent accidentally suppressing King's Rock/Razor Fang
				return secondaries.filter(effect => effect.volatileStatus === 'flinch');
			}
		},
		flags: { },
		name: "Hustle-Multihead",
		rating: 3.5,
		num: 55,
	},
	darkauramultihead: {
		onStart(pokemon) {
			if (this.suppressingAbility(pokemon)) return;
			this.add('-ability', pokemon, 'Dark Aura');
		},
		onAnyBasePowerPriority: 20,
		onAnyBasePower(basePower, source, target, move) {
			if (target === source || move.category === 'Status' || move.type !== 'Dark') return;
			if (!move.auraBooster?.hasAbility('Dark Aura')) move.auraBooster = this.effectState.target;
			if (move.auraBooster !== this.effectState.target) return;
			return this.chainModify([move.hasAuraBreak ? 3072 : 5448, 4096]);
		},
		onPrepareHit(source, target, move) {
			if (move.category === 'Status' || move.multihit || move.flags['noparentalbond'] || move.flags['charge'] ||
				move.flags['futuremove'] || move.spreadHit || move.isZ || move.isMax) return;
			move.multihit = 3;
			move.multihitType = 'parentalbond';
		},
		// Damage modifier implemented in BattleActions#modifyDamage()
		onSourceModifySecondaries(secondaries, target, source, move) {
			if (move.multihitType === 'parentalbond' && move.id === 'secretpower' && move.hit < 3) {
				// hack to prevent accidentally suppressing King's Rock/Razor Fang
				return secondaries.filter(effect => effect.volatileStatus === 'flinch');
			}
		},
		flags: { },
		name: "Dark Aura-Multihead",
		rating: 3,
		num: 186,
	},
	keeneyepersecution: {
		onStart(pokemon) {
			this.boost({ accuracy: 1 }, pokemon);
		},
		onBasePower(basePower, attacker, defender, move) {
			if (defender.beingCalledBack || defender.switchFlag) {
				this.debug('Persecution damage boost');
				return move.basePower * 2;
			}
			return move.basePower;
		},
		onBeforeTurn(pokemon) {
			for (const side of this.sides) {
				if (side.hasAlly(pokemon)) continue;
				side.addSideCondition('pursuit', pokemon);
				const data = side.getSideConditionData('pursuit');
				if (!data.sources) {
					data.sources = [];
				}
				data.sources.push(pokemon);
			}
		},
		onModifyMove(move, source, target) {
			if (target?.beingCalledBack || target?.switchFlag) move.accuracy = true;
		},
		onTryHit(target, pokemon) {
			target.side.removeSideCondition('pursuit');
		},
		flags: { breakable: 1 },
		name: "Keen Eye-Persecution",
		rating: 0.5,
		num: 51,
	},
	sandrushpersecution: {
		onModifySpe(spe, pokemon) {
			if (this.field.isWeather('sandstorm') || pokemon.volatiles['nestball']) {
				return this.chainModify(2);
			}
		},
		onImmunity(type, pokemon) {
			if (type === 'sandstorm') return false;
		},
		onEnd(pokemon) {
			if (pokemon.getItem().name === 'Nest Ball') {
				pokemon.useItem();
			}
		},
		onBasePower(basePower, attacker, defender, move) {
			if (defender.beingCalledBack || defender.switchFlag) {
				this.debug('Persecution damage boost');
				return move.basePower * 2;
			}
			return move.basePower;
		},
		onBeforeTurn(pokemon) {
			for (const side of this.sides) {
				if (side.hasAlly(pokemon)) continue;
				side.addSideCondition('pursuit', pokemon);
				const data = side.getSideConditionData('pursuit');
				if (!data.sources) {
					data.sources = [];
				}
				data.sources.push(pokemon);
			}
		},
		onModifyMove(move, source, target) {
			if (target?.beingCalledBack || target?.switchFlag) move.accuracy = true;
		},
		onTryHit(target, pokemon) {
			target.side.removeSideCondition('pursuit');
		},
		flags: { },
		name: "Sand Rush-Persecution",
		rating: 3,
		num: 146,
	},
	steadfastpersecution: {
		onTryAddVolatile(status, pokemon) {
			if (status.id === 'flinch') {
				this.boost({ spe: 1 }, pokemon);
				return null;
			}
		},
		onDamage(damage, target, source, effect) {
			if (effect.effectType !== 'Move') {
				this.boost({ spe: 1 }, target);
				this.add('-activate', source, 'ability: ' + effect.name);
			}
		},
		onStart(pokemon) {
			if (pokemon.getItem().name === 'Repeat Ball') {
				this.boost({ spe: 1 }, pokemon);
				pokemon.useItem();
			}
		},
		onBasePower(basePower, attacker, defender, move) {
			if (defender.beingCalledBack || defender.switchFlag) {
				this.debug('Persecution damage boost');
				return move.basePower * 2;
			}
			return move.basePower;
		},
		onBeforeTurn(pokemon) {
			for (const side of this.sides) {
				if (side.hasAlly(pokemon)) continue;
				side.addSideCondition('pursuit', pokemon);
				const data = side.getSideConditionData('pursuit');
				if (!data.sources) {
					data.sources = [];
				}
				data.sources.push(pokemon);
			}
		},
		onModifyMove(move, source, target) {
			if (target?.beingCalledBack || target?.switchFlag) move.accuracy = true;
		},
		onTryHit(target, pokemon) {
			target.side.removeSideCondition('pursuit');
		},
		flags: { breakable: 1 },
		name: "Steadfast-Persecution",
		rating: 1,
		num: 80,
	},
	galvanizethunderous: {
		onModifyTypePriority: -1,
		onModifyType(move, pokemon) {
			const noModifyType = [
				'judgment', 'multiattack', 'naturalgift', 'revelationdance', 'technoblast', 'terrainpulse', 'weatherball',
			];
			if (move.type === 'Normal' && (!noModifyType.includes(move.id) || this.activeMove?.isMax) &&
				!(move.isZ && move.category !== 'Status') && !(move.name === 'Tera Blast' && pokemon.terastallized)) {
				move.type = 'Electric';
				move.typeChangerBoosted = this.effect;
			}
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, pokemon, target, move) {
			if (move.typeChangerBoosted === this.effect) return this.chainModify([4915, 4096]);
		},
		onModifyMovePriority: -5,
		onModifyMove(move) {
			if (move.flags['sound']) {
				move.forceSwitch = true;
			}
		},
		onModifyPriority(priority, pokemon, target, move) {
			if (move.flags['sound']) {
				return priority - 3;
			}
		},
		flags: { },
		name: "Galvanize-Thunderous",
		rating: 4,
		num: 206,
	},
	punkrockthunderous: {
		onBasePowerPriority: 7,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['sound']) {
				this.debug('Punk Rock boost');
				return this.chainModify([5325, 4096]);
			}
		},
		onSourceModifyDamage(damage, source, target, move) {
			if (move.flags['sound']) {
				this.debug('Punk Rock weaken');
				return this.chainModify(0.5);
			}
		},
		onModifyMovePriority: -5,
		onModifyMove(move) {
			if (move.flags['sound']) {
				move.forceSwitch = true;
			}
		},
		onModifyPriority(priority, pokemon, target, move) {
			if (move.flags['sound']) {
				return priority - 3;
			}
		},
		flags: { breakable: 1 },
		name: "Punk Rock-Thunderous",
		rating: 3.5,
		num: 244,
	},
	plusthunderous: {
		onModifySpAPriority: 5,
		onModifySpA(spa, pokemon) {
			for (const allyActive of pokemon.allies()) {
				if (allyActive.hasAbility(['minus', 'plus'])) {
					return this.chainModify(2.5);
				}
			}
		},
		onTryBoost(boost, target, source, effect) {
			if (source && target === source) return;
			let showMsg = false;
			let i: BoostID;
			for (i in boost) {
				if (boost[i]! < 0) {
					delete boost[i];
					showMsg = true;
				}
			}
			if (showMsg && !(effect as ActiveMove).secondaries && effect.id !== 'octolock') {
				this.add("-fail", target, "unboost", "[from] ability: Plus", `[of] ${target}`);
			}
		},
		onModifyMovePriority: -5,
		onModifyMove(move) {
			if (move.flags['sound']) {
				move.forceSwitch = true;
			}
		},
		onModifyPriority(priority, pokemon, target, move) {
			if (move.flags['sound']) {
				return priority - 3;
			}
		},
		flags: { },
		name: "Plus-Thunderous",
		rating: 0,
		num: 57,
	},
	frubbleexplosive: {
		onSourceDamagingHit(damage, target, source, move) {
			// Despite not being a secondary, Shield Dust / Covert Cloak block Toxic Chain's effect
			if (target.hasAbility('shielddust') || target.hasItem('covertcloak')) return;
			if (this.randomChance(10, 10)) {
				this.boost({ spe: -1 }, target, source, null, true, false);
			}
		},
		onSourceModifyDamage(damage, source, target, move) {
			return this.chainModify(0.9);
		},
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			source.removeVolatile('itemignored');
			if (!target.hp) {
				this.actions.useMove('explosion', target);
			}
		},
		flags: { breakable: 1 },
		name: "Frubble-Explosive",
		rating: 3.5,
		num: -106,
	},
	parentalbondrandom: {
		onStart(pokemon) {
			this.actions.useMove('metronome', pokemon);
		},
		onPrepareHit(source, target, move) {
			if (move.category === 'Status' || move.multihit || move.flags['noparentalbond'] || move.flags['charge'] ||
				move.flags['futuremove'] || move.spreadHit || move.isZ || move.isMax) return;
			move.multihit = 2;
			move.multihitType = 'parentalbond';
		},
		// Damage modifier implemented in BattleActions#modifyDamage()
		onSourceModifySecondaries(secondaries, target, source, move) {
			if (move.multihitType === 'parentalbond' && move.id === 'secretpower' && move.hit < 2) {
				// hack to prevent accidentally suppressing King's Rock/Razor Fang
				return secondaries.filter(effect => effect.volatileStatus === 'flinch');
			}
		},
		flags: { },
		name: "Parental Bond-Random",
		rating: 4.5,
		num: 185,
	},
	toughclawsdefog: {
		onStart(pokemon) {
			const activated = false;
			const sideConditions = ['spikes', 'toxicspikes', 'stealthrock', 'stickyweb', 'gmaxsteelsurge',
				'sharproot', 'hail', 'iondeluge'];
			const removeTarget = ['reflect', 'lightscreen', 'auroraveil', 'safeguard', 'mist', ...sideConditions];
			for (const condition of sideConditions) {
				if (pokemon.hp && pokemon.side.removeSideCondition(condition) && !pokemon.hasItem('heavydutyboots') && !activated) {
					this.add('-sideend', pokemon.side, this.dex.conditions.get(condition).name, '[from] ability: Skill', `[of] ${pokemon}`);
				}
			}
			for (const condition of removeTarget) {
				if (pokemon.hp && pokemon.side.foe.removeSideCondition(condition) && !pokemon.hasItem('heavydutyboots') && !activated) {
					this.add('-sideend', pokemon.side.foe, this.dex.conditions.get(condition).name, '[from] ability: Skill', `[of] ${pokemon}`);
				}
			}
		},
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
		name: "Tough Claws-Defog",
		rating: 3.5,
		num: 181,
	},
};
