/**
 * PF2E Property Runes - Dread Rune Automation
 * Automates the Dread Rune effect on armor for Pathfinder 2E
 * 
 * IMPORTANT: When multiple Dread Runes are within range of a frightened creature,
 * the creature saves against the HIGHEST DC among all available runes.
 * Only one save is triggered per frightened creature per turn.
 */

class DreadRuneAutomation {
    constructor() {
        this.DREAD_RUNE_DISTANCE = 30; // 30 feet
        this.DREAD_RUNE_DC = 20; // DC 20 Will save
        this.DREAD_RUNE_NAME = "Dread Rune";
        this.DREAD_RUNE_EFFECT = "dread-rune-effect";
        
        // Define specific rune types for proper detection
        this.DREAD_RUNE_TYPES = {
            "lesser": {
                name: "Lesser Dread Rune",
                dc: 20,
                range: 30,
                minFrightened: 1
            },
            "moderate": {
                name: "Moderate Dread Rune", 
                dc: 29,
                range: 30,
                minFrightened: 2
            },
            "greater": {
                name: "Greater Dread Rune",
                dc: 38,
                range: 30,
                minFrightened: null // No decrease at any level
            }
        };
        
        // Define traits that indicate ally/enemy status
        this.ALLY_TRAITS = [
            "ally", "friendly", "helpful", "beneficial", "construct", "companion",
            "familiar", "pet", "mount", "steed", "guardian", "protector"
        ];
        
        this.ENEMY_TRAITS = [
            "enemy", "hostile", "harmful", "dangerous", "evil", "chaotic",
            "aggressive", "violent", "destructive"
        ];
        
        this.initializeHooks();
        this.initializeSettings();
        
        // Log to verify module is loading (only shows in debug mode)
        this.log("DreadRuneAutomation constructor called");
    }

    /**
     * Initialize FoundryVTT hooks for the module
     */
    initializeHooks() {

        
        // Hook into the end of turn to check for Dread Rune effects
        Hooks.on("pf2e.endTurn", this.onEndTurn.bind(this));

        
        // Hook into combat tracker updates to track turn changes
        Hooks.on("updateCombat", this.onCombatUpdate.bind(this));

        
        // Hook into actor updates to detect when Dread Rune is added/removed
        Hooks.on("updateActor", this.onActorUpdate.bind(this));

        
        // Module initialization
        Hooks.on("ready", this.onReady.bind(this));

        
        // Add additional hooks for better debugging
        Hooks.on("createCombatant", this.onCombatantCreated.bind(this));

        
        Hooks.on("deleteCombatant", this.onCombatantDeleted.bind(this));

        

    }

    /**
     * Initialize module settings
     */
    initializeSettings() {
        this.log("Initializing settings");
        
        // Register module settings
        game.settings.register("pf2e-property-runes", "enable-dread-rune", {
            name: "Enable Dread Rune Automation",
            hint: "Automatically trigger Dread Rune effects when frightened enemies end their turn within range",
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
            onChange: (value) => {
                this.log(`Dread Rune automation ${value ? 'enabled' : 'disabled'}`);
            }
        });

        // Note: DC and range are now dynamically determined from each character's specific rune type
        // The DC is properly owned by the character with the rune, not affected by the frightened creature's condition

        game.settings.register("pf2e-property-runes", "show-chat-messages", {
            name: "Show Chat Messages",
            hint: "Display chat messages when Dread Rune effects are triggered",
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
            onChange: (value) => {
                this.log(`Chat messages ${value ? 'enabled' : 'disabled'}`);
            }
        });



        game.settings.register("pf2e-property-runes", "debug-mode", {
            name: "Debug Mode",
            hint: "Enable detailed console logging for troubleshooting",
            scope: "world",
            config: true,
            type: Boolean,
            default: true, // Changed to true by default for debugging
            onChange: (value) => {
                this.log(`Debug mode ${value ? 'enabled' : 'disabled'}`);
            }
        });


    }

    /**
     * Log messages with debug mode support
     */
    log(message, data = null) {
        try {
            const debugMode = game.settings.get("pf2e-property-runes", "debug-mode");
            if (debugMode) {
                console.log(`[PF2E Property Runes] ${message}`, data);
            }
        } catch (error) {
            // Settings not registered yet, just use console.log
            console.log(`[PF2E Property Runes] ${message}`, data);
        }
    }

    /**
     * Called when the module is ready
     */
    onReady() {
        this.setupDreadRuneEffect();
        
        // Display welcome message
        if (game.settings.get("pf2e-property-runes", "show-chat-messages")) {
            this.showWelcomeMessage();
        }
        
        // Test rune detection
        this.testRuneDetection();
        
        // Add global debug functions for testing
        window.debugDreadRuneFrightened = (actorId) => {
            const actor = game.actors.get(actorId);
            if (actor) {
                this.debugFrightenedCondition(actor);
            } else {
                console.error(`Actor with ID ${actorId} not found`);
            }
        };
        
        window.debugDreadRuneAllyCheck = (actorId) => {
            const actor = game.actors.get(actorId);
            if (actor) {
                this.log(`=== DEBUGGING ALLY CHECK FOR ${actor.name} ===`);
                const isAlly = this.isActorAnAlly(actor);
                this.log(`Final result: ${actor.name} is ${isAlly ? 'an ALLY' : 'an ENEMY'}`);
                this.log(`This means Dread Rune will ${isAlly ? 'NOT affect' : 'affect'} ${actor.name}`);
            } else {
                console.error(`Actor with ID ${actorId} not found`);
            }
        };
        
        window.debugDreadRuneAlliance = (actorId1, actorId2) => {
            const actor1 = game.actors.get(actorId1);
            const actor2 = game.actors.get(actorId2);
            if (actor1 && actor2) {
                this.log(`=== DEBUGGING ALLIANCE BETWEEN ${actor1.name} AND ${actor2.name} ===`);
                const alliance1 = this.getActorAlliance(actor1);
                const alliance2 = this.getActorAlliance(actor2);
                const isEnemy = this.isActorEnemyOf(actor1, actor2);
                this.log(`${actor1.name} alliance: ${alliance1}`);
                this.log(`${actor2.name} alliance: ${alliance2}`);
                this.log(`Final result: ${actor1.name} and ${actor2.name} are ${isEnemy ? 'ENEMIES' : 'ALLIES'}`);
                this.log(`This means Dread Rune will ${isEnemy ? 'affect' : 'NOT affect'} ${actor1.name} if they are frightened`);
            } else {
                console.error(`One or both actors not found`);
            }
        };
        
        window.debugDreadRuneRequirements = (actorId) => {
            const actor = game.actors.get(actorId);
            if (actor) {
                this.log(`=== DEBUGGING DREAD RUNE REQUIREMENTS FOR ${actor.name} ===`);
                
                // Check if they have frightened condition
                const frightenedCondition = this.findFrightenedCondition(actor);
                if (!frightenedCondition) {
                    this.log(`❌ ${actor.name} does not have frightened condition`);
                    return;
                }
                
                const frightenedValue = frightenedCondition.value || 1;
                this.log(`✅ ${actor.name} has frightened ${frightenedValue}`);
                
                // Check if they meet rune requirements
                const meetsRequirements = this.doesFrightenedLevelMeetRuneRequirements(actor, frightenedValue);
                this.log(`Final result: ${actor.name} frightened ${frightenedValue} ${meetsRequirements ? 'MEETS' : 'does NOT meet'} Dread Rune requirements`);
                
                if (meetsRequirements) {
                    this.log(`This means Dread Rune WILL trigger for ${actor.name}`);
                } else {
                    this.log(`This means Dread Rune will NOT trigger for ${actor.name} (frightened level too low)`);
                }
            } else {
                console.error(`Actor with ID ${actorId} not found`);
            }
        };
        
        window.debugActorWillSave = (actorId) => {
            const actor = game.actors.get(actorId);
            if (actor) {
                this.log(`=== DEBUGGING WILL SAVE DATA FOR ${actor.name} ===`);
                
                // Log the actor's system structure
                this.log(`Actor system keys: ${Object.keys(actor.system || {}).join(', ')}`);
                
                if (actor.system?.saves) {
                    this.log(`Saves keys: ${Object.keys(actor.system.saves).join(', ')}`);
                    
                    if (actor.system.saves.will) {
                        this.log(`Will save data:`, actor.system.saves.will);
                        this.log(`Will save keys: ${Object.keys(actor.system.saves.will).join(', ')}`);
                        
                        // Check specific properties
                        if (actor.system.saves.will.value !== undefined) {
                            this.log(`Will save value: ${actor.system.saves.will.value}`);
                        }
                        if (actor.system.saves.will.mod !== undefined) {
                            this.log(`Will save mod: ${actor.system.saves.will.mod}`);
                        }
                        if (actor.system.saves.will.total !== undefined) {
                            this.log(`Will save total: ${actor.system.saves.will.total}`);
                        }
                        if (actor.system.saves.will.rank !== undefined) {
                            this.log(`Will save rank: ${actor.system.saves.will.rank}`);
                        }
                    } else {
                        this.log(`No will save data found`);
                    }
                } else {
                    this.log(`No saves data found`);
                }
                
                // Also check for alternative save structures
                if (actor.system?.attributes?.saves) {
                    this.log(`Alternative saves location found in attributes.saves`);
                    this.log(`Attributes saves keys: ${Object.keys(actor.system.attributes.saves).join(', ')}`);
                    
                    if (actor.system.attributes.saves.will) {
                        this.log(`Will save in attributes:`, actor.system.attributes.saves.will);
                    }
                }
                
            } else {
                console.error(`Actor with ID ${actorId} not found`);
            }
        };
        
        window.debugDreadRuneHighestDC = (frightenedActorId) => {
            const actor = game.actors.get(frightenedActorId);
            if (actor) {
                this.log(`=== DEBUGGING HIGHEST DC DREAD RUNE FOR ${actor.name} ===`);
                
                // Get all affecting actors
                const allAffecting = this.getAllDreadRuneActorsAffecting(actor);
                this.log(`Total Dread Rune actors affecting ${actor.name}: ${allAffecting.length}`);
                
                for (const affectingActor of allAffecting) {
                    const runeData = this.getDreadRuneData(affectingActor);
                    const distance = this.getDistanceBetween(actor, affectingActor);
                    this.log(`${affectingActor.name}: ${runeData.name} (DC ${runeData.dc}) at ${distance.toFixed(1)} feet`);
                }
                
                // Get the highest DC actor
                const highestDCActor = this.getDreadRuneActorAffecting(actor);
                if (highestDCActor) {
                    const runeData = this.getDreadRuneData(highestDCActor);
                    this.log(`🎯 Highest DC actor: ${highestDCActor.name} with ${runeData.name} (DC ${runeData.dc})`);
                } else {
                    this.log(`❌ No Dread Rune actor affecting ${actor.name}`);
                }
                
            } else {
                console.error(`Actor with ID ${frightenedActorId} not found`);
            }
        };
        
        this.log("Global debug functions available:");
        this.log("  - debugDreadRuneFrightened(actorId) - debug frightened condition detection");
        this.log("  - debugDreadRuneAllyCheck(actorId) - debug ally/enemy detection");
        this.log("  - debugDreadRuneAlliance(actorId1, actorId2) - debug alliance between two actors");
        this.log("  - debugDreadRuneRequirements(actorId) - debug frightened level requirements");
        this.log("  - debugActorWillSave(actorId) - debug actor's Will save data structure");
        this.log("  - debugDreadRuneHighestDC(actorId) - debug highest DC Dread Rune detection");
    }

    /**
     * Test rune detection on all actors
     */
    testRuneDetection() {
        const allActors = game.actors.filter(a => a.type === "character" || a.type === "npc");
        
        for (const actor of allActors) {
            this.checkDreadRuneEquipment(actor);
        }
    }

    /**
     * Show welcome message
     */
    async showWelcomeMessage() {
        const message = await ChatMessage.create({
            user: game.user.id,
            content: `<div class="dread-rune-effect">
                <div class="dread-rune-header">
                    <img src="systems/pf2e/icons/equipment/runes/armor-property-runes/armor-property-runes.webp" width="20" height="20">
                    <strong>PF2E Property Runes Module Loaded</strong>
                </div>
                <p>Dread Rune automation is now active! Check the module settings to configure options.</p>
                <p><strong>Debug Mode:</strong> ${game.settings.get("pf2e-property-runes", "debug-mode") ? 'ON' : 'OFF'}</p>
            </div>`,
            style: CONST.CHAT_MESSAGE_STYLES.OTHER
        });
    }

    /**
     * Set up the Dread Rune effect in the system
     */
    setupDreadRuneEffect() {
        // Register the Dread Rune effect if it doesn't exist
        if (!game.pf2e.effects.registered.has(this.DREAD_RUNE_EFFECT)) {
            const dreadRuneEffect = {
                id: this.DREAD_RUNE_EFFECT,
                name: this.DREAD_RUNE_NAME,
                description: "Eerie symbols cover your armor, inspiring terror in your foes. Frightened enemies within 30 feet that can see you must attempt a Will save at the end of their turn; on a failure, the value of their frightened condition doesn't decrease below the minimum for your rune type (Lesser: 1, Moderate: 2, Greater: no decrease).",
                img: "systems/pf2e/icons/equipment/runes/armor-property-runes/armor-property-runes.webp",
                system: {
                    rules: [],
                    tokenIcon: {
                        show: true
                    },
                    level: {
                        value: 1
                    }
                }
            };
            
            // Add to the effects registry
            game.pf2e.effects.registered.set(this.DREAD_RUNE_EFFECT, dreadRuneEffect);
        }
    }

    /**
     * Called when a turn ends in combat
     */
    async onEndTurn(combatant, combat) {
        if (!combat || !combatant || !combatant.actor) {
            return;
        }
        
        const actor = combatant.actor;
        
        // Check if automation is enabled
        if (!game.settings.get("pf2e-property-runes", "enable-dread-rune")) {
            return;
        }
        
        // Check if this actor should be affected by Dread Rune
        if (this.shouldCheckDreadRune(actor)) {
            await this.processDreadRuneEffect(actor);
        }
    }

    /**
     * Called when combat updates
     */
    onCombatUpdate(combat, change, options, userId) {
        // This hook helps us track when turns change
    }

    /**
     * Called when an actor is updated
     */
    onActorUpdate(actor, change, options, userId) {
        // Check if Dread Rune effects were added or removed
        if (change.system?.traits?.value) {
            this.checkDreadRuneEquipment(actor);
        }
    }

    /**
     * Called when a combatant is created
     */
    onCombatantCreated(combatant, options, userId) {
        // Hook for future use
    }

    /**
     * Called when a combatant is deleted
     */
    onCombatantDeleted(combatant, options, userId) {
        // Hook for future use
    }

    /**
     * Find the frightened condition on an actor using multiple detection methods
     */
    findFrightenedCondition(actor) {
        // Method 1: Check system.conditions (this is where PF2E stores conditions)
        if (actor.system?.conditions) {
            const found = actor.system.conditions.find(condition => 
                condition.slug === "frightened"
            );
            if (found) {
                return found;
            }
        }
        
        // Method 2: Check if conditions is a Map (some PF2E versions use Map)
        if (actor.system?.conditions instanceof Map) {
            for (const [id, condition] of actor.system.conditions) {
                if (condition.slug === "frightened") {
                    return condition;
                }
            }
        }
        
        // Method 3: Check if conditions is a Collection (some PF2E versions use Collection)
        if (actor.system?.conditions instanceof Collection) {
            for (const [id, condition] of actor.system.conditions) {
                if (condition.slug === "frightened") {
                    return condition;
                }
            }
        }
        
        // Method 4: Check if conditions is an object with keys (PF2E v13+ structure)
        if (actor.system?.conditions && typeof actor.system.conditions === 'object' && !Array.isArray(actor.system.conditions)) {
            for (const key of Object.keys(actor.system.conditions)) {
                const condition = actor.system.conditions[key];
                if (condition && condition.slug === "frightened") {
                    return condition;
                }
            }
        }
        
        // Method 5: Check effects for frightened condition (fallback)
        if (actor.effects) {
            for (const effect of actor.effects) {
                if (effect.slug === "frightened") {
                    return effect;
                }
            }
        }
        
        // Method 6: Check for frightened in actor traits (some versions store it there)
        if (actor.system?.traits?.value) {
            const traits = actor.system.traits.value;
            if (traits.includes("frightened")) {
                // Create a mock condition object
                return { slug: "frightened", value: 1, name: "Frightened" };
            }
        }
        
        // Method 7: Check for frightened in active effects (PF2E v13+)
        if (actor.effects && actor.effects.size > 0) {
            for (const effect of actor.effects) {
                if (effect.slug === "frightened" || effect.name.toLowerCase().includes("frightened")) {
                    return { slug: "frightened", value: effect.system?.value?.value || 1, name: effect.name };
                }
            }
        }
        
        // Method 8: Check for frightened in actor's current state (PF2E v13+)
        if (actor.system?.details?.conditions) {
            const detailsConditions = actor.system.details.conditions;
            if (detailsConditions.frightened) {
                return { slug: "frightened", value: detailsConditions.frightened.value || 1, name: "Frightened" };
            }
        }
        
        // Method 9: Check various possible locations for conditions
        const possibleLocations = [
            'conditions',
            'details',
            'attributes',
            'traits',
            'modifiers'
        ];
        
        for (const location of possibleLocations) {
            if (actor.system[location]) {
                // If it's an object, look for frightened
                if (typeof actor.system[location] === 'object') {
                    const keys = Object.keys(actor.system[location]);
                    
                    if (keys.includes('frightened')) {
                        const condition = actor.system[location].frightened;
                        return { 
                            slug: "frightened", 
                            value: condition.value || condition.level || 1, 
                            name: condition.name || "Frightened" 
                        };
                    }
                }
            }
        }
        
        // Method 10: Check for frightened in AC modifiers (PF2E v13+ specific)
        if (actor.system?.attributes?.ac?.modifiers) {
            for (const modifier of actor.system.attributes.ac.modifiers) {
                if (modifier.slug === "frightened") {
                    // Extract the frightened value from the modifier label (e.g., "Frightened 1" -> value 1)
                    const frightenedMatch = modifier.label.match(/Frightened\s+(\d+)/);
                    const frightenedValue = frightenedMatch ? parseInt(frightenedMatch[1]) : 1;
                    return {
                        slug: "frightened",
                        value: frightenedValue,
                        name: "Frightened"
                    };
                }
            }
        }
        
        // Method 11: Check for frightened in all attribute modifiers
        if (actor.system?.attributes) {
            for (const [attrName, attrData] of Object.entries(actor.system.attributes)) {
                if (attrData?.modifiers && Array.isArray(attrData.modifiers)) {
                    for (const modifier of attrData.modifiers) {
                        if (modifier.slug === "frightened") {
                            const frightenedMatch = modifier.label.match(/Frightened\s+(\d+)/);
                            const frightenedValue = frightenedMatch ? parseInt(frightenedMatch[1]) : 1;
                            return {
                                slug: "frightened",
                                value: frightenedValue,
                                name: "Frightened"
                            };
                        }
                    }
                }
            }
        }
        
        return null;
    }

    /**
     * Check if an actor should be affected by Dread Rune
     */
    shouldCheckDreadRune(actor) {
        // Must be an enemy (different alliance than the character with the rune)
        // Find the character with Dread Rune armor who would affect this actor
        const dreadRuneActor = this.getDreadRuneActorAffecting(actor);
        if (!dreadRuneActor) {
            return false;
        }
        
        // Check if the frightened actor has a different alliance than the character with the rune
        const isEnemy = this.isActorEnemyOf(actor, dreadRuneActor);
        if (!isEnemy) {
            return false;
        }
        
        // Must have the frightened condition
        // Use the comprehensive condition detection method
        const frightenedCondition = this.findFrightenedCondition(actor);
        
        if (!frightenedCondition) {
            return false;
        }
        
        const frightenedValue = frightenedCondition.value || 1;
        
        // Check if the frightened level meets the minimum requirement for the Dread Rune type
        const meetsRuneRequirements = this.doesFrightenedLevelMeetRuneRequirements(actor, frightenedValue);
        if (!meetsRuneRequirements) {
            return false;
        }
        
        // Must be within range of someone with Dread Rune armor
        const withinRange = this.isWithinDreadRuneRange(actor);
        
        return withinRange;
    }

    /**
     * Check if the frightened level meets the requirements for the Dread Rune type
     */
    doesFrightenedLevelMeetRuneRequirements(frightenedActor, frightenedValue) {
        // Find the character with Dread Rune armor who would affect this actor
        const dreadRuneActor = this.getDreadRuneActorAffecting(frightenedActor);
        if (!dreadRuneActor) {
            return false;
        }
        
        // Get the rune data for the character's armor
        const runeData = this.getDreadRuneData(dreadRuneActor);
        if (!runeData) {
            return false;
        }
        
        // Check the frightened level requirements based on rune type
        if (runeData.minFrightened === null) {
            // Greater Dread Rune: activates at any frightened level
            return true;
        } else {
            // Lesser/Moderate Dread Rune: only activates at or above the minimum frightened level
            return frightenedValue >= runeData.minFrightened;
        }
    }

    /**
     * Check if an actor is an enemy of another actor based on alliance
     */
    isActorEnemyOf(actor1, actor2) {
        // Get the alliance of both actors
        const alliance1 = this.getActorAlliance(actor1);
        const alliance2 = this.getActorAlliance(actor2);
        
        // If alliances are different, they are enemies
        if (alliance1 !== alliance2) {
            this.log(`✅ ${actor1.name} and ${actor2.name} have different alliances - they are enemies`);
            return true;
        } else {
            this.log(`❌ ${actor1.name} and ${actor2.name} have the same alliance - they are allies`);
            return false;
        }
    }

    /**
     * Get the alliance of an actor
     */
    getActorAlliance(actor) {
        // Check actor type and traits to determine alliance
        if (actor.type === "character") {
            // Player characters are always in the "party" alliance
            return "party";
        } else if (actor.type === "npc") {
            // NPCs can be allies or enemies based on traits
            if (this.isActorAnAlly(actor)) {
                return "party";
            } else {
                return "enemy";
            }
        } else {
            // Unknown actor type, default to enemy
            return "enemy";
        }
    }

    /**
     * Check if an actor is an ally (should not be affected by Dread Rune)
     */
    isActorAnAlly(actor) {
        // Check if the actor has any ally traits
        if (actor.system?.traits?.value) {
            const actorTraits = actor.system.traits.value.map(t => t.toLowerCase());
            
            // Check for ally traits first (these override other considerations)
            for (const trait of actorTraits) {
                if (this.ALLY_TRAITS.includes(trait)) {
                    return true;
                }
            }
            
            // Check for enemy traits (these override other considerations)
            for (const trait of actorTraits) {
                if (this.ENEMY_TRAITS.includes(trait)) {
                    return false;
                }
            }
        }
        
        // Method 1: Check if the actor has the "construct" trait and is likely a companion
        if (actor.system?.traits?.value && actor.system.traits.value.includes("construct")) {
            // Check if it's likely a companion construct (like a construct companion)
            if (actor.name.toLowerCase().includes("companion") || 
                actor.name.toLowerCase().includes("construct") ||
                actor.name.toLowerCase().includes("golem")) {
                return true;
            }
        }
        
        // Method 2: Check if the actor has a name that suggests it's an ally
        const allyNameIndicators = [
            "companion", "ally", "friend", "helper", "assistant", "familiar", 
            "pet", "mount", "steed", "guardian", "protector", "escort"
        ];
        
        const actorNameLower = actor.name.toLowerCase();
        for (const indicator of allyNameIndicators) {
            if (actorNameLower.includes(indicator)) {
                return true;
            }
        }
        
        // Method 3: Check alignment-based heuristics (only if no other traits are found)
        if (actor.system?.traits?.value) {
            const actorTraits = actor.system.traits.value.map(t => t.toLowerCase());
            
            // Good and lawful alignments are more likely to be allies
            if (actorTraits.includes("good") || actorTraits.includes("lawful")) {
                return true;
            }
            
            // Evil and chaotic alignments are more likely to be enemies
            if (actorTraits.includes("evil") || actorTraits.includes("chaotic")) {
                return false;
            }
        }
        
        // Default: If we can't determine, assume it's an enemy (safer for Dread Rune)
        // This means the rune will trigger, which is the intended behavior for unknown NPCs
        return false;
    }

    /**
     * Check if an actor is within range of someone with Dread Rune armor
     */
    isWithinDreadRuneRange(actor) {
        const scene = game.scenes.active;
        if (!scene) {
            return false;
        }

        // Get all actors with Dread Rune armor in the scene
        const dreadRuneActors = this.getDreadRuneActors(scene);
        
        if (dreadRuneActors.length === 0) {
            return false;
        }
        
        for (const dreadRuneActor of dreadRuneActors) {
            const distance = this.getDistanceBetween(actor, dreadRuneActor);
            
            // Get the specific rune data for this actor's armor to check range
            const runeData = this.getDreadRuneData(dreadRuneActor);
            if (!runeData) {
                continue;
            }
            
            if (distance <= runeData.range) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get all actors in the scene with Dread Rune armor
     */
    getDreadRuneActors(scene) {
        const dreadRuneActors = [];
        
        for (const token of scene.tokens) {
            if (token.actor && this.hasDreadRuneArmor(token.actor)) {
                dreadRuneActors.push(token.actor);
            }
        }
        
        return dreadRuneActors;
    }

    /**
     * Check if an actor has Dread Rune armor equipped
     */
    hasDreadRuneArmor(actor) {
        // Check equipped armor for Dread Rune
        const equippedArmor = actor.itemTypes.armor.find(armor => 
            armor.isEquipped
        );
        
        if (!equippedArmor) {
            return false;
        }
        
        // Check for property runes
        if (equippedArmor.system.runes?.property) {
            for (const rune of equippedArmor.system.runes.property) {
                // Handle both string and object rune formats
                let runeName = '';
                if (typeof rune === 'string') {
                    runeName = rune;
                } else if (rune && typeof rune === 'object') {
                    runeName = rune.name || rune.slug || '';
                }
                
                if (runeName.toLowerCase().includes('dread')) {
                    return true;
                }
            }
        }
        
        // Fallback: Check for legacy text-based detection
        if (equippedArmor.system.runes?.property) {
            for (const rune of equippedArmor.system.runes.property) {
                if (typeof rune === 'string' && rune.toLowerCase().includes('dread')) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Calculate distance between two actors in feet
     */
    getDistanceBetween(actor1, actor2) {
        const scene = game.scenes.active;
        if (!scene) return Infinity;

        const token1 = scene.tokens.find(t => t.actor?.id === actor1.id);
        const token2 = scene.tokens.find(t => t.actor?.id === actor2.id);
        
        if (!token1 || !token2) return Infinity;

        // Get token positions
        const pos1 = token1.center;
        const pos2 = token2.center;
        
        // Calculate distance in grid units
        const distance = Math.sqrt(
            Math.pow(pos2.x - pos1.x, 2) + 
            Math.pow(pos2.y - pos1.y, 2)
        );
        
        // Convert to feet (assuming 5-foot grid)
        const gridSize = scene.grid.size;
        const distanceInFeet = (distance / gridSize) * 5;
        
        return distanceInFeet;
    }

    /**
     * Process the Dread Rune effect for a frightened enemy
     */
    async processDreadRuneEffect(actor) {
        try {
            // Find the character with Dread Rune armor who is affecting this actor (highest DC)
            const dreadRuneActor = this.getDreadRuneActorAffecting(actor);
            if (!dreadRuneActor) {
                return;
            }
            
            // Get the rune data for the chat message
            const runeData = this.getDreadRuneData(dreadRuneActor);
            if (!runeData) {
                return;
            }
            
            // Get the frightened condition for the chat message
            const frightenedCondition = this.findFrightenedCondition(actor);
            if (!frightenedCondition) {
                return;
            }
            
            // Get all Dread Rune actors affecting this creature to show in the message
            const allAffectingActors = this.getAllDreadRuneActorsAffecting(actor);
            let affectingActorsText = "";
            
            if (allAffectingActors.length > 1) {
                const actorNames = allAffectingActors.map(a => a.name).join(", ");
                affectingActorsText = `<p><em>Multiple Dread Runes detected: ${actorNames}</em></p>`;
            }
            
            // Create a chat message to announce the effect
            if (game.settings.get("pf2e-property-runes", "show-chat-messages")) {
                const message = await ChatMessage.create({
                    user: game.user.id,
                    // No speaker - this ensures the DC is not affected by any actor's conditions
                    content: `<div class="dread-rune-effect">
                        <div class="dread-rune-header">
                            <img src="systems/pf2e/icons/equipment/runes/armor-property-runes/armor-property-runes.webp" width="20" height="20">
                            <strong>${runeData.name} Effect</strong>
                        </div>
                        ${affectingActorsText}
                        <p><strong>${actor.name}</strong> must attempt a Will save against the highest DC: @Check[will|dc:${runeData.dc}|name:Dread Rune|traits:fear|showDC:all]{Will Save}</p>
                    </div>`,
                    style: CONST.CHAT_MESSAGE_STYLES.OTHER
                });
            }
            
        } catch (error) {
            console.error("Error processing Dread Rune effect:", error);
        }
    }



    /**
     * Handle the consequences of a failed Will save against Dread Rune
     */
    async handleFailedWillSave(actor, dreadRuneActor, runeData) {
        this.log(`Handling failed Will save for ${actor.name} against ${dreadRuneActor.name}'s ${runeData.name}`);
        
        try {
            // Find the frightened condition
            const frightenedCondition = this.findFrightenedCondition(actor);
            if (!frightenedCondition) {
                this.log(`${actor.name} no longer has frightened condition`);
                return;
            }
            
            const currentValue = frightenedCondition.value;
            this.log(`${actor.name} current frightened value: ${currentValue}`);
            
            // Check if the rune prevents decrease below minimum
            const minFrightened = runeData.minFrightened;
            if (minFrightened !== null && currentValue > minFrightened) {
                this.log(`Creating temporary effect to prevent frightened decrease below ${minFrightened}`);
                
                // Create a temporary effect to prevent the decrease
                const preventDecreaseEffect = {
                    id: "dread-rune-prevent-decrease",
                    name: `${runeData.name} - Prevent Frightened Decrease`,
                    description: `The ${runeData.name} prevents your frightened condition from decreasing below ${minFrightened} this turn.`,
                    img: "systems/pf2e/icons/equipment/runes/armor-property-runes/armor-property-runes.webp",
                    system: {
                        rules: [],
                        tokenIcon: {
                            show: false
                        },
                        level: {
                            value: 1
                        },
                        duration: {
                            value: 1,
                            unit: "rounds"
                        }
                    }
                };
                
                // Apply the effect
                await actor.createEmbeddedDocuments("Item", [preventDecreaseEffect]);
                this.log("Prevent decrease effect applied successfully");
                
                // Send a chat message about the effect if enabled
                if (game.settings.get("pf2e-property-runes", "show-chat-messages")) {
                    await ChatMessage.create({
                        user: game.user.id,
                        // No speaker - this ensures the DC is not affected by any actor's conditions
                        content: `<div class="dread-rune-effect">
                            <div class="dread-rune-header">
                                <img src="systems/pf2e/icons/equipment/runes/armor-property-runes/armor-property-runes.webp" width="20" height="20">
                                <strong>${runeData.name} Effect</strong>
                            </div>
                            <p><strong>${actor.name}</strong> failed the Will save against the highest DC! Their frightened condition cannot decrease below ${minFrightened} this turn due to ${runeData.name}.</p>
                        </div>`,
                        style: CONST.CHAT_MESSAGE_STYLES.OTHER
                    });
                }
            } else if (minFrightened === null) {
                this.log(`${actor.name} has ${runeData.name} which prevents any frightened decrease`);
                
                // Send a chat message about the effect if enabled
                if (game.settings.get("pf2e-property-runes", "show-chat-messages")) {
                    await ChatMessage.create({
                        user: game.user.id,
                        // No speaker - this ensures the DC is not affected by any actor's conditions
                        content: `<div class="dread-rune-effect">
                            <div class="dread-rune-header">
                                <img src="systems/pf2e/icons/equipment/runes/armor-property-runes/armor-property-runes.webp" width="20" height="20">
                                <strong>${runeData.name} Effect</strong>
                            </div>
                            <p><strong>${actor.name}</strong> failed the Will save against the highest DC! Their frightened condition cannot decrease at all this turn due to ${runeData.name}.</p>
                        </div>`,
                        style: CONST.CHAT_MESSAGE_STYLES.OTHER
                    });
                }
            } else {
                this.log(`${actor.name} frightened value is already at or below minimum (${minFrightened}), no effect needed`);
            }
            
        } catch (error) {
            console.error("Error handling failed Will save:", error);
            this.log("Error handling failed Will save", error);
        }
    }

    /**
     * Get all Dread Rune actors affecting the given frightened actor
     * Returns an array of all actors with Dread Rune armor within range
     */
    getAllDreadRuneActorsAffecting(frightenedActor) {
        const scene = game.scenes.active;
        if (!scene) {
            return [];
        }

        // Get all actors with Dread Rune armor in the scene
        const dreadRuneActors = this.getDreadRuneActors(scene);
        const affectingActors = [];
        
        for (const dreadRuneActor of dreadRuneActors) {
            const distance = this.getDistanceBetween(frightenedActor, dreadRuneActor);
            
            // Get the specific rune data for this actor's armor to check range
            const runeData = this.getDreadRuneData(dreadRuneActor);
            if (!runeData) {
                continue;
            }
            
            if (distance <= runeData.range) {
                affectingActors.push(dreadRuneActor);
            }
        }
        
        return affectingActors;
    }

    /**
     * Get the Dread Rune actor who is affecting the given frightened actor
     * Returns the actor with the highest DC rune within range
     */
    getDreadRuneActorAffecting(frightenedActor) {
        const scene = game.scenes.active;
        if (!scene) {
            return null;
        }

        // Get all actors with Dread Rune armor in the scene
        const dreadRuneActors = this.getDreadRuneActors(scene);
        this.log(`Found ${dreadRuneActors.length} actors with Dread Rune armor`);
        
        if (dreadRuneActors.length === 0) {
            return null;
        }
        
        // Find the Dread Rune actor with the highest DC within range
        let highestDCActor = null;
        let highestDC = -1;
        
        for (const dreadRuneActor of dreadRuneActors) {
            const distance = this.getDistanceBetween(frightenedActor, dreadRuneActor);
            this.log(`Distance to ${dreadRuneActor.name}: ${distance.toFixed(1)} feet`);
            
            // Get the specific rune data for this actor's armor to check range
            const runeData = this.getDreadRuneData(dreadRuneActor);
            if (!runeData) {
                this.log(`Could not determine rune data for ${dreadRuneActor.name}, skipping`);
                continue;
            }
            
            if (distance <= runeData.range) {
                this.log(`✅ ${dreadRuneActor.name} is within range (${distance.toFixed(1)} feet <= ${runeData.range} feet) with DC ${runeData.dc}`);
                
                // Check if this actor has a higher DC than what we've seen so far
                if (runeData.dc > highestDC) {
                    highestDC = runeData.dc;
                    highestDCActor = dreadRuneActor;
                    this.log(`🎯 New highest DC: ${dreadRuneActor.name} with DC ${runeData.dc}`);
                }
            } else {
                this.log(`❌ ${dreadRuneActor.name} is out of range (${distance.toFixed(1)} feet > ${runeData.range} feet)`);
            }
        }
        
        if (highestDCActor) {
            this.log(`Highest DC Dread Rune actor affecting ${frightenedActor.name}: ${highestDCActor.name} with DC ${highestDC}`);
        } else {
            this.log(`No Dread Rune actor within range of ${frightenedActor.name}`);
        }
        
        return highestDCActor;
    }

    /**
     * Get the Dread Rune data for a specific actor's armor
     */
    getDreadRuneData(actor) {
        // Check equipped armor for Dread Rune
        const equippedArmor = actor.itemTypes.armor.find(armor => 
            armor.isEquipped
        );
        
        if (!equippedArmor) {
            return null;
        }
        
        // Check for property runes
        if (equippedArmor.system.runes?.property) {
            for (const rune of equippedArmor.system.runes.property) {
                // Handle both string and object rune formats
                let runeName = '';
                if (typeof rune === 'string') {
                    runeName = rune;
                } else if (rune && typeof rune === 'object') {
                    runeName = rune.name || rune.slug || '';
                }
                
                if (runeName.toLowerCase().includes('dread')) {
                    // Determine the rune type from the name
                    let runeType = 'lesser'; // default
                    if (runeName.toLowerCase().includes('greater')) {
                        runeType = 'greater';
                    } else if (runeName.toLowerCase().includes('moderate')) {
                        runeType = 'moderate';
                    }
                    
                    const runeData = this.DREAD_RUNE_TYPES[runeType];
                    return runeData;
                }
            }
        }
        
        return null;
    }

    /**
     * Check for Dread Rune equipment when actors are updated
     */
    checkDreadRuneEquipment(actor) {
        // Method for future use
    }

    /**
     * Debug method to inspect an actor's frightened condition
     */
    debugFrightenedCondition(actor) {
        this.log(`=== DEBUGGING FRIGHTENED CONDITION FOR ${actor.name} ===`);
        
        // Test the findFrightenedCondition method
        const foundCondition = this.findFrightenedCondition(actor);
        if (foundCondition) {
            this.log(`✅ Found frightened condition:`, foundCondition);
        } else {
            this.log(`❌ No frightened condition found`);
        }
        
        this.log(`=== END DEBUG ===`);
    }


}

// Initialize the module when FoundryVTT is ready
Hooks.on("ready", () => {
    new DreadRuneAutomation();
});
