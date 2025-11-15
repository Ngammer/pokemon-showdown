// Note: This is the list of formats
// The rules that formats use are stored in data/rulesets.ts

export const Formats: import('../sim/dex-formats').FormatList = [

	{
		section: "Nuevo Meta Singles",
		column: 1,
	},
	{
		name: "[Gen 9] Nuevo Meta Random Battle",
		desc: `Randomized teams of Pok&eacute;mon with sets that are generated to be competitively viable.`,
		mod: 'gen9',
		team: 'randomBSSFactory',
		ruleset: ['Standard NatDex', 'PotD', 'Illusion Level Mod', 'Nuevo Meta Pokedex', 'Terastal Clause', 'Item Clause = 1'],
	},
	{
		name: "[Gen 9] Nuevo Meta OU",
		mod: 'gen9',
		ruleset: ['Standard NatDex', 'Terastal Clause', 'Nuevo Meta Pokedex', '!Evasion Clause', '!OHKO Clause', 'Form Item Clause'],
		banlist: ['Uber'],
	},
	{
		name: "[Gen 9] Nuevo Meta Ubers",
		mod: 'gen9',
		ruleset: ['Standard NatDex', 'Nuevo Meta Pokedex', '!Evasion Clause', '!OHKO Clause', 'Terastal Clause'],
		banlist: ['AG'],
	},
	{
		name: "[Gen 9] Nuevo Meta UU",
		mod: 'gen9',
		ruleset: ['[Gen 9] Nuevo Meta'],
		banlist: ['OU', 'UUBL'],
	},
	{
		name: "[Gen 9] Nuevo Meta RU",
		mod: 'gen9',
		ruleset: ['[Gen 9] Nuevo Meta UU'],
		banlist: ['UU', 'RUBL'],
	},
	{
		name: "[Gen 9] Nuevo Meta NU",
		mod: 'gen9',
		ruleset: ['[Gen 9] Nuevo Meta RU'],
		banlist: ['RU', 'NUBL'],
	},
	{
		name: "[Gen 9] Nuevo Meta PU",
		mod: 'gen9',
		ruleset: ['[Gen 9] Nuevo Meta NU'],
		banlist: ['NU', 'PUBL'],
	},
	{
		name: "[Gen 9] Nuevo Meta ZU",
		mod: 'gen9',
		ruleset: ['[Gen 9] Nuevo Meta PU'],
		banlist: ['PU', 'ZUBL'],
	},
	{
		name: "[Gen 9] Nuevo Meta NFE",
		desc: `Only Pok&eacute;mon that can evolve are allowed.`,
		mod: 'gen9',
		ruleset: ['Not Fully Evolved', 'Standard NatDex', 'Terastal Clause', 'Nuevo Meta Pokedex', '!Evasion Clause', '!OHKO Clause'],
		banlist: [
			'Aipom', 'Azurill', 'Bonsly', 'Corsola-Galar', 'Electabuzz', 'Farfetch\u2019d-Galar', 'Girafarig', 'Gligar', 'Happiny', 'Lickitung', 'Magmar', 'Magneton', 'Mantyke', 'Mime Jr.',
			'Misdreavus', 'Mr. Mime-Galar', 'Munchlax', 'Murkrow', 'Piloswine', 'Porygon2', 'Primeape', 'Qwilfish-Hisui', 'Rhydon', 'Scyther', 'Sneasel', 'Sneasel-Hisui', 'Tangela', 'Togetic',
			'Ursaring', 'Wynaut', 'Yanma', 'Heat Rock', 'Light Ball', 'Oval Stone', 'Baton Pass',
		],
	},
	{
		name: "[Gen 9] Nuevo Meta LC",
		mod: 'gen9',
		ruleset: ['Little Cup', 'Standard NatDex', '!Evasion Clause', '!OHKO Clause', 'Terastal Clause', 'Nuevo Meta Pokedex'],
		banlist: [
			'Aipom', 'Abra', 'Azurill', 'Bonsly', 'Corsola-Galar', 'Farfetch\u2019d-Galar', 'Girafarig', 'Gligar', 'Happiny', 'Lickitung', 'Mantyke', 'Mime Jr.', 'Misdreavus',
			'Munchlax', 'Murkrow', 'Qwilfish-Hisui', 'Scyther', 'Smoochum', 'Sneasel', 'Sneasel-Hisui', 'Tangela', 'Vulpix-Base', 'Wynaut', 'Yanma', 'Moody', 'Dream Ball',
			'Heat Rock', 'Oval Stone', 'Baton Pass', 'Splash',
		],
	},
	{
		name: "[Gen 9] Nuevo Meta AG",
		mod: 'gen9',
		ruleset: ['Standard AG', 'NatDex Mod', 'Terastal Clause', 'Nuevo Meta Pokedex'],
	},

];

// Nuevo Meta Singles
///////////////////////////////////////////////////////////////////
