export const Moves: import('../../../sim/dex-moves').ModdedMoveDataTable = {
	kalostrio: {
		num: 596,
		accuracy: true,
		basePower: 0,
		category: "Status",
		name: "Kalos Trio",
		pp: 10,
		priority: 4,
		flags: { noassist: 1, failcopycat: 1, piercing: 1 },
		stallingMove: true,
		volatileStatus: 'spikyshield',
		onPrepareHit(pokemon) {
			return !!this.queue.willAct() && this.runEvent('StallMove', pokemon);
		},
		onHit(pokemon) {
			pokemon.addVolatile('stall');
		},
		onAfterMove(pokemon, target) {
			this.actions.useMove('watershuriken', pokemon);
			this.actions.useMove('mysticalfire', pokemon);
		},
		condition: {
			duration: 1,
			onStart(target) {
				this.add('-singleturn', target, 'move: Protect');
			},
			onTryHitPriority: 3,
			onTryHit(target, source, move) {
				if (this.checkMoveBypassesProtect(move, source, target)) return;
				if (move.smartTarget) {
					move.smartTarget = false;
				} else {
					this.add('-activate', target, 'move: Protect');
				}
				const lockedmove = source.getVolatile('lockedmove');
				if (lockedmove) {
					// Outrage counter is reset
					if (source.volatiles['lockedmove'].duration === 2) {
						delete source.volatiles['lockedmove'];
					}
				}
				if (this.checkMoveMakesContact(move, source, target)) {
					this.damage(source.baseMaxhp / 8, source, target);
				}
				return this.NOT_FAIL;
			},
			onHit(target, source, move) {
				if (move.isZOrMaxPowered && this.checkMoveMakesContact(move, source, target)) {
					this.damage(source.baseMaxhp / 8, source, target);
				}
			},
		},

		target: "self",
		type: "Grass",
		zMove: { boost: { def: 1 } },
		contestType: "Tough",
	},
};
