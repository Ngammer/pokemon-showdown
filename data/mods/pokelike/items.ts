export const Items: import('../../../sim/dex-items').ModdedItemDataTable = {
assaultvest: {
		name: "Assault Vest",
		spritenum: 581,
		fling: {
			basePower: 80,
		},
		onModifySpDPriority: 1,
		onModifySpD(spd, pokemon) {
			if(pokemon.baseSpecies.num === 995) return this.chainModify(2);
			return this.chainModify(1.5);
		},
		onDisableMove(pokemon) {
			for (const moveSlot of pokemon.moveSlots) {
				const move = this.dex.moves.get(moveSlot.id);
				if (move.category === 'Status' && move.id !== 'mefirst') {
					pokemon.disableMove(moveSlot.id);
				}
			}
		},
		itemUser: ["Iron Thorns"],
		num: 640,
		gen: 6,
	},
	bigroot: {
		name: "Big Root",
		spritenum: 29,
		fling: {
			basePower: 10,
		},
		onTryHealPriority: 1,
		onTryHeal(damage, target, source, effect) {
			const heals = ['drain', 'leechseed', 'ingrain', 'aquaring', 'strengthsap'];
			if(target.baseSpecies.num === 995 && heals.includes(effect.id)) return this.chainModify([6554, 4096]);
			if (heals.includes(effect.id)) {
				return this.chainModify([5324, 4096]);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 296,
		gen: 4,
	},
	blackbelt: {
		name: "Black Belt",
		spritenum: 32,
		fling: {
			basePower: 30,
		},
		onBasePowerPriority: 15,
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Fighting' && target.baseSpecies.num === 995) {
				return this.chainModify([6144, 4096]);
			}
			if (move && move.type === 'Fighting') {
				return this.chainModify([5120, 4096]);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 241,
		gen: 2,
	},
	blackglasses: {
		name: "Black Glasses",
		spritenum: 35,
		fling: {
			basePower: 30,
		},
		onBasePowerPriority: 15,
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Dark' && target.baseSpecies.num === 995) {
				return this.chainModify([6144, 4096]);
			}
			if (move && move.type === 'Dark') {
				return this.chainModify([5120, 4096]);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 240,
		gen: 2,
	},
	charcoal: {
		name: "Charcoal",
		spritenum: 61,
		fling: {
			basePower: 30,
		},
		onBasePowerPriority: 15,
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Fire' && target.baseSpecies.num === 995) {
				return this.chainModify([6144, 4096]);
			}
			if (move && move.type === 'Fire') {
				return this.chainModify([4915, 4096]);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 249,
		gen: 2,
	},
	choiceband: {
		name: "Choice Band",
		spritenum: 68,
		fling: {
			basePower: 10,
		},
		onStart(pokemon) {
			if (pokemon.volatiles['choicelock']) {
				this.debug('removing choicelock');
			}
			pokemon.removeVolatile('choicelock');
		},
		onModifyMove(move, pokemon) {
			pokemon.addVolatile('choicelock');
		},
		onModifyAtkPriority: 1,
		onModifyAtk(atk, pokemon) {
			if (pokemon.volatiles['dynamax']) return;
			if(pokemon.baseSpecies.num === 995) return this.chainModify(2);
			return this.chainModify(1.5);
		},
		isChoice: true,
		itemUser: ["Iron Thorns"],
		num: 220,
		gen: 3,
	},
	choicescarf: {
		name: "Choice Scarf",
		spritenum: 69,
		fling: {
			basePower: 10,
		},
		onStart(pokemon) {
			if (pokemon.volatiles['choicelock']) {
				this.debug('removing choicelock');
			}
			pokemon.removeVolatile('choicelock');
		},
		onModifyMove(move, pokemon) {
			pokemon.addVolatile('choicelock');
		},
		onModifySpe(spe, pokemon) {
			if (pokemon.volatiles['dynamax']) return;
			if(pokemon.baseSpecies.num === 995) return this.chainModify(2);
			return this.chainModify(1.5);
		},
		isChoice: true,
		itemUser: ["Iron Thorns"],
		num: 287,
		gen: 4,
	},
	choicespecs: {
		name: "Choice Specs",
		spritenum: 70,
		fling: {
			basePower: 10,
		},
		onStart(pokemon) {
			if (pokemon.volatiles['choicelock']) {
				this.debug('removing choicelock');
			}
			pokemon.removeVolatile('choicelock');
		},
		onModifyMove(move, pokemon) {
			pokemon.addVolatile('choicelock');
		},
		onModifySpAPriority: 1,
		onModifySpA(spa, pokemon) {
			if (pokemon.volatiles['dynamax']) return;
			if(pokemon.baseSpecies.num === 995) return this.chainModify(2);
			return this.chainModify(1.5);
		},
		isChoice: true,
		itemUser: ["Iron Thorns"],
		num: 297,
		gen: 4,
	},
	dragonfang: {
		name: "Dragon Fang",
		spritenum: 106,
		fling: {
			basePower: 70,
		},
		onBasePowerPriority: 15,
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Dragon' && target.baseSpecies.num === 995) {
				return this.chainModify([6144, 4096]);
			}
			if (move && move.type === 'Dragon') {
				return this.chainModify([5120, 4096]);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 250,
		gen: 2,
	},
	expertbelt: {
		name: "Expert Belt",
		spritenum: 132,
		fling: {
			basePower: 10,
		},
		onModifyDamage(damage, source, target, move) {
			if (move && move.type === 'Dragon' && target.baseSpecies.num === 995) {
				return this.chainModify([6144, 4096]);
			}
			if (move && target.getMoveHitData(move).typeMod > 0) {
				return this.chainModify([4915, 4096]);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 268,
		gen: 4,
	},
	fairyfeather: {
		name: "Fairy Feather",
		spritenum: 754,
		fling: {
			basePower: 10,
		},
		onBasePowerPriority: 15,
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Dragon' && target.baseSpecies.num === 995) {
				return this.chainModify([6144, 4096]);
			}
			if (move && move.type === 'Fairy') {
				return this.chainModify([5120, 4096]);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 2401,
		gen: 9,
	},
	hardstone: {
		name: "Hard Stone",
		spritenum: 187,
		fling: {
			basePower: 100,
			effect(target, source, move) {
				this.field.setWeather('sandstorm');
			},
			chance: 20,
		},
		onBasePowerPriority: 15,
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Dragon' && target.baseSpecies.num === 995) {
				return this.chainModify([6144, 4096]);
			}
			if (move && move.type === 'Rock') {
				return this.chainModify([5120, 4096]);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 238,
		gen: 2,
	},
	laggingtail: {
		name: "Lagging Tail",
		spritenum: 237,
		fling: {
			basePower: 10,
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, attacker, defender, move) {
			if(attacker.baseSpecies.num === 995 && move.flags['tail']){
				this.debug('Lagging Tail boost');
				return this.chainModify(1.5);
			}
			if (move.flags['tail']) {
				this.debug('Lagging Tail boost');
				return this.chainModify(1.25);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 279,
		gen: 4,
	},
	laxincense: {
		name: "Lax Incense",
		spritenum: 240,
		fling: {
			basePower: 10,
		},
		onSourceModifyDamage(damage, source, target, move) {
			if(source.baseSpecies.num === 995) return this.chainModify(0.8);
			return this.chainModify(0.9);
		},
		itemUser: ["Iron Thorns"],
		num: 255,
		gen: 3,

	},
	leftovers: {
		name: "Leftovers",
		spritenum: 242,
		fling: {
			basePower: 10,
		},
		onResidualOrder: 5,
		onResidualSubOrder: 4,
		onResidual(pokemon) {
			if(pokemon.baseSpecies.num === 995) {
				this.heal(pokemon.baseMaxhp / 8)
			}
			this.heal(pokemon.baseMaxhp / 16);
		},
		itemUser: ["Iron Thorns"],
		num: 234,
		gen: 2,
	},
	lifeorb: {
		name: "Life Orb",
		spritenum: 249,
		fling: {
			basePower: 30,
		},
		onModifyDamage(damage, source, target, move) {
			if(source.baseSpecies.num === 995) return this.chainModify([6554, 4096]);
			return this.chainModify([5324, 4096]);
		},
		onAfterMoveSecondarySelf(source, target, move) {
			if (source && source !== target && move && move.category !== 'Status' && !source.forceSwitchFlag) {
				this.damage(source.baseMaxhp / 10, source, source, this.dex.items.get('lifeorb'));
			}
		},
		itemUser: ["Iron Thorns"],
		num: 270,
		gen: 4,
	},
	luckypunch: {
		name: "Lucky Punch",
		spritenum: 261,
		fling: {
			basePower: 40,
		},
		onModifyMove(move, pokemon) {
			if (move.flags?.punch) {
				move.willCrit = true;
			}
		},
		onModifyDamage(damage, source, target, move) {
			if (move.willCrit) {
				this.debug('Lucky Punch crit damage modifier');
				if(source.baseSpecies.num === 995) return this.chainModify([1.2, 1])
				return this.chainModify([1.1, 1]);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 256,
		gen: 2,
	},
	magnet: {
		name: "Magnet",
		spritenum: 273,
		fling: {
			basePower: 30,
		},
		onBasePowerPriority: 15,
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Electric' && target.baseSpecies.num === 995) {
				return this.chainModify([6144, 4096]);
			}
			if (move.type === 'Electric') {
				return this.chainModify([5120, 4096]);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 242,
		gen: 2,
	},
	metalcoat: {
		name: "Metal Coat",
		spritenum: 286,
		fling: {
			basePower: 30,
		},
		onBasePowerPriority: 15,
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Steel' && target.baseSpecies.num === 995) {
				return this.chainModify([6144, 4096]);
			}
			if (move.type === 'Steel') {
				return this.chainModify([5120, 4096]);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 233,
		gen: 2,
	},
	miracleseed: {
		name: "Miracle Seed",
		fling: {
			basePower: 30,
		},
		spritenum: 292,
		onBasePowerPriority: 15,
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Grass' && target.baseSpecies.num === 995) {
				return this.chainModify([6144, 4096]);
			}
			if (move.type === 'Grass') {
				return this.chainModify([5120, 4096]);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 239,
		gen: 2,
	},
	mysticwater: {
		name: "Mystic Water",
		spritenum: 300,
		fling: {
			basePower: 30,
		},
		onBasePowerPriority: 15,
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Water' && target.baseSpecies.num === 995) {
				return this.chainModify([6144, 4096]);
			}
			if (move.type === 'Water') {
				return this.chainModify([5120, 4096]);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 243,
		gen: 2,
	},
	nevermeltice: {
		name: "Never-Melt Ice",
		spritenum: 305,
		fling: {
			basePower: 30,
		},
		onBasePowerPriority: 15,
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Ice' && target.baseSpecies.num === 995) {
				return this.chainModify([6144, 4096]);
			}
			if (move.type === 'Ice') {
				return this.chainModify([5120, 4096]);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 246,
		gen: 2,
	},
	powerband: {
		name: "Power Band",
		spritenum: 355,
		ignoreKlutz: true,
		fling: {
			basePower: 70,
		},
		onModifySpe(spe) {
			return this.chainModify(0.5);
		},
		onModifySpD(spd, pokemon) {
			if (pokemon.baseSpecies.num === 995) return this.chainModify(1.5);
			return this.chainModify(1.25);
		},
		itemUser: ["Iron Thorns"],
		num: 292,
		gen: 4,
	},
	powerbelt: {
		name: "Power Belt",
		spritenum: 356,
		ignoreKlutz: true,
		fling: {
			basePower: 70,
		},
		onModifySpe(spe) {
			return this.chainModify(0.5);
		},
		onModifySpD(spd, pokemon) {
			if (pokemon.baseSpecies.num === 995) return this.chainModify(1.5);
		},
		itemUser: ["Iron Thorns"],
		num: 290,
		gen: 4,
	},
	powerbracer: {
		name: "Power Bracer",
		spritenum: 357,
		ignoreKlutz: true,
		fling: {
			basePower: 70,
		},
		onModifySpe(spe) {
			return this.chainModify(0.5);
		},
		onModifySpD(spd, pokemon) {
			if (pokemon.baseSpecies.num === 995) return this.chainModify(1.5);
		},
		itemUser: ["Iron Thorns"],
		num: 289,
		gen: 4,
	},
	powerlens: {
		name: "Power Lens",
		spritenum: 359,
		ignoreKlutz: true,
		fling: {
			basePower: 70,
		},
		onModifySpe(spe) {
			return this.chainModify(0.5);
		},
		onModifySpD(spd, pokemon) {
			if (pokemon.baseSpecies.num === 995) return this.chainModify(1.5);
		},
		itemUser: ["Iron Thorns"],
		num: 291,
		gen: 4,
	},
	powerweight: {
		name: "Power Weight",
		spritenum: 360,
		ignoreKlutz: true,
		fling: {
			basePower: 70,
		},
		onModifySpe(spe) {
			return this.chainModify(0.5);
		},
		onBasePower(basePower, user, target, move) {
			if (move.category !== 'Status' && user.baseSpecies.num === 995) return this.chainModify([6144, 4096]);
			if (move.category !== 'Status') return this.chainModify([5120, 4096]);
		},
		itemUser: ["Iron Thorns"],
		num: 294,
		gen: 4,
	},
	protectivepads: {
		name: "Protective Pads",
		spritenum: 663,
		fling: {
			basePower: 30,
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['punch'] && attacker.baseSpecies.num === 995) {
				this.debug('Protective Pads boost');
				return this.chainModify(1.2);
			}
			if (move.flags['punch']) {
				this.debug('Protective Pads boost');
				return this.chainModify(1.1);
			}
		},
		itemUser: ["Iron Thorns"],
		// protective effect handled in Battle#checkMoveMakesContact
		num: 880,
		gen: 7,
	},
	punchingglove: {
		name: "Punching Glove",
		spritenum: 749,
		fling: {
			basePower: 30,
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['punch'] && attacker.baseSpecies.num === 995) {
				this.debug('Protective Pads boost');
				return this.chainModify(1.5);
			}
			if (move.flags['punch']) {
				this.debug('Punching Glove boost');
				return this.chainModify(1.25);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 1884,
		gen: 9,
	},
	quickclaw: {
		onModifySpe(spe, pokemon) {
			if (pokemon.volatiles['dynamax']) return;
			if(pokemon.baseSpecies.num === 995) return this.chainModify(1.2);
			return this.chainModify(1.1);
		},
		name: "Quick Claw",
		spritenum: 373,
		fling: {
			basePower: 80,
		},
		itemUser: ["Iron Thorns"],
		num: 217,
		gen: 2,
	},
	razorfang: {
		name: "Razor Fang",
		spritenum: 383,
		fling: {
			basePower: 30,
			volatileStatus: 'flinch',
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['bite'] && attacker.baseSpecies.num === 995) {
				this.debug('Razor Fang boost');
				return this.chainModify(1.5);
			}
			if (move.flags['bite']) {
				this.debug('Razor Fang boost');
				return this.chainModify(1.25);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 327,
		gen: 4,
	},
	sharpbeak: {
		name: "Sharp Beak",
		spritenum: 436,
		fling: {
			basePower: 50,
		},
		onBasePowerPriority: 15,
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Flying' && target.baseSpecies.num === 995) {
				return this.chainModify([6144, 4096]);
			}
			if (move && move.type === 'Flying') {
				return this.chainModify([5120, 4096]);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 244,
		gen: 2,
	},
	shellbell: {
		name: "Shell Bell",
		spritenum: 438,
		fling: {
			basePower: 30,
		},
		onAfterMoveSecondarySelfPriority: -1,
		onAfterMoveSecondarySelf(pokemon, target, move) {
			if (move.totalDamage && !pokemon.forceSwitchFlag && target.baseSpecies.num === 995) {
				this.heal(move.totalDamage / 3, pokemon);
			}
			if (move.totalDamage && !pokemon.forceSwitchFlag) {
				this.heal(move.totalDamage / 6, pokemon);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 253,
		gen: 3,
	},
	silkscarf: {
		name: "Silk Scarf",
		spritenum: 444,
		fling: {
			basePower: 10,
		},
		onBasePowerPriority: 15,
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Normal' && target.baseSpecies.num === 995) {
				return this.chainModify([6144, 4096]);
			}
			if (move.type === 'Normal') {
				return this.chainModify([5120, 4096]);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 251,
		gen: 3,
	},
	silverpowder: {
		name: "Silver Powder",
		spritenum: 447,
		fling: {
			basePower: 10,
		},
		onBasePowerPriority: 15,
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Bug' && target.baseSpecies.num === 995) {
				return this.chainModify([6144, 4096]);
			}
			if (move.type === 'Bug') {
				return this.chainModify([5120, 4096]);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 222,
		gen: 2,
	},
	softsand: {
		name: "Soft Sand",
		spritenum: 456,
		fling: {
			basePower: 10,
		},
		onBasePowerPriority: 15,
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Bug' && target.baseSpecies.num === 995) {
				return this.chainModify([6144, 4096]);
			}
			if (move.type === 'Ground') {
				return this.chainModify([5120, 4096]);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 237,
		gen: 2,
	},
	spelltag: {
		name: "Spell Tag",
		spritenum: 461,
		fling: {
			basePower: 30,
		},
		onBasePowerPriority: 15,
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Ghost' && target.baseSpecies.num === 995) {
				return this.chainModify([6144, 4096]);
			}
			if (move.type === 'Ghost') {
				return this.chainModify([5120, 4096]);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 247,
		gen: 2,
	},
	twistedspoon: {
		name: "Twisted Spoon",
		spritenum: 520,
		fling: {
			basePower: 30,
		},
		onBasePowerPriority: 15,
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Psychic' && target.baseSpecies.num === 995) {
				return this.chainModify([6144, 4096]);
			}
			if (move.type === 'Psychic') {
				return this.chainModify([5120, 4096]);
			}
		},
		itemUser: ["Iron Thorns"],
		num: 248,
		gen: 2,
	},
}